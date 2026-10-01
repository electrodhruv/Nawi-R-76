/**
 * Types & Data Contracts for NAWI-R76 Digital QR Report Verification
 *
 * Implements authoritative digital verification for OIML R 76-2 laboratory test reports.
 */

export type ReportVerificationStatus =
  | 'VALID'
  | 'REVOKED'
  | 'SUPERSEDED'
  | 'NOT_FOUND'
  | 'SIGNATURE_INVALID';

export interface CanonicalInstrumentPayload {
  serialNumber: string;
  model: string;
  manufacturer: string;
  accuracyClass: string;
  maxCapacity: string;
  minCapacity: string;
  verificationInterval_e: string;
  scaleInterval_d?: string;
  numberOfIntervals_n?: number;
  primaryUnit: string;
}

export interface CanonicalReportPayload {
  reportNumber: string;
  revision: number;
  evaluationId: string;
  instrument: CanonicalInstrumentPayload;
  standard: string;
  standardVersion: string;
  rulePackVersion: string;
  finalizedResult: 'COMPLIANT' | 'NON_COMPLIANT';
  issueTimestamp: string;
  canonicalPayloadVersion: string;
  pdfSha256?: string;
  signingKeyId?: string;
}

export interface CryptographicProof {
  digestSha256: string;
  digitalSignature: string;
  signatureAlgorithm: string;
  publicKeyFingerprint: string;
  issuedTimestamp: string;
}

export interface ReportVerificationRecord {
  verificationId: string;
  verificationToken: string;
  reportId: string;
  evaluationId: string;
  reportRevision: number;
  canonicalPayloadVersion: string;
  canonicalPayloadJson: string;
  cryptographicProof: CryptographicProof;
  pdfSha256Digest?: string;
  status: ReportVerificationStatus;
  issuedTimestamp: string;
  revokedAt?: string;
  revocationReason?: string;
  supersededByRevision?: number;
  supersededAt?: string;
  verificationUrl: string;
  publicMetadata: SafePublicReportMetadata;
}

export interface SafePublicReportMetadata {
  reportNumber: string;
  revision: number;
  instrumentModel: string;
  serialNumber: string;
  manufacturer: string;
  accuracyClass: string;
  evaluationType: string;
  standard: string;
  rulePack: string;
  finalizedResult: 'COMPLIANT' | 'NON_COMPLIANT';
  issueDate: string;
  laboratoryName: string;
  pdfSha256Digest?: string;
}

export interface PublicVerificationResult {
  status: ReportVerificationStatus;
  statusMessage: string;
  isValid: boolean;
  publicMetadata?: SafePublicReportMetadata;
  cryptographicProof?: {
    signatureAlgorithm: string;
    publicKeyFingerprint: string;
    digestSha256: string;
    issuedTimestamp: string;
  };
  pdfSha256Digest?: string;
  revocationInfo?: {
    revokedAt: string;
    reason: string;
  };
  supersededInfo?: {
    supersededByRevision: number;
    supersededAt?: string;
  };
  verifiedAt: string;
}

export type PdfVerificationOutcome =
  | 'EXACT_MATCH'
  | 'MISMATCH'
  | 'RECORD_NOT_FOUND'
  | 'NO_HASH_STORED';

export interface PdfVerificationResult {
  outcome: PdfVerificationOutcome;
  isExactMatch: boolean;
  computedSha256: string;
  expectedSha256?: string;
  message: string;
  fileName?: string;
  fileSizeBytes?: number;
  reportNumber?: string;
  verifiedAt: string;
}
