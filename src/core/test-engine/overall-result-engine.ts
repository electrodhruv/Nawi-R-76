/**
 * Authoritative Overall Evaluation Result Engine for NAWI-R76
 *
 * Implements Section 11 & Section 12 requirements:
 * 1. Single source of truth for calculating overall evaluation result.
 * 2. Strictly separates status dimensions (Test Result, Run Status, Workflow State, Overall Result, Report Status).
 * 3. Enforces deterministic finalization gates and blocker identification.
 */

import {
  TestRunRecord,
  CommonEvaluationContext,
} from './types';

// ============================================================================
// Section 12: Separate Status Types
// ============================================================================

export type TestResultCode = 'PASS' | 'FAIL' | 'N/A' | 'NOT_DETERMINED';

export type TestRunStatusCode =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'INVALID'
  | 'RETEST_REQUIRED';

export type EvaluationWorkflowState =
  | 'IN_TESTING'
  | 'PENDING_REVIEW'
  | 'CORRECTION_REQUIRED'
  | 'READY_FOR_FINALIZATION'
  | 'FINALIZED';

export type OverallEvaluationResult =
  | 'NOT_DETERMINED'
  | 'COMPLIANT'
  | 'NON_COMPLIANT';

export type ReportIssuanceStatus =
  | 'NOT_GENERATED'
  | 'GENERATED'
  | 'ISSUED'
  | 'SUPERSEDED'
  | 'REVOKED';

export interface MatrixItemSummary {
  itemNumber: string;
  testCode: string;
  clause: string;
  title: string;
  isApplicable: boolean;
  testResult: TestResultCode;
  runStatus: TestRunStatusCode;
  hasMissingEvidence: boolean;
  hasUnresolvedDiscrepancy: boolean;
  retestPending: boolean;
  remarks: string;
}

export interface OverallEvaluationResultSummary {
  overallResult: OverallEvaluationResult;
  workflowState: EvaluationWorkflowState;
  canFinalize: boolean;
  finalizationBlockers: string[];
  counts: {
    totalApplicable: number;
    completed: number;
    passed: number;
    failed: number;
    notApplicable: number;
    pending: number;
    retestRequired: number;
    invalid: number;
  };
  matrixSummary: MatrixItemSummary[];
  finalizedAt?: string;
  finalizedBy?: string;
}

export class OverallResultEngine {
  /**
   * Evaluates the authoritative overall evaluation result from finalized TestRun records.
   *
   * Logic (Section 11):
   * IF required applicable tests are incomplete:
   *     overallResult = NOT_DETERMINED
   * ELSE IF any required applicable finalized test has result = FAIL:
   *     overallResult = NON_COMPLIANT
   * ELSE IF all required applicable tests are PASS or valid N/A:
   *     overallResult = COMPLIANT
   * ELSE:
   *     overallResult = NOT_DETERMINED
   */
  public static calculateOverallResult(
    testRuns: TestRunRecord[],
    context?: CommonEvaluationContext,
    isAlreadyFinalized: boolean = false
  ): OverallEvaluationResultSummary {
    const blockers: string[] = [];

    // Map each test run to its detailed summary item
    const matrixSummary: MatrixItemSummary[] = testRuns.map((r, index) => {
      const isApplicable = r.isApplicable && r.status !== 'NOT_APPLICABLE';
      const def = r.testDefinition;
      const proc = def?.procedureDefinition;
      const policy = proc?.evidencePolicy;

      // Evidence checking
      const attachedCount = (r.evidenceReferences || r.evidence || []).length;
      const minRequired = policy?.required ? (policy.minItems || 1) : 0;
      const hasMissingEvidence = isApplicable && Boolean(policy?.required) && attachedCount < minRequired;

      // Discrepancy checking
      const hasUnresolvedDiscrepancy = Boolean(
        r.evidenceDiscrepancies && r.evidenceDiscrepancies.some((d) => d.status === 'DISCREPANCY_FLAGGED')
      );

      // Retest pending
      const retestPending: boolean = r.status === 'RETEST_REQUIRED';

      // Determine clean test result code (Section 12.A)
      let testResult: TestResultCode = 'NOT_DETERMINED';
      if (!isApplicable) {
        testResult = 'N/A';
      } else if (r.status === 'PASS' || r.complianceResult?.verdict === 'PASS') {
        testResult = 'PASS';
      } else if (r.status === 'FAIL' || r.complianceResult?.verdict === 'FAIL') {
        testResult = 'FAIL';
      }

      // Determine test run status code (Section 12.B)
      let runStatus: TestRunStatusCode = 'NOT_STARTED';
      if (!isApplicable) {
        runStatus = 'COMPLETED';
      } else if (retestPending) {
        runStatus = 'RETEST_REQUIRED';
      } else if (r.status === 'PASS' || r.status === 'FAIL') {
        runStatus = 'COMPLETED';
      } else if (r.rawObservations && r.rawObservations.length > 0) {
        runStatus = 'IN_PROGRESS';
      }

      // Remarks / Statutory Justification
      const remarks = !isApplicable
        ? (r.exclusionJustification || 'Not applicable to instrument configuration')
        : (r.complianceResult?.summaryStatement || (testResult === 'PASS' ? 'Within applicable OIML limits' : testResult === 'FAIL' ? 'Exceeds statutory limits' : 'Incomplete testing'));

      return {
        itemNumber: String(index + 1),
        testCode: def?.code || `TEST_${index + 1}`,
        clause: def?.clause || 'R 76',
        title: def?.name || 'Metrological Test',
        isApplicable,
        testResult,
        runStatus,
        hasMissingEvidence,
        hasUnresolvedDiscrepancy,
        retestPending,
        remarks,
      };
    });

    // Counts
    const applicableItems = matrixSummary.filter((m) => m.isApplicable);
    const totalApplicable = applicableItems.length;
    const notApplicable = matrixSummary.filter((m) => !m.isApplicable).length;

    const passed = applicableItems.filter((m) => m.testResult === 'PASS' && m.runStatus === 'COMPLETED' && !m.retestPending).length;
    const failed = applicableItems.filter((m) => m.testResult === 'FAIL').length;
    const retestRequired = applicableItems.filter((m) => m.retestPending).length;
    const pending = applicableItems.filter((m) => m.runStatus === 'NOT_STARTED' || m.runStatus === 'IN_PROGRESS').length;
    const completed = passed + failed;

    // Evaluate Blockers (Section 16: Finalization Gate)
    if (pending > 0) {
      blockers.push(`${pending} required test(s) incomplete or in progress.`);
    }

    if (retestRequired > 0) {
      blockers.push(`${retestRequired} test(s) have pending retest requirements.`);
    }

    const missingEvidenceItems = applicableItems.filter((m) => m.hasMissingEvidence);
    if (missingEvidenceItems.length > 0) {
      blockers.push(
        `${missingEvidenceItems.length} mandatory evidence item(s) missing for: ${missingEvidenceItems.map((m) => m.title).join(', ')}.`
      );
    }

    const discrepancyItems = applicableItems.filter((m) => m.hasUnresolvedDiscrepancy);
    if (discrepancyItems.length > 0) {
      blockers.push(
        `${discrepancyItems.length} optical display OCR discrepancy requires authorized review or dismissal.`
      );
    }

    // Check instrument metadata completeness
    if (context?.instrument) {
      if (!context.instrument.serialNumber || context.instrument.serialNumber.trim().length === 0) {
        blockers.push('Physical specimen serial number is required.');
      }
      if (!context.instrument.maxCapacity || context.instrument.maxCapacity <= 0) {
        blockers.push('Valid maximum capacity (Max) is required.');
      }
      if (!context.instrument.verificationInterval_e || context.instrument.verificationInterval_e <= 0) {
        blockers.push('Valid verification scale interval (e) is required.');
      }
    }

    // Authoritative Overall Result Determination (Section 11)
    let overallResult: OverallEvaluationResult = 'NOT_DETERMINED';

    if (failed > 0) {
      // Any finalized required test fails -> NON_COMPLIANT
      overallResult = 'NON_COMPLIANT';
    } else if (pending > 0 || retestRequired > 0 || missingEvidenceItems.length > 0) {
      // Incomplete tests or missing required evidence blocks compliance determination
      overallResult = 'NOT_DETERMINED';
    } else if (passed === totalApplicable && totalApplicable > 0) {
      // All required tests passed and no pending blockers
      overallResult = 'COMPLIANT';
    } else {
      overallResult = 'NOT_DETERMINED';
    }

    // Workflow State (Section 12.C)
    let workflowState: EvaluationWorkflowState = 'IN_TESTING';
    if (isAlreadyFinalized) {
      workflowState = 'FINALIZED';
    } else if (blockers.length === 0 && overallResult !== 'NOT_DETERMINED') {
      workflowState = 'READY_FOR_FINALIZATION';
    } else if (retestRequired > 0 || discrepancyItems.length > 0) {
      workflowState = 'CORRECTION_REQUIRED';
    } else if (pending === 0 && (failed > 0 || blockers.length > 0)) {
      workflowState = 'PENDING_REVIEW';
    }

    const canFinalize = blockers.length === 0 && overallResult !== 'NOT_DETERMINED';

    return {
      overallResult,
      workflowState,
      canFinalize,
      finalizationBlockers: blockers,
      counts: {
        totalApplicable,
        completed,
        passed,
        failed,
        notApplicable,
        pending,
        retestRequired,
        invalid: 0,
      },
      matrixSummary,
    };
  }
}
