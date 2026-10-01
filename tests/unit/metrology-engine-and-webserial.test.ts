import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import {
  OimlMetrologyEngine,
  resolveVerificationInterval,
  calculateTurningPoint,
  resolveMpeTier,
  processObservation,
  validateRepeatability,
  validateCreepCompliance,
  validateStandardMassUncertainty,
} from '@/lib/metrology/engine';
import { WebSerialDriver } from '@/lib/hardware/webserial';

describe('Metrology Engine (/lib/metrology/engine.ts)', () => {
  it('dynamically resolves verification scale interval e_i across multi-interval ranges', () => {
    const ranges = [
      { rangeIndex: 1, maxCapacity: 2.0, verificationInterval_e: 0.001 },
      { rangeIndex: 2, maxCapacity: 6.0, verificationInterval_e: 0.002 },
      { rangeIndex: 3, maxCapacity: 15.0, verificationInterval_e: 0.005 },
    ];

    expect(resolveVerificationInterval(1.5, ranges).toNumber()).toBe(0.001);
    expect(resolveVerificationInterval(2.0, ranges).toNumber()).toBe(0.001);
    expect(resolveVerificationInterval(2.001, ranges).toNumber()).toBe(0.002);
    expect(resolveVerificationInterval(6.0, ranges).toNumber()).toBe(0.002);
    expect(resolveVerificationInterval(10.0, ranges).toNumber()).toBe(0.005);
    expect(resolveVerificationInterval(20.0, ranges).toNumber()).toBe(0.005);
  });

  it('calculates true indication P, error E, and corrected error Ec per Clause A.4.4.3', () => {
    // Turning point: L = 10.000, I = 10.000, dL = 0.002, e = 0.005, E0 = 0.0005
    // P = 10.000 + (0.5 * 0.005) - 0.002 = 10.000 + 0.0025 - 0.002 = 10.0005
    // E = P - L = 10.0005 - 10.000 = +0.0005
    // Ec = E - E0 = +0.0005 - 0.0005 = 0.0000
    const result = calculateTurningPoint({
      load: 10.0,
      indication: 10.0,
      subWeight_dL: 0.002,
      e: 0.005,
      zeroError_E0: 0.0005,
      accuracyClass: 'CLASS_III',
    });

    expect(result.calculated_P.toNumber()).toBeCloseTo(10.0005, 5);
    expect(result.error_E.toNumber()).toBeCloseTo(0.0005, 5);
    expect(result.correctedError_Ec.toNumber()).toBeCloseTo(0.0, 5);
    expect(result.isCompliant).toBe(true);
  });

  it('resolves statutory Table 6 MPE tiers for Class I, II, III, IIII', () => {
    // Class III: e = 1g
    // 0 to 500e -> +/-0.5e
    // 500e to 2000e -> +/-1.0e
    // > 2000e -> +/-1.5e
    const mpeLow = resolveMpeTier({ accuracyClass: 'Class III', load: 400, e: 1 });
    expect(mpeLow.magnitude.toNumber()).toBe(0.5);

    const mpeMid = resolveMpeTier({ accuracyClass: 'Class III', load: 1500, e: 1 });
    expect(mpeMid.magnitude.toNumber()).toBe(1.0);

    const mpeHigh = resolveMpeTier({ accuracyClass: 'Class III', load: 4000, e: 1 });
    expect(mpeHigh.magnitude.toNumber()).toBe(1.5);
  });

  it('runs complete processObservation combining intervals, turning-point, and MPE', () => {
    const output = processObservation({
      load: 5.0,
      indication: 5.0,
      subWeight_dL: 0.0004,
      zeroDatum_E0: 0.0001,
      accuracyClass: 'Class II',
      e: 0.001,
    });

    expect(output.calculated_P.toNumber()).toBeCloseTo(5.0001, 5);
    expect(output.error_E.toNumber()).toBeCloseTo(0.0001, 5);
    expect(output.correctedError_Ec.toNumber()).toBeCloseTo(0.0, 5);
    expect(output.isCompliant).toBe(true);
  });

  it('validates 1/3 MPE standard mass uncertainty rule (Clause 3.7.1)', () => {
    // Valid standard: U = 0.0001 <= 1/3 * 0.0005 (0.000166)
    const valid = validateStandardMassUncertainty({
      standardSerialNumber: 'STD-E2-01',
      weightClass: 'E2',
      expandedUncertainty_U: 0.0001,
      validUntilDate: new Date(Date.now() + 86400000 * 30),
      mpeOfInstrumentAtLoad: 0.0005,
      appliedLoad: 10.0,
    });
    expect(valid.isCompliant).toBe(true);

    // Invalid standard: U = 0.0003 > 1/3 * 0.0005
    const invalid = validateStandardMassUncertainty({
      standardSerialNumber: 'STD-E2-02',
      weightClass: 'E2',
      expandedUncertainty_U: 0.0003,
      validUntilDate: new Date(Date.now() + 86400000 * 30),
      mpeOfInstrumentAtLoad: 0.0005,
      appliedLoad: 10.0,
    });
    expect(invalid.isCompliant).toBe(false);
  });
});

describe('WebSerial Driver & Equilibrium Lock (/lib/hardware/webserial.ts)', () => {
  it('parses MT-SICS stable frames and releases Equilibrium Lock', () => {
    const driver = new WebSerialDriver({ verificationInterval_e: 0.001 });
    const reading = driver.parseTelemetryFrame('S S   10.000 kg');
    expect(reading).not.toBeNull();
    expect(reading!.weight).toBe(10.0);
    expect(reading!.unit).toBe('kg');
    expect(reading!.isStable).toBe(true);
    expect(reading!.isEquilibriumLocked).toBe(false);
  });

  it('parses MT-SICS dynamic/unstable frames and engages Equilibrium Lock', () => {
    const driver = new WebSerialDriver({ verificationInterval_e: 0.001 });
    const reading = driver.parseTelemetryFrame('S D   10.000 kg');
    expect(reading).not.toBeNull();
    expect(reading!.isStable).toBe(false);
    expect(reading!.isEquilibriumLocked).toBe(true);
  });

  it('detects excessive drift over 1-second window and enforces Clause 4.4.2 lock', () => {
    const driver = new WebSerialDriver({
      verificationInterval_e: 0.001,
      stabilityMaxDelta_e: 1.0, // 0.001 kg limit
      stabilityWindowMs: 2000,
    });

    driver.parseTelemetryFrame('10.000 kg');
    const driftingReading = driver.parseTelemetryFrame('10.003 kg'); // delta = 0.003 > 0.001

    expect(driftingReading).not.toBeNull();
    expect(driftingReading!.isEquilibriumLocked).toBe(true);
  });
});
