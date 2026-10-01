/**
 * Issues & Findings Register Service for NAWI-R76
 *
 * Implements centralized and per-evaluation traceability for review findings,
 * test discrepancies, procedure interruptions, and retest requirements.
 * Findings are never deleted; resolved findings remain permanently audited.
 */

export type FindingType =
  | 'MISSING_DATA'
  | 'INVALID_OBSERVATION'
  | 'MISSING_EVIDENCE'
  | 'PROCEDURE_INCOMPLETE'
  | 'RETEST_REQUIRED'
  | 'METROLOGICAL_FAIL'
  | 'IDENTIFICATION_DISCREPANCY'
  | 'CALCULATION_REVIEW';

export type FindingSeverity = 'BLOCKING' | 'WARNING';
export type FindingStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'VERIFIED';

export interface EvaluationFinding {
  id: string;
  evaluationNumber: string;
  testCode: string;
  testName: string;
  clause: string;
  type: FindingType;
  severity: FindingSeverity;
  description: string;
  createdBy: string;
  createdAt: string;
  assignedTo: string;
  status: FindingStatus;
  resolutionNotes?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  linkedEvidenceId?: string;
  linkedObservationIndex?: number;
}

export class IssuesFindingsService {
  private static findings: EvaluationFinding[] = [
    {
      id: 'FND-0104-01',
      evaluationNumber: 'RRSL-2026-TE-0104',
      testCode: 'R76_WEIGH_INTRINSIC',
      testName: 'Weighing Performance (Initial Intrinsic Error)',
      clause: 'Clause 3.5.1, A.4.4',
      type: 'MISSING_EVIDENCE',
      severity: 'WARNING',
      description: 'Test setup photograph at Max capacity (6.0 kg) verified against digital display indication.',
      createdBy: 'M. Verma (Senior Reviewer)',
      createdAt: '2026-09-28T10:15:00Z',
      assignedTo: 'Dr. A. Sharma',
      status: 'RESOLVED',
      resolutionNotes: 'Inspection photo attached with cryptographic SHA-256 hash. Readout consistency confirmed.',
      resolvedAt: '2026-09-28T11:00:00Z',
      resolvedBy: 'Dr. A. Sharma',
    },
    {
      id: 'FND-0104-02',
      evaluationNumber: 'RRSL-2026-TE-0104',
      testCode: 'R76_ECCENTRICITY',
      testName: 'Eccentricity with Standard Weights',
      clause: 'Clause 3.6.2, A.4.7',
      type: 'CALCULATION_REVIEW',
      severity: 'WARNING',
      description: 'Corner 3 indication delta approached 0.4e. Verified against Table 6 tolerance.',
      createdBy: 'M. Verma (Senior Reviewer)',
      createdAt: '2026-09-28T14:30:00Z',
      assignedTo: 'Dr. A. Sharma',
      status: 'RESOLVED',
      resolutionNotes: 'Tolerance re-confirmed against OIML R 76-1 Table 6 (limit ±1.0e). Verified compliant.',
      resolvedAt: '2026-09-28T16:00:00Z',
      resolvedBy: 'Dr. A. Sharma',
    },
    {
      id: 'FND-0106-01',
      evaluationNumber: 'RRSL-2026-TE-0106',
      testCode: 'R76_WEIGH_INTRINSIC',
      testName: 'Weighing Performance (Initial Intrinsic Error)',
      clause: 'Clause 3.5.1, A.4.4',
      type: 'METROLOGICAL_FAIL',
      severity: 'BLOCKING',
      description: 'Indication error at Max (150 kg) exceeded Table 6 MPE (+2.5e > +1.5e). Retest mandatory.',
      createdBy: 'M. Verma (Senior Reviewer)',
      createdAt: '2026-09-27T11:00:00Z',
      assignedTo: 'Dr. A. Sharma',
      status: 'OPEN',
    },
    {
      id: 'FND-0105-01',
      evaluationNumber: 'RRSL-2026-TE-0105',
      testCode: 'R76_ADMIN_EXAM',
      testName: 'Administrative & Markings Examination',
      clause: 'Clause 3.10, 4.1',
      type: 'IDENTIFICATION_DISCREPANCY',
      severity: 'WARNING',
      description: 'Nameplate OCR initial scan showed missing character in model badge.',
      createdBy: 'R. Sharma (Intake Officer)',
      createdAt: '2026-09-26T09:20:00Z',
      assignedTo: 'M. Verma',
      status: 'RESOLVED',
      resolutionNotes: 'High-resolution photo uploaded and verified against manufacturer intake file.',
      resolvedAt: '2026-09-26T10:45:00Z',
      resolvedBy: 'M. Verma',
    },
  ];

  public static getAllFindings(): EvaluationFinding[] {
    return [...this.findings];
  }

  public static getFindingsForEvaluation(evaluationNumber: string): EvaluationFinding[] {
    return this.findings.filter((f) => f.evaluationNumber === evaluationNumber);
  }

  public static getBlockingFindingsCount(evaluationNumber: string): number {
    return this.findings.filter(
      (f) => f.evaluationNumber === evaluationNumber && f.severity === 'BLOCKING' && f.status !== 'RESOLVED' && f.status !== 'VERIFIED'
    ).length;
  }

  public static getOpenFindingsCount(evaluationNumber: string): number {
    return this.findings.filter(
      (f) => f.evaluationNumber === evaluationNumber && (f.status === 'OPEN' || f.status === 'IN_PROGRESS')
    ).length;
  }

  public static addFinding(
    finding: Omit<EvaluationFinding, 'id' | 'createdAt' | 'status'> & { id?: string }
  ): EvaluationFinding {
    const newFinding: EvaluationFinding = {
      ...finding,
      id: finding.id || `FND-${Date.now().toString(36).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      status: 'OPEN',
    };
    this.findings.unshift(newFinding);
    return newFinding;
  }

  public static updateFindingStatus(
    id: string,
    status: FindingStatus,
    resolutionNotes?: string,
    resolvedBy?: string
  ): EvaluationFinding | null {
    const finding = this.findings.find((f) => f.id === id);
    if (!finding) return null;

    finding.status = status;
    if (status === 'RESOLVED' || status === 'VERIFIED') {
      finding.resolutionNotes = resolutionNotes || finding.resolutionNotes;
      finding.resolvedAt = new Date().toISOString();
      finding.resolvedBy = resolvedBy || 'Dr. A. Sharma';
    }
    return finding;
  }
}
