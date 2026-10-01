/**
 * Server-Authoritative Metrology Observation Processor
 *
 * Strictly server-authoritative. Takes only raw observations (L, I, delta_L)
 * from the client, calculates P, E, E0, Ec, derives Table 6 MPE, evaluates
 * compliance using pure core functions, and persists results.
 */

import { prisma } from '@/lib/prisma';
import Decimal from 'decimal.js';
import {
  AccuracyClass as PrismaAccuracyClass,
  ComplianceStatus,
  TestRunStatus,
  EvaluationStatus,
  LoadDirection,
} from '@prisma/client';
import {
  AccuracyClass as CoreAccuracyClass,
  PartialWeighingRangeSpec,
  RepeatabilitySeriesInput,
  CreepObservationInput,
} from '@/core/types/metrology';
import { calculateTurningPoint, resolveVerificationIntervalForLoad } from '@/core/engine/turning-points';
import { evaluateRepeatability } from '@/core/engine/repeatability';
import { evaluateCreep } from '@/core/engine/creep';
import { AuditService } from '@/services/audit/audit-service';

export interface RawObservationItem {
  seriesIndex: number;
  stepIndex: number;
  direction: LoadDirection;
  nominalLoad_L: number | string | Decimal;
  indicatedValue_I: number | string | Decimal;
  turningPointLoad_dL: number | string | Decimal;
  isZeroCheck?: boolean;
  remarks?: string;
}

export interface ProcessObservationsInput {
  testRunId: string;
  actorId: string;
  observations: RawObservationItem[];
  changeReason?: string;
  clientIp?: string | null;
  creepElapsedMinutes?: number;
  isEarlyTerminationRequest?: boolean;
  zeroReturnObservation?: {
    indication: number | string | Decimal;
    additionalLoad_dL: number | string | Decimal;
  };
}

export class ObservationProcessor {
  /**
   * Authoritatively processes and persists raw observations for a test run.
   */
  static async processAndPersist(input: ProcessObservationsInput) {
    const { testRunId, actorId, observations } = input;

    if (!observations || observations.length === 0) {
      throw new Error('At least one raw observation point is required');
    }

    // 1. Fetch Test Run, Evaluation, and Instrument details
    const testRun = await prisma.evaluationTestRun.findUnique({
      where: { id: testRunId },
      include: {
        evaluation: {
          include: {
            instrument: {
              include: {
                partialRanges: {
                  orderBy: { rangeIndex: 'asc' },
                },
              },
            },
          },
        },
        testDefinition: true,
      },
    });

    if (!testRun) {
      throw new Error(`EvaluationTestRun with id ${testRunId} not found`);
    }

    const { evaluation } = testRun;
    const { instrument } = evaluation;

    // Check immutability of approved / issued evaluations
    if (
      evaluation.status === EvaluationStatus.APPROVED ||
      evaluation.status === EvaluationStatus.REPORT_ISSUED ||
      evaluation.status === EvaluationStatus.SUPERSEDED
    ) {
      throw new Error(
        `Evaluation is in ${evaluation.status} status and is strictly read-only. Create a revision to make modifications.`
      );
    }

    // Map Prisma AccuracyClass to CoreAccuracyClass
    const coreAccuracyClass = this.mapAccuracyClass(instrument.accuracyClass);

    const baseE = new Decimal(instrument.verificationInterval_e.toString());

    // Map partial ranges
    const corePartialRanges: PartialWeighingRangeSpec[] =
      instrument.partialRanges.length > 0
        ? instrument.partialRanges.map((pr) => ({
            rangeIndex: pr.rangeIndex,
            minCapacity: new Decimal(pr.minCapacity_i.toString()),
            maxCapacity: new Decimal(pr.maxCapacity_i.toString()),
            verificationInterval_e: new Decimal(pr.verificationInterval_ei.toString()),
            scaleInterval_d: new Decimal(pr.scaleInterval_di.toString()),
          }))
        : [
            {
              rangeIndex: 1,
              minCapacity: new Decimal(instrument.minCapacity.toString()),
              maxCapacity: new Decimal(instrument.maxCapacity.toString()),
              verificationInterval_e: baseE,
              scaleInterval_d: new Decimal(instrument.scaleInterval_d.toString()),
            },
          ];

    // 2. Identify Zero Error (E0) for each series
    const seriesZeroErrors: Record<number, Decimal> = {};

    for (const obs of observations) {
      const load = new Decimal(obs.nominalLoad_L.toString());
      if (obs.isZeroCheck || load.isZero()) {
        const ei = resolveVerificationIntervalForLoad(load, corePartialRanges);
        const { error_E } = calculateTurningPoint({
          load,
          indication: new Decimal(obs.indicatedValue_I.toString()),
          additionalLoad_dL: new Decimal(obs.turningPointLoad_dL.toString()),
          e: ei,
        });
        seriesZeroErrors[obs.seriesIndex] = error_E;
      }
    }

    // 3. Process each observation point authoritatively
    const processedPoints = observations.map((obs) => {
      const nominalLoad = new Decimal(obs.nominalLoad_L.toString());
      const indicatedValue = new Decimal(obs.indicatedValue_I.toString());
      const turningPointLoad = new Decimal(obs.turningPointLoad_dL.toString());

      // Determine verification interval ei for this specific load
      const ei = resolveVerificationIntervalForLoad(nominalLoad, corePartialRanges);

      // Obtain series zero error E0
      const zeroError_E0 = seriesZeroErrors[obs.seriesIndex] ?? new Decimal(0);

      // Calculate true indication P = I + 0.5e - dL, E = P - L, Ec = E - E0, and derive Table 6 MPE
      const tpResult = calculateTurningPoint({
        load: nominalLoad,
        indication: indicatedValue,
        additionalLoad_dL: turningPointLoad,
        e: ei,
        zeroError_E0,
        accuracyClass: coreAccuracyClass,
      });

      const calculated_P = tpResult.calculated_P;
      const error_E = tpResult.error_E;
      const correctedError_Ec = tpResult.correctedError_Ec;
      const applicableMpe = tpResult.mpe?.magnitude ?? new Decimal(0);
      const passes = tpResult.isCompliant ?? false;
      const complianceResult = passes ? ComplianceStatus.PASS : ComplianceStatus.FAIL;

      return {
        seriesIndex: obs.seriesIndex,
        stepIndex: obs.stepIndex,
        direction: obs.direction,
        nominalLoad_L: nominalLoad,
        indicatedValue_I: indicatedValue,
        turningPointLoad_dL: turningPointLoad,
        calculated_P,
        error_E,
        zeroError_E0,
        correctedError_Ec,
        applicableMpe,
        complianceResult,
        isZeroCheck: obs.isZeroCheck ?? nominalLoad.isZero(),
        remarks: obs.remarks ?? null,
      };
    });

    // 4. Determine overall test run status
    let newTestRunStatus: TestRunStatus = TestRunStatus.PASS;

    const anyPointFailed = processedPoints.some((p) => p.complianceResult === ComplianceStatus.FAIL);
    if (anyPointFailed) {
      newTestRunStatus = TestRunStatus.FAIL;
    }

    // Special test definition evaluations
    const testCode = testRun.testDefinition.testCode;

    if (testCode === 'R76_REPEATABILITY') {
      const seriesNumbers = Array.from(new Set(processedPoints.map((p) => p.seriesIndex)));
      const repSeries: RepeatabilitySeriesInput[] = seriesNumbers.map((sIndex) => {
        const seriesPts = processedPoints.filter((p) => p.seriesIndex === sIndex);
        return {
          seriesIndex: sIndex,
          nominalLoad: seriesPts[0].nominalLoad_L,
          weighings: seriesPts.map((p, idx) => ({
            weighingIndex: idx + 1,
            indication: p.indicatedValue_I,
            additionalLoad_dL: p.turningPointLoad_dL,
          })),
        };
      });

      const repResult = evaluateRepeatability({
        accuracyClass: coreAccuracyClass,
        maxCapacity: new Decimal(instrument.maxCapacity.toString()),
        e: baseE,
        series: repSeries,
      });

      if (!repResult.overallCompliant) {
        newTestRunStatus = TestRunStatus.FAIL;
      }
    } else if (testCode === 'R76_CREEP' && coreAccuracyClass !== 'CLASS_I') {
      const initialPoint = processedPoints[0];
      const initialObs: CreepObservationInput = {
        timestamp: new Date(),
        elapsedMinutes: 0,
        indication: initialPoint.indicatedValue_I,
        additionalLoad_dL: initialPoint.turningPointLoad_dL,
      };

      const obsList: CreepObservationInput[] = processedPoints.slice(1).map((p, idx) => ({
        timestamp: new Date(),
        elapsedMinutes: input.creepElapsedMinutes ?? (idx + 1) * 15,
        indication: p.indicatedValue_I,
        additionalLoad_dL: p.turningPointLoad_dL,
      }));

      const zeroReturnObs: CreepObservationInput | undefined = input.zeroReturnObservation
        ? {
            timestamp: new Date(),
            elapsedMinutes: (input.creepElapsedMinutes ?? 30) + 1,
            indication: new Decimal(input.zeroReturnObservation.indication.toString()),
            additionalLoad_dL: new Decimal(input.zeroReturnObservation.additionalLoad_dL.toString()),
          }
        : undefined;

      const creepResult = evaluateCreep({
        accuracyClass: coreAccuracyClass,
        maxCapacity: new Decimal(instrument.maxCapacity.toString()),
        appliedLoad: initialPoint.nominalLoad_L,
        e: baseE,
        initialObservation: initialObs,
        observations: obsList,
        zeroReturnObservation: zeroReturnObs,
      });

      if (!creepResult.overallCompliant) {
        newTestRunStatus = TestRunStatus.FAIL;
      }
    }

    // 5. Database transaction: persist observations and update test run
    const result = await prisma.$transaction(async (tx) => {
      // Remove old observations for this test run
      await tx.observationPoint.deleteMany({
        where: { testRunId },
      });

      // Bulk create new calculated observations
      await tx.observationPoint.createMany({
        data: processedPoints.map((p) => ({
          testRunId,
          seriesIndex: p.seriesIndex,
          stepIndex: p.stepIndex,
          direction: p.direction,
          nominalLoad_L: p.nominalLoad_L,
          indicatedValue_I: p.indicatedValue_I,
          turningPointLoad_dL: p.turningPointLoad_dL,
          calculated_P: p.calculated_P,
          error_E: p.error_E,
          zeroError_E0: p.zeroError_E0,
          correctedError_Ec: p.correctedError_Ec,
          applicableMpe: p.applicableMpe,
          complianceResult: p.complianceResult,
          isZeroCheck: p.isZeroCheck,
          remarks: p.remarks,
        })),
      });

      // Update test run status
      const updatedTestRun = await tx.evaluationTestRun.update({
        where: { id: testRunId },
        data: {
          status: newTestRunStatus,
          executedById: actorId,
          completedAt: new Date(),
        },
        include: {
          observationPoints: {
            orderBy: [{ seriesIndex: 'asc' }, { stepIndex: 'asc' }],
          },
        },
      });

      // Also transition evaluation status to IN_TESTING if it was in PLAN_CONFIGURED or DRAFT
      if (
        evaluation.status === EvaluationStatus.DRAFT ||
        evaluation.status === EvaluationStatus.PLAN_CONFIGURED
      ) {
        await tx.typeEvaluation.update({
          where: { id: evaluation.id },
          data: {
            status: EvaluationStatus.IN_TESTING,
            startedAt: evaluation.startedAt ?? new Date(),
          },
        });
      }

      return updatedTestRun;
    });

    // 6. Record immutable audit log
    await AuditService.record({
      actorId,
      evaluationId: evaluation.id,
      entityType: 'EvaluationTestRun',
      entityId: testRunId,
      action: 'UPDATE',
      previousStateJson: { status: testRun.status },
      newStateJson: { status: newTestRunStatus, observationCount: processedPoints.length },
      changeReason: input.changeReason ?? `Recorded ${processedPoints.length} observation points for ${testCode}`,
      clientIp: input.clientIp,
      rulePackVersion: evaluation.rulePackVersion,
    });

    return result;
  }

  private static mapAccuracyClass(ac: PrismaAccuracyClass): CoreAccuracyClass {
    switch (ac) {
      case PrismaAccuracyClass.CLASS_I:
        return 'CLASS_I';
      case PrismaAccuracyClass.CLASS_II:
        return 'CLASS_II';
      case PrismaAccuracyClass.CLASS_III:
        return 'CLASS_III';
      case PrismaAccuracyClass.CLASS_IIII:
        return 'CLASS_IIII';
      default:
        throw new Error(`Unsupported accuracy class: ${ac}`);
    }
  }
}
