import { describe, it, expect } from 'vitest';
import { buildInitialTestSuite } from '@/lib/test-suite-builder';
import { SYNTHETIC_INSTRUMENTS } from '@/lib/synthetic-instruments';
import { TestSuiteItem, EccentricityData, DiscriminationData, RepeatabilityData, WeighingPerformanceData, WeighingObsPoint } from '@/lib/test-suite-types';

describe('OIML R 76 Complete Test Suite & Workflow Verification', () => {
  it('initializes the full 13-test plan for standard Class III instrument', () => {
    const retailScale = SYNTHETIC_INSTRUMENTS[2]; // 15kg retail scale Class III
    const suite = buildInitialTestSuite(retailScale);

    expect(suite.length).toBe(13);

    // Verify all 13 required test codes exist
    const testCodes = suite.map((t) => t.testCode);
    expect(testCodes).toContain('R76_ADMIN_MARKINGS');
    expect(testCodes).toContain('R76_CONSTRUCTION');
    expect(testCodes).toContain('R76_WEIGH_INTRINSIC');
    expect(testCodes).toContain('R76_ECCENTRICITY');
    expect(testCodes).toContain('R76_DISCRIMINATION');
    expect(testCodes).toContain('R76_REPEATABILITY');
    expect(testCodes).toContain('R76_CREEP');
    expect(testCodes).toContain('R76_ZERO_RETURN');
    expect(testCodes).toContain('R76_EQUILIBRIUM');
    expect(testCodes).toContain('R76_TEMPERATURE');
    expect(testCodes).toContain('R76_VOLTAGE');
    expect(testCodes).toContain('R76_DAMP_HEAT');
    expect(testCodes).toContain('R76_SPAN_STABILITY');

    // All should be applicable for Class III dual mains+battery
    suite.forEach((test) => {
      expect(test.isApplicable).toBe(true);
      expect(test.name).toBeTruthy();
      expect(test.clause).toBeTruthy();
      expect(test.purpose).toBeTruthy();
      expect(test.instruction).toBeTruthy();
    });
  });

  it('exempts Creep and Zero Return for Class I analytical balance', () => {
    const classIBalance: typeof SYNTHETIC_INSTRUMENTS[0] = {
      ...SYNTHETIC_INSTRUMENTS[0],
      accuracyClass: 'CLASS_I',
    };
    const suite = buildInitialTestSuite(classIBalance);

    const creepTest = suite.find((t) => t.testCode === 'R76_CREEP');
    const zeroReturnTest = suite.find((t) => t.testCode === 'R76_ZERO_RETURN');

    expect(creepTest?.isApplicable).toBe(false);
    expect(creepTest?.status).toBe('NOT_APPLICABLE');
    expect(creepTest?.exclusionJustification).toContain('Classes II, III, and IIII');

    expect(zeroReturnTest?.isApplicable).toBe(false);
    expect(zeroReturnTest?.status).toBe('NOT_APPLICABLE');
    expect(zeroReturnTest?.exclusionJustification).toContain('Classes II, III, and IIII');
  });

  it('adapts Eccentricity geometry to receptor type', () => {
    const standardPan = SYNTHETIC_INSTRUMENTS[2]; // STANDARD_PAN
    const rollingWeighbridge = SYNTHETIC_INSTRUMENTS[3]; // ROLLING_TRACK
    const mobileCrane = SYNTHETIC_INSTRUMENTS[4]; // MOBILE_SCALE

    const standardSuite = buildInitialTestSuite(standardPan);
    const rollingSuite = buildInitialTestSuite(rollingWeighbridge);
    const mobileSuite = buildInitialTestSuite(mobileCrane);

    const standardEcc = standardSuite.find((t) => t.testCode === 'R76_ECCENTRICITY')?.data as EccentricityData;
    const rollingEcc = rollingSuite.find((t) => t.testCode === 'R76_ECCENTRICITY')?.data as EccentricityData;
    const mobileEcc = mobileSuite.find((t) => t.testCode === 'R76_ECCENTRICITY')?.data as EccentricityData;

    expect(standardEcc.receptorType).toBe('STANDARD_PAN');
    expect(standardEcc.observations.map((o) => o.position)).toEqual([
      'Center position',
      'Quarter 1 (Front-Left)',
      'Quarter 2 (Front-Right)',
      'Quarter 3 (Back-Right)',
      'Quarter 4 (Back-Left)',
    ]);

    expect(rollingEcc.receptorType).toBe('ROLLING_TRACK');
    expect(rollingEcc.observations.map((o) => o.position)).toContain('Beginning of rail');
    expect(rollingEcc.observations.map((o) => o.position)).toContain('Middle of track');
    expect(rollingEcc.observations.map((o) => o.position)).toContain('End of rail');

    expect(mobileEcc.receptorType).toBe('MOBILE_SCALE');
  });

  it('determines server-authoritative PASS vs FAIL in Weighing Performance and Repeatability', () => {
    const compliantScale = SYNTHETIC_INSTRUMENTS[2];
    const failingScale = SYNTHETIC_INSTRUMENTS.find((i) => i.hasFailedSample) || SYNTHETIC_INSTRUMENTS[14];

    const compliantSuite = buildInitialTestSuite(compliantScale);
    const failingSuite = buildInitialTestSuite(failingScale);

    const compliantWeigh = compliantSuite.find((t) => t.testCode === 'R76_WEIGH_INTRINSIC');
    const failingWeigh = failingSuite.find((t) => t.testCode === 'R76_WEIGH_INTRINSIC');

    expect(compliantWeigh?.status).toBe('PASS');
    expect(failingWeigh?.status).toBe('FAIL');

    // Failing specimen should have at least one observation with isPass === false
    const failingData = failingWeigh?.data as WeighingPerformanceData;
    expect(failingData.observations.some((o: WeighingObsPoint) => o.isPass === false)).toBe(true);
  });

  it('verifies discrimination evaluates 1.4d threshold compliance', () => {
    const scale = SYNTHETIC_INSTRUMENTS[2];
    const suite = buildInitialTestSuite(scale);
    const disc = suite.find((t) => t.testCode === 'R76_DISCRIMINATION')?.data as DiscriminationData;

    expect(disc.points.length).toBe(3); // Min, 50% Max, 100% Max
    disc.points.forEach((pt) => {
      expect(pt.extraLoad_1_4d).toBeCloseTo(1.4 * scale.scaleInterval_d, 4);
      expect(pt.isPass).toBe(true);
    });
  });

  it('verifies repeatability computes dual series ~50% and ~100% Max with Table 6 MPE comparison', () => {
    const scale = SYNTHETIC_INSTRUMENTS[2];
    const suite = buildInitialTestSuite(scale);
    const rep = suite.find((t) => t.testCode === 'R76_REPEATABILITY')?.data as RepeatabilityData;

    expect(rep.requiredObservationsPerSeries).toBe(10);
    expect(rep.series1.weighings.length).toBe(10);
    expect(rep.series2.weighings.length).toBe(10);
    expect(rep.series1.span).toBeLessThanOrEqual(rep.series1.mpeMagnitude ?? 1);
    expect(rep.series2.span).toBeLessThanOrEqual(rep.series2.mpeMagnitude ?? 1);
    expect(rep.series1.isCompliant).toBe(true);
    expect(rep.series2.isCompliant).toBe(true);
  });

  it('enforces completion gate rule: incomplete or not-tested tests prevent final evaluation completion', () => {
    const scale = SYNTHETIC_INSTRUMENTS[2];
    const suite = buildInitialTestSuite(scale);

    const hasIncomplete = suite.some(
      (t) => t.isApplicable && (t.status === 'NOT_TESTED' || t.status === 'IN_PROGRESS' || t.status === 'INCOMPLETE')
    );
    expect(hasIncomplete).toBe(true);

    // If any applicable test is not finalized, advance is blocked
    const canComplete = !suite.some(
      (t) => t.isApplicable && (t.status === 'NOT_TESTED' || t.status === 'IN_PROGRESS' || t.status === 'INCOMPLETE')
    );
    expect(canComplete).toBe(false);

    // Simulate finalizing all tests
    const allFinalized: TestSuiteItem[] = suite.map((t) => ({
      ...t,
      status: t.isApplicable ? 'PASS' : 'NOT_APPLICABLE',
    }));

    const canCompleteFinalized = !allFinalized.some(
      (t) => t.isApplicable && (t.status === 'NOT_TESTED' || t.status === 'IN_PROGRESS' || t.status === 'INCOMPLETE')
    );
    expect(canCompleteFinalized).toBe(true);
  });
});
