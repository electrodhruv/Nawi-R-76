/**
 * Generic Test Record Engine Types for NAWI-R76
 *
 * Implements declarative, strongly-typed schemas for OIML R 76 type evaluations:
 * TestDefinition, ProcedureDefinition, ObservationSchema, ValidationRules,
 * CalculationRules, ComplianceRules, EvidencePolicy, and TestRunRecord.
 */

import { AccuracyClass } from '@/core/types/metrology';

export type TestCategory =
  | 'METROLOGICAL'
  | 'ENVIRONMENTAL'
  | 'ELECTRICAL'
  | 'EXAMINATION'
  | 'FUNCTIONAL';

export type TestPatternType =
  | 'PATTERN_A_MEASUREMENT_TABLE'
  | 'PATTERN_B_CHECKLIST'
  | 'PATTERN_C_TIME_SERIES'
  | 'PATTERN_D_ENVIRONMENTAL_STRESS';

export type ObservationFieldType =
  | 'NUMBER'
  | 'STRING'
  | 'SELECT'
  | 'TIME'
  | 'BOOLEAN'
  | 'CHECKBOX';

export interface ObservationField {
  key: string;
  label: string;
  type: ObservationFieldType;
  unitKey?: 'primaryUnit' | 'e' | 'd' | 'percent' | 'celsius' | 'rh' | 'volt' | 'hpa' | 'minute' | 'day';
  required: boolean;
  readOnly?: boolean;
  placeholder?: string;
  helpText?: string;
  options?: { label: string; value: string }[];
  min?: number;
  max?: number;
  step?: number;
}

export type ObservationLayout =
  | 'TABLE'
  | 'CHECKLIST'
  | 'TIME_SERIES'
  | 'DUAL_SERIES'
  | 'LOCATION_GRID'
  | 'INCREMENTAL_RUNS'
  | 'DISCRIMINATION_POINTS'
  | 'STRESS_SEQUENCE'
  | 'ENDURANCE_CYCLE';

export interface ObservationSchema {
  layout: ObservationLayout;
  fields: ObservationField[];
  minObservations?: number;
  maxObservations?: number;
  allowAddRows?: boolean;
  allowDeleteRows?: boolean;
  initialRowGenerator?: string;
  secondaryFields?: ObservationField[];
}

export type ValidationRuleType =
  | 'REQUIRED_FIELDS'
  | 'OBSERVATION_COUNT'
  | 'LOAD_WITHIN_CAPACITY'
  | 'EQUIPMENT_CALIBRATION_VALID'
  | 'EVIDENCE_ATTACHED'
  | 'JUSTIFICATION_FOR_NA'
  | 'NUMERICAL_RANGE'
  | 'NO_FAILING_POINTS'
  | 'EVIDENCE_CONSISTENCY';

export interface ValidationRule {
  id: string;
  ruleType: ValidationRuleType;
  fieldKey?: string;
  description: string;
  severity: 'BLOCKING' | 'WARNING';
  min?: number;
  max?: number;
}

export interface CalculationRuleReference {
  ruleId: string;
  parameters?: Record<string, unknown>;
}

export interface ComplianceRuleReference {
  ruleId: string;
  clause: string;
  mpeSource?: 'TABLE_6' | 'FIXED_FACTOR_E' | 'ABSOLUTE' | 'FUNCTIONAL';
  factorOfE?: number;
  maxAllowableSpanFactorOfE?: number;
  description: string;
}

export type EvidenceRequirementLevel =
  | 'REQUIRED'
  | 'RECOMMENDED'
  | 'OPTIONAL'
  | 'NOT_REQUIRED';

export type EvidencePurpose =
  | 'IDENTITY'
  | 'SETUP'
  | 'LOAD_POSITION'
  | 'ENVIRONMENT'
  | 'EQUIPMENT'
  | 'FUNCTION'
  | 'RESULT_SUPPORT'
  | 'RESULT'
  | 'FUNCTIONAL_BEHAVIOR'
  | 'OTHER';

export type EvidenceStatusCode =
  | 'UPLOADED'
  | 'INTEGRITY_VERIFIED'
  | 'CONSISTENT'
  | 'DISCREPANCY'
  | 'MANUAL_REVIEW'
  | 'VERIFIED_BY_REVIEWER';

export interface EvidencePolicy {
  level: EvidenceRequirementLevel;
  required: boolean;
  purposes: EvidencePurpose[];
  minItems: number;
  recommendedTypes: string[];
  explanation: string;
}

export interface ReportMapping {
  reportItemNumber: string;
  reportItemTitle: string;
  formNumber?: string;
  isTopLevelReportItem: boolean;
  parentReportItemNumber?: string;
  parentReportItemTitle?: string;
}

export interface CompletionRules {
  minObservations: number;
  maxObservations?: number;
  requiredFields?: string[];
  requiredDirections?: ('ASCENDING' | 'DESCENDING' | 'INC' | 'DEC')[];
  requiresZeroReturnCheck?: boolean;
  requiresReturnToZero?: boolean;
  minPointsPerDecade?: number;
  requiresAllLoadsWithinCapacity?: boolean;
  specificCompletionCheck?: string;
}

export interface ApplicabilityRuleDefinition {
  applicableClasses: AccuracyClass[];
  requiresReceptorType?: string[];
  excludedReceptorTypes?: string[];
  requiresScaleType?: ('NON_SELF_INDICATING' | 'SELF_INDICATING' | 'ELECTRONIC_SELF_INDICATING' | 'MECHANICAL')[];
  requiresPowerSupply?: ('AC_MAINS' | 'BATTERY_INTERNAL' | 'BATTERY_VEHICLE' | 'EXTERNAL_AC_DC')[];
  requiresTiltingCapability?: boolean;
  isExemptible?: boolean;
  exemptionRuleDescription?: string;
  exemptionReasonCode?: StructuredReasonCode;
}

export type ValidationRules = ValidationRule[];
export type CalculationReference = CalculationRuleReference;
export type ComplianceReference = ComplianceRuleReference;

export interface ProcedureDefinition {
  procedureVersion: string;
  pattern: TestPatternType;
  summary: string;
  whatIsBeingChecked: string;
  setupInstructions: string[];
  requiredInputs?: string[];
  requiredObservations?: string[];
  observationSchema: ObservationSchema;
  validationRules: ValidationRule[];
  calculationRule: CalculationRuleReference;
  complianceRule: ComplianceRuleReference;
  evidencePolicy: EvidencePolicy;
  completionRules?: CompletionRules;
}

export interface TestDefinition {
  id?: string;
  code: string;
  name: string;
  clause: string;
  standard: 'OIML R 76-1:2006' | 'OIML R 76-2:2007';
  category: TestCategory;
  pattern: TestPatternType;
  purpose: string;
  applicableClasses: AccuracyClass[];
  applicability?: ApplicabilityRuleDefinition;
  applicabilityDefinition?: ApplicabilityRuleDefinition;
  isExemptible?: boolean;
  exemptionRuleDescription?: string;
  completionRules?: CompletionRules;
  reportMapping: ReportMapping;
  procedureDefinition: ProcedureDefinition;
}

export interface TestEvidenceItem {
  id: string;
  evaluationId?: string;
  testRunId?: string;
  observationPointId?: string;
  specimenId?: string;
  fileName: string;
  fileSizeBytes?: number;
  mimeType: string;
  dataUrl?: string;
  sha256Hash?: string;
  serverHashSha256?: string;
  clientPreliminaryHash?: string;
  captureMethod?: 'IN_APP_CAPTURE' | 'GALLERY_UPLOAD';
  timestamp: string;
  capturedAt?: string;
  uploader?: string;
  user?: string;
  sessionId?: string;
  description: string;
  category?: 'SETUP_PHOTO' | 'NAMEPLATE' | 'SEALING' | 'OBSERVATION' | 'DOCUMENT';
  purpose?: EvidencePurpose;
  status?: EvidenceStatusCode;
  verifiedByMetrologist?: boolean;
  ocrExtractedValue?: string | number;
  ocrConfidence?: number;
  consistencyStatus?: 'CONSISTENT' | 'DISCREPANCY' | 'PENDING' | 'NOT_APPLICABLE' | 'MANUAL_REVIEW';
  isSuperseded?: boolean;
  supersededById?: string;
  supersededReason?: string;
  dismissalReason?: string;
  dismissedBy?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface EquipmentAssigned {
  id: string;
  name: string;
  serialNumber: string;
  certificateNumber: string;
  calibrationDate: string;
  calibrationExpiry: string;
  isCalibrated: boolean;
}

export interface EnvironmentalSnapshot {
  temperatureC: number;
  humidityPercent: number;
  pressureHpa: number;
  recordedAt: string;
}

export type StructuredReasonCode =
  | 'REQUIRED_OBSERVATION_MISSING'
  | 'INVALID_VALUE'
  | 'TEST_CONDITION_NOT_ACHIEVED'
  | 'STABILIZATION_NOT_ACHIEVED'
  | 'EQUIPMENT_CALIBRATION_INVALID'
  | 'INCORRECT_TEST_SEQUENCE'
  | 'INSTRUMENT_FAULT'
  | 'EVIDENCE_MISSING'
  | 'EVIDENCE_DISCREPANCY'
  | 'NOT_APPLICABLE_CONFIGURATION'
  | 'NOT_APPLICABLE_CLASS'
  | 'OTHER';

export interface StructuredRemark {
  id: string;
  reasonCode: StructuredReasonCode;
  description: string;
  additionalNote?: string;
  timestamp: string;
  actor: string;
}

export interface ObservationCorrection {
  id: string;
  rowIndex: number;
  fieldKey: string;
  originalValue: unknown;
  newValue: unknown;
  reason: string;
  actor: string;
  timestamp: string;
}

export interface RetestEvent {
  id: string;
  requestedAt: string;
  requestedBy: string;
  reason: string;
  previousStatus: TestStatusCode;
  previousSummary: string;
}

export interface EvidenceDiscrepancyItem {
  id: string;
  evidenceId: string;
  fieldKey: string;
  recordedValue: string | number;
  ocrExtractedValue: string | number;
  ocrValue?: number;
  status: 'DISCREPANCY_FLAGGED' | 'MANUAL_REVIEW_CONFIRMED' | 'RESOLVED_BY_RETEST';
  notes?: string;
  flaggedAt: string;
}

export interface InputValidationCheck {
  id: string;
  fieldKey: string;
  rowIndex?: number;
  value: unknown;
  message: string;
}

export interface ProcedureValidationCheck {
  id: string;
  ruleId?: string;
  condition: string;
  message: string;
  severity: 'BLOCKING' | 'WARNING';
}

export interface ValidationEvaluationResult {
  canComplete: boolean;
  blockingCount: number;
  warningCount: number;
  userSummary: string;
  inputIssues: InputValidationCheck[];
  procedureIssues: ProcedureValidationCheck[];
  evidenceDiscrepancies: EvidenceDiscrepancyItem[];
  messages: {
    id: string;
    message: string;
    severity: 'BLOCKING' | 'WARNING';
  }[];
}

export interface TestRunRecord {
  id: string;
  evaluationId: string;
  testCode: string;
  name: string;
  clause: string;
  purpose: string;
  instruction: string;
  pattern: TestPatternType;
  testDefinition: TestDefinition;
  procedureVersion: string;
  operator: {
    fullName: string;
    role: string;
    email?: string;
  };
  startTime: string;
  endTime?: string;
  status: TestStatusCode;
  isApplicable: boolean;
  exclusionJustification?: string | null;
  equipmentUsed: EquipmentAssigned[];
  environmentalSnapshot: EnvironmentalSnapshot;
  rawObservations: Record<string, unknown>[];
  calculatedValues: Record<string, unknown>;
  complianceResult: {
    verdict: 'PASS' | 'FAIL' | 'INCOMPLETE' | 'NOT_APPLICABLE' | 'INCONCLUSIVE';
    summaryStatement: string;
    failedPointsCount: number;
    passedPointsCount: number;
    trace?: Record<string, unknown>;
  };
  structuredRemarks: StructuredRemark[];
  remarks: string;
  evidenceReferences: TestEvidenceItem[];
  evidence: TestEvidenceItem[];
  reviewState: 'UNREVIEWED' | 'ACCEPTED' | 'REJECTED';
  validationMessages: {
    id: string;
    message: string;
    severity: 'BLOCKING' | 'WARNING';
  }[];
  inputValidationIssues?: InputValidationCheck[];
  procedureValidationIssues?: ProcedureValidationCheck[];
  evidenceDiscrepancies?: EvidenceDiscrepancyItem[];
  correctionsHistory?: ObservationCorrection[];
  retestHistory?: RetestEvent[];
  maxCapacity?: number;
  data?: Record<string, unknown>;
}

export type TestStatusCode =
  | 'NOT_TESTED'
  | 'IN_PROGRESS'
  | 'PASS'
  | 'FAIL'
  | 'INCOMPLETE'
  | 'INCONCLUSIVE'
  | 'NOT_APPLICABLE'
  | 'RETEST_REQUIRED';

export interface CommonEvaluationContext {
  evaluationNumber: string;
  laboratoryName: string;
  operatorName: string;
  operatorRole: string;
  standardVersion: string;
  instrument: {
    id?: string;
    specimenId?: string;
    configurationRevision?: number;
    modelName: string;
    serialNumber: string;
    manufacturer: string;
    accuracyClass: AccuracyClass;
    maxCapacity: number;
    minCapacity: number;
    verificationInterval_e: number;
    scaleInterval_d: number;
    numberOfIntervals_n: number;
    primaryUnit: string;
    rangeType: string;
    tareType: string;
    powerSupply: string;
    temperatureRange: string;
    receptorType: string;
    softwareVersion: string;
    hasFailedSample?: boolean;
    scaleType?: 'ELECTRONIC_SELF_INDICATING' | 'NON_SELF_INDICATING' | 'MECHANICAL';
  };
  environmentalSnapshot?: EnvironmentalSnapshot;
  equipmentUsed?: EquipmentAssigned[];
}
