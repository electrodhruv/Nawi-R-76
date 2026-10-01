import Decimal from 'decimal.js';
import {
  InvalidInputError,
  ReferenceStandardValidationParams,
  ReferenceStandardValidationResult,
  StandardWeightClass,
} from '../types/metrology';

/**
 * Checks whether a standard weight class qualifies for the Class E2-or-better
 * uncertainty provision under OIML R 76-1:2006 Clause 3.7.1.
 */
export function isClassE2OrBetter(weightClass: StandardWeightClass): boolean {
  return weightClass === 'E1' || weightClass === 'E2';
}

/**
 * Validates reference standard weights and calibration uncertainties
 * against OIML R 76-1:2006 Clause 3.7.1.
 *
 * Rules:
 *   1. General standard-weight case:
 *        error(standard weight) <= 1/3 * |MPE(L)|
 *   2. Class E2-or-better case:
 *        expandedUncertainty_U <= 1/3 * |MPE(L)|
 *   3. Validity check:
 *        Test date must be prior to or equal to calibration expiration date.
 *
 * Deterministic validation check. Returns compliance status, diagnostic ratios,
 * and explicit violation notices.
 *
 * @param params Standard weight specifications, calibration metadata, and instrument MPE.
 * @returns Complete validation result.
 */
export function validateReferenceStandard(
  params: ReferenceStandardValidationParams
): ReferenceStandardValidationResult {
  const {
    standardSerialNumber,
    weightClass,
    standardError,
    expandedUncertainty_U,
    validUntilDate,
    testDate = new Date(),
    mpeOfInstrumentAtLoad,
  } = params;

  const violations: string[] = [];

  // 1. Resolve Instrument MPE magnitude
  let instrumentMpe: Decimal;
  if (typeof mpeOfInstrumentAtLoad === 'object' && 'magnitude' in mpeOfInstrumentAtLoad) {
    instrumentMpe = mpeOfInstrumentAtLoad.magnitude;
  } else {
    try {
      instrumentMpe = new Decimal(mpeOfInstrumentAtLoad).abs();
    } catch {
      throw new InvalidInputError(`Invalid MPE value provided for reference standard validation.`);
    }
  }

  if (instrumentMpe.lte(0)) {
    throw new InvalidInputError(`Instrument MPE magnitude must be strictly positive (received ${instrumentMpe.toString()}).`);
  }

  // Authoritative 1/3 MPE limit
  const oneThirdMpeLimit = instrumentMpe.dividedBy(3);

  // 2. Calibration Expiration Check
  const validUntil = new Date(validUntilDate);
  const currentTestDate = new Date(testDate);

  if (isNaN(validUntil.getTime())) {
    throw new InvalidInputError(`Invalid calibration validity date: "${validUntilDate}".`);
  }
  if (isNaN(currentTestDate.getTime())) {
    throw new InvalidInputError(`Invalid test date: "${testDate}".`);
  }

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysUntilExpiration = Math.floor((validUntil.getTime() - currentTestDate.getTime()) / msPerDay);
  const isExpired = daysUntilExpiration < 0;

  if (isExpired) {
    violations.push(
      `Calibration certificate for standard "${standardSerialNumber}" expired ${Math.abs(
        daysUntilExpiration
      )} days prior to test date (valid until ${validUntil.toISOString().split('T')[0]}).`
    );
  }

  // 3. Evaluate Error or Uncertainty Criterion (Clause 3.7.1)
  let decStandardError: Decimal | undefined = undefined;
  let decUncertainty: Decimal | undefined = undefined;
  let criterionUsed: 'ERROR_LEQ_ONE_THIRD_MPE' | 'UNCERTAINTY_LEQ_ONE_THIRD_MPE';
  let ratioToLimit: Decimal;
  let isMetrologicallyCompliant = true;

  if (isClassE2OrBetter(weightClass) && expandedUncertainty_U !== undefined) {
    // E2-or-better case: expanded uncertainty U <= 1/3 MPE
    criterionUsed = 'UNCERTAINTY_LEQ_ONE_THIRD_MPE';
    decUncertainty = new Decimal(expandedUncertainty_U).abs();
    ratioToLimit = decUncertainty.dividedBy(oneThirdMpeLimit);

    if (decUncertainty.gt(oneThirdMpeLimit)) {
      isMetrologicallyCompliant = false;
      violations.push(
        `Expanded calibration uncertainty U (${decUncertainty.toString()}) exceeds 1/3 MPE limit (${oneThirdMpeLimit.toDecimalPlaces(6).toString()}) for Class ${weightClass} standard under Clause 3.7.1.`
      );
    }
  } else {
    // General standard-weight case: standardError <= 1/3 MPE
    criterionUsed = 'ERROR_LEQ_ONE_THIRD_MPE';

    if (standardError === undefined) {
      throw new InvalidInputError(
        `Standard weight error 'standardError' is required for Class ${weightClass} standards under Clause 3.7.1.`
      );
    }

    decStandardError = new Decimal(standardError).abs();
    ratioToLimit = decStandardError.dividedBy(oneThirdMpeLimit);

    if (decStandardError.gt(oneThirdMpeLimit)) {
      isMetrologicallyCompliant = false;
      violations.push(
        `Standard weight error (${decStandardError.toString()}) exceeds 1/3 MPE limit (${oneThirdMpeLimit.toDecimalPlaces(6).toString()}) under Clause 3.7.1.`
      );
    }
  }

  const isCompliant = isMetrologicallyCompliant && !isExpired;

  return {
    isCompliant,
    isExpired,
    daysUntilExpiration,
    standardError: decStandardError,
    expandedUncertainty_U: decUncertainty,
    oneThirdMpeLimit,
    criterionUsed,
    ratioToLimit,
    violations,
  };
}
