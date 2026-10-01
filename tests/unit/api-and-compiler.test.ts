import { describe, it, expect } from 'vitest';
import { ReportCompiler } from '@/lib/reports/compiler';
import { ReportPayload } from '@/services/reports/report-types';
import crypto from 'crypto';

describe('Report Compiler (/lib/reports/compiler.ts)', () => {
  const samplePayload: ReportPayload = {
    evaluationNumber: 'RRSL-2026-TE-0104',
    revisionNumber: 1,
    reportIssueDate: '2026-09-30',
    standard: 'OIML R 76-1',
    standardVersion: '2006 (E)',
    rulePackVersion: 'R76-2006-v1',
    overallResult: 'COMPLIANT',
    laboratoryName: 'Regional Reference Standard Laboratory, Ahmedabad',
    leadMetrologistName: 'Dr. A. Sharma',
    leadMetrologistAccreditation: 'RRSL-MET-2024-042',
    applicantName: 'Apex Metrology Ltd',
    applicantAddress: 'Industrial Zone, Phase II, Ahmedabad',
    manufacturerName: 'Apex Metrology Ltd',
    manufacturerCountry: 'India',
    manufacturerAddress: 'Industrial Zone, Phase II, Ahmedabad',
    modelName: 'Precision-Bench-B6',
    serialNumber: 'SN-BS-26001',
    accuracyClass: 'Class II',
    rangeType: 'Single Range',
    maxCapacity: '6.000',
    minCapacity: '0.050',
    verificationInterval_e: '0.001',
    scaleInterval_d: '0.001',
    numberOfIntervals_n: 6000,
    primaryUnit: 'kg',
    temperatureLimits: '-10 °C to +40 °C',
    powerSupply: '230 V AC Mains',
    tareType: 'Subtractive',
    summaryMatrix: [
      {
        itemNumber: '1',
        clause: 'A.4.4',
        testTitle: 'Weighing Performance (Clause A.4.4)',
        isApplicable: true,
        status: 'Passed',
      },
    ],
    testRuns: [
      {
        testCode: 'R76_WEIGH_INTRINSIC',
        clauseReference: 'A.4.4',
        title: 'Weighing Performance: Initial Intrinsic Error Determination',
        status: 'PASS',
        observations: [
          {
            seriesIndex: 1,
            stepIndex: 1,
            direction: 'INCREASING',
            nominalLoad: '0.000 kg',
            indicatedValue: '0.000 kg',
            turningPoint_dL: '0.0005 kg',
            calculated_P: '0.0000 kg',
            error_E: '0.0000 kg',
            zeroError_E0: '0.0000 kg',
            correctedError_Ec: '0.0000 kg',
            mpe: '0.0005 kg',
            result: 'PASS',
          },
          {
            seriesIndex: 1,
            stepIndex: 2,
            direction: 'INCREASING',
            nominalLoad: '2.000 kg',
            indicatedValue: '2.000 kg',
            turningPoint_dL: '0.0004 kg',
            calculated_P: '2.0001 kg',
            error_E: '0.0001 kg',
            zeroError_E0: '0.0000 kg',
            correctedError_Ec: '0.0001 kg',
            mpe: '0.0005 kg',
            result: 'PASS',
          },
          {
            seriesIndex: 1,
            stepIndex: 3,
            direction: 'INCREASING',
            nominalLoad: '6.000 kg',
            indicatedValue: '6.000 kg',
            turningPoint_dL: '0.0003 kg',
            calculated_P: '6.0002 kg',
            error_E: '0.0002 kg',
            zeroError_E0: '0.0000 kg',
            correctedError_Ec: '0.0002 kg',
            mpe: '0.0010 kg',
            result: 'PASS',
          },
        ],
      },
    ],
    standardsUsed: [
      {
        serialNumber: 'STD-WT-001',
        name: 'Primary Mass Set E2',
        weightClass: 'E2',
        certificateNumber: 'NPL-CAL-2026-0891',
        calibratedBy: 'NPL India',
        validUntil: '2027-03-31',
        uncertaintyOrError: 'U <= 0.05 mg',
      },
    ],
    evidenceFiles: [],
  };

  it('compiles canonical vector PDF with dynamic SHA-256 hash and QR verification code', async () => {
    const result = await ReportCompiler.compilePdf(samplePayload);
    expect(result.pdfBytes).toBeInstanceOf(Uint8Array);
    expect(result.pdfBytes.length).toBeGreaterThan(5000);
    expect(result.documentSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(result.verificationToken).toBeDefined();
    expect(result.verificationUrl).toContain('/verify/');
  });

  it('compiles OpenXML editable Word (.docx) document', async () => {
    const result = await ReportCompiler.compileDocx(samplePayload);
    expect(result.docxBuffer).toBeInstanceOf(Buffer);
    expect(result.docxBuffer.length).toBeGreaterThan(1000);
    expect(result.documentSha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it('compiles dual report generating matching cryptographic metadata', async () => {
    const dual = await ReportCompiler.compileDualReport(samplePayload);
    expect(dual.pdf).toBeDefined();
    expect(dual.docx).toBeDefined();
    expect(dual.verificationToken).toBe(dual.pdf.verificationToken);
    expect(dual.verificationUrl).toBe(dual.pdf.verificationUrl);
  });

  it('verifies ISO/IEC 17025 SHA-256 Merkle chain integrity across consecutive audit entries', () => {
    const genesisHash = '0000000000000000000000000000000000000000000000000000000000000000';

    // Entry 1
    const payload1 = JSON.stringify({
      observationId: 'obs-001',
      action: 'RECORD',
      load: 10.0,
      timestamp: '2026-09-30T10:00:00Z',
    });
    const payloadHash1 = crypto.createHash('sha256').update(payload1).digest('hex');
    const hash1 = crypto.createHash('sha256').update(genesisHash + payloadHash1).digest('hex');

    // Entry 2 (Correction with engineering justification)
    const payload2 = JSON.stringify({
      observationId: 'obs-001',
      action: 'CORRECTION',
      previousValue: 10.0005,
      newValue: 10.0001,
      justification: 'Corrected tare subweight typo recorded during A.4.4 cycle',
      timestamp: '2026-09-30T10:15:00Z',
    });
    const payloadHash2 = crypto.createHash('sha256').update(payload2).digest('hex');
    const hash2 = crypto.createHash('sha256').update(hash1 + payloadHash2).digest('hex');

    expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    expect(hash2).toMatch(/^[a-f0-9]{64}$/);
    expect(hash1).not.toBe(hash2);

    // Tamper detection: if payload 1 is modified, hash 2 becomes invalid
    const tamperedPayload1 = JSON.stringify({
      observationId: 'obs-001',
      action: 'RECORD',
      load: 12.0, // Tampered!
      timestamp: '2026-09-30T10:00:00Z',
    });
    const tamperedPayloadHash1 = crypto.createHash('sha256').update(tamperedPayload1).digest('hex');
    const tamperedHash1 = crypto.createHash('sha256').update(genesisHash + tamperedPayloadHash1).digest('hex');
    const recalculatedHash2 = crypto.createHash('sha256').update(tamperedHash1 + payloadHash2).digest('hex');

    expect(recalculatedHash2).not.toBe(hash2); // Tamper detected!
  });
});

describe('REST Route Handlers Integration', () => {
  it('GET /api/evaluations returns success with evaluation list and headers', async () => {
    const { GET } = await import('@/app/api/evaluations/route');
    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.evaluations)).toBe(true);
    expect(body.evaluations.length).toBeGreaterThan(0);
  });

  it('GET /api/evaluations/[id] returns evaluation record', async () => {
    const { GET } = await import('@/app/api/evaluations/[id]/route');
    const req = new Request('http://localhost:3000/api/evaluations/RRSL-2026-TE-0104') as any;
    const response = await GET(req, { params: Promise.resolve({ id: 'RRSL-2026-TE-0104' }) });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.evaluation.evaluationNumber).toBe('RRSL-2026-TE-0104');
  });

  it('POST /api/evaluations/[id]/correct records correction audit trail', async () => {
    const { POST } = await import('@/app/api/evaluations/[id]/correct/route');
    const payload = {
      testRunId: 'tr-01',
      rowIndex: 2,
      fieldKey: 'indication',
      oldValue: 15.002,
      newValue: 15.000,
      reason: 'Transcription typo corrected from calibration mass certificate',
      actor: 'Dr. A. Sharma',
    };
    const req = new Request('http://localhost:3000/api/evaluations/RRSL-2026-TE-0104/correct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }) as any;
    const response = await POST(req, { params: Promise.resolve({ id: 'RRSL-2026-TE-0104' }) });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.auditRecord).toBeDefined();
    expect(body.auditRecord.action).toBe('OBSERVATION_CORRECTION');
  });

  it('GET /api/evaluations/[id]/export/pdf streams PDF with content headers', async () => {
    const { GET } = await import('@/app/api/evaluations/[id]/export/pdf/route');
    const req = new Request('http://localhost:3000/api/evaluations/RRSL-2026-TE-0104/export/pdf') as any;
    const response = await GET(req, { params: Promise.resolve({ id: 'RRSL-2026-TE-0104' }) });
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
    expect(response.headers.get('Content-Disposition')).toContain('attachment; filename=');
    expect(response.headers.get('X-Document-SHA256')).toMatch(/^[a-f0-9]{64}$/);
    const buffer = await response.arrayBuffer();
    expect(buffer.byteLength).toBeGreaterThan(1000);
  });

  it('GET /api/evaluations/[id]/export/docx streams Word document with content headers', async () => {
    const { GET } = await import('@/app/api/evaluations/[id]/export/docx/route');
    const req = new Request('http://localhost:3000/api/evaluations/RRSL-2026-TE-0104/export/docx') as any;
    const response = await GET(req, { params: Promise.resolve({ id: 'RRSL-2026-TE-0104' }) });
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    expect(response.headers.get('Content-Disposition')).toContain('attachment; filename=');
    const buffer = await response.arrayBuffer();
    expect(buffer.byteLength).toBeGreaterThan(1000);
  });
});

