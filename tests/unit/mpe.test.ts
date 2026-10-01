import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import {
  calculateMPE,
  InvalidInputError,
  LoadOutOfRangeError,
  UnsupportedClassError,
  UnsupportedRulePackError,
} from '../../src/core';

describe('OIML R 76-1:2006 Table 6 MPE Engine (R76-2006-v1)', () => {
  // ==========================================================================
  // 1. Accuracy Class I (Special Accuracy)
  // Tiers: [0, 50 000 e] -> ±0.5 e | (50 000 e, 200 000 e] -> ±1.0 e | > 200 000 e -> ±1.5 e
  // No upper limit under Table 3 / Table 6
  // ==========================================================================
  describe('Class I Boundaries and Tiers', () => {
    const e = new Decimal('0.001'); // 1 mg

    it('evaluates zero load (m = 0 e) at Tier 1 (±0.5 e)', () => {
      const res = calculateMPE({
        accuracyClass: 'CLASS_I',
        load: new Decimal(0),
        e,
      });

      expect(res.tier).toBe('TIER_1');
      expect(res.factorInE.toString()).toBe('0.5');
      expect(res.magnitude.toString()).toBe('0.0005');
      expect(res.lowerLimit.toString()).toBe('-0.0005');
      expect(res.upperLimit.toString()).toBe('0.0005');
      expect(res.loadInE.toString()).toBe('0');
      expect(res.standard).toBe('OIML R 76-1');
      expect(res.standardVersion).toBe('2006 (E)');
      expect(res.clauseReference).toBe('3.5.1 Table 6');
      expect(res.ruleId).toBe('RULE_R76_2006_TABLE6_MPE');
    });

    it('evaluates just below Transition 1 (m = 49 999.9 e) at Tier 1 (±0.5 e)', () => {
      const res = calculateMPE({
        accuracyClass: 'CLASS_I',
        load: e.times('49999.9'),
        e,
      });

      expect(res.tier).toBe('TIER_1');
      expect(res.factorInE.toString()).toBe('0.5');
      expect(res.magnitude.toString()).toBe('0.0005');
    });

    it('evaluates exactly at Transition 1 (m = 50 000 e) at Tier 1 (±0.5 e)', () => {
      const res = calculateMPE({
        accuracyClass: 'CLASS_I',
        load: e.times('50000'),
        e,
      });

      expect(res.tier).toBe('TIER_1');
      expect(res.factorInE.toString()).toBe('0.5');
      expect(res.magnitude.toString()).toBe('0.0005');
      expect(res.loadInE.toString()).toBe('50000');
    });

    it('evaluates just above Transition 1 (m = 50 000.1 e) at Tier 2 (±1.0 e)', () => {
      const res = calculateMPE({
        accuracyClass: 'CLASS_I',
        load: e.times('50000.1'),
        e,
      });

      expect(res.tier).toBe('TIER_2');
      expect(res.factorInE.toString()).toBe('1');
      expect(res.magnitude.toString()).toBe('0.001');
    });

    it('evaluates just below Transition 2 (m = 199 999.9 e) at Tier 2 (±1.0 e)', () => {
      const res = calculateMPE({
        accuracyClass: 'CLASS_I',
        load: e.times('199999.9'),
        e,
      });

      expect(res.tier).toBe('TIER_2');
      expect(res.factorInE.toString()).toBe('1');
      expect(res.magnitude.toString()).toBe('0.001');
    });

    it('evaluates exactly at Transition 2 (m = 200 000 e) at Tier 2 (±1.0 e)', () => {
      const res = calculateMPE({
        accuracyClass: 'CLASS_I',
        load: e.times('200000'),
        e,
      });

      expect(res.tier).toBe('TIER_2');
      expect(res.factorInE.toString()).toBe('1');
      expect(res.magnitude.toString()).toBe('0.001');
      expect(res.loadInE.toString()).toBe('200000');
    });

    it('evaluates just above Transition 2 (m = 200 000.1 e) at Tier 3 (±1.5 e)', () => {
      const res = calculateMPE({
        accuracyClass: 'CLASS_I',
        load: e.times('200000.1'),
        e,
      });

      expect(res.tier).toBe('TIER_3');
      expect(res.factorInE.toString()).toBe('1.5');
      expect(res.magnitude.toString()).toBe('0.0015');
    });

    it('evaluates high interval load (m = 1 000 000 e) at Tier 3 (unbounded for Class I)', () => {
      const res = calculateMPE({
        accuracyClass: 'CLASS_I',
        load: e.times('1000000'),
        e,
      });

      expect(res.tier).toBe('TIER_3');
      expect(res.factorInE.toString()).toBe('1.5');
      expect(res.magnitude.toString()).toBe('0.0015');
    });
  });

  // ==========================================================================
  // 2. Accuracy Class II (High Accuracy)
  // Tiers: [0, 5 000 e] -> ±0.5 e | (5 000 e, 20 000 e] -> ±1.0 e | (20 000 e, 100 000 e] -> ±1.5 e
  // Maximum n = 100 000
  // ==========================================================================
  describe('Class II Boundaries and Tiers', () => {
    const e = new Decimal('0.05'); // 50 mg

    it('evaluates zero load (m = 0 e) at Tier 1 (±0.5 e)', () => {
      const res = calculateMPE({
        accuracyClass: 'CLASS_II',
        load: 0,
        e,
      });

      expect(res.tier).toBe('TIER_1');
      expect(res.factorInE.toString()).toBe('0.5');
      expect(res.magnitude.toString()).toBe('0.025');
    });

    it('evaluates just below Transition 1 (m = 4 999.9 e) at Tier 1', () => {
      const res = calculateMPE({
        accuracyClass: 'CLASS_II',
        load: e.times('4999.9'),
        e,
      });

      expect(res.tier).toBe('TIER_1');
      expect(res.factorInE.toString()).toBe('0.5');
    });

    it('evaluates exactly at Transition 1 (m = 5 000 e) at Tier 1 (±0.5 e)', () => {
      const res = calculateMPE({
        accuracyClass: 'CLASS_II',
        load: e.times('5000'),
        e,
      });

      expect(res.tier).toBe('TIER_1');
      expect(res.factorInE.toString()).toBe('0.5');
      expect(res.magnitude.toString()).toBe('0.025');
    });

    it('evaluates just above Transition 1 (m = 5 000.1 e) at Tier 2 (±1.0 e)', () => {
      const res = calculateMPE({
        accuracyClass: 'CLASS_II',
        load: e.times('5000.1'),
        e,
      });

      expect(res.tier).toBe('TIER_2');
      expect(res.factorInE.toString()).toBe('1');
      expect(res.magnitude.toString()).toBe('0.05');
    });

    it('evaluates just below Transition 2 (m = 19 999.9 e) at Tier 2', () => {
      const res = calculateMPE({
        accuracyClass: 'CLASS_II',
        load: e.times('19999.9'),
        e,
      });

      expect(res.tier).toBe('TIER_2');
      expect(res.factorInE.toString()).toBe('1');
    });

    it('evaluates exactly at Transition 2 (m = 20 000 e) at Tier 2 (±1.0 e)', () => {
      const res = calculateMPE({
        accuracyClass: 'CLASS_II',
        load: e.times('20000'),
        e,
      });

      expect(res.tier).toBe('TIER_2');
      expect(res.factorInE.toString()).toBe('1');
      expect(res.magnitude.toString()).toBe('0.05');
    });

    it('evaluates just above Transition 2 (m = 20 000.1 e) at Tier 3 (±1.5 e)', () => {
      const res = calculateMPE({
        accuracyClass: 'CLASS_II',
        load: e.times('20000.1'),
        e,
      });

      expect(res.tier).toBe('TIER_3');
      expect(res.factorInE.toString()).toBe('1.5');
      expect(res.magnitude.toString()).toBe('0.075');
    });

    it('evaluates at maximum permitted capacity (m = 100 000 e) at Tier 3 (±1.5 e)', () => {
      const res = calculateMPE({
        accuracyClass: 'CLASS_II',
        load: e.times('100000'),
        e,
      });

      expect(res.tier).toBe('TIER_3');
      expect(res.factorInE.toString()).toBe('1.5');
      expect(res.magnitude.toString()).toBe('0.075');
      expect(res.loadInE.toString()).toBe('100000');
    });

    it('rejects loads exceeding maximum permitted capacity (m = 100 000.1 e) with LoadOutOfRangeError', () => {
      expect(() =>
        calculateMPE({
          accuracyClass: 'CLASS_II',
          load: e.times('100000.1'),
          e,
        })
      ).toThrow(LoadOutOfRangeError);
    });

    it('allows loads exceeding maximum capacity when allowExceedingMaxRange: true', () => {
      const res = calculateMPE({
        accuracyClass: 'CLASS_II',
        load: e.times('100000.1'),
        e,
        allowExceedingMaxRange: true,
      });

      expect(res.tier).toBe('TIER_3');
      expect(res.factorInE.toString()).toBe('1.5');
    });
  });

  // ==========================================================================
  // 3. Accuracy Class III (Medium Accuracy)
  // Tiers: [0, 500 e] -> ±0.5 e | (500 e, 2 000 e] -> ±1.0 e | (2 000 e, 10 000 e] -> ±1.5 e
  // Maximum n = 10 000
  // ==========================================================================
  describe('Class III Boundaries and Tiers', () => {
    const e = new Decimal('2'); // 2 g

    it('evaluates zero load (m = 0 e) at Tier 1 (±0.5 e)', () => {
      const res = calculateMPE({
        accuracyClass: 'CLASS_III',
        load: 0,
        e,
      });

      expect(res.tier).toBe('TIER_1');
      expect(res.factorInE.toString()).toBe('0.5');
      expect(res.magnitude.toString()).toBe('1');
      expect(res.lowerLimit.toString()).toBe('-1');
      expect(res.upperLimit.toString()).toBe('1');
    });

    it('evaluates just below Transition 1 (m = 499.9 e) at Tier 1', () => {
      const res = calculateMPE({
        accuracyClass: 'CLASS_III',
        load: e.times('499.9'),
        e,
      });

      expect(res.tier).toBe('TIER_1');
      expect(res.factorInE.toString()).toBe('0.5');
      expect(res.magnitude.toString()).toBe('1');
    });

    it('evaluates exactly at Transition 1 (m = 500 e) at Tier 1 (±0.5 e)', () => {
      const res = calculateMPE({
        accuracyClass: 'CLASS_III',
        load: e.times('500'), // 1000 g
        e,
      });

      expect(res.tier).toBe('TIER_1');
      expect(res.factorInE.toString()).toBe('0.5');
      expect(res.magnitude.toString()).toBe('1');
      expect(res.loadInE.toString()).toBe('500');
    });

    it('evaluates just above Transition 1 (m = 500.1 e) at Tier 2 (±1.0 e)', () => {
      const res = calculateMPE({
        accuracyClass: 'CLASS_III',
        load: e.times('500.1'),
        e,
      });

      expect(res.tier).toBe('TIER_2');
      expect(res.factorInE.toString()).toBe('1');
      expect(res.magnitude.toString()).toBe('2');
    });

    it('evaluates just below Transition 2 (m = 1 999.9 e) at Tier 2', () => {
      const res = calculateMPE({
        accuracyClass: 'CLASS_III',
        load: e.times('1999.9'),
        e,
      });

      expect(res.tier).toBe('TIER_2');
      expect(res.factorInE.toString()).toBe('1');
      expect(res.magnitude.toString()).toBe('2');
    });

    it('evaluates exactly at Transition 2 (m = 2 000 e) at Tier 2 (±1.0 e)', () => {
      const res = calculateMPE({
        accuracyClass: 'CLASS_III',
        load: e.times('2000'), // 4000 g
        e,
      });

      expect(res.tier).toBe('TIER_2');
      expect(res.factorInE.toString()).toBe('1');
      expect(res.magnitude.toString()).toBe('2');
      expect(res.loadInE.toString()).toBe('2000');
    });

    it('evaluates just above Transition 2 (m = 2 000.1 e) at Tier 3 (±1.5 e)', () => {
      const res = calculateMPE({
        accuracyClass: 'CLASS_III',
        load: e.times('2000.1'),
        e,
      });

      expect(res.tier).toBe('TIER_3');
      expect(res.factorInE.toString()).toBe('1.5');
      expect(res.magnitude.toString()).toBe('3');
    });

    it('evaluates at maximum permitted capacity (m = 10 000 e) at Tier 3 (±1.5 e)', () => {
      const res = calculateMPE({
        accuracyClass: 'CLASS_III',
        load: e.times('10000'), // 20 000 g
        e,
      });

      expect(res.tier).toBe('TIER_3');
      expect(res.factorInE.toString()).toBe('1.5');
      expect(res.magnitude.toString()).toBe('3');
      expect(res.loadInE.toString()).toBe('10000');
    });

    it('rejects loads exceeding maximum permitted capacity (m = 10 001 e) with LoadOutOfRangeError', () => {
      expect(() =>
        calculateMPE({
          accuracyClass: 'CLASS_III',
          load: e.times('10001'),
          e,
        })
      ).toThrow(LoadOutOfRangeError);
    });
  });

  // ==========================================================================
  // 4. Accuracy Class IIII (Ordinary Accuracy)
  // Tiers: [0, 50 e] -> ±0.5 e | (50 e, 200 e] -> ±1.0 e | (200 e, 1 000 e] -> ±1.5 e
  // Maximum n = 1 000
  // ==========================================================================
  describe('Class IIII Boundaries and Tiers', () => {
    const e = new Decimal('10'); // 10 kg weighbridge

    it('evaluates zero load (m = 0 e) at Tier 1 (±0.5 e)', () => {
      const res = calculateMPE({
        accuracyClass: 'CLASS_IIII',
        load: 0,
        e,
      });

      expect(res.tier).toBe('TIER_1');
      expect(res.factorInE.toString()).toBe('0.5');
      expect(res.magnitude.toString()).toBe('5');
    });

    it('evaluates just below Transition 1 (m = 49.9 e) at Tier 1', () => {
      const res = calculateMPE({
        accuracyClass: 'CLASS_IIII',
        load: e.times('49.9'),
        e,
      });

      expect(res.tier).toBe('TIER_1');
      expect(res.factorInE.toString()).toBe('0.5');
      expect(res.magnitude.toString()).toBe('5');
    });

    it('evaluates exactly at Transition 1 (m = 50 e) at Tier 1 (±0.5 e)', () => {
      const res = calculateMPE({
        accuracyClass: 'CLASS_IIII',
        load: e.times('50'),
        e,
      });

      expect(res.tier).toBe('TIER_1');
      expect(res.factorInE.toString()).toBe('0.5');
      expect(res.magnitude.toString()).toBe('5');
    });

    it('evaluates just above Transition 1 (m = 50.1 e) at Tier 2 (±1.0 e)', () => {
      const res = calculateMPE({
        accuracyClass: 'CLASS_IIII',
        load: e.times('50.1'),
        e,
      });

      expect(res.tier).toBe('TIER_2');
      expect(res.factorInE.toString()).toBe('1');
      expect(res.magnitude.toString()).toBe('10');
    });

    it('evaluates just below Transition 2 (m = 199.9 e) at Tier 2', () => {
      const res = calculateMPE({
        accuracyClass: 'CLASS_IIII',
        load: e.times('199.9'),
        e,
      });

      expect(res.tier).toBe('TIER_2');
      expect(res.factorInE.toString()).toBe('1');
      expect(res.magnitude.toString()).toBe('10');
    });

    it('evaluates exactly at Transition 2 (m = 200 e) at Tier 2 (±1.0 e)', () => {
      const res = calculateMPE({
        accuracyClass: 'CLASS_IIII',
        load: e.times('200'),
        e,
      });

      expect(res.tier).toBe('TIER_2');
      expect(res.factorInE.toString()).toBe('1');
      expect(res.magnitude.toString()).toBe('10');
    });

    it('evaluates just above Transition 2 (m = 200.1 e) at Tier 3 (±1.5 e)', () => {
      const res = calculateMPE({
        accuracyClass: 'CLASS_IIII',
        load: e.times('200.1'),
        e,
      });

      expect(res.tier).toBe('TIER_3');
      expect(res.factorInE.toString()).toBe('1.5');
      expect(res.magnitude.toString()).toBe('15');
    });

    it('evaluates at maximum permitted capacity (m = 1 000 e) at Tier 3 (±1.5 e)', () => {
      const res = calculateMPE({
        accuracyClass: 'CLASS_IIII',
        load: e.times('1000'),
        e,
      });

      expect(res.tier).toBe('TIER_3');
      expect(res.factorInE.toString()).toBe('1.5');
      expect(res.magnitude.toString()).toBe('15');
      expect(res.loadInE.toString()).toBe('1000');
    });

    it('rejects loads exceeding maximum permitted capacity (m = 1 001 e) with LoadOutOfRangeError', () => {
      expect(() =>
        calculateMPE({
          accuracyClass: 'CLASS_IIII',
          load: e.times('1001'),
          e,
        })
      ).toThrow(LoadOutOfRangeError);
    });
  });

  // ==========================================================================
  // 5. Input Normalization and Flexibility
  // ==========================================================================
  describe('Input Normalization', () => {
    it('accepts string and roman-numeral formats for accuracy class', () => {
      const e = 1;
      expect(calculateMPE({ accuracyClass: 'I', load: 100, e }).accuracyClass).toBe('CLASS_I');
      expect(calculateMPE({ accuracyClass: 'class i', load: 100, e }).accuracyClass).toBe('CLASS_I');
      expect(calculateMPE({ accuracyClass: 'II', load: 100, e }).accuracyClass).toBe('CLASS_II');
      expect(calculateMPE({ accuracyClass: 'III', load: 100, e }).accuracyClass).toBe('CLASS_III');
      expect(calculateMPE({ accuracyClass: 'IV', load: 100, e }).accuracyClass).toBe('CLASS_IIII');
      expect(calculateMPE({ accuracyClass: 'IIII', load: 100, e }).accuracyClass).toBe('CLASS_IIII');
      expect(calculateMPE({ accuracyClass: 'CLASS_IV', load: 100, e }).accuracyClass).toBe('CLASS_IIII');
    });

    it('accepts numbers and string representation for load and e', () => {
      const res = calculateMPE({
        accuracyClass: 'CLASS_III',
        load: '1500.5',
        e: '0.5',
      });
      // 1500.5 / 0.5 = 3001 e -> Tier 3 (factor 1.5)
      expect(res.tier).toBe('TIER_3');
      expect(res.factorInE.toString()).toBe('1.5');
      expect(res.magnitude.toString()).toBe('0.75'); // 1.5 * 0.5 = 0.75
    });
  });

  // ==========================================================================
  // 6. Strict Error Handling
  // ==========================================================================
  describe('Error Handling and Validation', () => {
    it('throws InvalidInputError on negative load', () => {
      expect(() =>
        calculateMPE({
          accuracyClass: 'CLASS_III',
          load: -5,
          e: 1,
        })
      ).toThrow(InvalidInputError);
    });

    it('throws InvalidInputError on zero verification interval e', () => {
      expect(() =>
        calculateMPE({
          accuracyClass: 'CLASS_III',
          load: 100,
          e: 0,
        })
      ).toThrow(InvalidInputError);
    });

    it('throws InvalidInputError on negative verification interval e', () => {
      expect(() =>
        calculateMPE({
          accuracyClass: 'CLASS_III',
          load: 100,
          e: -1,
        })
      ).toThrow(InvalidInputError);
    });

    it('throws InvalidInputError on unparseable non-numerical load', () => {
      expect(() =>
        calculateMPE({
          accuracyClass: 'CLASS_III',
          load: 'not-a-number',
          e: 1,
        })
      ).toThrow(InvalidInputError);
    });

    it('throws InvalidInputError on unparseable non-numerical e', () => {
      expect(() =>
        calculateMPE({
          accuracyClass: 'CLASS_III',
          load: 100,
          e: 'invalid',
        })
      ).toThrow(InvalidInputError);
    });

    it('throws UnsupportedClassError on unknown accuracy class', () => {
      expect(() =>
        calculateMPE({
          accuracyClass: 'CLASS_UNKNOWN',
          load: 100,
          e: 1,
        })
      ).toThrow(UnsupportedClassError);
    });

    it('throws UnsupportedRulePackError on invalid rule pack version', () => {
      expect(() =>
        calculateMPE({
          accuracyClass: 'CLASS_III',
          load: 100,
          e: 1,
          rulePackVersion: 'R76-FUTURE-v99',
        })
      ).toThrow(UnsupportedRulePackError);
    });
  });
});
