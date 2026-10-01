/**
 * NAWI-R76 Deterministic Metrology Core Module
 *
 * Implements pure mathematical metrology calculations under OIML R 76-1:2006.
 * Zero external dependencies outside decimal.js.
 */

// Types & Errors
export * from './types/metrology';

// Rules & Definitions
export * from './rules/rule-types';
export * from './rules/oiml-r76-2006';

// Engine APIs
export { calculateMPE } from './engine/mpe';

export {
  calculateTurningPoint,
  resolveVerificationIntervalForLoad,
} from './engine/turning-points';

export {
  evaluateRepeatability,
  getRequiredRepeatabilityCount,
  REPEATABILITY_CAPACITY_THRESHOLD_KG,
} from './engine/repeatability';

export { evaluateCreep } from './engine/creep';

export {
  validateReferenceStandard,
  isClassE2OrBetter,
} from './engine/uncertainty';

export {
  generateIntrinsicErrorLoadPlan,
  generateEccentricityLoadPlan,
  generateTemperatureTestSequence,
} from './engine/test-planner';
