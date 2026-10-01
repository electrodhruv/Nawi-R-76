import { describe, it, expect } from 'vitest';
import { TEST_DEFINITIONS_REGISTRY } from '@/core/test-engine/registry';
import { interpretCalculations } from '@/core/test-engine/interpreters/calculation-interpreter';
import { interpretCompliance } from '@/core/test-engine/interpreters/compliance-interpreter';
import { evaluateValidationRules } from '@/core/test-engine/interpreters/validation-interpreter';
import {
  buildCompleteEvaluationSuite,
  buildTestRunRecord,
} from '@/core/test-engine/record-factory';
import { CommonEvaluationContext } from '@/core/test-engine/types';

describe('Generic Test Record Engine - NAWI-R76', () => {
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

  describe('1. Declarative Test Registry & Architecture Separation', () => {
    it('contains all 22 OIML R 76 test definitions with distinct patterns', () => {
      const expectedCodes = [
        'R76_ADMIN_MARKINGS',
        'R76_CONSTRUCTION',
        'R76_WEIGH_INTRINSIC',
        'R76_ECCENTRICITY',
        'R76_ECC_ROLLING',
        'R76_ECC_MOBILE',
        'R76_DISCRIMINATION',
        'R76_SENSITIVITY',
        'R76_REPEATABILITY',
        'R76_CREEP',
        'R76_ZERO_RETURN',
        'R76_EQUILIBRIUM',
        'R76_TARE',
        'R76_TILTING',
        'R76_WARMUP',
        'R76_TEMPERATURE',
        'R76_TEMP_EFFECT_NO_LOAD',
        'R76_VOLTAGE',
        'R76_ELECTRICAL_DISTURBANCE',
        'R76_DAMP_HEAT',
        'R76_SPAN_STABILITY',
        'R76_ENDURANCE',
      ];

      expectedCodes.forEach((code) => {
        expect(TEST_DEFINITIONS_REGISTRY[code]).toBeDefined();
        const def = TEST_DEFINITIONS_REGISTRY[code];
        expect(def.code).toBe(code);
        expect(def.clause).toBeTruthy();
        expect(def.pattern).toBeDefined();
        expect(def.procedureDefinition).toBeDefined();
        expect(def.procedureDefinition.observationSchema).toBeDefined();
        expect(def.procedureDefinition.calculationRule).toBeDefined();
        expect(def.procedureDefinition.evidencePolicy).toBeDefined();
        expect(def.reportMapping).toBeDefined();
        expect(def.completionRules).toBeDefined();
        expect(def.purpose).toBeTruthy();
      });
    });

    it('strictly separates ordinary, rolling-load, and mobile eccentricity at definition level', () => {
      const standardEcc = TEST_DEFINITIONS_REGISTRY.R76_ECCENTRICITY;
      const rollingEcc = TEST_DEFINITIONS_REGISTRY.R76_ECC_ROLLING;
      const mobileEcc = TEST_DEFINITIONS_REGISTRY.R76_ECC_MOBILE;

      expect(standardEcc.clause).toContain('A.4.7.1–A.4.7.3');
      expect(rollingEcc.clause).toContain('A.4.7.4');
      expect(mobileEcc.clause).toContain('A.4.7.5');

      expect(standardEcc.procedureDefinition.calculationRule.ruleId).toBe('CALC_ECCENTRICITY');
      expect(rollingEcc.procedureDefinition.calculationRule.ruleId).toBe('CALC_ECCENTRICITY');
      expect(mobileEcc.procedureDefinition.calculationRule.ruleId).toBe('CALC_ECCENTRICITY');

      // Verify they do not share identical observation schema layouts
      expect(standardEcc.procedureDefinition.observationSchema.fields.map((f) => f.key)).toContain('position');
      expect(rollingEcc.procedureDefinition.observationSchema.fields.map((f) => f.key)).toContain('trackPosition');
      expect(mobileEcc.procedureDefinition.observationSchema.fields.map((f) => f.key)).toContain('suspensionPosture');
    });

    it('enforces policy-driven evidence based on metrological necessity', () => {
      expect(TEST_DEFINITIONS_REGISTRY.R76_ADMIN_MARKINGS.procedureDefinition.evidencePolicy.required).toBe(true);
      expect(TEST_DEFINITIONS_REGISTRY.R76_CONSTRUCTION.procedureDefinition.evidencePolicy.required).toBe(true);
      expect(TEST_DEFINITIONS_REGISTRY.R76_ECCENTRICITY.procedureDefinition.evidencePolicy.required).toBe(true);
      expect(TEST_DEFINITIONS_REGISTRY.R76_TEMPERATURE.procedureDefinition.evidencePolicy.required).toBe(true);
      expect(TEST_DEFINITIONS_REGISTRY.R76_DAMP_HEAT.procedureDefinition.evidencePolicy.required).toBe(true);
      expect(TEST_DEFINITIONS_REGISTRY.R76_VOLTAGE.procedureDefinition.evidencePolicy.required).toBe(true);
      expect(TEST_DEFINITIONS_REGISTRY.R76_WEIGH_INTRINSIC.procedureDefinition.evidencePolicy.required).toBe(true);
      expect(TEST_DEFINITIONS_REGISTRY.R76_REPEATABILITY.procedureDefinition.evidencePolicy.required).toBe(true);
      expect(TEST_DEFINITIONS_REGISTRY.R76_DISCRIMINATION.procedureDefinition.evidencePolicy.required).toBe(false);
      expect(TEST_DEFINITIONS_REGISTRY.R76_ZERO_RETURN.procedureDefinition.evidencePolicy.required).toBe(false);
    });
  });

  describe('2. Calculation Interpreter (Frozen OIML Formulas)', () => {
    it('CALC_WEIGHING_INTRINSIC: calculates P, E, E0, Ec and verifies against Table 6 MPE', () => {
      const rawObs = [
        { step: 1, direction: 'INC', load: 0, indication: 0, deltaL: 0.0025 }, // P0 = 0 + 0.0025 - 0.0025 = 0, E0 = 0
        { step: 2, direction: 'INC', load: 5, indication: 5, deltaL: 0.0025 }, // P = 5, E = 0, Ec = 0
        { step: 3, direction: 'INC', load: 10, indication: 10.005, deltaL: 0.0025 }, // P = 10.005, Ec = +0.005
        { step: 4, direction: 'INC', load: 15, indication: 15, deltaL: 0.0025 }, // P = 15, Ec = 0
        { step: 5, direction: 'DEC', load: 10, indication: 10, deltaL: 0.0025 }, // P = 10, Ec = 0
        { step: 6, direction: 'DEC', load: 0, indication: 0, deltaL: 0.0025 }, // P = 0, Ec = 0
      ];

      const result = interpretCalculations('CALC_WEIGHING_INTRINSIC', rawObs, mockContext);
      expect(result.summary.isAllPassed).toBe(true);
      expect(result.summary.passedCount).toBe(6);
      expect(result.summary.failedCount).toBe(0);

      const rows = result.calculatedValues.observations as Record<string, unknown>[];
      expect(rows).toHaveLength(6);
      expect(rows[0].zeroError_E0).toBe(0);
      expect(rows[2].correctedError_Ec).toBe(0.005);
      expect(rows[2].applicableMpe).toBe(0.005);
      expect(rows[2].isPass).toBe(true);
    });

    it('CALC_WEIGHING_INTRINSIC: detects out-of-tolerance error correctly', () => {
      const rawObs = [
        { step: 1, direction: 'INC', load: 0, indication: 0, deltaL: 0.0025 },
        { step: 2, direction: 'INC', load: 15, indication: 15.02, deltaL: 0.0025 }, // Ec = +0.02, MPE at 15kg is 0.0075 (1.5e)
      ];

      const result = interpretCalculations('CALC_WEIGHING_INTRINSIC', rawObs, mockContext);
      expect(result.summary.isAllPassed).toBe(false);
      expect(result.summary.failedCount).toBe(1);
    });

    it('CALC_REPEATABILITY: evaluates dual series repeatability span (Emax - Emin <= MPE)', () => {
      const series1Obs = [
        { load: 7.5, indication: 7.5, deltaL: 0.0025 }, // E = 0
        { load: 7.5, indication: 7.505, deltaL: 0.0025 }, // E = +0.005
        { load: 7.5, indication: 7.5, deltaL: 0.0025 }, // E = 0
      ];
      const series2Obs = [
        { load: 15, indication: 15, deltaL: 0.0025 }, // E = 0
        { load: 15, indication: 15, deltaL: 0.0025 }, // E = 0
        { load: 15, indication: 15, deltaL: 0.0025 }, // E = 0
      ];

      const rawObs = [...series1Obs, ...series2Obs];
      const result = interpretCalculations('CALC_REPEATABILITY', rawObs, mockContext, {
        series1Observations: series1Obs,
        series2Observations: series2Obs,
      });

      expect(result.summary.isAllPassed).toBe(true);
      const s1 = (result.calculatedValues.series1 as { span: number; isPass: boolean });
      expect(s1.span).toBe(0.005);
      expect(s1.isPass).toBe(true);
    });

    it('CALC_ECCENTRICITY: calculates difference from center and verifies within 1e', () => {
      const rawObs = [
        { position: 'Center position', load: 5, indication: 5, deltaL: 0.0025 }, // Ref P = 5
        { position: 'Quadrant 1 (Front-Left)', load: 5, indication: 5.005, deltaL: 0.0025 }, // diff = 0.005 <= 1e (0.005)
        { position: 'Quadrant 2 (Front-Right)', load: 5, indication: 5, deltaL: 0.0025 }, // diff = 0
        { position: 'Quadrant 3 (Back-Right)', load: 5, indication: 5.005, deltaL: 0.0025 }, // diff = 0.005
        { position: 'Quadrant 4 (Back-Left)', load: 5, indication: 5, deltaL: 0.0025 }, // diff = 0
      ];

      const result = interpretCalculations('CALC_ECCENTRICITY', rawObs, mockContext);
      expect(result.summary.isAllPassed).toBe(true);
      expect(result.calculatedValues.maxObservedDifference).toBe(0.005);
    });

    it('CALC_SENSITIVITY: evaluates Clause A.4.9 displacement requirements', () => {
      const rawObs = [
        { loadPointName: 'Min', appliedLoad: 0.1, initialIndication: 0.1, additionalLoad: 0.005, responseDisplacementMm: 3.2 },
        { loadPointName: 'Max', appliedLoad: 15, initialIndication: 15, additionalLoad: 0.005, responseDisplacementMm: 2.8 },
      ];

      const result = interpretCalculations('CALC_SENSITIVITY', rawObs, mockContext);
      expect(result.summary.isAllPassed).toBe(true);
      expect(result.summary.passedCount).toBe(2);
    });

    it('CALC_ELECTRICAL_DISTURBANCE: evaluates Clause B.3 significant faults', () => {
      const rawObs = [
        { disturbanceType: 'Burst pulses', load: 7.5, baselineIndication: 7.5, indicationDuringDisturbance: 7.502, significantFaultDetected: 'NO' },
        { disturbanceType: 'ESD', load: 7.5, baselineIndication: 7.5, indicationDuringDisturbance: 7.5, significantFaultDetected: 'NO' },
      ];

      const result = interpretCalculations('CALC_ELECTRICAL_DISTURBANCE', rawObs, mockContext);
      expect(result.summary.isAllPassed).toBe(true);
      expect(result.summary.passedCount).toBe(2);
    });

    it('CALC_ENDURANCE: evaluates Clause A.6 pre- and post-endurance error change', () => {
      const rawObs = [
        { phase: 'Pre-endurance', load: 7.5, indication: 7.5, deltaL: 0.0025, cyclesCompleted: 0 },
        { phase: 'Repetitive Loading', load: 7.5, indication: 7.5, deltaL: 0.0025, cyclesCompleted: 100000 },
        { phase: 'Post-endurance', load: 7.5, indication: 7.502, deltaL: 0.0025, cyclesCompleted: 100000 },
      ];

      const result = interpretCalculations('CALC_ENDURANCE', rawObs, mockContext);
      expect(result.summary.isAllPassed).toBe(true);
      expect(result.calculatedValues.totalCycles).toBe(100000);
    });
  });

  describe('3. Separation of the 4 Core Concepts (Input, Procedure, Compliance, Evidence)', () => {
    it('Concept A: Input Validation catches Load > Max', () => {
      const testDef = TEST_DEFINITIONS_REGISTRY.R76_WEIGH_INTRINSIC;
      const record = buildTestRunRecord(testDef, mockContext);
      record.rawObservations = [
        { step: 1, direction: 'INC', load: 200, indication: 200, deltaL: 0.0025 }, // Exceeds Max = 15 kg
      ];

      const val = evaluateValidationRules(record, testDef.procedureDefinition.validationRules);
      expect(val.canComplete).toBe(false);
      expect(val.inputIssues.length).toBeGreaterThan(0);
      expect(val.inputIssues[0].message).toContain('exceeds Max capacity');
    });

    it('Concept B: Procedure Validation produces "X items remain" list on missing observations', () => {
      const testDef = TEST_DEFINITIONS_REGISTRY.R76_WEIGH_INTRINSIC;
      const incompleteRecord = buildTestRunRecord(testDef, mockContext);
      incompleteRecord.rawObservations = [
        { step: 1, direction: 'INC', load: '', indication: 0, deltaL: 0 }, // Missing load
      ];

      const val = evaluateValidationRules(incompleteRecord, testDef.procedureDefinition.validationRules);
      expect(val.canComplete).toBe(false);
      expect(val.messages.length).toBeGreaterThan(0);
      expect(val.userSummary).toContain('remain before this test can be completed');
    });

    it('Concept C: Un-overridable Compliance evaluates strictly against OIML limits', () => {
      const calcFail = {
        calculatedValues: {},
        trace: {},
        summary: {
          passedCount: 5,
          failedCount: 1,
          isAllPassed: false,
          headline: '1 point exceeds MPE',
        },
      };

      const compliance = interpretCompliance(calcFail, true);
      expect(compliance.verdict).toBe('FAIL');
      expect(compliance.status).toBe('FAIL');
      expect(compliance.summaryStatement).toContain('NON-COMPLIANT');
    });

    it('Concept D: Evidence Discrepancy flags mismatch between recorded and OCR values', () => {
      const testDef = TEST_DEFINITIONS_REGISTRY.R76_WEIGH_INTRINSIC;
      const record = buildTestRunRecord(testDef, mockContext);
      record.evidenceReferences = [
        {
          id: 'ev-test-01',
          fileName: 'display_max.jpg',
          mimeType: 'image/jpeg',
          timestamp: new Date().toISOString(),
          description: 'Display at Max',
          ocrExtractedValue: '15.025 kg',
          consistencyStatus: 'DISCREPANCY',
        },
      ];
      record.evidenceDiscrepancies = [
        {
          id: 'disc-01',
          evidenceId: 'ev-test-01',
          fieldKey: 'indication',
          recordedValue: '15.000 kg',
          ocrExtractedValue: '15.025 kg',
          status: 'DISCREPANCY_FLAGGED',
          flaggedAt: new Date().toISOString(),
        },
      ];

      const val = evaluateValidationRules(record, testDef.procedureDefinition.validationRules);
      expect(val.canComplete).toBe(false);
      expect(val.evidenceDiscrepancies.length).toBe(1);
      expect(val.userSummary).toContain('remain before this test can be completed');
    });
  });

  describe('4. Evaluation Suite Builder & Applicability Rules', () => {
    it('builds complete evaluation suite with all 22 tests and inherits common metadata', () => {
      const suite = buildCompleteEvaluationSuite(mockContext);
      expect(suite).toHaveLength(22);

      suite.forEach((record) => {
        expect(record.evaluationId).toBe(mockContext.evaluationNumber);
        expect(record.testDefinition).toBeDefined();
        expect(record.operator.fullName).toBe(mockContext.operatorName);
        expect(record.environmentalSnapshot.temperatureC).toBe(mockContext.environmentalSnapshot!.temperatureC);
        expect(record.equipmentUsed.length).toBeGreaterThan(0);
      });
    });

    it('correctly marks Rolling Load and Mobile Eccentricity as NOT_APPLICABLE for standard bench scales', () => {
      const suite = buildCompleteEvaluationSuite(mockContext);
      const rollingEcc = suite.find((t) => t.testCode === 'R76_ECC_ROLLING');
      const mobileEcc = suite.find((t) => t.testCode === 'R76_ECC_MOBILE');
      const standardEcc = suite.find((t) => t.testCode === 'R76_ECCENTRICITY');

      expect(standardEcc?.isApplicable).toBe(true);
      expect(standardEcc?.status).toBe('PASS');

      expect(rollingEcc?.isApplicable).toBe(false);
      expect(rollingEcc?.status).toBe('NOT_APPLICABLE');
      expect(rollingEcc?.exclusionJustification).toContain('Clause A.4.7.4');

      expect(mobileEcc?.isApplicable).toBe(false);
      expect(mobileEcc?.status).toBe('NOT_APPLICABLE');
      expect(mobileEcc?.exclusionJustification).toContain('Clause A.4.7.5');
    });

    it('marks Sensitivity as NOT_APPLICABLE for electronic self-indicating instruments with mandatory justification', () => {
      const suite = buildCompleteEvaluationSuite(mockContext);
      const sensitivity = suite.find((t) => t.testCode === 'R76_SENSITIVITY');

      expect(sensitivity?.isApplicable).toBe(false);
      expect(sensitivity?.status).toBe('NOT_APPLICABLE');
      expect(sensitivity?.exclusionJustification).toContain('non-self-indicating instruments');
    });

    it('Evaluation B generates deliberate failing observation and evidence discrepancy', () => {
      const failingContext: CommonEvaluationContext = {
        ...mockContext,
        instrument: {
          ...mockContext.instrument,
          serialNumber: 'SN-PS-26015-FAIL',
          hasFailedSample: true,
        },
      };

      const suite = buildCompleteEvaluationSuite(failingContext);
      const weighingTest = suite.find((t) => t.testCode === 'R76_WEIGH_INTRINSIC');
      expect(weighingTest?.status).toBe('FAIL');
      expect(weighingTest?.complianceResult?.verdict).toBe('FAIL');
      expect(weighingTest?.complianceResult?.failedPointsCount).toBeGreaterThan(0);
      expect(weighingTest?.evidenceDiscrepancies?.length).toBeGreaterThan(0);
      expect(weighingTest?.structuredRemarks.length).toBeGreaterThan(0);
      expect(weighingTest?.structuredRemarks[0].reasonCode).toBe('INVALID_VALUE');
    });
  });
});
