import { describe, it, expect } from 'vitest';
import {
  validateReferenceStandard,
  isClassE2OrBetter,
} from '../../src/core';

describe('OIML R 76-1:2006 Clause 3.7.1 Reference Standards Validation', () => {
  it('correctly identifies Class E2-or-better weights', () => {
    expect(isClassE2OrBetter('E1')).toBe(true);
    expect(isClassE2OrBetter('E2')).toBe(true);
    expect(isClassE2OrBetter('F1')).toBe(false);
    expect(isClassE2OrBetter('M1')).toBe(false);
  });

  it('validates general standard weights against standardError <= 1/3 MPE', () => {
    // Instrument MPE at load = 1.5 g
    // 1/3 MPE limit = 0.5 g
    // Class F1 standard weight with error = 0.3 g <= 0.5 g (PASS)
    const validUntilDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days in future

    const resPass = validateReferenceStandard({
      standardSerialNumber: 'STD-F1-001',
      weightClass: 'F1',
      standardError: 0.3,
      validUntilDate,
      appliedLoad: 1000,
      mpeOfInstrumentAtLoad: 1.5,
    });

    expect(resPass.isCompliant).toBe(true);
    expect(resPass.criterionUsed).toBe('ERROR_LEQ_ONE_THIRD_MPE');
    expect(resPass.oneThirdMpeLimit.toString()).toBe('0.5');
    expect(resPass.isExpired).toBe(false);
    expect(resPass.violations).toHaveLength(0);

    // Standard with error = 0.6 g > 0.5 g (FAIL!)
    const resFail = validateReferenceStandard({
      standardSerialNumber: 'STD-M1-002',
      weightClass: 'M1',
      standardError: 0.6,
      validUntilDate,
      appliedLoad: 1000,
      mpeOfInstrumentAtLoad: 1.5,
    });

    expect(resFail.isCompliant).toBe(false);
    expect(resFail.violations.length).toBeGreaterThan(0);
    expect(resFail.violations[0]).toContain('exceeds 1/3 MPE limit');
  });

  it('validates Class E2-or-better weights using expanded uncertainty U <= 1/3 MPE', () => {
    // Class E2 standard
    // Instrument MPE at load = 0.03 g -> 1/3 MPE = 0.01 g
    // Uncertainty U = 0.005 g <= 0.01 g (PASS)
    const validUntilDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

    const res = validateReferenceStandard({
      standardSerialNumber: 'STD-E2-999',
      weightClass: 'E2',
      expandedUncertainty_U: 0.005,
      validUntilDate,
      appliedLoad: 100,
      mpeOfInstrumentAtLoad: 0.03,
    });

    expect(res.isCompliant).toBe(true);
    expect(res.criterionUsed).toBe('UNCERTAINTY_LEQ_ONE_THIRD_MPE');
    expect(res.expandedUncertainty_U?.toString()).toBe('0.005');
  });

  it('flags calibration expiration as a blocking violation', () => {
    // Expired 10 days ago
    const expiredDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);

    const res = validateReferenceStandard({
      standardSerialNumber: 'STD-F2-EXPIRED',
      weightClass: 'F2',
      standardError: 0.1,
      validUntilDate: expiredDate,
      appliedLoad: 500,
      mpeOfInstrumentAtLoad: 1.0,
    });

    expect(res.isExpired).toBe(true);
    expect(res.isCompliant).toBe(false);
    expect(res.violations[0]).toContain('expired');
  });
});
