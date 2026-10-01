import { describe, it, expect } from 'vitest';
import {
  calculateTurningPoint,
  resolveVerificationIntervalForLoad,
  InvalidInputError,
} from '../../src/core';

describe('OIML R 76-1:2006 Clause A.4.4.3 Turning-Points & True Error Engine', () => {
  it('calculates true indication P = I + 0.5e - delta_L and error E = P - L', () => {
    // Example from OIML R 76-1:
    // e = 1 g, load L = 1000 g
    // Displayed indication I = 1000 g
    // Fractional weights added until display steps to 1001 g: delta_L = 0.3 g
    // P = 1000 + 0.5 * 1 - 0.3 = 1000.2 g
    // E = 1000.2 - 1000 = +0.2 g
    // With E0 = 0, Ec = +0.2 g
    const res = calculateTurningPoint({
      load: 1000,
      indication: 1000,
      additionalLoad_dL: 0.3,
      e: 1,
      zeroError_E0: 0,
    });

    expect(res.calculated_P.toString()).toBe('1000.2');
    expect(res.error_E.toString()).toBe('0.2');
    expect(res.correctedError_Ec.toString()).toBe('0.2');
  });

  it('corrects error using zero-load error E0: Ec = E - E0', () => {
    // E0 = +0.1 g (measured at zero load)
    // E = +0.2 g
    // Ec = 0.2 - 0.1 = +0.1 g
    const res = calculateTurningPoint({
      load: 500,
      indication: 500,
      additionalLoad_dL: 0.3,
      e: 1,
      zeroError_E0: 0.1,
    });

    expect(res.error_E.toString()).toBe('0.2');
    expect(res.zeroError_E0.toString()).toBe('0.1');
    expect(res.correctedError_Ec.toString()).toBe('0.1');
  });

  it('evaluates MPE compliance when accuracy class is provided', () => {
    // Class III, e = 2 g, load = 1000 g (m = 500 e -> Tier 1 MPE = ±1.0 g)
    // Indication = 1000 g, delta_L = 0.7 g -> P = 1000 + 1 - 0.7 = 1000.3 g
    // E = +0.3 g, E0 = 0 -> Ec = +0.3 g <= 1.0 g (PASS)
    const resPass = calculateTurningPoint({
      load: 1000,
      indication: 1000,
      additionalLoad_dL: 0.7,
      e: 2,
      accuracyClass: 'CLASS_III',
    });

    expect(resPass.isCompliant).toBe(true);
    expect(resPass.mpe?.magnitude.toString()).toBe('1');

    // Excess error: delta_L = 0.1 g -> P = 1000 + 1 - 0.1 = 1000.9 g
    // E = +0.9 g, with E0 = -0.3 g -> Ec = 0.9 - (-0.3) = 1.2 g > 1.0 g (FAIL)
    const resFail = calculateTurningPoint({
      load: 1000,
      indication: 1000,
      additionalLoad_dL: 0.1,
      e: 2,
      zeroError_E0: -0.3,
      accuracyClass: 'CLASS_III',
    });

    expect(resFail.isCompliant).toBe(false);
  });

  it('resolves verification interval e_i for multi-interval instruments', () => {
    // Dual range instrument:
    // Range 1: 0 to 3 kg, e1 = 1 g
    // Range 2: 3 kg to 15 kg, e2 = 5 g
    const partialRanges = [
      {
        rangeIndex: 1,
        minCapacity: 0.02,
        maxCapacity: 3000,
        verificationInterval_e: 1,
      },
      {
        rangeIndex: 2,
        minCapacity: 3000,
        maxCapacity: 15000,
        verificationInterval_e: 5,
      },
    ];

    expect(resolveVerificationIntervalForLoad(1500, partialRanges).toString()).toBe('1');
    expect(resolveVerificationIntervalForLoad(3000, partialRanges).toString()).toBe('1');
    expect(resolveVerificationIntervalForLoad(3001, partialRanges).toString()).toBe('5');
    expect(resolveVerificationIntervalForLoad(15000, partialRanges).toString()).toBe('5');
  });

  it('rejects invalid inputs', () => {
    expect(() =>
      calculateTurningPoint({
        load: 100,
        indication: 100,
        additionalLoad_dL: -0.2, // negative delta_L
        e: 1,
      })
    ).toThrow(InvalidInputError);

    expect(() =>
      calculateTurningPoint({
        load: 100,
        indication: 100,
        additionalLoad_dL: 0.5,
        e: 0, // zero e
      })
    ).toThrow(InvalidInputError);
  });
});
