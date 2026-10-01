/**
 * Server-Side Deterministic Metrology Calculation Engine
 * 
 * Conforms to OIML R 76-1:2006 (E) & OIML R 76-2:2007 (E).
 * Immutable, testable server module using Decimal.js for arbitrary-precision arithmetic.
 */

import Decimal from 'decimal.js';
import {
  calculateTurningPoint as coreCalculateTurningPoint,
  resolveVerificationIntervalForLoad as coreResolveInterval,
} from '@/core/engine/turning-points';
import { calculateMPE as coreCalculateMPE } from '@/core/engine/mpe';
import { evaluateRepeatability as coreEvaluateRepeatability } from '@/core/engine/repeatability';
import { evaluateCreep as coreEvaluateCreep } from '@/core/engine/creep';
import { validateReferenceStandard as coreValidateReferenceStandard } from '@/core/engine/uncertainty';
import {
  AccuracyClass,
  MPEResult,
  PartialWeighingRangeSpec,
  TurningPointInput,
  TurningPointResult,
  RepeatabilityEvaluationParams,
  RepeatabilityEvaluationResult,
  CreepEvaluationParams,
  CreepEvaluationResult,
  ReferenceStandardValidationParams,
  ReferenceStandardValidationResult,
  normalizeAccuracyClass,
} from '@/core/types/metrology';

export interface PartialRangeDef {
  rangeIndex: number;
  maxCapacity: number | string | Decimal;
  minCapacity?: number | string | Decimal;
  verificationInterval_e: number | string | Decimal;
  scaleInterval_d?: number | string | Decimal;
}

export interface ObservationCalculationInput {
  load: number | string | Decimal;
  indication: number | string | Decimal;
  subWeight_dL: number | string | Decimal;
  zeroDatum_E0?: number | string | Decimal;
  accuracyClass: string;
  e?: number | string | Decimal;
  partialRanges?: PartialRangeDef[];
  rulePackVersion?: string;
}

export interface ObservationCalculationOutput {
  load_L: Decimal;
  indication_I: Decimal;
  subWeight_dL: Decimal;
  calculated_P: Decimal;
  error_E: Decimal;
  zeroDatum_E0: Decimal;
  correctedError_Ec: Decimal;
  applicable_e: Decimal;
  applicable_mpe: Decimal;
  division_m: Decimal;
  isCompliant: boolean;
  mpeResult: MPEResult;
}

export class OimlMetrologyEngine {
  /**
   * 1. Multi-Interval Load Mapping (Clause 3.2 & 3.3)
   * Dynamically calculates verification scale interval e_i based on L where Max_{i-1} < L <= Max_i
   */
  public static resolveVerificationInterval(
    load: number | string | Decimal,
    partialRanges?: PartialRangeDef[] | null,
    fallbackE: number | string | Decimal = 1
  ): Decimal {
    const decLoad = new Decimal(load);

    if (!partialRanges || partialRanges.length === 0) {
      return new Decimal(fallbackE);
    }

    // Sort partial ranges ascending by maxCapacity
    const sorted = [...partialRanges].sort((a, b) =>
      new Decimal(a.maxCapacity).minus(new Decimal(b.maxCapacity)).toNumber()
    );

    for (let i = 0; i < sorted.length; i++) {
      const range = sorted[i];
      const maxCap = new Decimal(range.maxCapacity);
      if (decLoad.lte(maxCap)) {
        return new Decimal(range.verificationInterval_e);
      }
    }

    // If load exceeds highest partial range, return top range interval
    return new Decimal(sorted[sorted.length - 1].verificationInterval_e);
  }

  /**
   * 2. Turning-Point Method (Clause A.4.4.3)
   * Formulas:
   *   P  = I + 0.5 * e_i - delta_L
   *   E  = P - L
   *   Ec = E - E0
   */
  public static calculateTurningPoint(input: {
    load: number | string | Decimal;
    indication: number | string | Decimal;
    subWeight_dL: number | string | Decimal;
    e: number | string | Decimal;
    zeroError_E0?: number | string | Decimal;
    accuracyClass?: string;
    rulePackVersion?: string;
  }): TurningPointResult {
    const tpInput: TurningPointInput = {
      load: input.load,
      indication: input.indication,
      additionalLoad_dL: input.subWeight_dL,
      e: input.e,
      zeroError_E0: input.zeroError_E0 ?? 0,
      accuracyClass: input.accuracyClass ? normalizeAccuracyClass(input.accuracyClass) : undefined,
      rulePackVersion: input.rulePackVersion,
    };
    return coreCalculateTurningPoint(tpInput);
  }

  /**
   * 3. OIML Table 6 Maximum Permissible Error (MPE) Tier Resolver
   * Normalized division index: m = L / e_i
   * Statutory tolerances for Class I, II, III, IIII
   */
  public static resolveMpeTier(params: {
    accuracyClass: string;
    load: number | string | Decimal;
    e: number | string | Decimal;
    rulePackVersion?: string;
    allowExceedingMaxRange?: boolean;
  }): MPEResult {
    return coreCalculateMPE({
      accuracyClass: normalizeAccuracyClass(params.accuracyClass),
      load: params.load,
      e: params.e,
      rulePackVersion: params.rulePackVersion || 'R76-2006-v1',
      allowExceedingMaxRange: params.allowExceedingMaxRange ?? true,
    });
  }

  /**
   * Complete Observation Processor
   * Combines multi-interval mapping, turning-point calculation, and MPE verification
   */
  public static processObservation(input: ObservationCalculationInput): ObservationCalculationOutput {
    const decLoad = new Decimal(input.load);
    const decIndication = new Decimal(input.indication);
    const decSubWeight = new Decimal(input.subWeight_dL);
    const decE0 = new Decimal(input.zeroDatum_E0 ?? 0);

    // 1. Resolve applicable verification interval e_i
    const applicable_e = input.partialRanges && input.partialRanges.length > 0
      ? this.resolveVerificationInterval(decLoad, input.partialRanges, input.e || 1)
      : new Decimal(input.e || 1);

    // 2. Turning-Point Formula: P = I + 0.5 * e_i - delta_L
    const calculated_P = decIndication.plus(applicable_e.times(0.5)).minus(decSubWeight);

    // 3. Error of indication: E = P - L
    const error_E = calculated_P.minus(decLoad);

    // 4. Corrected error: Ec = E - E0
    const correctedError_Ec = error_E.minus(decE0);

    // 5. Normalized division index: m = L / e_i
    const division_m = decLoad.dividedBy(applicable_e);

    // 6. MPE Tier Resolution
    const mpeResult = this.resolveMpeTier({
      accuracyClass: input.accuracyClass,
      load: decLoad,
      e: applicable_e,
      rulePackVersion: input.rulePackVersion,
      allowExceedingMaxRange: true,
    });

    const isCompliant = correctedError_Ec.abs().lte(mpeResult.magnitude);

    return {
      load_L: decLoad,
      indication_I: decIndication,
      subWeight_dL: decSubWeight,
      calculated_P,
      error_E,
      zeroDatum_E0: decE0,
      correctedError_Ec,
      applicable_e,
      applicable_mpe: mpeResult.magnitude,
      division_m,
      isCompliant,
      mpeResult,
    };
  }

  /**
   * 4. Repeatability Validator (Clause A.4.10)
   * Enforces: P_max - P_min <= |MPE(L)| across series
   */
  public static validateRepeatability(params: RepeatabilityEvaluationParams): RepeatabilityEvaluationResult {
    return coreEvaluateRepeatability(params);
  }

  /**
   * 5. Creep Compliance (Clause A.4.11.1 & A.4.11.2)
   * Strictly enforces 30-minute timing:
   *   |P_30min - P_15min| <= 0.2e (or <= 0.5e for early termination)
   *   Zero return: |E_0_return| <= 0.5e
   */
  public static validateCreepCompliance(params: CreepEvaluationParams): CreepEvaluationResult {
    return coreEvaluateCreep(params);
  }

  /**
   * 6. 1/3 MPE Standard Mass Uncertainty Rule (Clause 3.7.1)
   * Invalidate test execution if reference standard uncertainty U > (1/3) * MPE(L)
   */
  public static validateStandardMassUncertainty(
    params: ReferenceStandardValidationParams
  ): ReferenceStandardValidationResult {
    return coreValidateReferenceStandard(params);
  }
}

// Named functional exports for seamless functional or object-oriented consumption
export const resolveVerificationInterval = OimlMetrologyEngine.resolveVerificationInterval.bind(OimlMetrologyEngine);
export const calculateTurningPoint = OimlMetrologyEngine.calculateTurningPoint.bind(OimlMetrologyEngine);
export const resolveMpeTier = OimlMetrologyEngine.resolveMpeTier.bind(OimlMetrologyEngine);
export const processObservation = OimlMetrologyEngine.processObservation.bind(OimlMetrologyEngine);
export const validateRepeatability = OimlMetrologyEngine.validateRepeatability.bind(OimlMetrologyEngine);
export const validateCreepCompliance = OimlMetrologyEngine.validateCreepCompliance.bind(OimlMetrologyEngine);
export const validateStandardMassUncertainty = OimlMetrologyEngine.validateStandardMassUncertainty.bind(OimlMetrologyEngine);
export default OimlMetrologyEngine;
