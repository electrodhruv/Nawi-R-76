import { describe, it, expect } from 'vitest';
import {
  evaluateRepeatability,
  getRequiredRepeatabilityCount,
} from '../../src/core';

describe('OIML R 76-1:2006 Clause A.4.10 Type Examination Repeatability', () => {
  it('identifies weighing count based on capacity (< 1000 kg requires 10, >= 1000 kg requires 3)', () => {
    expect(getRequiredRepeatabilityCount(500)).toBe(10);
    expect(getRequiredRepeatabilityCount(999.9)).toBe(10);
    expect(getRequiredRepeatabilityCount(1000)).toBe(3);
    expect(getRequiredRepeatabilityCount(50000)).toBe(3);
  });

  it('evaluates repeatability span Delta E_rep = E_max - E_min <= |MPE| for compliant series', () => {
    // Class III instrument, Max = 15 kg (< 1000 kg -> 10 weighings required)
    // e = 5 g
    // Series 1 at 7.5 kg (~50% Max, m = 1500 e -> Tier 2 MPE = ±1.0 e = ±5 g)
    // Series 2 at 15 kg (~100% Max, m = 3000 e -> Tier 3 MPE = ±1.5 e = ±7.5 g)
    const series1Weighings = Array.from({ length: 10 }, (_, i) => ({
      weighingIndex: i + 1,
      indication: 7500,
      additionalLoad_dL: 2.0 + (i % 3) * 0.5, // 2.0, 2.5, 3.0 g -> P between 7500.5 and 7499.5 g -> errors within 1 g
    }));

    const series2Weighings = Array.from({ length: 10 }, (_, i) => ({
      weighingIndex: i + 1,
      indication: 15000,
      additionalLoad_dL: 2.5,
    }));

    const result = evaluateRepeatability({
      accuracyClass: 'CLASS_III',
      maxCapacity: 15,
      e: 5,
      series: [
        {
          seriesIndex: 1,
          nominalLoad: 7500,
          weighings: series1Weighings,
        },
        {
          seriesIndex: 2,
          nominalLoad: 15000,
          weighings: series2Weighings,
        },
      ],
    });

    expect(result.overallCompliant).toBe(true);
    expect(result.seriesResults).toHaveLength(2);

    const s1 = result.seriesResults[0];
    expect(s1.requiredCount).toBe(10);
    expect(s1.weighingCount).toBe(10);
    expect(s1.repeatabilitySpan.lte(s1.mpe.magnitude)).toBe(true);
    expect(s1.isCompliant).toBe(true);
  });

  it('detects non-compliance when repeatability span exceeds MPE', () => {
    // Series with extreme error drift
    // e = 5 g, load = 7500 g -> MPE = 5 g
    // Point 1: indication 7500, dL = 0 -> P = 7502.5 -> E = +2.5 g
    // Point 2: indication 7490, dL = 2.5 -> P = 7490 -> E = -10.0 g
    // Span = 2.5 - (-10.0) = 12.5 g > 5.0 g (FAIL!)
    const weighings = [
      { weighingIndex: 1, indication: 7500, additionalLoad_dL: 0 },
      { weighingIndex: 2, indication: 7490, additionalLoad_dL: 2.5 },
      { weighingIndex: 3, indication: 7500, additionalLoad_dL: 2.5 },
    ];

    const result = evaluateRepeatability({
      accuracyClass: 'CLASS_III',
      maxCapacity: 5000, // >= 1000 kg -> 3 weighings required
      e: 5,
      series: [
        {
          seriesIndex: 1,
          nominalLoad: 7500,
          weighings,
        },
        {
          seriesIndex: 2,
          nominalLoad: 15000,
          weighings: [
            { weighingIndex: 1, indication: 15000, additionalLoad_dL: 2.5 },
            { weighingIndex: 2, indication: 15000, additionalLoad_dL: 2.5 },
            { weighingIndex: 3, indication: 15000, additionalLoad_dL: 2.5 },
          ],
        },
      ],
    });

    expect(result.seriesResults[0].isCompliant).toBe(false);
    expect(result.overallCompliant).toBe(false);
  });

  it('rejects evaluation when weighing count is insufficient for capacity', () => {
    // Max = 15 kg (< 1000 kg) requires 10 weighings, but only 5 provided
    const weighings = Array.from({ length: 5 }, (_, i) => ({
      weighingIndex: i + 1,
      indication: 7500,
      additionalLoad_dL: 2.5,
    }));

    const result = evaluateRepeatability({
      accuracyClass: 'CLASS_III',
      maxCapacity: 15,
      e: 5,
      series: [
        {
          seriesIndex: 1,
          nominalLoad: 7500,
          weighings,
        },
        {
          seriesIndex: 2,
          nominalLoad: 15000,
          weighings,
        },
      ],
    });

    expect(result.seriesResults[0].isCompliant).toBe(false); // insufficient count
    expect(result.overallCompliant).toBe(false);
  });
});
