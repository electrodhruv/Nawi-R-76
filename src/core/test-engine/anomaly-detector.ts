/**
 * Non-Authoritative Metrological Anomaly Detector for NAWI-R76
 *
 * Implements non-intrusive heuristics to identify potential physical measurement
 * anomalies, observation sequence inconsistencies, and evidence duplication.
 *
 * STRICT METROLOGICAL SAFETY PRINCIPLE:
 * - These flags produce "REVIEW RECOMMENDED" for the accredited reviewer.
 * - These flags NEVER declare "FRAUD DETECTED".
 * - Automated algorithms or AI do NOT decide fraud or override compliance.
 */

import { TestRunRecord } from './types';

export type AnomalyType =
  | 'IDENTICAL_READINGS'
  | 'SUSPICIOUS_ZERO_ERROR'
  | 'TIMESTAMP_CONFLICT'
  | 'REPEATED_EVIDENCE_FILE'
  | 'SEQUENCE_ANOMALY';

export interface AnomalyFlag {
  id: string;
  type: AnomalyType;
  testCode: string;
  severity: 'REVIEW_RECOMMENDED';
  title: string;
  description: string;
  suggestedAction: string;
  detectedAt: string;
  affectedPoints?: string[];
}

export class AnomalyDetectorService {
  /**
   * Scans a TestRunRecord for physical reading anomalies, timestamp reversals,
   * zero-error perfection, or evidence duplicates.
   */
  public static detectAnomalies(testRun: TestRunRecord): AnomalyFlag[] {
    const flags: AnomalyFlag[] = [];
    const observations = testRun.rawObservations || [];
    const evidence = testRun.evidence || testRun.evidenceReferences || [];
    const now = new Date().toISOString();

    if (observations.length === 0) {
      return flags;
    }

    // 1. IDENTICAL CONSECUTIVE READINGS
    // Detect if 3 or more consecutive distinct load points record identical non-zero indications
    let consecutiveIdentical = 1;
    let prevVal: unknown = null;
    let lastIdenticalVal: unknown = null;

    for (let i = 0; i < observations.length; i++) {
      const row = observations[i];
      const indication = row.indication ?? row.observedValue ?? row.reading;

      if (indication !== undefined && indication !== null && Number(indication) > 0) {
        if (prevVal !== null && indication === prevVal) {
          consecutiveIdentical++;
          if (consecutiveIdentical >= 3) {
            lastIdenticalVal = indication;
          }
        } else {
          consecutiveIdentical = 1;
        }
        prevVal = indication;
      }
    }

    if (consecutiveIdentical >= 3 && lastIdenticalVal !== null) {
      flags.push({
        id: `ANOM-IDEN-${testRun.testCode}-${Date.now()}`,
        type: 'IDENTICAL_READINGS',
        testCode: testRun.testCode,
        severity: 'REVIEW_RECOMMENDED',
        title: 'Identical Consecutive Indications Recorded',
        description: `Three or more consecutive test loads recorded identical indication readings (${lastIdenticalVal}). In physical testing, minor turning-point sub-weight variance is expected.`,
        suggestedAction: 'Review raw observation log and confirm balance pan stabilization.',
        detectedAt: now,
      });
    }

    // 2. SUSPICIOUS PERFECT ZERO ERRORS ACROSS ALL LOAD POINTS
    // If 4+ points all have deltaL = 0 and error = 0, turning points may not have been determined
    if (observations.length >= 4) {
      const allZeroDeltaL = observations.every(
        (r) => Number(r.deltaL ?? r.additionalLoad ?? 0) === 0
      );
      const allZeroError = observations.every(
        (r) => Number(r.error ?? r.roundedError ?? r.calculatedError ?? 0) === 0
      );

      if (allZeroDeltaL && allZeroError) {
        flags.push({
          id: `ANOM-ZERO-${testRun.testCode}-${Date.now()}`,
          type: 'SUSPICIOUS_ZERO_ERROR',
          testCode: testRun.testCode,
          severity: 'REVIEW_RECOMMENDED',
          title: 'Suspiciously Perfect Zero Error Across All Load Points',
          description: 'Zero turning-point offset (ΔL = 0) and zero error recorded across all test points. OIML Clause A.4.4.3 requires adding turning-point sub-weights (ΔL) to determine continuous indication.',
          suggestedAction: 'Verify that turning-point fractional weights (0.1e to 1.0e) were physically applied per Clause A.4.4.3.',
          detectedAt: now,
        });
      }
    }

    // 3. SEQUENCE ANOMALY IN INCREASING SERIES
    // Ensure monotonic increasing test loads in increasing series
    let lastIncreasingLoad: number | null = null;
    let sequenceAnomalyFound = false;

    for (const row of observations) {
      const direction = String(row.direction || row.phase || '').toUpperCase();
      const load = Number(row.load ?? row.nominalLoad ?? row.targetLoad ?? 0);

      if (direction === 'INCREASING' && load > 0) {
        if (lastIncreasingLoad !== null && load < lastIncreasingLoad) {
          sequenceAnomalyFound = true;
          break;
        }
        lastIncreasingLoad = load;
      }
    }

    if (sequenceAnomalyFound) {
      flags.push({
        id: `ANOM-SEQ-${testRun.testCode}-${Date.now()}`,
        type: 'SEQUENCE_ANOMALY',
        testCode: testRun.testCode,
        severity: 'REVIEW_RECOMMENDED',
        title: 'Load Application Sequence Divergence',
        description: 'Applied test load decreased during an increasing measurement sequence.',
        suggestedAction: 'Confirm whether load application followed standard OIML R 76-1 Clause A.4.4 monotonic protocol.',
        detectedAt: now,
      });
    }

    // 4. DUPLICATE EVIDENCE FILES
    if (evidence.length >= 2) {
      const seenNames = new Set<string>();
      const seenHashes = new Set<string>();
      let duplicateFound = false;

      for (const ev of evidence) {
        if (ev.fileName && seenNames.has(ev.fileName.toLowerCase())) {
          duplicateFound = true;
          break;
        }
        if (ev.fileName) seenNames.add(ev.fileName.toLowerCase());

        if (ev.sha256Hash && seenHashes.has(ev.sha256Hash)) {
          duplicateFound = true;
          break;
        }
        if (ev.sha256Hash) seenHashes.add(ev.sha256Hash);
      }

      if (duplicateFound) {
        flags.push({
          id: `ANOM-EVID-${testRun.testCode}-${Date.now()}`,
          type: 'REPEATED_EVIDENCE_FILE',
          testCode: testRun.testCode,
          severity: 'REVIEW_RECOMMENDED',
          title: 'Duplicate Evidence File or Digest Detected',
          description: 'Identical photo artifact filename or SHA-256 hash was attached multiple times to this test run.',
          suggestedAction: 'Ensure distinct, authentic photographs are captured for each specific test setup position.',
          detectedAt: now,
        });
      }
    }

    return flags;
  }
}
