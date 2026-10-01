/**
 * Tests for EvaluationWorkflowService applicability evaluator and lifecycle logic.
 */

import { describe, it, expect } from 'vitest';
import { EvaluationWorkflowService } from '@/services/workflow/evaluation-workflow';
import { AccuracyClass, ReceptorType, PowerSupplyType } from '@prisma/client';

describe('EvaluationWorkflowService - Dynamic Applicability Matrix', () => {
  const standardBenchInstrument = {
    accuracyClass: AccuracyClass.CLASS_III,
    receptorType: ReceptorType.STANDARD_PAN,
    powerSupplyType: PowerSupplyType.MAINS_AC,
    hasAutomaticLeveling: false,
    maxCapacity: 15,
  };

  it('marks rolling eccentricity (A.4.7.4) as NOT_APPLICABLE for standard pan scales', () => {
    const result = EvaluationWorkflowService.evaluateApplicability(
      'R76_ECC_ROLLING',
      standardBenchInstrument
    );
    expect(result.isApplicable).toBe(false);
    expect(result.exclusionJustification).toContain('rolling track');
  });

  it('marks rolling eccentricity as APPLICABLE for rolling track weighbridges', () => {
    const weighbridge = {
      ...standardBenchInstrument,
      receptorType: ReceptorType.ROLLING_TRACK,
      maxCapacity: 60000,
    };
    const result = EvaluationWorkflowService.evaluateApplicability('R76_ECC_ROLLING', weighbridge);
    expect(result.isApplicable).toBe(true);
    expect(result.exclusionJustification).toBeNull();
  });

  it('marks mobile eccentricity as APPLICABLE only for mobile instruments', () => {
    const mobileScale = {
      ...standardBenchInstrument,
      receptorType: ReceptorType.MOBILE_SCALE,
    };
    const notMobile = EvaluationWorkflowService.evaluateApplicability('R76_ECC_MOBILE', standardBenchInstrument);
    const isMobile = EvaluationWorkflowService.evaluateApplicability('R76_ECC_MOBILE', mobileScale);

    expect(notMobile.isApplicable).toBe(false);
    expect(isMobile.isApplicable).toBe(true);
  });

  it('exempts Class I instruments from Creep and Zero Return per Clause A.4.11.1', () => {
    const classIInstrument = {
      ...standardBenchInstrument,
      accuracyClass: AccuracyClass.CLASS_I,
    };
    const creepRes = EvaluationWorkflowService.evaluateApplicability('R76_CREEP', classIInstrument);
    const zeroRetRes = EvaluationWorkflowService.evaluateApplicability('R76_ZERO_RETURN', classIInstrument);

    expect(creepRes.isApplicable).toBe(false);
    expect(creepRes.exclusionJustification).toContain('Clause A.4.11.1');
    expect(zeroRetRes.isApplicable).toBe(false);
  });

  it('enforces Creep and Zero Return as APPLICABLE for Classes II, III, and IIII', () => {
    const classII = { ...standardBenchInstrument, accuracyClass: AccuracyClass.CLASS_II };
    const classIII = { ...standardBenchInstrument, accuracyClass: AccuracyClass.CLASS_III };
    const classIIII = { ...standardBenchInstrument, accuracyClass: AccuracyClass.CLASS_IIII };

    expect(EvaluationWorkflowService.evaluateApplicability('R76_CREEP', classII).isApplicable).toBe(true);
    expect(EvaluationWorkflowService.evaluateApplicability('R76_CREEP', classIII).isApplicable).toBe(true);
    expect(EvaluationWorkflowService.evaluateApplicability('R76_CREEP', classIIII).isApplicable).toBe(true);
  });

  it('exempts instruments with automatic leveling from Tilting Test (A.5.1)', () => {
    const autoLevelScale = {
      ...standardBenchInstrument,
      hasAutomaticLeveling: true,
    };
    const result = EvaluationWorkflowService.evaluateApplicability('R76_TILTING', autoLevelScale);
    expect(result.isApplicable).toBe(false);
    expect(result.exclusionJustification).toContain('automatic leveling');
  });

  it('evaluates battery voltage test applicability strictly based on power supply type', () => {
    const batteryScale = {
      ...standardBenchInstrument,
      powerSupplyType: PowerSupplyType.BATTERY_INTERNAL,
    };
    const vehicleScale = {
      ...standardBenchInstrument,
      powerSupplyType: PowerSupplyType.ROAD_VEHICLE_BATTERY,
    };

    expect(
      EvaluationWorkflowService.evaluateApplicability('R76_VOLT_BATTERY', standardBenchInstrument).isApplicable
    ).toBe(false);
    expect(
      EvaluationWorkflowService.evaluateApplicability('R76_VOLT_BATTERY', batteryScale).isApplicable
    ).toBe(true);

    expect(
      EvaluationWorkflowService.evaluateApplicability('R76_VOLT_VEHICLE', batteryScale).isApplicable
    ).toBe(false);
    expect(
      EvaluationWorkflowService.evaluateApplicability('R76_VOLT_VEHICLE', vehicleScale).isApplicable
    ).toBe(true);
  });
});
