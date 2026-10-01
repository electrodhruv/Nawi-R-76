import Decimal from 'decimal.js';
import {
  InvalidInputError,
  normalizeAccuracyClass,
  RepeatabilityEvaluationParams,
  RepeatabilityEvaluationResult,
  RepeatabilityPointResult,
  RepeatabilitySeriesResult,
} from '../types/metrology';
import { calculateMPE } from './mpe';

/**
 * Minimum capacity threshold in kg where required repeatability count shifts
 * from 10 weighings to at least 3 weighings (OIML R 76-1 Clause A.4.10).
 */
export const REPEATABILITY_CAPACITY_THRESHOLD_KG = new Decimal(1000);

/**
 * Determines the mandatory number of weighings per series for Type Examination
 * under OIML R 76-1:2006 Clause A.4.10.
 *
 * @param maxCapacityInKg Instrument maximum capacity Max in kilograms
 * @returns Required weighing count: 10 if Max < 1000 kg, 3 if Max >= 1000 kg
 */
export function getRequiredRepeatabilityCount(maxCapacityInKg: Decimal | number | string): number {
  const decMax = new Decimal(maxCapacityInKg);
  if (decMax.lt(REPEATABILITY_CAPACITY_THRESHOLD_KG)) {
    return 10;
  }
  return 3;
}

/**
 * Evaluates Type Examination Repeatability under OIML R 76-1:2006 Clause A.4.10.
 *
 * Authoritative compliance rule:
 *   Repeatability Span = E_max - E_min <= |MPE(L)|
 *
 * Evaluates two distinct series (~50% Max and ~100% Max) and verifies individual
 * turning-point errors, extreme errors, repeatability span, and weighing count adequacy.
 *
 * @param params Repeatability observation series and instrument metadata.
 * @returns Comprehensive series results, calculated spans, and overall compliance verdict.
 */
export function evaluateRepeatability(params: RepeatabilityEvaluationParams): RepeatabilityEvaluationResult {
  const { accuracyClass, maxCapacity, e, series, rulePackVersion = 'R76-2006-v1' } = params;

  const canonicalClass = normalizeAccuracyClass(accuracyClass);
  const decMax = new Decimal(maxCapacity);
  const decE = new Decimal(e);

  if (decMax.lte(0)) {
    throw new InvalidInputError(`Maximum capacity 'maxCapacity' must be strictly positive (received ${decMax.toString()}).`);
  }
  if (decE.lte(0)) {
    throw new InvalidInputError(`Verification scale interval 'e' must be strictly positive (received ${decE.toString()}).`);
  }
  if (!series || series.length === 0) {
    throw new InvalidInputError('At least one repeatability test series must be provided.');
  }

  const requiredCount = getRequiredRepeatabilityCount(decMax);
  const seriesResults: RepeatabilitySeriesResult[] = [];
  let allSeriesCompliant = true;

  for (const s of series) {
    const nominalLoad = new Decimal(s.nominalLoad);
    if (nominalLoad.lte(0)) {
      throw new InvalidInputError(`Nominal load for series ${s.seriesIndex} must be strictly positive.`);
    }

    const points: RepeatabilityPointResult[] = [];

    for (const w of s.weighings) {
      const decIndication = new Decimal(w.indication);
      const decDeltaL = new Decimal(w.additionalLoad_dL);

      // P = I + 0.5 * e - delta_L
      const calculated_P = decIndication.plus(decE.times(0.5)).minus(decDeltaL);
      const error_E = calculated_P.minus(nominalLoad);

      // Zero check if recorded
      let zeroError_E0 = new Decimal(0);
      if (w.zeroIndication !== undefined && w.zeroAdditionalLoad_dL !== undefined) {
        const decZeroI = new Decimal(w.zeroIndication);
        const decZeroDL = new Decimal(w.zeroAdditionalLoad_dL);
        const zero_P = decZeroI.plus(decE.times(0.5)).minus(decZeroDL);
        zeroError_E0 = zero_P; // Zero load error: P(0) - 0
      }

      const correctedError_Ec = error_E.minus(zeroError_E0);

      points.push({
        weighingIndex: w.weighingIndex,
        calculated_P,
        error_E,
        zeroError_E0,
        correctedError_Ec,
      });
    }

    if (points.length === 0) {
      throw new InvalidInputError(`Repeatability series ${s.seriesIndex} contains no weighings.`);
    }

    // Derive extreme errors using corrected errors
    let maxError = points[0].correctedError_Ec;
    let minError = points[0].correctedError_Ec;

    for (const p of points) {
      if (p.correctedError_Ec.gt(maxError)) {
        maxError = p.correctedError_Ec;
      }
      if (p.correctedError_Ec.lt(minError)) {
        minError = p.correctedError_Ec;
      }
    }

    // Authoritative repeatability span: E_max - E_min
    const repeatabilitySpan = maxError.minus(minError);

    // MPE for the applied load
    const mpe = calculateMPE({
      accuracyClass: canonicalClass,
      load: nominalLoad,
      e: decE,
      rulePackVersion,
      allowExceedingMaxRange: true,
    });

    const isCountSufficient = points.length >= requiredCount;
    const isSpanCompliant = repeatabilitySpan.lte(mpe.magnitude);
    const isSeriesCompliant = isCountSufficient && isSpanCompliant;

    if (!isSeriesCompliant) {
      allSeriesCompliant = false;
    }

    seriesResults.push({
      seriesIndex: s.seriesIndex,
      nominalLoad,
      weighingCount: points.length,
      requiredCount,
      points,
      maxError,
      minError,
      repeatabilitySpan,
      mpe,
      isCompliant: isSeriesCompliant,
    });
  }

  return {
    seriesResults,
    overallCompliant: allSeriesCompliant && seriesResults.length >= 2,
    accuracyClass: canonicalClass,
    ruleId: 'RULE_R76_2006_A410_REPEATABILITY',
    clauseReference: 'A.4.10',
  };
}
