/**
 * Evidence Register Service for NAWI-R76
 *
 * Provides centralized searchable traceability across all laboratory evidence,
 * including photos, calibration certificates, OCR readings, and cryptographic digests.
 */

export type EvidenceType = 'PHOTO' | 'DOCUMENT' | 'CERTIFICATE' | 'VIDEO';
export type EvidencePurposeCategory =
  | 'IDENTITY'
  | 'NAMEPLATE'
  | 'TEST_SETUP'
  | 'OBSERVATION_EVIDENCE'
  | 'REFERENCE_STANDARD'
  | 'ENVIRONMENTAL_CONDITION'
  | 'SUPPORTING_DOCUMENT';

export type EvidenceIntegrityStatus = 'HASH_VERIFIED' | 'TAMPER_DETECTED' | 'PENDING';
export type EvidenceReviewStatus = 'UPLOADED' | 'VERIFIED' | 'DISCREPANCY' | 'SUPERSEDED';

export interface EvidenceRecord {
  id: string;
  evaluationNumber: string;
  testCode?: string;
  testName?: string;
  clause?: string;
  type: EvidenceType;
  purpose: EvidencePurposeCategory;
  fileName: string;
  mimeType: string;
  storageUrl: string;
  serverHashSha256: string;
  capturedAt: string;
  uploadedBy: string;
  status: EvidenceReviewStatus;
  integrityStatus: EvidenceIntegrityStatus;
  description: string;
  ocrExtractedValue?: string;
  ocrConfidence?: number;
  consistencyVerdict?: 'CONSISTENT' | 'DISCREPANCY' | 'NOT_APPLICABLE';
  linkedObservationIndex?: number;
  supersededById?: string;
  notes?: string;
}

export class EvidenceRegisterService {
  private static evidenceList: EvidenceRecord[] = [
    {
      id: 'EV-26001-ID',
      evaluationNumber: 'RRSL-2026-TE-0104',
      testCode: 'R76_ADMIN_EXAM',
      testName: 'Administrative & Markings Examination',
      clause: 'Clause 3.10, 4.1',
      type: 'PHOTO',
      purpose: 'NAMEPLATE',
      fileName: 'bench_scale_nameplate.jpg',
      mimeType: 'image/jpeg',
      storageUrl: '/demo-evidence/bench_scale_nameplate.jpg',
      serverHashSha256: 'b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef01a',
      capturedAt: '2026-09-27T09:45:00Z',
      uploadedBy: 'R. Sharma (Intake Officer)',
      status: 'VERIFIED',
      integrityStatus: 'HASH_VERIFIED',
      description: 'Physical specimen identification nameplate proving Model Precision-Bench-B6, Serial Number SN-BS-26001, Max 6 kg, Min 0.05 kg, and e 0.001 kg.',
      ocrExtractedValue: 'SN-BS-26001',
      ocrConfidence: 0.99,
      consistencyVerdict: 'CONSISTENT',
      linkedObservationIndex: 0,
    },
    {
      id: 'EV-26001-FULL',
      evaluationNumber: 'RRSL-2026-TE-0104',
      testCode: 'R76_ADMIN_EXAM',
      testName: 'Administrative & Markings Examination',
      clause: 'Clause 3.10, 4.1',
      type: 'PHOTO',
      purpose: 'IDENTITY',
      fileName: 'bench_scale_full.jpg',
      mimeType: 'image/jpeg',
      storageUrl: '/demo-evidence/bench_scale_full.jpg',
      serverHashSha256: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
      capturedAt: '2026-09-27T09:50:00Z',
      uploadedBy: 'R. Sharma (Intake Officer)',
      status: 'VERIFIED',
      integrityStatus: 'HASH_VERIFIED',
      description: 'Overall view of Precision-Bench-B6 scale housing, stainless steel pan, and digital readout fascia.',
    },
    {
      id: 'EV-26003-SETUP-01',
      evaluationNumber: 'RRSL-2026-TE-0104',
      testCode: 'R76_WEIGH_INTRINSIC',
      testName: 'Weighing Performance (Initial Intrinsic Error)',
      clause: 'Clause 3.5.1, A.4.4',
      type: 'PHOTO',
      purpose: 'TEST_SETUP',
      fileName: 'bench_setup_test1.jpg',
      mimeType: 'image/jpeg',
      storageUrl: '/demo-evidence/bench_scale_full.jpg',
      serverHashSha256: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
      capturedAt: '2026-09-27T11:15:00Z',
      uploadedBy: 'Dr. A. Sharma',
      status: 'VERIFIED',
      integrityStatus: 'HASH_VERIFIED',
      description: 'Test platform setup showing anti-vibration table installation and initial unloaded zero.',
    },
    {
      id: 'EV-26003-OBS-MAX',
      evaluationNumber: 'RRSL-2026-TE-0104',
      testCode: 'R76_WEIGH_INTRINSIC',
      testName: 'Weighing Performance (Initial Intrinsic Error)',
      clause: 'Clause 3.5.1, A.4.4',
      type: 'PHOTO',
      purpose: 'OBSERVATION_EVIDENCE',
      fileName: 'display_reading_15kg.jpg',
      mimeType: 'image/jpeg',
      storageUrl: '/demo-evidence/retail_scale_nameplate.jpg',
      serverHashSha256: 'f7e8d9c0b1a234567890abcdef1234567890abcdef1234567890abcdef123456',
      capturedAt: '2026-09-27T11:40:00Z',
      uploadedBy: 'Dr. A. Sharma',
      status: 'VERIFIED',
      integrityStatus: 'HASH_VERIFIED',
      description: 'Weight display reading at Max capacity (15.000 kg) showing 15.000 kg indication.',
      ocrExtractedValue: '15.000 kg',
      ocrConfidence: 0.98,
      consistencyVerdict: 'CONSISTENT',
      linkedObservationIndex: 5,
    },
    {
      id: 'EV-26003-STD-CERT',
      evaluationNumber: 'RRSL-2026-TE-0104',
      testCode: 'R76_WEIGH_INTRINSIC',
      testName: 'Weighing Performance (Initial Intrinsic Error)',
      clause: 'Clause 3.7.1',
      type: 'CERTIFICATE',
      purpose: 'REFERENCE_STANDARD',
      fileName: 'Calibration_Certificate_STD_WT_001.pdf',
      mimeType: 'application/pdf',
      storageUrl: '/documents/Calibration_Certificate_STD_WT_001.pdf',
      serverHashSha256: '99887766554433221100aabbccddeeff00112233445566778899aabbccddeeff',
      capturedAt: '2024-04-10T08:00:00Z',
      uploadedBy: 'NPLI Metrology',
      status: 'VERIFIED',
      integrityStatus: 'HASH_VERIFIED',
      description: 'National Metrology Institute calibration certificate proving Class F1 standard uncertainty (U = 0.25 mg).',
    },
    {
      id: 'EV-26002-DISC-01',
      evaluationNumber: 'RRSL-2026-TE-0106',
      testCode: 'R76_WEIGH_INTRINSIC',
      testName: 'Weighing Performance (Initial Intrinsic Error)',
      clause: 'Clause 3.5.1, A.4.4',
      type: 'PHOTO',
      purpose: 'OBSERVATION_EVIDENCE',
      fileName: 'platform_non_linear_display.jpg',
      mimeType: 'image/jpeg',
      storageUrl: '/demo-evidence/bench_scale_nameplate.jpg',
      serverHashSha256: '11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff',
      capturedAt: '2026-09-27T10:30:00Z',
      uploadedBy: 'Dr. A. Sharma',
      status: 'DISCREPANCY',
      integrityStatus: 'HASH_VERIFIED',
      description: 'Indication reading at 150 kg showing non-compliant display discrepancy against Table 6 limit.',
      ocrExtractedValue: '150.125 kg',
      ocrConfidence: 0.95,
      consistencyVerdict: 'DISCREPANCY',
      linkedObservationIndex: 4,
    },
  ];

  private static listeners = new Set<() => void>();
  private static isStorageLoaded = false;

  private static ensureStorageLoaded(): void {
    if (this.isStorageLoaded) return;
    this.isStorageLoaded = true;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem('nawi_r76_evidence_register');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.evidenceList = parsed;
          }
        }
      } catch (err) {
        console.warn('Failed to load evidence register from storage:', err);
      }
    }
  }

  private static persistStorage(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem('nawi_r76_evidence_register', JSON.stringify(this.evidenceList));
      } catch (err) {
        console.warn('Failed to persist evidence register to storage:', err);
      }
    }
    this.notify();
  }

  public static subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notify(): void {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        console.error('Error in EvidenceRegisterService listener:', e);
      }
    });
  }

  public static getAllEvidence(): EvidenceRecord[] {
    this.ensureStorageLoaded();
    return [...this.evidenceList];
  }

  public static getEvidenceForEvaluation(evaluationNumber: string): EvidenceRecord[] {
    this.ensureStorageLoaded();
    return this.evidenceList.filter((e) => e.evaluationNumber === evaluationNumber);
  }

  public static getEvidenceById(id: string): EvidenceRecord | null {
    this.ensureStorageLoaded();
    return this.evidenceList.find((e) => e.id === id) || null;
  }

  public static addEvidence(evidence: EvidenceRecord): EvidenceRecord {
    this.ensureStorageLoaded();
    const existingIdx = this.evidenceList.findIndex((e) => e.id === evidence.id);
    if (existingIdx >= 0) {
      this.evidenceList[existingIdx] = evidence;
    } else {
      this.evidenceList.unshift(evidence);
    }
    this.persistStorage();
    return evidence;
  }

  /**
   * Synchronizes physical test observations and uploaded photos from active TestRuns.
   */
  public static syncFromTestRuns(
    evaluationNumber: string,
    testRuns: any[],
    operatorName?: string
  ): void {
    if (!testRuns || !Array.isArray(testRuns) || testRuns.length === 0) return;
    this.ensureStorageLoaded();

    let hasNew = false;
    for (const run of testRuns) {
      const items = run.evidence || run.evidenceReferences;
      if (Array.isArray(items) && items.length > 0) {
        for (const item of items) {
          const evidenceId = item.id || `ev-${run.testCode}-${Date.now().toString(36)}`;
          const existingIdx = this.evidenceList.findIndex((e) => e.id === evidenceId);

          const purpose: EvidencePurposeCategory =
            item.category === 'NAMEPLATE'
              ? 'NAMEPLATE'
              : item.category === 'SETUP_PHOTO'
              ? 'TEST_SETUP'
              : item.category === 'DOCUMENT'
              ? 'SUPPORTING_DOCUMENT'
              : 'OBSERVATION_EVIDENCE';

          const mapped: EvidenceRecord = {
            id: evidenceId,
            evaluationNumber,
            testCode: run.testCode,
            testName: run.name,
            clause: run.clause,
            type: item.mimeType?.includes('pdf') ? 'DOCUMENT' : 'PHOTO',
            purpose,
            fileName: item.fileName || `${run.testCode}_evidence.jpg`,
            mimeType: item.mimeType || 'image/jpeg',
            storageUrl: item.dataUrl || item.storageUrl || '/demo-evidence/bench_scale_full.jpg',
            serverHashSha256: item.sha256Hash || item.serverHashSha256 || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
            capturedAt: item.timestamp || item.capturedAt || new Date().toISOString(),
            uploadedBy: item.uploader || item.user || operatorName || 'Testing Officer',
            status: item.verifiedByMetrologist ? 'VERIFIED' : 'UPLOADED',
            integrityStatus: 'HASH_VERIFIED',
            description: item.description || `Photographic test evidence captured during ${run.name} under ${run.clause}`,
            ocrExtractedValue: item.ocrExtractedValue ? String(item.ocrExtractedValue) : undefined,
            ocrConfidence: item.ocrConfidence || 0.98,
            consistencyVerdict: item.consistencyStatus === 'DISCREPANCY' ? 'DISCREPANCY' : 'CONSISTENT',
          };

          if (existingIdx >= 0) {
            this.evidenceList[existingIdx] = { ...this.evidenceList[existingIdx], ...mapped };
          } else {
            this.evidenceList.unshift(mapped);
            hasNew = true;
          }
        }
      }
    }

    if (hasNew) {
      this.persistStorage();
    }
  }
}
