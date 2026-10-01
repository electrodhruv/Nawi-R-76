/**
 * Compliance Interpreter for NAWI-R76 Generic Test Engine
 *
 * Evaluates calculation results against statutory OIML R 76 rules
 * to derive authoritative PASS, FAIL, INCOMPLETE, or NOT_APPLICABLE verdicts.
 */

import { CalculationResultOutput } from './calculation-interpreter';
import { TestStatusCode } from '../types';

export interface AuthoritativeComplianceResult {
  status: TestStatusCode;
  verdict: 'PASS' | 'FAIL' | 'INCOMPLETE' | 'NOT_APPLICABLE' | 'INCONCLUSIVE';
  summaryStatement: string;
  failedPointsCount: number;
  passedPointsCount: number;
  trace?: Record<string, unknown>;
}

export function interpretCompliance(
  calcOutput: CalculationResultOutput,
  isApplicable: boolean,
  exclusionJustification?: string | null
): AuthoritativeComplianceResult {
  // If not applicable:
  if (!isApplicable) {
    return {
      status: 'NOT_APPLICABLE',
      verdict: 'NOT_APPLICABLE',
      summaryStatement: exclusionJustification || 'Test excluded per applicable OIML R 76 scope exemption.',
      failedPointsCount: 0,
      passedPointsCount: 0,
    };
  }

  const { passedCount, failedCount, isAllPassed, headline } = calcOutput.summary;

  if (passedCount === 0 && failedCount === 0) {
    return {
      status: 'NOT_TESTED',
      verdict: 'INCOMPLETE',
      summaryStatement: 'No observations recorded yet.',
      failedPointsCount: 0,
      passedPointsCount: 0,
    };
  }

  if (failedCount > 0) {
    return {
      status: 'FAIL',
      verdict: 'FAIL',
      summaryStatement: `NON-COMPLIANT: ${headline}`,
      failedPointsCount: failedCount,
      passedPointsCount: passedCount,
      trace: calcOutput.trace,
    };
  }

  if (isAllPassed) {
    return {
      status: 'PASS',
      verdict: 'PASS',
      summaryStatement: `COMPLIANT: ${headline}`,
      failedPointsCount: 0,
      passedPointsCount: passedCount,
      trace: calcOutput.trace,
    };
  }

  return {
    status: 'IN_PROGRESS',
    verdict: 'INCOMPLETE',
    summaryStatement: 'Test observations partially complete.',
    failedPointsCount: failedCount,
    passedPointsCount: passedCount,
    trace: calcOutput.trace,
  };
}
