import { describe, it, expect } from 'vitest';
import {
  generateIntrinsicErrorLoadPlan,
  generateEccentricityLoadPlan,
  generateTemperatureTestSequence,
} from '../../src/core';

describe('OIML R 76-1:2006 Test Load Planner Engine', () => {
  describe('Intrinsic Error Load Plan (Clause A.4.4)', () => {
    it('generates at least 10 different test loads in increasing and decreasing directions', () => {
      // Class III, Min = 100 g (50 e), Max = 15000 g (7500 e), e = 2 g
      const plan = generateIntrinsicErrorLoadPlan({
        accuracyClass: 'CLASS_III',
        minCapacity: 100,
        maxCapacity: 15000,
        e: 2,
      });

      expect(plan.testCode).toBe('R76_WEIGH_INTRINSIC');
      expect(plan.clauseReference).toBe('A.4.4');
      expect(plan.metadata.distinctLoadsCount).toBeGreaterThanOrEqual(10);
      expect(plan.points.length).toBeGreaterThanOrEqual(20); // 10 increasing + 10 decreasing

      // Verify Min is included
      const hasMin = plan.points.some((p) => p.loadInE.equals(50));
      expect(hasMin).toBe(true);

      // Verify Max is included
      const hasMax = plan.points.some((p) => p.loadInE.equals(7500));
      expect(hasMax).toBe(true);

      // Verify points immediately below, at, and above Class III transitions (500e, 2000e)
      const loadsInE = plan.points.map((p) => p.loadInE.toNumber());
      expect(loadsInE).toContain(500);
      expect(loadsInE).toContain(2000);
    });
  });

  describe('Eccentricity Load Plan (Clauses A.4.7.1 to A.4.7.5)', () => {
    it('generates 1/3 Max quarter-segment points for standard receptor with <= 4 supports', () => {
      const plan = generateEccentricityLoadPlan({
        maxCapacity: 15,
        e: 0.005,
        geometry: {
          numberOfSupportPoints: 4,
          receptorType: 'STANDARD_PAN',
        },
      });

      expect(plan.testCode).toBe('R76_ECC_WEIGHTS');
      expect(plan.clauseReference).toBe('A.4.7.1');
      expect(plan.points).toHaveLength(5); // Center + 4 quarters
      // Load = 15 / 3 = 5 kg
      expect(plan.points[0].load.toString()).toBe('5');
    });

    it('generates 1/(N-1) Max points for receptors with > 4 supports (Clause A.4.7.2)', () => {
      // 6 support points -> test load = 60 / (6 - 1) = 12 t
      const plan = generateEccentricityLoadPlan({
        maxCapacity: 60,
        e: 0.02,
        geometry: {
          numberOfSupportPoints: 6,
          receptorType: 'STANDARD_PAN',
        },
      });

      expect(plan.clauseReference).toBe('A.4.7.2');
      expect(plan.points).toHaveLength(6);
      expect(plan.points[0].load.toString()).toBe('12');
    });

    it('generates beginning/middle/end points for rolling loads (Clause A.4.7.4)', () => {
      const plan = generateEccentricityLoadPlan({
        maxCapacity: 60000,
        e: 20,
        geometry: {
          numberOfSupportPoints: 4,
          receptorType: 'ROLLING_TRACK',
          numberOfReceptorSections: 1,
          isBidirectionalTraffic: true,
        },
      });

      expect(plan.testCode).toBe('R76_ECC_ROLLING');
      expect(plan.clauseReference).toBe('A.4.7.4');
      // 3 positions forward + 3 positions reverse = 6 points
      expect(plan.points).toHaveLength(6);
      expect(plan.points.some((p) => p.direction === 'FORWARD')).toBe(true);
      expect(plan.points.some((p) => p.direction === 'REVERSE')).toBe(true);
    });
  });

  describe('Temperature Test Sequence (Clause A.5.3)', () => {
    it('generates dynamic temperature sequence including +5 °C point when T_low <= 0 °C', () => {
      // Default limits: -10 °C to +40 °C
      const seq = generateTemperatureTestSequence({
        accuracyClass: 'CLASS_III',
        specifiedTempMin: -10,
        specifiedTempMax: 40,
      });

      // Sequence: Ref (20), High (40), Low (-10), +5 C, Return (20)
      expect(seq).toHaveLength(5);
      expect(seq[0].targetTemperature.toNumber()).toBe(20);
      expect(seq[1].targetTemperature.toNumber()).toBe(40);
      expect(seq[2].targetTemperature.toNumber()).toBe(-10);
      expect(seq[3].targetTemperature.toNumber()).toBe(5);
      expect(seq[4].targetTemperature.toNumber()).toBe(20);
    });

    it('derives reference temperature as mean of limits for Class I instruments', () => {
      // Class I specified limits: +18 °C to +26 °C -> Mean = 22 °C
      const seq = generateTemperatureTestSequence({
        accuracyClass: 'CLASS_I',
        specifiedTempMin: 18,
        specifiedTempMax: 26,
      });

      expect(seq[0].targetTemperature.toNumber()).toBe(22);
      expect(seq[1].targetTemperature.toNumber()).toBe(26);
      expect(seq[2].targetTemperature.toNumber()).toBe(18);
      // Low is 18 > 0, so no +5 C point needed!
      expect(seq).toHaveLength(4);
      expect(seq[3].targetTemperature.toNumber()).toBe(22);
    });
  });
});
