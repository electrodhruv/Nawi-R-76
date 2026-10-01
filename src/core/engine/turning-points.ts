import Decimal from 'decimal.js';
import {
  InvalidInputError,
  PartialWeighingRangeSpec,
  TurningPointInput,
  TurningPointResult,
} from '../types/metrology';
import { calculateMPE } from './mpe';

/**
 * Calculates true indication prior to rounding, error, and corrected error
 * using the turning-points method under OIML R 76-1:2006 Clause A.4.4.3.
 *
 * Formulas:
 *   P  = I + 0.5 * e - delta_L
 *   E  = P - L
 *   Ec = E - E0
 *
 * @param input Raw observations and scale interval.
 * @returns Calculated true indication, error, corrected error, and optional MPE compliance.
 */
export function calculateTurningPoint(input: TurningPointInput): TurningPointResult {
  const { load, indication, additionalLoad_dL, e, zeroError_E0 = 0, accuracyClass, rulePackVersion } = input;

  // 1. Parse and validate inputs
  let decLoad: Decimal;
  let decIndication: Decimal;
  let decDeltaL: Decimal;
  let decE: Decimal;
  let decE0: Decimal;

  try {
    decLoad = new Decimal(load);
    decIndication = new Decimal(indication);
    decDeltaL = new Decimal(additionalLoad_dL);
    decE = new Decimal(e);
    decE0 = new Decimal(zeroError_E0);
  } catch (err) {
    throw new InvalidInputError(`Invalid numerical input to calculateTurningPoint: ${(err as Error).message}`);
  }

  if (decE.lte(0)) {
    throw new InvalidInputError(`Verification scale interval 'e' must be strictly positive (received ${decE.toString()}).`);
  }

  if (decDeltaL.isNegative()) {
    throw new InvalidInputError(`Additional load delta_L cannot be negative (received ${decDeltaL.toString()}).`);
  }

  if (decLoad.isNegative()) {
    throw new InvalidInputError(`Applied load cannot be negative (received ${decLoad.toString()}).`);
  }

  // 2. Compute true indication P prior to rounding (A.4.4.3)
  // P = I + 0.5 * e - delta_L
  const calculated_P = decIndication.plus(decE.times(0.5)).minus(decDeltaL);

  // 3. Compute error of indication before rounding E
  // E = P - L
  const error_E = calculated_P.minus(decLoad);

  // 4. Compute corrected error of indication Ec
  // Ec = E - E0
  const correctedError_Ec = error_E.minus(decE0);

  // 5. Optional MPE compliance evaluation if accuracy class is supplied
  let mpeResult = undefined;
  let isCompliant = undefined;

  if (accuracyClass) {
    mpeResult = calculateMPE({
      accuracyClass,
      load: decLoad,
      e: decE,
      rulePackVersion,
      allowExceedingMaxRange: true,
    });
    isCompliant = correctedError_Ec.abs().lte(mpeResult.magnitude);
  }

  return {
    load: decLoad,
    indication: decIndication,
    additionalLoad_dL: decDeltaL,
    e: decE,
    calculated_P,
    error_E,
    zeroError_E0: decE0,
    correctedError_Ec,
    mpe: mpeResult,
    isCompliant,
  };
}

/**
 * Resolves the applicable verification scale interval e_i for a given load L
 * across multi-interval or multiple-range instruments.
 *
 * Under OIML R 76-1 Clause 3.2, each partial range i is bounded by Max_i
 * and possesses its own verification interval e_i.
 *
 * @param load Applied load L
 * @param partialRanges Array of partial weighing ranges
 * @returns Verification scale interval e_i for the matching partial range
 */
export function resolveVerificationIntervalForLoad(
  load: Decimal | number | string,
  partialRanges: PartialWeighingRangeSpec[]
): Decimal {
  if (!partialRanges || partialRanges.length === 0) {
    throw new InvalidInputError('At least one partial weighing range must be provided.');
  }

  const decLoad = new Decimal(load);

  // Sort by maxCapacity ascending
  const sorted = [...partialRanges].sort((a, b) =>
    new Decimal(a.maxCapacity).comparedTo(new Decimal(b.maxCapacity))
  );

  for (const range of sorted) {
    const maxCap = new Decimal(range.maxCapacity);
    if (decLoad.lte(maxCap)) {
      return new Decimal(range.verificationInterval_e);
    }
  }

  // If load exceeds highest partial range, return the highest range's e_i
  return new Decimal(sorted[sorted.length - 1].verificationInterval_e);
}
