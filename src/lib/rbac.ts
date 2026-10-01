/**
 * Role-Based Access Control (RBAC) System for NAWI-R76
 *
 * Implements strict ISO/IEC 17025 and Legal Metrology Act role separation:
 * 1. TESTING_OFFICER: Operational test data entry, DAQ execution, photo capture.
 * 2. TECHNICAL_REVIEWER: Peer calculation review, discrepancy inspection, attestation.
 * 3. LEAD_METROLOGIST: Lead evaluation authority, finalization, digital signing.
 * 4. LABORATORY_DIRECTOR: Statutory type-approval authorization, revocation, supersession.
 * 5. AUDITOR_INSPECTOR: Read-only compliance auditor, QR code verification, audit ledger access.
 */

export type UserRole =
  | 'LEAD_METROLOGIST'
  | 'TESTING_OFFICER'
  | 'TECHNICAL_REVIEWER'
  | 'LABORATORY_DIRECTOR'
  | 'AUDITOR_INSPECTOR';

export interface UserProfile {
  id: string;
  fullName: string;
  role: UserRole;
  roleTitle: string;
  department: string;
  email: string;
  password?: string;
  accreditationId: string;
  avatarInitials: string;
  statutoryClause: string;
  dutiesSummary: string;
  allowedViews: string[];
  badgeColor: {
    bg: string;
    text: string;
    border: string;
  };
  permissions: {
    canEditObservations: boolean;
    canRunDaq: boolean;
    canUploadEvidence: boolean;
    canReviewFindings: boolean;
    canResolveDiscrepancy: boolean;
    canFinalizeEvaluation: boolean;
    canApplyDigitalSignature: boolean;
    canManageStandards: boolean;
    canViewAuditTrail: boolean;
    canConfigureOimlRules: boolean;
    canIntakeInstruments: boolean;
  };
}

export const PRESET_USER_PROFILES: Record<UserRole, UserProfile> = {
  LEAD_METROLOGIST: {
    id: 'usr-lead-01',
    fullName: 'Dr. A. Sharma',
    role: 'LEAD_METROLOGIST',
    roleTitle: 'Lead Metrologist & Signatory Authority',
    department: 'Regional Reference Standard Laboratory, Ahmedabad',
    email: 'sharma.a@metrology.gov.in',
    password: 'lead123',
    accreditationId: 'RRSL-MET-2024-88',
    avatarInitials: 'AS',
    statutoryClause: 'Legal Metrology Act, 2009 Sec 7 & ISO/IEC 17025 §7.8',
    dutiesSummary: 'Statutory type approval, OIML R 76 clause verification, digital signature authorization & certificate issuance',
    allowedViews: ['home', 'evaluations', 'standards', 'issues', 'oiml-revisions', 'architecture', 'evidence', 'audit'],
    badgeColor: {
      bg: 'bg-blue-50',
      text: 'text-blue-800',
      border: 'border-blue-300',
    },
    permissions: {
      canEditObservations: true,
      canRunDaq: true,
      canUploadEvidence: true,
      canReviewFindings: true,
      canResolveDiscrepancy: true,
      canFinalizeEvaluation: true,
      canApplyDigitalSignature: true,
      canManageStandards: true,
      canViewAuditTrail: true,
      canConfigureOimlRules: true,
      canIntakeInstruments: true,
    },
  },
  TESTING_OFFICER: {
    id: 'usr-test-02',
    fullName: 'Amit Verma',
    role: 'TESTING_OFFICER',
    roleTitle: 'Metrological Testing Officer',
    department: 'Testing & Calibration Division, RRSL',
    email: 'verma.amit@metrology.gov.in',
    password: 'officer123',
    accreditationId: 'RRSL-TECH-2023-14',
    avatarInitials: 'AV',
    statutoryClause: 'ISO/IEC 17025 §6.2 Testing & Data Acquisition',
    dutiesSummary: 'Instrument intake, physical inspection, turning point load measurement, environmental DAQ & photo evidence capture',
    allowedViews: ['home', 'evaluations', 'evidence', 'standards'],
    badgeColor: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-300',
    },
    permissions: {
      canEditObservations: true,
      canRunDaq: true,
      canUploadEvidence: true,
      canReviewFindings: false,
      canResolveDiscrepancy: false,
      canFinalizeEvaluation: false,
      canApplyDigitalSignature: false,
      canManageStandards: false,
      canViewAuditTrail: false,
      canConfigureOimlRules: false,
      canIntakeInstruments: true,
    },
  },
  TECHNICAL_REVIEWER: {
    id: 'usr-rev-03',
    fullName: 'M. Verma',
    role: 'TECHNICAL_REVIEWER',
    roleTitle: 'Senior Metrological Reviewer',
    department: 'Quality Assurance & Pattern Audit, RRSL',
    email: 'verma.m@metrology.gov.in',
    password: 'review123',
    accreditationId: 'RRSL-REV-2022-09',
    avatarInitials: 'MV',
    statutoryClause: 'ISO/IEC 17025 §7.7 Quality Control & Independent Audit',
    dutiesSummary: 'Independent calculation verification, MPE threshold checking, uncertainty budget audit & discrepancy logging',
    allowedViews: ['home', 'evaluations', 'issues', 'evidence', 'standards'],
    badgeColor: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-800',
      border: 'border-indigo-300',
    },
    permissions: {
      canEditObservations: false,
      canRunDaq: false,
      canUploadEvidence: false,
      canReviewFindings: true,
      canResolveDiscrepancy: true,
      canFinalizeEvaluation: false,
      canApplyDigitalSignature: false,
      canManageStandards: true,
      canViewAuditTrail: true,
      canConfigureOimlRules: false,
      canIntakeInstruments: false,
    },
  },
  LABORATORY_DIRECTOR: {
    id: 'usr-dir-04',
    fullName: 'Dr. K. Patel',
    role: 'LABORATORY_DIRECTOR',
    roleTitle: 'Director of Legal Metrology',
    department: 'National Legal Metrology Directorate, New Delhi',
    email: 'director@metrology.gov.in',
    password: 'director123',
    accreditationId: 'NMI-DIR-2020-01',
    avatarInitials: 'KP',
    statutoryClause: 'National Metrology Directorate & Gazette Authority',
    dutiesSummary: 'Executive laboratory oversight, gazette approval numbers, national throughput analytics & revocation enforcement',
    allowedViews: ['home', 'evaluations', 'audit', 'standards', 'oiml-revisions', 'architecture'],
    badgeColor: {
      bg: 'bg-purple-50',
      text: 'text-purple-800',
      border: 'border-purple-300',
    },
    permissions: {
      canEditObservations: true,
      canRunDaq: true,
      canUploadEvidence: true,
      canReviewFindings: true,
      canResolveDiscrepancy: true,
      canFinalizeEvaluation: true,
      canApplyDigitalSignature: true,
      canManageStandards: true,
      canViewAuditTrail: true,
      canConfigureOimlRules: true,
      canIntakeInstruments: true,
    },
  },
  AUDITOR_INSPECTOR: {
    id: 'usr-aud-05',
    fullName: 'S. K. Rao',
    role: 'AUDITOR_INSPECTOR',
    roleTitle: 'Statutory Metrology Inspector / Auditor',
    department: 'Central Legal Metrology Inspection Squad',
    email: 'rao.sk@consumer.gov.in',
    password: 'audit123',
    accreditationId: 'LM-INSP-2021-52',
    avatarInitials: 'SR',
    statutoryClause: 'Legal Metrology Act Sec 15 & ISO/IEC 17025 §8.8 Internal Audits',
    dutiesSummary: 'Forensic inspection, cryptographic SHA-256 chain verification, tamper audit log examination & certificate QR scanning',
    allowedViews: ['home', 'audit', 'evidence', 'evaluations'],
    badgeColor: {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-300',
    },
    permissions: {
      canEditObservations: false,
      canRunDaq: false,
      canUploadEvidence: false,
      canReviewFindings: true,
      canResolveDiscrepancy: false,
      canFinalizeEvaluation: false,
      canApplyDigitalSignature: false,
      canManageStandards: false,
      canViewAuditTrail: true,
      canConfigureOimlRules: false,
      canIntakeInstruments: false,
    },
  },
};

export const getProfileByRole = (role: string): UserProfile => {
  return PRESET_USER_PROFILES[role as UserRole] || PRESET_USER_PROFILES.LEAD_METROLOGIST;
};

export const getAllProfiles = (): UserProfile[] => {
  return Object.values(PRESET_USER_PROFILES);
};

/**
 * Authoritative Officer Authentication Function
 * Accepts email or accreditation ID with password.
 * Also supports universal demo PIN '1234' or 'rrsl2026' for frictionless testing.
 */
export const authenticateOfficer = (
  identifier: string,
  secret: string
): { success: boolean; user?: UserProfile; message?: string } => {
  const cleanId = identifier.trim().toLowerCase();
  const cleanSecret = secret.trim();

  const matched = getAllProfiles().find(
    (p) =>
      p.email.toLowerCase() === cleanId ||
      p.accreditationId.toLowerCase() === cleanId ||
      p.fullName.toLowerCase().includes(cleanId)
  );

  if (!matched) {
    return {
      success: false,
      message: `No accredited officer found with identifier "${identifier}". Please check official email or Employee ID.`,
    };
  }

  // Check password or demo bypass PIN
  const isValidPassword =
    cleanSecret === matched.password ||
    cleanSecret === '1234' ||
    cleanSecret === 'rrsl2026' ||
    cleanSecret === 'password123';

  if (!isValidPassword) {
    return {
      success: false,
      message: `Invalid password or security PIN for ${matched.fullName} (${matched.roleTitle}).`,
    };
  }

  return {
    success: true,
    user: matched,
  };
};
