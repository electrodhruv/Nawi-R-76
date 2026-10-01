/**
 * Validation schemas for NAWI-R76 domain operations.
 *
 * Implements strict input validation using Zod.
 * Critical Rule: Observation submissions MUST ONLY contain raw observations
 * (L, I, delta_L). Derived metrological values (P, E, Ec, MPE, Pass/Fail)
 * submitted by the client are strictly stripped/forbidden.
 */

import { z } from 'zod';
import {
  AccuracyClass,
  RangeType,
  PowerSupplyType,
  ReceptorType,
  TareType,
  LoadDirection,
  StandardType,
  StandardWeightClass,
  ReviewStage,
  ReviewDecision,
} from '@prisma/client';

// ============================================================================
// Instrument Model Validations
// ============================================================================

export const PartialRangeSchema = z.object({
  rangeIndex: z.number().int().positive(),
  minCapacity_i: z.number().positive(),
  maxCapacity_i: z.number().positive(),
  verificationInterval_ei: z.number().positive(),
  scaleInterval_di: z.number().positive(),
  numberOfIntervals_ni: z.number().int().positive(),
}).refine((data) => data.minCapacity_i < data.maxCapacity_i, {
  message: 'Minimum capacity must be strictly less than maximum capacity',
});

export const CreateInstrumentSchema = z.object({
  manufacturerId: z.string().uuid(),
  modelName: z.string().min(1).max(100),
  tradeName: z.string().max(150).optional(),
  softwareVersion: z.string().max(50).optional(),
  serialNumberPattern: z.string().max(50).optional(),
  accuracyClass: z.nativeEnum(AccuracyClass),
  rangeType: z.nativeEnum(RangeType).default(RangeType.SINGLE),

  maxCapacity: z.number().positive(),
  minCapacity: z.number().positive(),
  verificationInterval_e: z.number().positive(),
  scaleInterval_d: z.number().positive(),
  numberOfIntervals_n: z.number().int().positive(),
  primaryUnit: z.string().min(1).max(10).default('kg'),

  specifiedTempMin: z.number().min(-50).max(100).optional(),
  specifiedTempMax: z.number().min(-50).max(100).optional(),
  powerSupplyType: z.nativeEnum(PowerSupplyType).default(PowerSupplyType.MAINS_AC),
  nominalVoltage: z.number().positive().optional(),
  batteryCutoffVoltage: z.number().positive().optional(),

  receptorType: z.nativeEnum(ReceptorType).default(ReceptorType.STANDARD_PAN),
  numberOfSupportPoints: z.number().int().positive().default(4),
  numberOfReceptorSections: z.number().int().positive().default(1),
  isBidirectionalTraffic: z.boolean().default(false),
  tareType: z.nativeEnum(TareType).default(TareType.SUBTRACTIVE),
  hasAutomaticLeveling: z.boolean().default(false),
  isElectronic: z.boolean().default(true),

  partialRanges: z.array(PartialRangeSchema).optional(),
}).refine((data) => data.minCapacity < data.maxCapacity, {
  message: 'minCapacity must be strictly less than maxCapacity',
  path: ['minCapacity'],
}).refine(
  (data) => {
    if (data.rangeType === RangeType.MULTI_INTERVAL || data.rangeType === RangeType.MULTI_RANGE) {
      return Array.isArray(data.partialRanges) && data.partialRanges.length >= 2;
    }
    return true;
  },
  {
    message: 'Multi-interval or multi-range instruments must define at least 2 partial ranges',
    path: ['partialRanges'],
  }
);

// ============================================================================
// Raw Observation Submission Schema (Server-Authoritative Contract)
// ============================================================================

export const RawObservationPointSchema = z.object({
  seriesIndex: z.number().int().positive().default(1),
  stepIndex: z.number().int().min(0),
  direction: z.nativeEnum(LoadDirection).default(LoadDirection.INCREASING),

  // RAW OBSERVATIONS ONLY
  nominalLoad_L: z.number().min(0, 'Load cannot be negative'),
  indicatedValue_I: z.number().min(0, 'Indication cannot be negative'),
  turningPointLoad_dL: z.number().min(0, 'Turning point small load cannot be negative'),

  isZeroCheck: z.boolean().default(false),
  remarks: z.string().max(500).optional(),
});

export const SubmitObservationsSchema = z.object({
  testRunId: z.string().uuid(),
  observations: z.array(RawObservationPointSchema).min(1, 'At least one observation point is required'),
  creepElapsedMinutes: z.number().min(0).optional(),
  isEarlyTerminationRequest: z.boolean().optional(),
});

// ============================================================================
// Evaluation Plan & Test Run Configuration
// ============================================================================

export const ConfigureTestRunSchema = z.object({
  testRunId: z.string().uuid(),
  isApplicable: z.boolean(),
  exclusionJustification: z.string().min(10, 'A detailed justification is required when excluding a test').optional(),
}).refine(
  (data) => data.isApplicable || (data.exclusionJustification && data.exclusionJustification.trim().length >= 10),
  {
    message: 'Exclusion of any OIML R 76 test strictly requires a recorded metrological justification (min 10 chars)',
    path: ['exclusionJustification'],
  }
);

// ============================================================================
// Reference Standard Validation Schema
// ============================================================================

export const CreateReferenceStandardSchema = z.object({
  serialNumber: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  standardType: z.nativeEnum(StandardType).default(StandardType.WEIGHT_SET),
  weightClass: z.nativeEnum(StandardWeightClass).default(StandardWeightClass.F1),
  nominalMass: z.number().min(0),
  conventionalMass: z.number().min(0),
  standardError: z.number().optional(),
  expandedUncertainty_U: z.number().positive().optional(),
  coverageFactor_k: z.number().positive().default(2.0),
  certificateNumber: z.string().min(1).max(100),
  calibratedBy: z.string().min(1).max(200),
  calibratedAt: z.coerce.date(),
  validUntil: z.coerce.date(),
}).refine((data) => data.calibratedAt < data.validUntil, {
  message: 'Calibration validUntil date must be after calibratedAt date',
  path: ['validUntil'],
});

// ============================================================================
// Review & Approval Workflow
// ============================================================================

export const SubmitReviewSchema = z.object({
  evaluationId: z.string().uuid(),
  stage: z.nativeEnum(ReviewStage),
  decision: z.nativeEnum(ReviewDecision),
  comments: z.string().min(5, 'Review comments are mandatory for traceability'),
  signatureHash: z.string().optional(),
});
