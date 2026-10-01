/**
 * Canonical Report Payload Generator for NAWI-R76
 *
 * Constructs a deterministic, canonical representation of finalized report metadata
 * and metrological test results. The output is strictly ordered to ensure identical
 * cryptographic digests across distributed evaluations and revisions.
 */

import { ReportPayload } from '@/services/reports/report-types';
import { CanonicalReportPayload } from './verification-types';

/**
 * Deeply sorts an object's keys alphabetically to guarantee deterministic JSON output.
 */
export function sortKeysDeep<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(sortKeysDeep) as unknown as T;
  }

  const sortedObj: Record<string, unknown> = {};
  const keys = Object.keys(value as Record<string, unknown>).sort();

  for (const key of keys) {
    sortedObj[key] = sortKeysDeep((value as Record<string, unknown>)[key]);
  }

  return sortedObj as T;
}

/**
 * Builds the canonical report payload from a finalized ReportPayload.
 * Excludes volatile UI formatting and temporary view states.
 */
export function buildCanonicalReportPayload(
  payload: ReportPayload,
  revisionOverride?: number,
  timestampOverride?: string
): CanonicalReportPayload {
  // Determine authoritative finalized result from overallResult, summary matrix, or test runs
  const isNonCompliant =
    payload.overallResult === 'NON_COMPLIANT' ||
    (payload.overallResult as string) === 'FAIL' ||
    payload.summaryMatrix?.some((s) => s.status === 'Failed') ||
    payload.testRuns?.some((t) => (t.status as string) === 'NON_COMPLIANT' || (t.status as string) === 'FAIL' || (t.status as string) === 'FAILED');

  const canonical: CanonicalReportPayload = {
    reportNumber: payload.evaluationNumber?.trim() || 'RRSL-EVAL',
    revision: revisionOverride ?? payload.revisionNumber ?? 0,
    evaluationId: payload.evaluationNumber?.trim() || 'RRSL-EVAL',
    instrument: {
      serialNumber: payload.serialNumber?.trim() || 'SAMPLE-01',
      model: payload.modelName?.trim() || 'UNKNOWN-MODEL',
      manufacturer: payload.manufacturerName?.trim() || 'UNKNOWN-MFR',
      accuracyClass: payload.accuracyClass?.trim() || 'Class III',
      maxCapacity: String(payload.maxCapacity ?? '').trim(),
      minCapacity: String(payload.minCapacity ?? '').trim(),
      verificationInterval_e: String(payload.verificationInterval_e ?? '').trim(),
      scaleInterval_d: payload.scaleInterval_d ? String(payload.scaleInterval_d).trim() : undefined,
      numberOfIntervals_n: payload.numberOfIntervals_n ? Number(payload.numberOfIntervals_n) : undefined,
      primaryUnit: payload.primaryUnit?.trim() || 'kg',
    },
    standard: payload.standard?.trim() || 'OIML R 76-1',
    standardVersion: payload.standardVersion?.trim() || '2006 (E)',
    rulePackVersion: payload.rulePackVersion?.trim() || 'R76-2006-V1.0',
    finalizedResult: isNonCompliant ? 'NON_COMPLIANT' : 'COMPLIANT',
    issueTimestamp: timestampOverride ?? (payload.reportIssueDate?.trim() || new Date().toISOString().split('T')[0]),
    canonicalPayloadVersion: '1.0',
  };

  return sortKeysDeep(canonical);
}

/**
 * Deterministically serializes a canonical report payload to JSON.
 */
export function serializeCanonicalPayload(canonical: CanonicalReportPayload): string {
  const sorted = sortKeysDeep(canonical);
  return JSON.stringify(sorted);
}
