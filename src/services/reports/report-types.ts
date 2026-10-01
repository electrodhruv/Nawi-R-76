/**
 * Types & Contracts for OIML R 76-2 Report Generation
 */

export interface ReportSummaryItem {
  itemNumber: string;
  clause: string;
  testTitle: string;
  isApplicable: boolean;
  status: 'Passed' | 'Failed' | 'Inconclusive' | 'Not Applicable' | 'Scheduled' | 'Not Executed';
  justification?: string | null;
}

export interface ReportObservationPoint {
  seriesIndex: number;
  stepIndex: number;
  direction: string;
  nominalLoad: string;
  indicatedValue: string;
  turningPoint_dL: string;
  calculated_P: string;
  error_E: string;
  zeroError_E0: string;
  correctedError_Ec: string;
  mpe: string;
  result: 'PASS' | 'FAIL';
  remarks?: string | null;
}

export interface ReportTestRun {
  testCode: string;
  clauseReference: string;
  title: string;
  status: string;
  exclusionJustification?: string | null;
  executedBy?: string | null;
  completedAt?: string | null;
  observations: ReportObservationPoint[];
}

export interface ReportReferenceStandard {
  serialNumber: string;
  name: string;
  weightClass: string;
  certificateNumber: string;
  calibratedBy: string;
  validUntil: string;
  uncertaintyOrError: string;
}

export interface ReportEvidenceItem {
  id: string;
  fileName: string;
  mimeType: string;
  serverHashSha256: string;
  status: string;
  testClause?: string | null;
  purpose?: string | null;
  captureMethod?: string | null;
  description?: string | null;
  ocrCandidate?: string | null;
  consistencyStatus?: string | null;
  capturedAt?: string | null;
  verifiedBy?: string | null;
}

export interface ReportPayload {
  evaluationNumber: string;
  revisionNumber: number;
  reportIssueDate: string;
  standard: string;
  standardVersion: string;
  rulePackVersion: string;

  // Authoritative Overall Evaluation Result (Section 11)
  overallResult: 'COMPLIANT' | 'NON_COMPLIANT' | 'NOT_DETERMINED';
  isFinalized?: boolean;
  finalizedAt?: string;
  finalizedBy?: string;

  // Executive Test Counters (Section 7)
  testExecutionSummary?: {
    totalApplicable: number;
    completed: number;
    passed: number;
    failed: number;
    notApplicable: number;
    pending: number;
    retestRequired: number;
  };

  // Laboratory & Personnel
  laboratoryName: string;
  leadMetrologistName: string;
  leadMetrologistAccreditation?: string | null;
  technicalReviewerName?: string | null;
  approvingSignatoryName?: string | null;

  // Applicant & Manufacturer
  applicantName: string;
  applicantAddress: string;
  manufacturerName: string;
  manufacturerCountry: string;
  manufacturerAddress: string;

  // Instrument
  modelName: string;
  tradeName?: string | null;
  softwareVersion?: string | null;
  serialNumber?: string | null;
  instrumentType?: string | null;
  accuracyClass: string;
  rangeType: string;
  maxCapacity: string;
  minCapacity: string;
  verificationInterval_e: string;
  scaleInterval_d: string;
  numberOfIntervals_n: number;
  primaryUnit: string;
  temperatureLimits: string;
  powerSupply: string;
  tareType: string;

  // Partial Ranges (if multi-interval / multi-range)
  partialRanges?: Array<{
    rangeIndex: number;
    maxCapacity: string;
    minCapacity: string;
    verificationInterval_e: string;
    numberOfIntervals_n: number;
  }>;

  // Summary of Results (Summary Items 1 - 22)
  summaryMatrix: ReportSummaryItem[];

  // Detailed Test Records
  testRuns: ReportTestRun[];

  // Traceability & Evidence
  standardsUsed: ReportReferenceStandard[];
  evidenceFiles: ReportEvidenceItem[];

  // Digital Verification & Authenticity Attestation
  verificationToken?: string;
  verificationUrl?: string;
  verificationQrDataUrl?: string;
  verificationDigest?: string;
  signatureAlgorithm?: string;
}
