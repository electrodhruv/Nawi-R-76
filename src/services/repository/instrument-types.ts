/**
 * Instrument Repository & Specimen Types for NAWI-R76
 *
 * Implements clean architectural separation between:
 * - InstrumentModel: Shared pattern / design characteristics
 * - InstrumentSpecimen: Physical machine with serial number, intake date,
 *   configuration revisions, identity evidence, and evaluation history.
 */

export type AccuracyClassType = 'CLASS_I' | 'CLASS_II' | 'CLASS_III' | 'CLASS_IIII';
export type RangeType = 'SINGLE' | 'MULTI_INTERVAL' | 'MULTI_RANGE';
export type TareType = 'SUBTRACTIVE' | 'ADDITIVE';
export type ReceptorType = 'STANDARD_PAN' | 'ROLLING_TRACK' | 'MOBILE_SCALE';
export type InstrumentCategory =
  | 'BENCH'
  | 'PLATFORM'
  | 'WEIGHBRIDGE'
  | 'RETAIL'
  | 'CRANE'
  | 'LABORATORY';

export type SpecimenStatus =
  | 'AVAILABLE'
  | 'IN_EVALUATION'
  | 'PENDING_REVIEW'
  | 'COMPLETED'
  | 'REPORT_ISSUED'
  | 'RETIRED';

export interface ModelSupportingDocument {
  id: string;
  title: string;
  documentType: 'MANUAL' | 'TECHNICAL_SPEC' | 'DRAWING' | 'PREVIOUS_CERTIFICATE' | 'OTHER';
  fileName: string;
  version?: string;
  source?: string;
  uploadDate: string;
  approvalStatus?: 'APPROVED' | 'PENDING' | 'REJECTED';
  isApprovedForGuidance: boolean;
}

export interface InstrumentModel {
  modelId: string;
  modelName: string;
  tradeName: string;
  manufacturer: string;
  instrumentCategory: InstrumentCategory;
  accuracyClass: AccuracyClassType;
  maxCapacity: number;
  minCapacity: number;
  verificationInterval_e: number;
  scaleInterval_d: number;
  numberOfIntervals_n: number;
  primaryUnit: string;
  rangeType: RangeType;
  tareType: TareType;
  powerSupply: string;
  temperatureRange: string;
  receptorType: ReceptorType;
  hasAutomaticLeveling?: boolean;
  supportingDocuments: ModelSupportingDocument[];
  createdAt: string;
}

export interface SpecimenConfigurationRevision {
  revisionNumber: number;
  effectiveDate: string;
  softwareVersion: string;
  firmwareVersion?: string;
  specialConfigurationNotes?: string;
  changeReason?: string;
  updatedBy: string;
  timestamp?: string;
  actor?: string;
}

export interface SpecimenIdentityEvidence {
  purpose?: 'IDENTITY';
  serverHashSha256?: string;
  completeInstrumentPhotoUrl?: string;
  completeInstrumentPhotoHash?: string;
  nameplatePhotoUrl?: string;
  nameplatePhotoHash?: string;
  scannedOcrSerial?: string;
  scannedOcrModel?: string;
  scannedOcrManufacturer?: string;
  scannedOcrMax?: string;
  scannedOcrMin?: string;
  scannedOcrE?: string;
  isConsistent?: boolean;
  inconsistencyFlags?: string[];
  capturedAt: string;
  uploader: string;
}

export interface SpecimenEvaluationSummary {
  evaluationNumber: string;
  startDate: string;
  completedDate?: string;
  status: 'IN_PROGRESS' | 'PENDING_REVIEW' | 'COMPLETED' | 'REVOKED';
  finalVerdict?: 'COMPLIANT' | 'NON_COMPLIANT';
  reportNumber?: string;
  reportRevision?: number;
  verificationToken?: string;
  leadMetrologist: string;
  configurationRevisionUsed: number;
}

export interface SpecimenServiceLog {
  id: string;
  date: string;
  type: 'INTAKE' | 'CONFIG_UPDATE' | 'CALIBRATION_CHECK' | 'MAINTENANCE';
  description: string;
  technician: string;
}

export interface InstrumentSpecimen {
  specimenId: string;
  modelId: string;
  serialNumber: string;
  intakeDate: string;
  status: SpecimenStatus;
  currentEvaluationNumber?: string;
  activeConfigurationRevision: number;
  configurationRevisions: SpecimenConfigurationRevision[];
  identityEvidence: SpecimenIdentityEvidence;
  evaluationHistory: SpecimenEvaluationSummary[];
  serviceHistory: SpecimenServiceLog[];
  hasFailedSample?: boolean;
}

export interface RegisterSpecimenInput {
  // Identity
  serialNumber: string;
  manufacturer: string;
  modelName: string;
  tradeName?: string;
  instrumentCategory: InstrumentCategory;
  scannedNameplateSerial?: string;

  // Metrological
  accuracyClass: AccuracyClassType;
  maxCapacity: number;
  minCapacity: number;
  verificationInterval_e: number;
  scaleInterval_d: number;
  primaryUnit: string;
  rangeType: RangeType;
  tareType: TareType;

  // Configuration
  powerSupply: string;
  temperatureRange: string;
  receptorType: ReceptorType;
  softwareVersion: string;
  firmwareVersion?: string;
  hasAutomaticLeveling?: boolean;
  specialConfigurationNotes?: string;

  // Documents
  manualTitle?: string;
  supportingDocuments?: ModelSupportingDocument[];

  // Identity Evidence
  completeInstrumentPhotoUrl?: string;
  nameplatePhotoUrl?: string;
  scannedOcrSerial?: string;
  scannedOcrModel?: string;
  scannedOcrManufacturer?: string;
  scannedOcrMax?: string;
  scannedOcrMin?: string;
  scannedOcrE?: string;
  isIdentityConsistent?: boolean;
  identityInconsistencyNotes?: string;

  // Intake metadata
  intakeOfficer: string;
}
