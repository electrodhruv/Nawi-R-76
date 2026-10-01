import { describe, it, expect } from 'vitest';
import {
  evaluateCreep,
  InvalidInputError,
} from '../../src/core';

describe('OIML R 76-1:2006 Clause A.4.11 Creep and Zero Return Engine', () => {
  it('throws InvalidInputError when executed for Class I instruments (exempt under A.4.11.1)', () => {
    expect(() =>
      evaluateCreep({
        accuracyClass: 'CLASS_I',
        maxCapacity: 1000,
        appliedLoad: 1000,
        e: 0.001,
        initialObservation: { timestamp: new Date(), elapsedMinutes: 0, indication: 1000, additionalLoad_dL: 0.0005 },
        observations: [
          { timestamp: new Date(), elapsedMinutes: 15, indication: 1000, additionalLoad_dL: 0.0005 },
          { timestamp: new Date(), elapsedMinutes: 30, indication: 1000, additionalLoad_dL: 0.0005 },
        ],
      })
    ).toThrow(InvalidInputError);
  });

  it('qualifies for 30-minute early termination when drift is within 0.5e and delta(30m - 15m) <= 0.2e', () => {
    // Class III, Max = 15 kg, e = 5 g
    // Initial P0 at t = 0: I = 15000, dL = 2.5 -> P0 = 15000 + 2.5 - 2.5 = 15000.0 g
    // At t = 15 min: I = 15000, dL = 2.0 -> P = 15000 + 2.5 - 2.0 = 15000.5 g (drift = +0.5 g = 0.1 e)
    // At t = 30 min: I = 15000, dL = 1.8 -> P = 15000 + 2.5 - 1.8 = 15000.7 g
    // Drift from initial = 0.7 g <= 0.5e (2.5 g) -> OK
    // Delta between 30m and 15m = |15000.7 - 15000.5| = 0.2 g <= 0.2e (1.0 g) -> OK!
    const res = evaluateCreep({
      accuracyClass: 'CLASS_III',
      maxCapacity: 15000,
      appliedLoad: 15000,
      e: 5,
      initialObservation: { timestamp: 0, elapsedMinutes: 0, indication: 15000, additionalLoad_dL: 2.5 },
      observations: [
        { timestamp: 15, elapsedMinutes: 15, indication: 15000, additionalLoad_dL: 2.0 },
        { timestamp: 30, elapsedMinutes: 30, indication: 15000, additionalLoad_dL: 1.8 },
      ],
      zeroReturnObservation: { timestamp: 35, elapsedMinutes: 35, indication: 0, additionalLoad_dL: 2.5 }, // residual zero = 0
    });

    expect(res.earlyTerminationQualified).toBe(true);
    expect(res.earlyTerminatedAt30Min).toBe(true);
    expect(res.isCreepCompliant).toBe(true);
    expect(res.zeroReturn?.isCompliant).toBe(true);
    expect(res.overallCompliant).toBe(true);
  });

  it('evaluates full 4-hour drift when test does not qualify for early termination', () => {
    // Drift between 30m and 15m is large (exceeds 0.2e), so cannot terminate at 30 min
    // Test continues to 240 minutes (4 hours).
    // Final reading at 240 min must satisfy drift <= MPE(Max) = 1.5 e = 7.5 g
    const res = evaluateCreep({
      accuracyClass: 'CLASS_III',
      maxCapacity: 15000,
      appliedLoad: 15000,
      e: 5,
      initialObservation: { timestamp: 0, elapsedMinutes: 0, indication: 15000, additionalLoad_dL: 2.5 }, // P0 = 15000
      observations: [
        { timestamp: 15, elapsedMinutes: 15, indication: 15000, additionalLoad_dL: 2.5 }, // P = 15000
        { timestamp: 30, elapsedMinutes: 30, indication: 15000, additionalLoad_dL: 0.5 }, // P = 15002 (delta 15 to 30 = 2 g > 1 g = 0.2e)
        { timestamp: 60, elapsedMinutes: 60, indication: 15000, additionalLoad_dL: 0.5 },
        { timestamp: 120, elapsedMinutes: 120, indication: 15000, additionalLoad_dL: 0.5 },
        { timestamp: 240, elapsedMinutes: 240, indication: 15000, additionalLoad_dL: 0.0 }, // P = 15002.5 (drift = 2.5 g <= 7.5 g MPE)
      ],
    });

    expect(res.earlyTerminationQualified).toBe(false);
    expect(res.earlyTerminatedAt30Min).toBe(false);
    expect(res.evaluatedDurationMinutes).toBe(240);
    expect(res.isCreepCompliant).toBe(true); // full 4-hour drift is within MPE
  });

  it('fails zero return test when residual error exceeds 0.5e upon load removal', () => {
    // e = 5 g -> zero return limit = 0.5 * 5 = 2.5 g
    // Upon load removal, indication = 0, delta_L = 0 -> zero_P = 0 + 2.5 - 0 = 2.5 g
    // If indication = 5, delta_L = 2.5 -> zero_P = 5.0 g > 2.5 g (FAIL!)
    const res = evaluateCreep({
      accuracyClass: 'CLASS_III',
      maxCapacity: 15000,
      appliedLoad: 15000,
      e: 5,
      initialObservation: { timestamp: 0, elapsedMinutes: 0, indication: 15000, additionalLoad_dL: 2.5 },
      observations: [
        { timestamp: 15, elapsedMinutes: 15, indication: 15000, additionalLoad_dL: 2.5 },
        { timestamp: 30, elapsedMinutes: 30, indication: 15000, additionalLoad_dL: 2.5 },
      ],
      zeroReturnObservation: { timestamp: 35, elapsedMinutes: 35, indication: 5, additionalLoad_dL: 2.5 }, // residual = 5.0 g > 2.5 g
    });

    expect(res.zeroReturn?.isCompliant).toBe(false);
    expect(res.overallCompliant).toBe(false);
  });
});
