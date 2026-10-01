import Decimal from 'decimal.js';
import {
  AccuracyClass,
  CalculateMPEParams,
  InvalidInputError,
  LoadOutOfRangeError,
  MPEResult,
  normalizeAccuracyClass,
  UnsupportedRulePackError,
} from '../types/metrology';
import { RULE_PACK_REGISTRY } from '../rules/oiml-r76-2006';

/**
 * Calculates the Maximum Permissible Error (MPE) for pattern evaluation and
 * initial verification according to OIML R 76-1:2006 Table 6.
 *
 * Fully deterministic, server-authoritative, decimal-precision calculation.
 *
 * @param params Input specifications containing accuracy class, load, and e.
 * @returns Complete authoritative MPEResult object.
 * @throws InvalidInputError on negative load, non-positive e, or unparseable numbers.
 * @throws UnsupportedClassError on unrecognized accuracy class.
 * @throws UnsupportedRulePackError on unregistered rule pack version.
 * @throws LoadOutOfRangeError when load exceeds maximum permissible intervals for class.
 */
export function calculateMPE(params: CalculateMPEParams): MPEResult {
  const {
    accuracyClass,
    load,
    e,
    rulePackVersion = 'R76-2006-v1',
    allowExceedingMaxRange = false,
  } = params;

  // 1. Resolve and validate rule pack
  const rulePack = RULE_PACK_REGISTRY[rulePackVersion];
  if (!rulePack) {
    throw new UnsupportedRulePackError(
      `Unsupported or unregistered rule pack version: "${rulePackVersion}". Supported: ${Object.keys(
        RULE_PACK_REGISTRY
      ).join(', ')}`
    );
  }

  // 2. Normalize and validate accuracy class
  const canonicalClass: AccuracyClass = normalizeAccuracyClass(accuracyClass);
  const classSpec = rulePack.table6Rules[canonicalClass];
  if (!classSpec) {
    throw new InvalidInputError(
      `No Table 6 MPE specification configured for accuracy class: "${canonicalClass}" in rule pack "${rulePackVersion}".`
    );
  }

  // 3. Parse and validate verification scale interval e
  let decE: Decimal;
  try {
    decE = new Decimal(e);
  } catch {
    throw new InvalidInputError(`Invalid numerical value for verification scale interval 'e': "${e}"`);
  }

  if (decE.isNaN() || !decE.isFinite()) {
    throw new InvalidInputError(`Verification scale interval 'e' must be a finite numerical value.`);
  }

  if (decE.lte(0)) {
    throw new InvalidInputError(
      `Verification scale interval 'e' must be strictly positive and non-zero (received ${decE.toString()}).`
    );
  }

  // 4. Parse and validate test load L
  let decLoad: Decimal;
  try {
    decLoad = new Decimal(load);
  } catch {
    throw new InvalidInputError(`Invalid numerical value for test load 'load': "${load}"`);
  }

  if (decLoad.isNaN() || !decLoad.isFinite()) {
    throw new InvalidInputError(`Test load 'load' must be a finite numerical value.`);
  }

  if (decLoad.isNegative()) {
    throw new InvalidInputError(
      `Test load 'load' cannot be negative under OIML R 76 Table 6 (received ${decLoad.toString()}).`
    );
  }

  // 5. Calculate load in units of verification scale intervals: m = load / e
  const m = decLoad.dividedBy(decE);

  // 6. Check maximum applicable verification interval count for class
  if (classSpec.maxN !== null && m.gt(classSpec.maxN) && !allowExceedingMaxRange) {
    throw new LoadOutOfRangeError(
      `Load ${m.toString()} e exceeds the maximum permitted verification interval count (${classSpec.maxN.toString()} e) for ${canonicalClass} under ${rulePack.standard} Table 6.`,
      m,
      classSpec.maxN,
      canonicalClass
    );
  }

  // 7. Determine applicable tier by linear boundary evaluation
  let matchedTier = classSpec.tiers[classSpec.tiers.length - 1]; // Fallback to highest tier
  for (const tierBoundary of classSpec.tiers) {
    if (tierBoundary.maxMInE === null || m.lte(tierBoundary.maxMInE)) {
      matchedTier = tierBoundary;
      break;
    }
  }

  const factorInE = matchedTier.mpeFactor;
  const magnitude = factorInE.times(decE);
  const lowerLimit = magnitude.negated();
  const upperLimit = magnitude;

  const ruleDef = rulePack.ruleDefinitions['RULE_R76_2006_TABLE6_MPE'];

  return {
    magnitude,
    factorInE,
    lowerLimit,
    upperLimit,
    tier: matchedTier.tier,
    loadInE: m,
    e: decE,
    load: decLoad,
    accuracyClass: canonicalClass,
    rulePackVersion: rulePack.rulePackVersion,
    standard: rulePack.standard,
    standardVersion: rulePack.standardVersion,
    clauseReference: ruleDef?.clauseReference ?? '3.5.1 Table 6',
    ruleId: ruleDef?.ruleId ?? 'RULE_R76_2006_TABLE6_MPE',
  };
}
