import Decimal from 'decimal.js';

/**
 * Standard OIML R 76 Accuracy Classes.
 */
export type AccuracyClass = 'CLASS_I' | 'CLASS_II' | 'CLASS_III' | 'CLASS_IIII';

/**
 * Normalizes user-supplied accuracy class strings to the canonical AccuracyClass.
 */
export function normalizeAccuracyClass(input: string): AccuracyClass {
  const normalized = input.trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (normalized === 'CLASS_I' || normalized === 'I') return 'CLASS_I';
  if (normalized === 'CLASS_II' || normalized === 'II') return 'CLASS_II';
  if (normalized === 'CLASS_III' || normalized === 'III') return 'CLASS_III';
  if (normalized === 'CLASS_IIII' || normalized === 'IIII' || normalized === 'CLASS_IV' || normalized === 'IV') {
    return 'CLASS_IIII';
  }
  throw new UnsupportedClassError(`Unsupported or invalid accuracy class: "${input}"`);
}

/**
 * Maximum Permissible Error (MPE) Tiers under OIML R 76-1 Table 6.
 */
export type MPETier = 'TIER_1' | 'TIER_2' | 'TIER_3';

/**
 * Canonical Versioned Rule Pack Identifiers.
 */
export type CanonicalRulePackVersion = 'R76-2006-v1';

/**
 * Public input contract for calculateMPE.
 */
export interface CalculateMPEParams {
  /** Accuracy class of the instrument or weighing range */
  accuracyClass: AccuracyClass | string;
  /** Test load applied (in mass units) */
  load: Decimal | number | string;
  /** Verification scale interval e (in identical mass units) */
  e: Decimal | number | string;
  /** Versioned rule pack identifier (default: 'R76-2006-v1') */
  rulePackVersion?: string;
  /**
   * If true, allows calculating MPE for loads exceeding the nominal maximum verification
   * interval count (n_max) for the class, without throwing LoadOutOfRangeError.
   * Default: false (strict OIML class boundary enforcement).
   */
  allowExceedingMaxRange?: boolean;
}

/**
 * Public authoritative result produced by calculateMPE.
 */
export interface MPEResult {
  /** Maximum permissible error magnitude in absolute mass units (|MPE| = mpeFactor * e) */
  magnitude: Decimal;
  /** Multiplier factor of e (0.5, 1.0, or 1.5) */
  factorInE: Decimal;
  /** Signed lower tolerance limit: -magnitude */
  lowerLimit: Decimal;
  /** Signed upper tolerance limit: +magnitude */
  upperLimit: Decimal;
  /** Applicable Table 6 tier ('TIER_1', 'TIER_2', or 'TIER_3') */
  tier: MPETier;
  /** Applied load expressed in verification scale intervals: m = load / e */
  loadInE: Decimal;
  /** The verification scale interval e used for evaluation */
  e: Decimal;
  /** The test load applied */
  load: Decimal;
  /** Canonical accuracy class */
  accuracyClass: AccuracyClass;
  /** Rule pack version used for calculation */
  rulePackVersion: string;
  /** Authoritative standard identifier (e.g. 'OIML R 76-1') */
  standard: string;
  /** Standard edition / version (e.g. '2006 (E)') */
  standardVersion: string;
  /** Clause reference in the standard (e.g. '3.5.1 Table 6') */
  clauseReference: string;
  /** Unique canonical rule identifier (e.g. 'RULE_R76_2006_TABLE6_MPE') */
  ruleId: string;
}

// ============================================================================
// Multi-Interval Partial Range Specification
// ============================================================================

export interface PartialWeighingRangeSpec {
  rangeIndex: number;
  minCapacity: Decimal | number | string;
  maxCapacity: Decimal | number | string;
  verificationInterval_e: Decimal | number | string;
  scaleInterval_d?: Decimal | number | string;
}

// ============================================================================
// Turning-Points & True Indication (Clause A.4.4.3)
// ============================================================================

export interface TurningPointInput {
  load: Decimal | number | string;
  indication: Decimal | number | string;
  additionalLoad_dL: Decimal | number | string;
  e: Decimal | number | string;
  zeroError_E0?: Decimal | number | string;
  accuracyClass?: AccuracyClass | string;
  rulePackVersion?: string;
}

export interface TurningPointResult {
  load: Decimal;
  indication: Decimal;
  additionalLoad_dL: Decimal;
  e: Decimal;
  calculated_P: Decimal;
  error_E: Decimal;
  zeroError_E0: Decimal;
  correctedError_Ec: Decimal;
  mpe?: MPEResult;
  isCompliant?: boolean;
}

// ============================================================================
// Repeatability (Clause A.4.10)
// ============================================================================

export interface RepeatabilityWeighingInput {
  weighingIndex: number;
  indication: Decimal | number | string;
  additionalLoad_dL: Decimal | number | string;
  zeroIndication?: Decimal | number | string;
  zeroAdditionalLoad_dL?: Decimal | number | string;
}

export interface RepeatabilitySeriesInput {
  seriesIndex: number;
  nominalLoad: Decimal | number | string;
  weighings: RepeatabilityWeighingInput[];
}

export interface RepeatabilityEvaluationParams {
  accuracyClass: AccuracyClass | string;
  maxCapacity: Decimal | number | string;
  e: Decimal | number | string;
  series: RepeatabilitySeriesInput[];
  rulePackVersion?: string;
}

export interface RepeatabilityPointResult {
  weighingIndex: number;
  calculated_P: Decimal;
  error_E: Decimal;
  zeroError_E0: Decimal;
  correctedError_Ec: Decimal;
}

export interface RepeatabilitySeriesResult {
  seriesIndex: number;
  nominalLoad: Decimal;
  weighingCount: number;
  requiredCount: number;
  points: RepeatabilityPointResult[];
  maxError: Decimal;
  minError: Decimal;
  repeatabilitySpan: Decimal;
  mpe: MPEResult;
  isCompliant: boolean;
}

export interface RepeatabilityEvaluationResult {
  seriesResults: RepeatabilitySeriesResult[];
  overallCompliant: boolean;
  accuracyClass: AccuracyClass;
  ruleId: string;
  clauseReference: string;
}

// ============================================================================
// Creep & Zero Return (Clause A.4.11)
// ============================================================================

export interface CreepObservationInput {
  timestamp: Date | string | number;
  elapsedMinutes: number;
  indication: Decimal | number | string;
  additionalLoad_dL: Decimal | number | string;
}

export interface CreepEvaluationParams {
  accuracyClass: AccuracyClass | string;
  maxCapacity: Decimal | number | string;
  appliedLoad: Decimal | number | string;
  e: Decimal | number | string;
  initialObservation: CreepObservationInput;
  observations: CreepObservationInput[];
  zeroReturnObservation?: CreepObservationInput;
  rulePackVersion?: string;
}

export interface CreepEvaluationResult {
  initialReading_P0: Decimal;
  evaluatedDurationMinutes: number;
  earlyTerminatedAt30Min: boolean;
  earlyTerminationQualified: boolean;
  delta30MinToInitial?: Decimal;
  delta30MinTo15Min?: Decimal;
  maxDriftFromInitial: Decimal;
  mpeAtMax: MPEResult;
  isCreepCompliant: boolean;
  zeroReturn?: {
    indication_P: Decimal;
    residualError: Decimal;
    isCompliant: boolean;
  };
  overallCompliant: boolean;
  clauseReference: string;
  ruleId: string;
}

// ============================================================================
// Reference Standard & Uncertainty (Clause 3.7.1)
// ============================================================================

export type StandardWeightClass =
  | 'E1'
  | 'E2'
  | 'F1'
  | 'F2'
  | 'M1'
  | 'M1_2'
  | 'M2'
  | 'M2_3'
  | 'M3'
  | 'NOT_APPLICABLE';

export interface ReferenceStandardValidationParams {
  standardSerialNumber: string;
  weightClass: StandardWeightClass;
  standardError?: Decimal | number | string;
  expandedUncertainty_U?: Decimal | number | string;
  coverageFactor_k?: number;
  validUntilDate: Date | string;
  testDate?: Date | string;
  appliedLoad: Decimal | number | string;
  mpeOfInstrumentAtLoad: Decimal | number | string | MPEResult;
}

export interface ReferenceStandardValidationResult {
  isCompliant: boolean;
  isExpired: boolean;
  daysUntilExpiration: number;
  standardError?: Decimal;
  expandedUncertainty_U?: Decimal;
  oneThirdMpeLimit: Decimal;
  criterionUsed: 'ERROR_LEQ_ONE_THIRD_MPE' | 'UNCERTAINTY_LEQ_ONE_THIRD_MPE';
  ratioToLimit: Decimal;
  violations: string[];
}

// ============================================================================
// Test Planner
// ============================================================================

export interface InstrumentGeometrySpec {
  numberOfSupportPoints: number;
  receptorType: 'STANDARD_PAN' | 'SPECIAL_TANK_HOPPER' | 'ROLLING_TRACK' | 'MOBILE_SCALE';
  numberOfReceptorSections?: number;
  isBidirectionalTraffic?: boolean;
}

export interface PlannedLoadPoint {
  stepIndex: number;
  load: Decimal;
  loadInE: Decimal;
  direction: 'INCREASING' | 'DECREASING' | 'FORWARD' | 'REVERSE' | 'STATIC';
  location?: string;
  temperature?: Decimal;
  targetMpeFactor: Decimal;
  description: string;
}

export interface TestLoadPlan {
  testCode: string;
  clauseReference: string;
  points: PlannedLoadPoint[];
  totalObservations: number;
  metadata: Record<string, unknown>;
}

// ============================================================================
// Typed Error Classes for Metrological Rigor
// ============================================================================

export class MetrologyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MetrologyError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InvalidInputError extends MetrologyError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidInputError';
  }
}

export class UnsupportedClassError extends MetrologyError {
  constructor(message: string) {
    super(message);
    this.name = 'UnsupportedClassError';
  }
}

export class UnsupportedRulePackError extends MetrologyError {
  constructor(message: string) {
    super(message);
    this.name = 'UnsupportedRulePackError';
  }
}

export class LoadOutOfRangeError extends MetrologyError {
  public readonly loadInE: Decimal;
  public readonly maxPermittedE: Decimal;
  public readonly accuracyClass: AccuracyClass;

  constructor(message: string, loadInE: Decimal, maxPermittedE: Decimal, accuracyClass: AccuracyClass) {
    super(message);
    this.name = 'LoadOutOfRangeError';
    this.loadInE = loadInE;
    this.maxPermittedE = maxPermittedE;
    this.accuracyClass = accuracyClass;
  }
}
