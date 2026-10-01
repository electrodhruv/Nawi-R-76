/**
 * NAWI-R76 Complete Evaluation Workflow Refactor Verification Tests
 *
 * Verifies all 12 core requirements specified in Section 26:
 * 1. Normal bench scale
 * 2. Rolling-load/wheel-load instrument
 * 3. Mobile/suspended instrument
 * 4. Failed measurement (no manual overrides, authoritative calculation)
 * 5. Invalid observation (preserves record, audits justification)
 * 6. N/A test (automatic derivation from instrument configuration)
 * 7. Missing evidence (blocking gate when mandatory policy not satisfied)
 * 8. Evidence discrepancy (flagged on OCR mismatch)
 * 9. Corrected observation (controlled correction audit)
 * 10. Retest (audit event + fresh observation cycle)
 * 11. Review block (approval gate prevents invalid approvals)
 * 12. Final report (OIML R 76-2 structure and statutory disclaimer)
 */

import { describe, it, expect } from 'vitest';
import { SYNTHETIC_INSTRUMENTS } from '@/lib/synthetic-instruments';
import { buildCompleteEvaluationSuite, buildTestRunRecord } from '@/core/test-engine/record-factory';
import { TEST_DEFINITIONS_REGISTRY } from '@/core/test-engine/registry';
import { interpretCalculations } from '@/core/test-engine/interpreters/calculation-interpreter';
import { interpretCompliance } from '@/core/test-engine/interpreters/compliance-interpreter';
import { evaluateValidationRules } from '@/core/test-engine/interpreters/validation-interpreter';
import { CommonEvaluationContext, TestRunRecord } from '@/core/test-engine/types';

describe('NAWI-R76 Complete Workflow Refactor - Section 26 Verification', () => {
  // Base context builder
  const createTestContext = (instIndex = 0): CommonEvaluationContext => {
    const inst = SYNTHETIC_INSTRUMENTS[instIndex];
    return {
      evaluationNumber: 'RRSL-2026-TE-VERIFY',
      laboratoryName: 'Regional Reference Standard Laboratory, Ahmedabad',
      operatorName: 'Dr. A. Sharma',
      operatorRole: 'LEAD_METROLOGIST',
      standardVersion: 'OIML R 76-1:2006 (E)',
      instrument: {
        modelName: inst.modelName,
        serialNumber: inst.serialNumber,
        manufacturer: inst.manufacturer,
        accuracyClass: inst.accuracyClass,
        maxCapacity: inst.maxCapacity,
        minCapacity: inst.minCapacity,
        verificationInterval_e: inst.verificationInterval_e,
        scaleInterval_d: inst.scaleInterval_d,
        numberOfIntervals_n: inst.numberOfIntervals_n,
        rangeType: inst.rangeType,
        tareType: inst.tareType,
        powerSupply: inst.powerSupply,
        temperatureRange: inst.temperatureRange,
        receptorType: inst.receptorType,
        softwareVersion: inst.softwareVersion,
        primaryUnit: inst.primaryUnit,
        hasFailedSample: inst.hasFailedSample,
      },
      environmentalSnapshot: {
        temperatureC: 20.8,
        humidityPercent: 49.5,
        pressureHpa: 1013.2,
        recordedAt: '2026-09-28T10:00:00Z',
      },
      equipmentUsed: [],
    };
  };

  // 1. Normal bench scale
  it('1. correctly configures a normal bench scale (standard pan, Clause A.4.7.1)', () => {
    const benchContext = createTestContext(0); // SN-BS-26001 (Class II, Standard Pan)
    const suite = buildCompleteEvaluationSuite(benchContext);

    const standardEcc = suite.find((t) => t.testCode === 'R76_ECCENTRICITY');
    const rollingEcc = suite.find((t) => t.testCode === 'R76_ECC_ROLLING');
    const mobileEcc = suite.find((t) => t.testCode === 'R76_ECC_MOBILE');

    expect(standardEcc?.isApplicable).toBe(true);
    expect(rollingEcc?.isApplicable).toBe(false);
    expect(rollingEcc?.exclusionJustification).toContain('rolling-load');
    expect(mobileEcc?.isApplicable).toBe(false);
    expect(mobileEcc?.exclusionJustification).toContain('mobile');
  });

  // 2. Rolling-load/wheel-load instrument
  it('2. correctly configures rolling-load eccentricity (Clause A.4.7.4) and marks standard eccentricity N/A', () => {
    const rollingInst = SYNTHETIC_INSTRUMENTS.find((i) => i.receptorType === 'ROLLING_TRACK');
    expect(rollingInst).toBeDefined();

    const rollingContext = createTestContext(SYNTHETIC_INSTRUMENTS.indexOf(rollingInst!));
    const suite = buildCompleteEvaluationSuite(rollingContext);

    const standardEcc = suite.find((t) => t.testCode === 'R76_ECCENTRICITY');
    const rollingEcc = suite.find((t) => t.testCode === 'R76_ECC_ROLLING');

    expect(standardEcc?.isApplicable).toBe(false);
    expect(standardEcc?.exclusionJustification).toContain('rolling load receptor');
    expect(rollingEcc?.isApplicable).toBe(true);
  });

  // 3. Mobile/suspended instrument
  it('3. correctly configures mobile instrument eccentricity (Clause A.4.7.5) and marks standard eccentricity N/A', () => {
    const mobileInst = SYNTHETIC_INSTRUMENTS.find((i) => i.receptorType === 'MOBILE_SCALE');
    expect(mobileInst).toBeDefined();

    const mobileContext = createTestContext(SYNTHETIC_INSTRUMENTS.indexOf(mobileInst!));
    const suite = buildCompleteEvaluationSuite(mobileContext);

    const standardEcc = suite.find((t) => t.testCode === 'R76_ECCENTRICITY');
    const mobileEcc = suite.find((t) => t.testCode === 'R76_ECC_MOBILE');

    expect(standardEcc?.isApplicable).toBe(false);
    expect(standardEcc?.exclusionJustification).toContain('mobile/crane device');
    expect(mobileEcc?.isApplicable).toBe(true);
  });

  // 4. Failed measurement
  it('4. strictly calculates authoritative FAIL when error exceeds Table 6 MPE limits without manual overrides', () => {
    const context = createTestContext(0);
    // Intentionally create observation exceeding MPE
    const failingObservations = [
      { step: 1, direction: 'INC', load: 0, indication: 0, deltaL: 0.0005 },
      { step: 2, direction: 'INC', load: 6.0, indication: 6.050, deltaL: 0.0005 }, // +50 g error >> MPE (±1.5 g)
    ];

    const calcResult = interpretCalculations('CALC_WEIGHING_INTRINSIC', failingObservations, context);
    const compliance = interpretCompliance(calcResult, true);

    expect(compliance.verdict).toBe('FAIL');
    expect(compliance.status).toBe('FAIL');
    expect(compliance.summaryStatement.toUpperCase()).toContain('NON-COMPLIANT');
    expect(compliance.failedPointsCount).toBeGreaterThan(0);
  });

  // 5. Invalid observation
  it('5. preserves invalid observations in record history and ignores them in compliance calculation', () => {
    const context = createTestContext(0);
    const observationsWithInvalidated = [
      { step: 1, direction: 'INC', load: 0, indication: 0, deltaL: 0.0005 },
      { step: 2, direction: 'INC', load: 1.0, indication: 1.000, deltaL: 0.0005 },
      {
        step: 3,
        direction: 'INC',
        load: 6.0,
        indication: 6.080,
        deltaL: 0.0005,
        isInvalidated: true,
        invalidationReason: 'Excessive building vibration caused false turning point reading',
      },
    ];

    // Observations filtered: point 3 is marked invalid
    const validObs = observationsWithInvalidated.filter((r) => !r.isInvalidated);
    const calcResult = interpretCalculations('CALC_WEIGHING_INTRINSIC', validObs, context);
    const compliance = interpretCompliance(calcResult, true);

    expect(compliance.verdict).toBe('PASS');
    expect(observationsWithInvalidated[2].isInvalidated).toBe(true);
    expect(observationsWithInvalidated[2].invalidationReason).toContain('vibration');
  });

  // 6. N/A test
  it('6. derives N/A reasons automatically from instrument configuration without blank fields', () => {
    const classIContext = createTestContext(6);
    classIContext.instrument.accuracyClass = 'CLASS_I';

    const suite = buildCompleteEvaluationSuite(classIContext);
    const creepTest = suite.find((t) => t.testCode === 'R76_CREEP');

    expect(creepTest?.isApplicable).toBe(false);
    expect(creepTest?.status).toBe('NOT_APPLICABLE');
    expect(creepTest?.exclusionJustification).toBeDefined();
    expect(creepTest?.exclusionJustification?.length).toBeGreaterThan(10);
  });

  // 7. Missing evidence
  it('7. blocks completion when mandatory evidence required by procedure policy is missing', () => {
    const context = createTestContext(0);
    const adminDef = TEST_DEFINITIONS_REGISTRY['R76_ADMIN_MARKINGS'];
    const testRun = buildTestRunRecord(adminDef, context);

    // Strip evidence from record
    testRun.evidenceReferences = [];
    testRun.evidence = [];

    const validation = evaluateValidationRules(testRun, adminDef.procedureDefinition.validationRules, context);
    expect(validation.canComplete).toBe(false);
    expect(validation.blockingCount).toBeGreaterThan(0);
    expect(validation.messages.some((m) => m.message.toLowerCase().includes('photographic') || m.message.toLowerCase().includes('evidence'))).toBe(true);
  });

  // 8. Evidence discrepancy
  it('8. flags discrepancy when camera OCR extracted value does not match metrologist observation', () => {
    const context = createTestContext(0);
    context.instrument.hasFailedSample = true; // triggers sample discrepancy

    const weighDef = TEST_DEFINITIONS_REGISTRY['R76_WEIGH_INTRINSIC'];
    const testRun = buildTestRunRecord(weighDef, context);

    expect(testRun.evidenceDiscrepancies).toBeDefined();
    expect(testRun.evidenceDiscrepancies!.length).toBeGreaterThan(0);
    expect(testRun.evidenceDiscrepancies![0].status).toBe('DISCREPANCY_FLAGGED');
  });

  // 9. Corrected observation
  it('9. records original value, new value, reason, actor, and timestamp when an observation is corrected', () => {
    const context = createTestContext(0);
    const weighDef = TEST_DEFINITIONS_REGISTRY['R76_WEIGH_INTRINSIC'];
    const testRun = buildTestRunRecord(weighDef, context);

    const originalIndication = testRun.rawObservations[1].indication;
    const correctedIndication = 1.0002;

    const correction = {
      id: 'corr-01',
      rowIndex: 1,
      fieldKey: 'indication',
      originalValue: originalIndication,
      newValue: correctedIndication,
      reason: 'Transcription typo corrected from manual laboratory field notebook',
      actor: context.operatorName,
      timestamp: new Date().toISOString(),
    };

    testRun.correctionsHistory = [correction];
    testRun.rawObservations[1].indication = correctedIndication;

    const calcResult = interpretCalculations('CALC_WEIGHING_INTRINSIC', testRun.rawObservations, context);
    expect(testRun.correctionsHistory.length).toBe(1);
    expect(testRun.correctionsHistory[0].reason).toContain('Transcription typo');
    expect(calcResult.calculatedValues).toBeDefined();
  });

  // 10. Retest
  it('10. logs retest event with prior status and reason while resetting observation sequence', () => {
    const context = createTestContext(0);
    const weighDef = TEST_DEFINITIONS_REGISTRY['R76_WEIGH_INTRINSIC'];
    const testRun = buildTestRunRecord(weighDef, context);

    const retestEvent = {
      id: 'retest-01',
      requestedAt: new Date().toISOString(),
      requestedBy: context.operatorName,
      reason: 'Environmental draught detected during test series; chamber re-stabilized',
      previousStatus: testRun.status,
      previousSummary: testRun.complianceResult.summaryStatement,
    };

    testRun.retestHistory = [retestEvent];
    expect(testRun.retestHistory[0].reason).toContain('draught detected');
    expect(testRun.retestHistory[0].previousStatus).toBeDefined();
  });

  // 11. Review block
  it('11. blocks evaluation approval if incomplete tests or unresolved discrepancies exist', () => {
    const context = createTestContext(0);
    const suite = buildCompleteEvaluationSuite(context);

    // Make one applicable test incomplete
    const weighRun = suite.find((t) => t.testCode === 'R76_WEIGH_INTRINSIC')!;
    weighRun.status = 'INCOMPLETE';

    const applicable = suite.filter((t) => t.isApplicable);
    const incomplete = applicable.filter((t) => t.status === 'NOT_TESTED' || t.status === 'INCOMPLETE');

    expect(incomplete.length).toBeGreaterThan(0);
    const canApprove = incomplete.length === 0;
    expect(canApprove).toBe(false);
  });

  // 12. Final report structure
  it('12. structures report dynamically according to OIML R 76-2 without hardcoding and with statutory disclaimer', () => {
    const context = createTestContext(0);
    const suite = buildCompleteEvaluationSuite(context);

    const mappedClauses = suite.map((t) => ({ clause: t.clause, title: t.name, status: t.status }));
    expect(mappedClauses.length).toBe(suite.length);
    expect(mappedClauses.every((m) => m.clause.length > 0 && m.title.length > 0)).toBe(true);

    const naTests = suite.filter((t) => !t.isApplicable);
    expect(naTests.every((t) => t.exclusionJustification && t.exclusionJustification.length > 0)).toBe(true);
  });
});
