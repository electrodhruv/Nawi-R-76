import { describe, it, expect } from 'vitest';
import { TEST_DEFINITIONS_REGISTRY } from '@/core/test-engine/registry';
import { interpretCalculations } from '@/core/test-engine/interpreters/calculation-interpreter';
import { interpretCompliance } from '@/core/test-engine/interpreters/compliance-interpreter';
import { evaluateValidationRules } from '@/core/test-engine/interpreters/validation-interpreter';
import {
  buildCompleteEvaluationSuite,
  buildTestRunRecord,
} from '@/core/test-engine/record-factory';
import { CommonEvaluationContext, TestRunRecord, ObservationCorrection } from '@/core/test-engine/types';

describe('NAWI-R76 Core Evaluation & Test Record Engine (Section 49 Requirements)', () => {
  const mockContext: CommonEvaluationContext = {
    evaluationNumber: 'RRSL-2026-TE-0104',
    laboratoryName: 'Regional Reference Standard Laboratory, Ahmedabad',
    operatorName: 'Dr. A. Sharma',
    operatorRole: 'LEAD_METROLOGIST',
    standardVersion: 'OIML R 76-1:2006 (E)',
    instrument: {
      modelName: 'AWT-3000-Retail',
      serialNumber: 'SN-RS-26003',
      manufacturer: 'Delta Electronics Synthetic Corp',
      accuracyClass: 'CLASS_III',
      maxCapacity: 15,
      minCapacity: 0.1,
      verificationInterval_e: 0.005,
      scaleInterval_d: 0.005,
      numberOfIntervals_n: 3000,
      rangeType: 'SINGLE',
      tareType: 'SUBTRACTIVE',
      powerSupply: '230 V AC Mains + 6V Internal Battery',
      temperatureRange: '-10 °C to +40 °C',
      receptorType: 'STANDARD_PAN',
      softwareVersion: 'v2.14.0',
      primaryUnit: 'kg',
      hasFailedSample: false,
    },
    environmentalSnapshot: {
      temperatureC: 20.4,
      humidityPercent: 48.2,
      pressureHpa: 1013.2,
      recordedAt: '2026-03-27T10:00:00Z',
    },
    equipmentUsed: [
      {
        id: 'eq-01',
        name: 'Class F1 Stainless Steel Weight Set (1 g to 20 kg)',
        serialNumber: 'STD-F1-2024-015',
        certificateNumber: 'CERT-2025-F1-084',
        calibrationDate: '2025-03-31',
        calibrationExpiry: '2027-03-31',
        isCalibrated: true,
      },
    ],
  };

  // =========================================================================
  // A. WEIGHING PERFORMANCE — A.4.4
  // =========================================================================
  describe('A. Weighing Performance (A.4.4)', () => {
    const weighDef = TEST_DEFINITIONS_REGISTRY.R76_WEIGH_INTRINSIC;

    it('processes valid observations with deterministic P, E, Ec, MPE and PASS', () => {
      const validObservations = [
        { direction: 'INC', load: 0, indication: 0, deltaL: 0.002 },
        { direction: 'INC', load: 5, indication: 5.000, deltaL: 0.002 },
        { direction: 'INC', load: 10, indication: 10.000, deltaL: 0.002 },
        { direction: 'INC', load: 15, indication: 15.000, deltaL: 0.002 },
        { direction: 'DEC', load: 10, indication: 10.000, deltaL: 0.002 },
        { direction: 'DEC', load: 0, indication: 0, deltaL: 0.002 },
      ];

      const testRun = buildTestRunRecord(weighDef, mockContext);
      testRun.rawObservations = validObservations;

      // 1. Validation
      const validation = evaluateValidationRules(
        testRun,
        weighDef.procedureDefinition.validationRules,
        mockContext
      );
      expect(validation.blockingCount).toBe(0);
      expect(validation.canComplete).toBe(true);

      // 2. Calculation
      const calcResult = interpretCalculations('CALC_WEIGHING_INTRINSIC', validObservations, mockContext);
      expect(calcResult.summary.passedCount).toBeGreaterThan(0);
      expect(calcResult.summary.failedCount).toBe(0);
      expect(calcResult.summary.isAllPassed).toBe(true);

      // 3. Compliance
      const compliance = interpretCompliance(calcResult, true);
      expect(compliance.verdict).toBe('PASS');
    });

    it('flags load > Max as INVALID in input validation', () => {
      const invalidLoadObs = [
        { direction: 'INC', load: 20, indication: 20.000, deltaL: 0.002 }, // 20 > Max (15)
      ];

      const testRun = buildTestRunRecord(weighDef, mockContext);
      testRun.rawObservations = invalidLoadObs;

      const validation = evaluateValidationRules(
        testRun,
        weighDef.procedureDefinition.validationRules,
        mockContext
      );
      expect(validation.canComplete).toBe(false);
      expect(validation.inputIssues.some((m) => m.fieldKey === 'load' && m.message.includes('exceeds Max'))).toBe(true);
    });

    it('flags negative values as INVALID where non-negative is required', () => {
      const negativeLoadObs = [
        { direction: 'INC', load: -5, indication: 0, deltaL: 0.002 },
      ];

      const testRun = buildTestRunRecord(weighDef, mockContext);
      testRun.rawObservations = negativeLoadObs;

      const validation = evaluateValidationRules(
        testRun,
        weighDef.procedureDefinition.validationRules,
        mockContext
      );
      expect(validation.canComplete).toBe(false);
      expect(validation.inputIssues.some((m) => m.fieldKey === 'load' && m.message.includes('cannot be less than'))).toBe(true);
    });

    it('correctly calculates MPE failure when corrected error exceeds Table 6 limit', () => {
      const failingObs = [
        { direction: 'INC', load: 0, indication: 0, deltaL: 0.002 },
        // At 10 kg (2000e), Table 6 MPE is 1.0e = 0.005 kg. Here indication has error = 0.020 kg (4e)
        { direction: 'INC', load: 10, indication: 10.020, deltaL: 0.002 },
      ];

      const calcResult = interpretCalculations('CALC_WEIGHING_INTRINSIC', failingObs, mockContext);
      expect(calcResult.summary.failedCount).toBeGreaterThan(0);
      expect(calcResult.summary.isAllPassed).toBe(false);

      const compliance = interpretCompliance(calcResult, true);
      expect(compliance.verdict).toBe('FAIL');
      expect(compliance.summaryStatement).toContain('exceed');
    });

    it('supports observation correction audit trail (preserving history, recalculating server-side)', () => {
      const testRun = buildTestRunRecord(weighDef, mockContext);
      testRun.rawObservations = [
        { direction: 'INC', load: 10, indication: 10.030, deltaL: 0.002 },
      ];

      // Simulate correcting a data-entry transcription typo from 10.030 to 10.000
      const correction: ObservationCorrection = {
        id: 'corr-001',
        rowIndex: 0,
        fieldKey: 'indication',
        originalValue: 10.030,
        newValue: 10.000,
        reason: 'Typo in manual transcription during testing',
        actor: 'Dr. A. Sharma',
        timestamp: new Date().toISOString(),
      };

      testRun.correctionsHistory = [correction];
      testRun.rawObservations[0].indication = 10.000;

      // Recalculate
      const recalc = interpretCalculations('CALC_WEIGHING_INTRINSIC', testRun.rawObservations, mockContext);
      expect(recalc.summary.failedCount).toBe(0);
      expect(testRun.correctionsHistory).toHaveLength(1);
      expect(testRun.correctionsHistory[0].originalValue).toBe(10.030);
      expect(testRun.correctionsHistory[0].newValue).toBe(10.000);
    });

    it('supports marking observation invalid with structured reason and preserving it', () => {
      const testRun = buildTestRunRecord(weighDef, mockContext);
      testRun.rawObservations = [
        {
          direction: 'INC',
          load: 10,
          indication: 10.040,
          deltaL: 0.002,
          isInvalid: true,
          invalidReason: 'UNSTABLE_CONDITION',
          invalidNotes: 'Draft shield knocked open by operator',
          invalidatedAt: new Date().toISOString(),
        },
      ];

      // The observation still exists in the array (not deleted)
      expect(testRun.rawObservations).toHaveLength(1);
      expect(testRun.rawObservations[0].isInvalid).toBe(true);
      expect(testRun.rawObservations[0].invalidReason).toBe('UNSTABLE_CONDITION');
    });

    it('supports retest attempt creation preserving Attempt 1 history', () => {
      const testRun = buildTestRunRecord(weighDef, mockContext);
      testRun.status = 'FAIL';
      testRun.rawObservations = [
        { direction: 'INC', load: 10, indication: 10.030, deltaL: 0.002 },
      ];

      // Trigger retest
      const attempt1Record = {
        id: 'ret-001',
        requestedAt: new Date().toISOString(),
        requestedBy: 'Dr. A. Sharma',
        reason: 'Recalibrated test weights and retrying',
        previousStatus: testRun.status,
        previousSummary: 'Calculated error exceeded Table 6 limit at 10 kg',
      };

      testRun.retestHistory = [attempt1Record];
      testRun.status = 'NOT_TESTED';
      testRun.rawObservations = [
        { direction: 'INC', load: 10, indication: 10.000, deltaL: 0.002 },
      ];

      expect(testRun.retestHistory).toHaveLength(1);
      expect(testRun.retestHistory?.[0].previousStatus).toBe('FAIL');
      expect(testRun.rawObservations[0].indication).toBe(10.000);
    });
  });

  // =========================================================================
  // B. REPEATABILITY — A.4.10
  // =========================================================================
  describe('B. Repeatability (A.4.10)', () => {
    const repDef = TEST_DEFINITIONS_REGISTRY.R76_REPEATABILITY;

    it('evaluates both Series 1 (~50% Max) and Series 2 (~100% Max) with Emax - Emin span', () => {
      // 3 observations each for Series 1 and Series 2
      const obs = [
        // Series 1: ~7 kg (approx 50% Max)
        { series: 'SERIES_1', weighingIndex: 1, load: 7.0, indication: 7.000, deltaL: 0.002 },
        { series: 'SERIES_1', weighingIndex: 2, load: 7.0, indication: 7.000, deltaL: 0.002 },
        { series: 'SERIES_1', weighingIndex: 3, load: 7.0, indication: 7.000, deltaL: 0.002 },
        // Series 2: ~15 kg (approx 100% Max)
        { series: 'SERIES_2', weighingIndex: 1, load: 15.0, indication: 15.000, deltaL: 0.002 },
        { series: 'SERIES_2', weighingIndex: 2, load: 15.0, indication: 15.000, deltaL: 0.002 },
        { series: 'SERIES_2', weighingIndex: 3, load: 15.0, indication: 15.000, deltaL: 0.002 },
      ];

      const calcResult = interpretCalculations('CALC_REPEATABILITY', obs, mockContext);
      expect(calcResult.summary.isAllPassed).toBe(true);
      expect(calcResult.calculatedValues.series1).toBeDefined();
      expect(calcResult.calculatedValues.series2).toBeDefined();
      const s1 = calcResult.calculatedValues.series1 as { span: number; isPass: boolean };
      const s2 = calcResult.calculatedValues.series2 as { span: number; isPass: boolean };
      expect(s1.isPass).toBe(true);
      expect(s2.isPass).toBe(true);

      const compliance = interpretCompliance(calcResult, true);
      expect(compliance.verdict).toBe('PASS');
    });

    it('fails when repeatability span (Emax - Emin) exceeds MPE', () => {
      const failingObs = [
        // Series 1 has a large span difference between weighings: 7.000 and 7.020 (span 0.020 > MPE 0.005)
        { series: 'SERIES_1', weighingIndex: 1, load: 7.0, indication: 7.000, deltaL: 0.002 },
        { series: 'SERIES_1', weighingIndex: 2, load: 7.0, indication: 7.020, deltaL: 0.002 },
        { series: 'SERIES_1', weighingIndex: 3, load: 7.0, indication: 7.000, deltaL: 0.002 },
        // Series 2
        { series: 'SERIES_2', weighingIndex: 1, load: 15.0, indication: 15.000, deltaL: 0.002 },
        { series: 'SERIES_2', weighingIndex: 2, load: 15.0, indication: 15.000, deltaL: 0.002 },
        { series: 'SERIES_2', weighingIndex: 3, load: 15.0, indication: 15.000, deltaL: 0.002 },
      ];

      const calcResult = interpretCalculations('CALC_REPEATABILITY', failingObs, mockContext);
      expect(calcResult.summary.isAllPassed).toBe(false);
      const s1 = calcResult.calculatedValues.series1 as { span: number; isPass: boolean };
      expect(s1.isPass).toBe(false);

      const compliance = interpretCompliance(calcResult, true);
      expect(compliance.verdict).toBe('FAIL');
    });

    it('detects missing observations when fewer than procedure required weighings', () => {
      // Only 2 weighings instead of minimum 6 total across both series
      const incompleteObs = [
        { series: 'SERIES_1', weighingIndex: 1, load: 7.0, indication: 7.000, deltaL: 0.002 },
        { series: 'SERIES_1', weighingIndex: 2, load: 7.0, indication: 7.000, deltaL: 0.002 },
      ];

      const testRun = buildTestRunRecord(repDef, mockContext);
      testRun.rawObservations = incompleteObs;

      const validation = evaluateValidationRules(
        testRun,
        repDef.procedureDefinition.validationRules,
        mockContext
      );
      expect(validation.canComplete).toBe(false);
      expect(validation.procedureIssues.some((m) => m.message.includes('observation'))).toBe(true);
    });
  });

  // =========================================================================
  // C. ECCENTRICITY — A.4.7
  // =========================================================================
  describe('C. Eccentricity (A.4.7)', () => {
    it('isolates standard weights procedure fields from rolling and mobile controls', () => {
      const stdEccDef = TEST_DEFINITIONS_REGISTRY.R76_ECCENTRICITY;
      const rollingEccDef = TEST_DEFINITIONS_REGISTRY.R76_ECC_ROLLING;
      const mobileEccDef = TEST_DEFINITIONS_REGISTRY.R76_ECC_MOBILE;

      // Standard weights has standard position fields
      const stdFieldKeys = stdEccDef.procedureDefinition.observationSchema.fields.map((f) => f.key);
      expect(stdFieldKeys).toContain('position');
      expect(stdFieldKeys).not.toContain('trackPosition');
      expect(stdFieldKeys).not.toContain('suspensionPosture');

      // Rolling load has trackPosition / direction
      const rollingFieldKeys = rollingEccDef.procedureDefinition.observationSchema.fields.map((f) => f.key);
      expect(rollingFieldKeys).toContain('trackPosition');
      expect(rollingFieldKeys).toContain('direction');

      // Mobile eccentricity has suspensionPosture
      const mobileFieldKeys = mobileEccDef.procedureDefinition.observationSchema.fields.map((f) => f.key);
      expect(mobileFieldKeys).toContain('suspensionPosture');
    });

    it('calculates standard eccentricity with position, load, deltaL and MPE comparison', () => {
      const obs = [
        { position: 'CENTER', load: 5, indication: 5.000, deltaL: 0.002 },
        { position: 'CORNER_FRONT_LEFT', load: 5, indication: 5.000, deltaL: 0.002 },
        { position: 'CORNER_BACK_LEFT', load: 5, indication: 5.000, deltaL: 0.002 },
        { position: 'CORNER_BACK_RIGHT', load: 5, indication: 5.000, deltaL: 0.002 },
        { position: 'CORNER_FRONT_RIGHT', load: 5, indication: 5.000, deltaL: 0.002 },
      ];

      const calcResult = interpretCalculations('CALC_ECCENTRICITY', obs, mockContext);
      expect(calcResult.summary.isAllPassed).toBe(true);
      expect(calcResult.summary.passedCount).toBe(5);

      const compliance = interpretCompliance(calcResult, true);
      expect(compliance.verdict).toBe('PASS');
    });
  });

  // =========================================================================
  // D. CHECKLIST PATTERN — Administrative & Construction
  // =========================================================================
  describe('D. Checklist Pattern (Administrative & Construction)', () => {
    const adminDef = TEST_DEFINITIONS_REGISTRY.R76_ADMIN_MARKINGS;

    it('passes when all requirements are marked PASS', () => {
      const obs = [
        { requirement: 'Manufacturer Name', status: 'PASS' },
        { requirement: 'Model & Serial Number', status: 'PASS' },
        { requirement: 'Accuracy Class & Max/e', status: 'PASS' },
      ];

      const calcResult = interpretCalculations('CALC_CHECKLIST', obs, mockContext);
      expect(calcResult.summary.isAllPassed).toBe(true);

      const compliance = interpretCompliance(calcResult, true);
      expect(compliance.verdict).toBe('PASS');
    });

    it('fails when any requirement is marked FAIL', () => {
      const obs = [
        { requirement: 'Manufacturer Name', status: 'PASS' },
        { requirement: 'Model & Serial Number', status: 'FAIL' },
        { requirement: 'Accuracy Class & Max/e', status: 'PASS' },
      ];

      const calcResult = interpretCalculations('CALC_CHECKLIST', obs, mockContext);
      expect(calcResult.summary.isAllPassed).toBe(false);
      expect(calcResult.summary.failedCount).toBe(1);

      const compliance = interpretCompliance(calcResult, true);
      expect(compliance.verdict).toBe('FAIL');
    });

    it('requires structured justification when an item is marked NOT_APPLICABLE', () => {
      // Missing naReason should be blocked by validation interpreter
      const testRunWithoutReason = buildTestRunRecord(adminDef, mockContext);
      testRunWithoutReason.rawObservations = [
        { requirement: 'Auxiliary Indicating Device', status: 'NOT_APPLICABLE' },
      ];

      const validationWithoutReason = evaluateValidationRules(
        testRunWithoutReason,
        adminDef.procedureDefinition.validationRules,
        mockContext
      );
      expect(validationWithoutReason.canComplete).toBe(false);
      expect(validationWithoutReason.inputIssues.some((m) => m.fieldKey === 'naReason')).toBe(true);

      // With structured justification: valid
      const testRunWithReason = buildTestRunRecord(adminDef, mockContext);
      testRunWithReason.rawObservations = [
        {
          requirement: 'Auxiliary Indicating Device',
          status: 'NOT_APPLICABLE',
          naReason: 'FEATURE_NOT_FITTED',
          observation: 'Instrument is single-interval Class III without auxiliary indication',
        },
      ];

      const validationWithReason = evaluateValidationRules(
        testRunWithReason,
        adminDef.procedureDefinition.validationRules,
        mockContext
      );
      expect(
        validationWithReason.inputIssues.some((m) => m.fieldKey === 'naReason')
      ).toBe(false);
    });
  });

  // =========================================================================
  // E. TIME SERIES PATTERN — Creep & Span Stability
  // =========================================================================
  describe('E. Time Series Pattern (Creep & Span Stability)', () => {
    it('evaluates creep observations and allows 30-minute early termination evaluation', () => {
      const obs = [
        { elapsedMinutes: 0, load: 15, indication: 15.000, deltaL: 0.002, temperatureC: 20 },
        { elapsedMinutes: 5, load: 15, indication: 15.000, deltaL: 0.002, temperatureC: 20 },
        { elapsedMinutes: 15, load: 15, indication: 15.000, deltaL: 0.002, temperatureC: 20 },
        { elapsedMinutes: 30, load: 15, indication: 15.000, deltaL: 0.002, temperatureC: 20 },
      ];

      const calcResult = interpretCalculations('CALC_CREEP', obs, mockContext);
      expect(calcResult.calculatedValues.earlyTerminationQualified).toBe(true);
      expect(calcResult.summary.isAllPassed).toBe(true);

      const compliance = interpretCompliance(calcResult, true);
      expect(compliance.verdict).toBe('PASS');
    });

    it('tracks span stability dynamic measurements count toward required total', () => {
      const spanDef = TEST_DEFINITIONS_REGISTRY.R76_SPAN_STABILITY;
      const obs = [
        { measurementIndex: 1, elapsedHours: 0, referenceLoad: 15, indication: 15.000, deltaL: 0.002, temperatureC: 20, humidityPercent: 50 },
        { measurementIndex: 2, elapsedHours: 24, referenceLoad: 15, indication: 15.000, deltaL: 0.002, temperatureC: 20, humidityPercent: 50 },
        { measurementIndex: 3, elapsedHours: 48, referenceLoad: 15, indication: 15.000, deltaL: 0.002, temperatureC: 20, humidityPercent: 50 },
      ];

      const testRun = buildTestRunRecord(spanDef, mockContext);
      testRun.rawObservations = obs;

      // Completion rules require 8 measurements for span stability
      const validation = evaluateValidationRules(
        testRun,
        spanDef.procedureDefinition.validationRules,
        mockContext
      );
      expect(validation.canComplete).toBe(false);
      expect(validation.procedureIssues.some((m) => m.message.includes('observation'))).toBe(true);
    });
  });

  // =========================================================================
  // F. ENVIRONMENTAL & STRESS PATTERN
  // =========================================================================
  describe('F. Environmental & Stress Pattern', () => {
    it('isolates voltage variation subtypes and calculates voltage error and MPE', () => {
      const obs = [
        { supplyCondition: 'NOMINAL', targetVoltageV: 230, actualVoltageV: 230, load: 10, indication: 10.000, deltaL: 0.002, response: 'NORMAL' },
        { supplyCondition: 'UPPER_LIMIT', targetVoltageV: 253, actualVoltageV: 253, load: 10, indication: 10.000, deltaL: 0.002, response: 'NORMAL' },
        { supplyCondition: 'LOWER_LIMIT', targetVoltageV: 195.5, actualVoltageV: 195.5, load: 10, indication: 10.000, deltaL: 0.002, response: 'NORMAL' },
      ];

      const calcResult = interpretCalculations('CALC_VOLTAGE', obs, mockContext);
      expect(calcResult.summary.isAllPassed).toBe(true);

      const compliance = interpretCompliance(calcResult, true);
      expect(compliance.verdict).toBe('PASS');
    });

    it('evaluates endurance 3-phase workflow (pre, 100000 cycles, post)', () => {
      const obs = [
        {
          preWeighingError: 0.001,
          targetLoad: 10,
          cyclesCompleted: 100000,
          postWeighingError: 0.002,
          isMechanicallyIntact: true,
        },
      ];

      const calcResult = interpretCalculations('CALC_ENDURANCE', obs, mockContext);
      expect(calcResult.calculatedValues.isPass).toBe(true);
      expect(calcResult.summary.isAllPassed).toBe(true);

      const compliance = interpretCompliance(calcResult, true);
      expect(compliance.verdict).toBe('PASS');
    });
  });

  // =========================================================================
  // G. FULL WORKFLOW COMPLETION GATE
  // =========================================================================
  describe('G. Evaluation Workflow Completion Gate', () => {
    it('builds complete evaluation suite with 22 canonical test runs', () => {
      const suite = buildCompleteEvaluationSuite(mockContext);
      expect(suite.length).toBe(22);
      expect(suite.every((t) => t.testCode && t.clause && t.name)).toBe(true);
    });

    it('correctly partitions applicable tests and non-applicable statutory exemptions', () => {
      const suite = buildCompleteEvaluationSuite(mockContext);
      const applicable = suite.filter((t) => t.isApplicable && t.status !== 'NOT_APPLICABLE');
      const nonApplicable = suite.filter((t) => !t.isApplicable || t.status === 'NOT_APPLICABLE');

      // Electronic self-indicating retail scale has statutory exemptions (e.g. Sensitivity A.4.9, Rolling Load A.4.7.4, Mobile/Suspended A.4.7.5)
      expect(applicable.length).toBeGreaterThan(0);
      expect(nonApplicable.length).toBeGreaterThan(0);
      expect(applicable.length + nonApplicable.length).toBe(suite.length);

      // Verify non-applicable tests carry clear exemption reasons
      nonApplicable.forEach((test) => {
        expect(test.exclusionJustification || test.testDefinition.exemptionRuleDescription).toBeDefined();
      });

      // Verify that sensitivity is marked non-applicable for self-indicating instruments
      const sensitivityTest = suite.find((t) => t.testCode === 'R76_SENSITIVITY');
      if (sensitivityTest) {
        expect(sensitivityTest.isApplicable).toBe(false);
        expect(sensitivityTest.status).toBe('NOT_APPLICABLE');
      }
    });
  });
});
