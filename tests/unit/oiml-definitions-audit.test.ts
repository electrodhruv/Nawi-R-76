/**
 * OIML R 76 Rule & Test-Definition Metrological Audit Test Suite
 *
 * Verifies:
 * 1. Authority and completeness of all 22 OIML R 76 test definitions.
 * 2. Strict clause mapping correctness against OIML R 76-1:2006 (E) and R 76-2:2007 (E).
 * 3. Regression rules:
 *    - Standard Eccentricity never receives rolling or mobile/tilt fields.
 *    - Warm-up is strictly Clause 5.3.5, A.5.2 (never Span Stability B.4).
 *    - Damp Heat is strictly Annex B Clause B.2 (never Static Temperature A.5.3).
 *    - Span Stability is strictly Annex B Clause 3.9.5, B.4 (never Warm-up A.5.2).
 *    - Tare is strictly Clause 4.6, A.4.5 (never Ballast Substitution A.4.6).
 * 4. Metrological contract fields completeness (id, code, clause, purpose, applicability,
 *    pattern, requiredInputs, requiredObservations, calculationRule, complianceRule,
 *    completionRules, evidencePolicy, reportMapping).
 * 5. Applicability evaluation:
 *    - Inapplicable tests contain structured justifications.
 *    - Inapplicable tests are NEVER marked PASS.
 * 6. Distinction between top-level OIML R 76-2 report items and internal executable subtests.
 */

import { describe, it, expect } from 'vitest';
import { TEST_DEFINITIONS_REGISTRY } from '@/core/test-engine/registry';
import {
  buildCompleteEvaluationSuite,
  buildTestRunRecord,
} from '@/core/test-engine/record-factory';
import { CommonEvaluationContext, TestRunRecord } from '@/core/test-engine/types';
import { interpretCompliance } from '@/core/test-engine/interpreters/compliance-interpreter';

describe('OIML R 76 Rule & Test-Definition Metrological Audit', () => {
  const baseContext: CommonEvaluationContext = {
    evaluationNumber: 'AUDIT-RRSL-2026-001',
    laboratoryName: 'National Metrology Institute Type Approval Laboratory',
    operatorName: 'A. K. Sharma',
    operatorRole: 'LEAD_METROLOGIST',
    standardVersion: 'OIML R 76-1:2006 (E) & R 76-2:2007 (E)',
    instrument: {
      modelName: 'BENCH-SCALE-STANDARD',
      serialNumber: 'SN-STD-2026-01',
      manufacturer: 'Precision Weighing Instruments Ltd',
      accuracyClass: 'CLASS_III',
      maxCapacity: 30,
      minCapacity: 0.2,
      verificationInterval_e: 0.01,
      scaleInterval_d: 0.01,
      numberOfIntervals_n: 3000,
      rangeType: 'SINGLE',
      tareType: 'SUBTRACTIVE',
      powerSupply: '230 V AC Mains + 6V Internal Battery',
      temperatureRange: '-10 °C to +40 °C',
      receptorType: 'STANDARD_PAN',
      softwareVersion: 'v3.1.0',
      primaryUnit: 'kg',
      hasFailedSample: false,
      scaleType: 'ELECTRONIC_SELF_INDICATING',
    },
    environmentalSnapshot: {
      temperatureC: 20.0,
      humidityPercent: 50.0,
      pressureHpa: 1013.25,
      recordedAt: '2026-09-29T10:00:00Z',
    },
    equipmentUsed: [],
  };

  // ==========================================================================
  // 1. INVENTORY & DEFINITION CONTRACT COMPLETENESS
  // ==========================================================================
  describe('1. Inventory & Test Engine Contract Completeness', () => {
    const requiredTestCodes = [
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

    it('contains exactly the 22 canonical OIML R 76 test definitions', () => {
      const registryCodes = Object.keys(TEST_DEFINITIONS_REGISTRY);
      expect(registryCodes.length).toBe(22);
      requiredTestCodes.forEach((code) => {
        expect(TEST_DEFINITIONS_REGISTRY[code]).toBeDefined();
      });
    });

    it('ensures every TestDefinition satisfies all mandatory contract fields without dynamic eval()', () => {
      Object.values(TEST_DEFINITIONS_REGISTRY).forEach((def) => {
        // Internal identity
        expect(def.code).toBeTruthy();
        expect(def.name).toBeTruthy();
        expect(def.clause).toBeTruthy();
        expect(def.purpose).toBeTruthy();
        expect(def.purpose.length).toBeGreaterThan(10);

        // Standard and pattern
        expect(def.standard).toBe('OIML R 76-1:2006');
        expect(def.pattern).toMatch(/^PATTERN_[ABCD]_[A-Z_]+$/);

        // Applicability
        expect(def.applicableClasses).toBeDefined();
        expect(def.applicableClasses.length).toBeGreaterThan(0);
        expect(def.applicability).toBeDefined();
        expect(def.applicability!.applicableClasses).toEqual(def.applicableClasses);

        // Completion rules
        expect(def.completionRules).toBeDefined();
        expect(def.completionRules!.minObservations).toBeGreaterThanOrEqual(1);

        // Report mapping
        expect(def.reportMapping).toBeDefined();
        expect(def.reportMapping.reportItemNumber).toBeTruthy();
        expect(def.reportMapping.reportItemTitle).toBeTruthy();
        expect(typeof def.reportMapping.isTopLevelReportItem).toBe('boolean');

        // Procedure definition
        const proc = def.procedureDefinition;
        expect(proc).toBeDefined();
        expect(proc.procedureVersion).toBeTruthy();
        expect(proc.summary).toBeTruthy();
        expect(proc.whatIsBeingChecked).toBeTruthy();
        expect(proc.setupInstructions.length).toBeGreaterThan(0);
        expect(proc.observationSchema).toBeDefined();
        expect(proc.observationSchema.fields.length).toBeGreaterThan(0);
        expect(proc.validationRules.length).toBeGreaterThan(0);
        expect(proc.calculationRule).toBeDefined();
        expect(proc.calculationRule.ruleId).toMatch(/^CALC_/);
        expect(proc.complianceRule).toBeDefined();
        expect(proc.complianceRule.ruleId).toMatch(/^COMP_/);
        expect(proc.evidencePolicy).toBeDefined();
        expect(proc.evidencePolicy.level).toBeDefined();
        expect(proc.requiredInputs).toBeDefined();
        expect(proc.requiredObservations).toBeDefined();
      });
    });
  });

  // ==========================================================================
  // 2. REGRESSION TESTS: CLAUSE MAPPINGS & ISOLATION
  // ==========================================================================
  describe('2. Metrological Clause Mapping & Isolation Verification', () => {
    it('Eccentricity with Standard Weights never renders mobile or track/tilt fields', () => {
      const standardEcc = TEST_DEFINITIONS_REGISTRY.R76_ECCENTRICITY;
      expect(standardEcc.clause).toContain('A.4.7.1–A.4.7.3');
      expect(standardEcc.clause).toContain('3.6.2');

      const fieldKeys = standardEcc.procedureDefinition.observationSchema.fields.map((f) => f.key);
      expect(fieldKeys).toContain('position');
      expect(fieldKeys).toContain('load');
      expect(fieldKeys).toContain('indication');
      expect(fieldKeys).toContain('deltaL');

      // Regression: must never have rolling, mobile posture, or tilt fields
      expect(fieldKeys).not.toContain('trackPosition');
      expect(fieldKeys).not.toContain('suspensionPosture');
      expect(fieldKeys).not.toContain('tiltOrientation');
      expect(fieldKeys).not.toContain('chamberTempC');
      expect(fieldKeys).not.toContain('elapsedMinutes');
    });

    it('Warm-up Time test is strictly Clause 5.3.5, A.5.2 (never Span Stability B.4)', () => {
      const warmup = TEST_DEFINITIONS_REGISTRY.R76_WARMUP;
      expect(warmup.clause).toBe('5.3.5, A.5.2');
      expect(warmup.reportMapping.reportItemNumber).toBe('12');
      expect(warmup.reportMapping.reportItemTitle).toBe('Warm-up Time Test');
      expect(warmup.procedureDefinition.calculationRule.ruleId).toBe('CALC_WARMUP');

      // Verify fields are strictly time-series warm-up, not 28-day span stability
      const fieldKeys = warmup.procedureDefinition.observationSchema.fields.map((f) => f.key);
      expect(fieldKeys).toContain('elapsedMinutes');
      expect(fieldKeys).toContain('zeroReading');
      expect(fieldKeys).not.toContain('elapsedDays');
      expect(fieldKeys).not.toContain('pressureHpa');
    });

    it('Damp Heat is strictly Annex B Clause 3.9.2.4, B.2 (never Static Temperature A.5.3)', () => {
      const dampHeat = TEST_DEFINITIONS_REGISTRY.R76_DAMP_HEAT;
      expect(dampHeat.clause).toBe('3.9.2.4, B.2');
      expect(dampHeat.reportMapping.reportItemNumber).toBe('17');
      expect(dampHeat.reportMapping.reportItemTitle).toBe('Damp Heat Steady State Test');
      expect(dampHeat.procedureDefinition.complianceRule.ruleId).toBe('COMP_DAMP_HEAT');

      // Field isolation: must have humidity and 48h soak
      const fieldKeys = dampHeat.procedureDefinition.observationSchema.fields.map((f) => f.key);
      expect(fieldKeys).toContain('chamberHumidityRh');
      expect(fieldKeys).toContain('durationHours');
      expect(fieldKeys).not.toContain('soakHours');
    });

    it('Span Stability is strictly Annex B Clause 3.9.5, B.4 (never Warm-up A.5.2)', () => {
      const spanStab = TEST_DEFINITIONS_REGISTRY.R76_SPAN_STABILITY;
      expect(spanStab.clause).toBe('3.9.5, B.4');
      expect(spanStab.reportMapping.reportItemNumber).toBe('18');
      expect(spanStab.reportMapping.reportItemTitle).toBe('Span Stability Test');

      const fieldKeys = spanStab.procedureDefinition.observationSchema.fields.map((f) => f.key);
      expect(fieldKeys).toContain('elapsedDays');
      expect(fieldKeys).toContain('recordedDate');
      expect(fieldKeys).not.toContain('elapsedMinutes');
    });

    it('Tare Weighing is strictly Clause 4.6, A.4.5 (never Ballast Substitution A.4.6)', () => {
      const tare = TEST_DEFINITIONS_REGISTRY.R76_TARE;
      expect(tare.clause).toBe('4.6, A.4.5');
      expect(tare.clause).not.toContain('A.4.6');
      expect(tare.reportMapping.reportItemNumber).toBe('10');
      expect(tare.procedureDefinition.calculationRule.ruleId).toBe('CALC_TARE');
    });

    it('Tilting test is strictly Clause 3.9.1.1, A.5.1 and isolated from standard eccentricity', () => {
      const tilting = TEST_DEFINITIONS_REGISTRY.R76_TILTING;
      expect(tilting.clause).toBe('3.9.1.1, A.5.1');
      expect(tilting.reportMapping.reportItemNumber).toBe('11');
      expect(tilting.procedureDefinition.calculationRule.ruleId).toBe('CALC_TILTING');

      const fieldKeys = tilting.procedureDefinition.observationSchema.fields.map((f) => f.key);
      expect(fieldKeys).toContain('tiltOrientation');
      expect(fieldKeys).toContain('testLoad');
      expect(fieldKeys).not.toContain('position');
    });

    it('Static Temperature (A.5.3.1) and Temperature Effect on No-Load (A.5.3.2) are distinct concepts', () => {
      const staticTemp = TEST_DEFINITIONS_REGISTRY.R76_TEMPERATURE;
      const noLoadTemp = TEST_DEFINITIONS_REGISTRY.R76_TEMP_EFFECT_NO_LOAD;

      expect(staticTemp.clause).toBe('3.9.2.1, 3.9.2.2, A.5.3.1');
      expect(noLoadTemp.clause).toBe('3.9.2.3, A.5.3.2');

      expect(staticTemp.code).not.toBe(noLoadTemp.code);
      expect(staticTemp.reportMapping.reportItemNumber).toBe('13');
      expect(noLoadTemp.reportMapping.reportItemNumber).toBe('14');

      expect(staticTemp.procedureDefinition.calculationRule.ruleId).toBe('CALC_TEMPERATURE');
      expect(noLoadTemp.procedureDefinition.calculationRule.ruleId).toBe('CALC_TEMP_EFFECT_NO_LOAD');
    });
  });

  // ==========================================================================
  // 3. APPLICABILITY & ZERO-OVERRIDE POLICIES
  // ==========================================================================
  describe('3. Applicability Logic & Structured Exclusion Justifications', () => {
    it('Ordinary bench scale: marks rolling load, mobile, and sensitivity as NOT_APPLICABLE with justifications', () => {
      const suite = buildCompleteEvaluationSuite(baseContext);

      const rolling = suite.find((t) => t.testCode === 'R76_ECC_ROLLING');
      const mobile = suite.find((t) => t.testCode === 'R76_ECC_MOBILE');
      const sensitivity = suite.find((t) => t.testCode === 'R76_SENSITIVITY');

      expect(rolling?.isApplicable).toBe(false);
      expect(rolling?.status).toBe('NOT_APPLICABLE');
      expect(rolling?.exclusionJustification).toContain('Clause A.4.7.4');

      expect(mobile?.isApplicable).toBe(false);
      expect(mobile?.status).toBe('NOT_APPLICABLE');
      expect(mobile?.exclusionJustification).toContain('Clause A.4.7.5');

      expect(sensitivity?.isApplicable).toBe(false);
      expect(sensitivity?.status).toBe('NOT_APPLICABLE');
      expect(sensitivity?.exclusionJustification).toContain('Clause A.4.9');
    });

    it('Class I analytical balance: exempts Creep, Zero Return, and Tilting with authoritative statutory reasons', () => {
      const classIContext: CommonEvaluationContext = {
        ...baseContext,
        instrument: {
          ...baseContext.instrument,
          modelName: 'ANALYTICAL-MICRO-BALANCE',
          accuracyClass: 'CLASS_I',
          maxCapacity: 0.22,
          minCapacity: 0.001,
          verificationInterval_e: 0.001,
          scaleInterval_d: 0.0001,
          numberOfIntervals_n: 220000,
          primaryUnit: 'g',
        },
      };

      const suite = buildCompleteEvaluationSuite(classIContext);

      const creep = suite.find((t) => t.testCode === 'R76_CREEP');
      const zeroReturn = suite.find((t) => t.testCode === 'R76_ZERO_RETURN');
      const tilting = suite.find((t) => t.testCode === 'R76_TILTING');

      expect(creep?.isApplicable).toBe(false);
      expect(creep?.status).toBe('NOT_APPLICABLE');
      expect(creep?.exclusionJustification).toContain('Clause A.4.11.1');

      expect(zeroReturn?.isApplicable).toBe(false);
      expect(zeroReturn?.status).toBe('NOT_APPLICABLE');
      expect(zeroReturn?.exclusionJustification).toContain('Clause A.4.11.1');

      expect(tilting?.isApplicable).toBe(false);
      expect(tilting?.status).toBe('NOT_APPLICABLE');
      expect(tilting?.exclusionJustification).toContain('Clause 3.9.1.1');
    });

    it('NEVER marks an inapplicable test as PASS under any circumstances', () => {
      // Inapplicable test with dummy passing observations
      const fakeCalcOutput = {
        calculatedValues: {},
        trace: {},
        summary: {
          passedCount: 10,
          failedCount: 0,
          isAllPassed: true,
          headline: 'All points passed',
        },
      };

      const compliance = interpretCompliance(fakeCalcOutput, false, 'Clause exemption');
      expect(compliance.status).toBe('NOT_APPLICABLE');
      expect(compliance.verdict).toBe('NOT_APPLICABLE');
      expect(compliance.verdict).not.toBe('PASS');
      expect(compliance.status).not.toBe('PASS');
    });
  });

  // ==========================================================================
  // 4. REPORT MAPPINGS & DISTINCTION OF SUBTESTS VS TOP-LEVEL ITEMS
  // ==========================================================================
  describe('4. OIML R 76-2 Report Structure & Subtest Distinctions', () => {
    it('distinguishes top-level report items from internal executable subtests', () => {
      const eccStandard = TEST_DEFINITIONS_REGISTRY.R76_ECCENTRICITY;
      const eccRolling = TEST_DEFINITIONS_REGISTRY.R76_ECC_ROLLING;
      const eccMobile = TEST_DEFINITIONS_REGISTRY.R76_ECC_MOBILE;

      // These are subtests under top-level Report Item 4 (Eccentricity)
      expect(eccStandard.reportMapping.isTopLevelReportItem).toBe(false);
      expect(eccStandard.reportMapping.parentReportItemNumber).toBe('4');
      expect(eccStandard.reportMapping.reportItemNumber).toBe('4.1');

      expect(eccRolling.reportMapping.isTopLevelReportItem).toBe(false);
      expect(eccRolling.reportMapping.parentReportItemNumber).toBe('4');
      expect(eccRolling.reportMapping.reportItemNumber).toBe('4.2');

      expect(eccMobile.reportMapping.isTopLevelReportItem).toBe(false);
      expect(eccMobile.reportMapping.parentReportItemNumber).toBe('4');
      expect(eccMobile.reportMapping.reportItemNumber).toBe('4.3');

      // Creep and Zero return are subtests under top-level Report Item 8
      const creep = TEST_DEFINITIONS_REGISTRY.R76_CREEP;
      const zeroReturn = TEST_DEFINITIONS_REGISTRY.R76_ZERO_RETURN;
      expect(creep.reportMapping.isTopLevelReportItem).toBe(false);
      expect(creep.reportMapping.parentReportItemNumber).toBe('8');
      expect(creep.reportMapping.reportItemNumber).toBe('8.1');

      expect(zeroReturn.reportMapping.isTopLevelReportItem).toBe(false);
      expect(zeroReturn.reportMapping.parentReportItemNumber).toBe('8');
      expect(zeroReturn.reportMapping.reportItemNumber).toBe('8.2');

      // Top-level standalone report items
      expect(TEST_DEFINITIONS_REGISTRY.R76_WEIGH_INTRINSIC.reportMapping.isTopLevelReportItem).toBe(true);
      expect(TEST_DEFINITIONS_REGISTRY.R76_TILTING.reportMapping.isTopLevelReportItem).toBe(true);
      expect(TEST_DEFINITIONS_REGISTRY.R76_WARMUP.reportMapping.isTopLevelReportItem).toBe(true);
      expect(TEST_DEFINITIONS_REGISTRY.R76_TEMPERATURE.reportMapping.isTopLevelReportItem).toBe(true);
      expect(TEST_DEFINITIONS_REGISTRY.R76_TEMP_EFFECT_NO_LOAD.reportMapping.isTopLevelReportItem).toBe(true);
      expect(TEST_DEFINITIONS_REGISTRY.R76_VOLTAGE.reportMapping.isTopLevelReportItem).toBe(true);
      expect(TEST_DEFINITIONS_REGISTRY.R76_ELECTRICAL_DISTURBANCE.reportMapping.isTopLevelReportItem).toBe(true);
      expect(TEST_DEFINITIONS_REGISTRY.R76_DAMP_HEAT.reportMapping.isTopLevelReportItem).toBe(true);
      expect(TEST_DEFINITIONS_REGISTRY.R76_SPAN_STABILITY.reportMapping.isTopLevelReportItem).toBe(true);
      expect(TEST_DEFINITIONS_REGISTRY.R76_ENDURANCE.reportMapping.isTopLevelReportItem).toBe(true);
    });
  });
});
