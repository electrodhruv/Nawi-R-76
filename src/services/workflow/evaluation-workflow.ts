/**
 * Evaluation Lifecycle & Workflow State Machine for NAWI-R76
 *
 * Implements deterministic lifecycle state transitions, automatic test plan
 * generation with applicability rules, review gates, and post-approval revisioning.
 */

import { prisma } from '@/lib/prisma';
import {
  EvaluationStatus,
  TestRunStatus,
  AccuracyClass,
  ReceptorType,
  PowerSupplyType,
  ReviewStage,
  ReviewDecision,
} from '@prisma/client';
import { AuditService } from '@/services/audit/audit-service';

export interface CreateEvaluationInput {
  instrumentId: string;
  leadMetrologistId: string;
  evaluationNumber: string;
  reviewerId?: string;
  signatoryId?: string;
  changeReason?: string;
  clientIp?: string | null;
}

export class EvaluationWorkflowService {
  /**
   * Creates an evaluation and dynamically schedules applicable OIML R 76 test runs.
   */
  static async createEvaluationWithPlan(input: CreateEvaluationInput) {
    const { instrumentId, leadMetrologistId, evaluationNumber, reviewerId, signatoryId } = input;

    const instrument = await prisma.instrumentModel.findUnique({
      where: { id: instrumentId },
    });

    if (!instrument) {
      throw new Error(`InstrumentModel with id ${instrumentId} not found`);
    }

    const testDefinitions = await prisma.testDefinition.findMany({
      orderBy: { testCode: 'asc' },
    });

    const evaluation = await prisma.$transaction(async (tx) => {
      // 1. Create TypeEvaluation record
      const ev = await tx.typeEvaluation.create({
        data: {
          evaluationNumber,
          instrumentId,
          leadMetrologistId,
          reviewerId: reviewerId ?? null,
          signatoryId: signatoryId ?? null,
          status: EvaluationStatus.PLAN_CONFIGURED,
        },
      });

      // 2. Schedule EvaluationTestRun records with metrological applicability
      let executionOrder = 1;
      for (const def of testDefinitions) {
        const { isApplicable, exclusionJustification } = this.evaluateApplicability(def.testCode, instrument);

        await tx.evaluationTestRun.create({
          data: {
            evaluationId: ev.id,
            testDefinitionId: def.id,
            executionOrder: executionOrder++,
            status: isApplicable ? TestRunStatus.NOT_TESTED : TestRunStatus.NOT_APPLICABLE,
            exclusionJustification: isApplicable ? null : exclusionJustification,
          },
        });
      }

      return ev;
    });

    // Audit log
    await AuditService.record({
      actorId: leadMetrologistId,
      evaluationId: evaluation.id,
      entityType: 'TypeEvaluation',
      entityId: evaluation.id,
      action: 'CREATE',
      previousStateJson: null,
      newStateJson: { evaluationNumber, status: evaluation.status },
      changeReason: input.changeReason ?? `Initialized evaluation ${evaluationNumber} with dynamic test plan`,
      clientIp: input.clientIp,
    });

    return evaluation;
  }

  /**
   * Metrological applicability predicate evaluator.
   */
  static evaluateApplicability(
    testCode: string,
    instrument: {
      accuracyClass: AccuracyClass;
      receptorType: ReceptorType;
      powerSupplyType: PowerSupplyType;
      hasAutomaticLeveling: boolean;
      maxCapacity: unknown;
    }
  ): { isApplicable: boolean; exclusionJustification: string | null } {
    switch (testCode) {
      case 'R76_ECC_ROLLING':
        if (instrument.receptorType !== ReceptorType.ROLLING_TRACK) {
          return {
            isApplicable: false,
            exclusionJustification:
              'Instrument does not feature a rolling track or rail mechanism; ordinary eccentricity (A.4.7.1–3) applies instead.',
          };
        }
        return { isApplicable: true, exclusionJustification: null };

      case 'R76_ECC_MOBILE':
        if (instrument.receptorType !== ReceptorType.MOBILE_SCALE) {
          return {
            isApplicable: false,
            exclusionJustification:
              'Instrument is installed on a permanent or bench foundation; not a mobile pallet or vehicle scale.',
          };
        }
        return { isApplicable: true, exclusionJustification: null };

      case 'R76_CREEP':
      case 'R76_ZERO_RETURN':
        if (instrument.accuracyClass === AccuracyClass.CLASS_I) {
          return {
            isApplicable: false,
            exclusionJustification:
              'Per OIML R 76-1:2006 Clause A.4.11.1, Creep and Zero Return are mandatory only for Classes II, III, and IIII.',
          };
        }
        return { isApplicable: true, exclusionJustification: null };

      case 'R76_TILTING':
        if (instrument.accuracyClass === AccuracyClass.CLASS_I) {
          return {
            isApplicable: false,
            exclusionJustification: 'Tilting test is not applicable to Class I analytical balances.',
          };
        }
        if (instrument.hasAutomaticLeveling) {
          return {
            isApplicable: false,
            exclusionJustification:
              'Instrument is equipped with an automatic leveling device that inhibits weighing under out-of-level conditions.',
          };
        }
        return { isApplicable: true, exclusionJustification: null };

      case 'R76_VOLT_BATTERY':
        if (
          instrument.powerSupplyType !== PowerSupplyType.BATTERY_INTERNAL &&
          instrument.powerSupplyType !== PowerSupplyType.DUAL_MAINS_BATTERY
        ) {
          return {
            isApplicable: false,
            exclusionJustification: 'Instrument is not powered by internal batteries.',
          };
        }
        return { isApplicable: true, exclusionJustification: null };

      case 'R76_VOLT_VEHICLE':
        if (instrument.powerSupplyType !== PowerSupplyType.ROAD_VEHICLE_BATTERY) {
          return {
            isApplicable: false,
            exclusionJustification: 'Instrument is not powered from a road-vehicle battery supply.',
          };
        }
        return { isApplicable: true, exclusionJustification: null };

      case 'R76_VOLT_EXT_AC_DC':
        if (instrument.powerSupplyType !== PowerSupplyType.EXTERNAL_AC_DC) {
          return {
            isApplicable: false,
            exclusionJustification: 'Instrument does not utilize an external plug-in AC/DC power adapter.',
          };
        }
        return { isApplicable: true, exclusionJustification: null };

      case 'R76_PORTABLE_WEIGHBRIDGE':
        return {
          isApplicable: false,
          exclusionJustification: 'Instrument is not a portable weighbridge requiring clause A.4.13 foundation testing.',
        };

      default:
        return { isApplicable: true, exclusionJustification: null };
    }
  }

  /**
   * Submits an evaluation for peer review.
   */
  static async submitForReview(params: {
    evaluationId: string;
    actorId: string;
    changeReason?: string;
    clientIp?: string | null;
  }) {
    const evaluation = await prisma.typeEvaluation.findUnique({
      where: { id: params.evaluationId },
      include: { testRuns: true },
    });

    if (!evaluation) {
      throw new Error(`TypeEvaluation with id ${params.evaluationId} not found`);
    }

    // Verify all test runs are completed or properly excluded with justification
    const incompleteRuns = evaluation.testRuns.filter(
      (tr) => tr.status === TestRunStatus.NOT_TESTED || tr.status === TestRunStatus.INCOMPLETE
    );

    if (incompleteRuns.length > 0) {
      throw new Error(
        `Cannot submit evaluation for review: ${incompleteRuns.length} test run(s) are still incomplete or not tested.`
      );
    }

    const updated = await prisma.typeEvaluation.update({
      where: { id: params.evaluationId },
      data: {
        status: EvaluationStatus.PENDING_REVIEW,
        completedAt: new Date(),
      },
    });

    await AuditService.record({
      actorId: params.actorId,
      evaluationId: evaluation.id,
      entityType: 'TypeEvaluation',
      entityId: evaluation.id,
      action: 'STATE_TRANSITION',
      previousStateJson: { status: evaluation.status },
      newStateJson: { status: updated.status },
      changeReason: params.changeReason ?? 'Completed all scheduled test runs and submitted for peer review',
      clientIp: params.clientIp,
    });

    return updated;
  }

  /**
   * Records a formal review decision (Technical Reviewer or Approving Signatory).
   */
  static async recordReviewDecision(params: {
    evaluationId: string;
    reviewerId: string;
    stage: ReviewStage;
    decision: ReviewDecision;
    comments: string;
    signatureHash?: string | null;
    clientIp?: string | null;
  }) {
    const evaluation = await prisma.typeEvaluation.findUnique({
      where: { id: params.evaluationId },
      include: { testRuns: true },
    });

    if (!evaluation) {
      throw new Error(`TypeEvaluation with id ${params.evaluationId} not found`);
    }

    // Record review step
    const step = await prisma.reviewWorkflowStep.create({
      data: {
        evaluationId: params.evaluationId,
        reviewerId: params.reviewerId,
        stage: params.stage,
        decision: params.decision,
        comments: params.comments,
        signatureHash: params.signatureHash ?? null,
      },
    });

    let newStatus = evaluation.status;

    if (params.decision === ReviewDecision.REVISIONS_REQUESTED) {
      newStatus = EvaluationStatus.REVISIONS_REQUESTED;
    } else if (params.decision === ReviewDecision.ACCEPTED) {
      if (params.stage === ReviewStage.FINAL_APPROVAL) {
        // Check if any test failed
        const hasFailedTests = evaluation.testRuns.some((tr) => tr.status === TestRunStatus.FAIL);
        if (hasFailedTests) {
          throw new Error('Cannot issue final approval for an evaluation with failed metrological test runs');
        }
        newStatus = EvaluationStatus.APPROVED;
      }
    }

    const updated = await prisma.typeEvaluation.update({
      where: { id: params.evaluationId },
      data: {
        status: newStatus,
        approvedAt: newStatus === EvaluationStatus.APPROVED ? new Date() : evaluation.approvedAt,
      },
    });

    await AuditService.record({
      actorId: params.reviewerId,
      evaluationId: evaluation.id,
      entityType: 'TypeEvaluation',
      entityId: evaluation.id,
      action: 'STATE_TRANSITION',
      previousStateJson: { status: evaluation.status },
      newStateJson: { status: updated.status, reviewStepId: step.id, decision: params.decision },
      changeReason: `Review step [${params.stage}]: ${params.decision}. Comments: ${params.comments}`,
      clientIp: params.clientIp,
    });

    return { step, evaluation: updated };
  }

  /**
   * Controlled post-approval revisioning.
   * If an approved evaluation requires modification, it is superseded and cloned.
   */
  static async createSupervisingRevision(params: {
    parentEvaluationId: string;
    actorId: string;
    revisionReason: string;
    clientIp?: string | null;
  }) {
    const parent = await prisma.typeEvaluation.findUnique({
      where: { id: params.parentEvaluationId },
      include: {
        testRuns: {
          include: { observationPoints: true },
        },
      },
    });

    if (!parent) {
      throw new Error(`Parent evaluation with id ${params.parentEvaluationId} not found`);
    }

    if (parent.status !== EvaluationStatus.APPROVED && parent.status !== EvaluationStatus.REPORT_ISSUED) {
      throw new Error('Only approved or issued evaluations can undergo controlled post-approval revisioning');
    }

    const newRevisionNumber = parent.revisionNumber + 1;
    const newEvaluationNumber = `${parent.evaluationNumber}-Rev${newRevisionNumber}`;

    const newEvaluation = await prisma.$transaction(async (tx) => {
      // 1. Mark parent as SUPERSEDED
      await tx.typeEvaluation.update({
        where: { id: parent.id },
        data: { status: EvaluationStatus.SUPERSEDED },
      });

      // 2. Create child revision
      const child = await tx.typeEvaluation.create({
        data: {
          evaluationNumber: newEvaluationNumber,
          revisionNumber: newRevisionNumber,
          parentEvaluationId: parent.id,
          instrumentId: parent.instrumentId,
          standard: parent.standard,
          standardVersion: parent.standardVersion,
          rulePackVersion: parent.rulePackVersion,
          status: EvaluationStatus.PLAN_CONFIGURED,
          leadMetrologistId: params.actorId,
          reviewerId: parent.reviewerId,
          signatoryId: parent.signatoryId,
        },
      });

      // 3. Clone test runs
      for (const run of parent.testRuns) {
        await tx.evaluationTestRun.create({
          data: {
            evaluationId: child.id,
            testDefinitionId: run.testDefinitionId,
            executionOrder: run.executionOrder,
            status: run.status,
            exclusionJustification: run.exclusionJustification,
          },
        });
      }

      return child;
    });

    await AuditService.record({
      actorId: params.actorId,
      evaluationId: parent.id,
      entityType: 'TypeEvaluation',
      entityId: parent.id,
      action: 'STATE_TRANSITION',
      previousStateJson: { status: parent.status },
      newStateJson: { status: EvaluationStatus.SUPERSEDED, supersededBy: newEvaluation.id },
      changeReason: `Superseded by revision ${newEvaluationNumber}. Reason: ${params.revisionReason}`,
      clientIp: params.clientIp,
    });

    return newEvaluation;
  }
}
