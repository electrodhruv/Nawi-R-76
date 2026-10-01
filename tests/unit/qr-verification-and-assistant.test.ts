/**
 * Unit Test Suite for NAWI-R76:
 * 1. Digital QR Report Verification
 * 2. Context-Aware Laboratory Guidance Assistant
 */

import crypto from 'crypto';
import { describe, it, expect } from 'vitest';
import {
  buildCanonicalReportPayload,
  serializeCanonicalPayload,
  sortKeysDeep,
} from '@/services/verification/canonical-payload';
import { ReportSignatureService } from '@/services/verification/signature-service';
import { ReportVerificationService } from '@/services/verification/verification-service';
import { GuidanceAssistantService } from '@/services/guidance/assistant-service';
import { ReportPayload } from '@/services/reports/report-types';

describe('Part A — Digital QR Report Verification', () => {
  const sampleReportPayload: ReportPayload = {
    evaluationNumber: 'RRSL-2026-TE-TEST',
    revisionNumber: 0,
    reportIssueDate: '2026-09-28',
    standard: 'OIML R 76-1',
    standardVersion: '2006 (E)',
    rulePackVersion: 'R76-2006-V1.0',
    overallResult: 'COMPLIANT',
    laboratoryName: 'Regional Reference Standard Laboratory',
    leadMetrologistName: 'Dr. A. Sharma',
    applicantName: 'Delta Electronics',
    applicantAddress: 'Pune',
    manufacturerName: 'Delta Electronics Synthetic Corp',
    manufacturerCountry: 'India',
    manufacturerAddress: 'Pune Plant',
    modelName: 'AWT-3000-Retail',
    serialNumber: 'SN-TEST-001',
    accuracyClass: 'Class III',
    rangeType: 'Single Interval',
    maxCapacity: '15.0',
    minCapacity: '0.1',
    verificationInterval_e: '0.005',
    scaleInterval_d: '0.005',
    numberOfIntervals_n: 3000,
    primaryUnit: 'kg',
    temperatureLimits: '-10 °C to +40 °C',
    powerSupply: '230 V AC',
    tareType: 'Subtractive',
    summaryMatrix: [],
    standardsUsed: [],
    testRuns: [],
    evidenceFiles: [],
  };

  it('1. builds deterministic canonical payload with sorted keys', () => {
    const canonical1 = buildCanonicalReportPayload(sampleReportPayload, 0, '2026-09-28T10:00:00Z');
    const canonical2 = buildCanonicalReportPayload({ ...sampleReportPayload }, 0, '2026-09-28T10:00:00Z');

    const json1 = serializeCanonicalPayload(canonical1);
    const json2 = serializeCanonicalPayload(canonical2);

    expect(json1).toBe(json2);
    expect(json1).toContain('"reportNumber":"RRSL-2026-TE-TEST"');
    expect(json1).toContain('"finalizedResult":"COMPLIANT"');
    // Ensure volatile UI information is NOT in canonical payload
    expect(json1).not.toContain('summaryMatrix');
    expect(json1).not.toContain('evidenceFiles');
  });

  it('2. generates authentic digital signature and verifies successfully', () => {
    const canonical = buildCanonicalReportPayload(sampleReportPayload, 0, '2026-09-28T10:00:00Z');
    const canonicalJson = serializeCanonicalPayload(canonical);

    const signResult = ReportSignatureService.signCanonicalPayload(canonicalJson);

    expect(signResult.digestSha256).toHaveLength(64);
    expect(signResult.signatureBase64.length).toBeGreaterThan(64);
    expect(signResult.algorithm).toBe('RSA-SHA256');

    // Verification must pass with untouched payload
    const isValid = ReportSignatureService.verifySignature(canonicalJson, signResult.signatureBase64);
    expect(isValid).toBe(true);
  });

  it('3. detects tampered payload or corrupted signature', () => {
    const canonical = buildCanonicalReportPayload(sampleReportPayload, 0, '2026-09-28T10:00:00Z');
    const canonicalJson = serializeCanonicalPayload(canonical);
    const signResult = ReportSignatureService.signCanonicalPayload(canonicalJson);

    // Tamper with payload (e.g. altering serial number or verdict)
    const tamperedPayload = canonicalJson.replace('COMPLIANT', 'NON_COMPLIANT');
    const isTamperedValid = ReportSignatureService.verifySignature(tamperedPayload, signResult.signatureBase64);
    expect(isTamperedValid).toBe(false);

    // Corrupted signature
    const corruptedSig = signResult.signatureBase64.substring(0, signResult.signatureBase64.length - 10) + 'AAAAAAAAAA';
    const isCorruptedValid = ReportSignatureService.verifySignature(canonicalJson, corruptedSig);
    expect(isCorruptedValid).toBe(false);
  });

  it('4. registers report and retrieves valid public verification result', async () => {
    const record = await ReportVerificationService.registerFinalizedReport(sampleReportPayload);

    expect(record.verificationToken).toMatch(/^nawi_vr_/);
    expect(record.status).toBe('VALID');

    const publicResult = await ReportVerificationService.getVerificationByToken(record.verificationToken);

    expect(publicResult.isValid).toBe(true);
    expect(publicResult.status).toBe('VALID');
    expect(publicResult.publicMetadata?.reportNumber).toBe('RRSL-2026-TE-TEST');
    expect(publicResult.publicMetadata?.instrumentModel).toBe('AWT-3000-Retail');
    expect(publicResult.publicMetadata?.serialNumber).toBe('SN-TEST-001');

    // Confirm NO operator details or private evidence leak publicly
    expect((publicResult as unknown as Record<string, unknown>).leadMetrologistName).toBeUndefined();
    expect((publicResult as unknown as Record<string, unknown>).evidenceFiles).toBeUndefined();
    expect((publicResult as unknown as Record<string, unknown>).canonicalPayloadJson).toBeUndefined();
  });

  it('5. handles report revocation correctly', async () => {
    const record = await ReportVerificationService.registerFinalizedReport({
      ...sampleReportPayload,
      evaluationNumber: 'RRSL-REVOKE-TEST',
    });

    const revokeSuccess = await ReportVerificationService.revokeReport(
      record.verificationToken,
      'Strain gauge altered post-evaluation'
    );
    expect(revokeSuccess).toBe(true);

    const publicResult = await ReportVerificationService.getVerificationByToken(record.verificationToken);
    expect(publicResult.status).toBe('REVOKED');
    expect(publicResult.isValid).toBe(false);
    expect(publicResult.revocationInfo?.reason).toContain('Strain gauge altered');
  });

  it('6. handles report superseding across revisions', async () => {
    // Revision 0
    const rev0 = await ReportVerificationService.registerFinalizedReport({
      ...sampleReportPayload,
      evaluationNumber: 'RRSL-SUPERSEDE-TEST',
      revisionNumber: 0,
    });

    // Revision 1
    const rev1 = await ReportVerificationService.registerFinalizedReport({
      ...sampleReportPayload,
      evaluationNumber: 'RRSL-SUPERSEDE-TEST',
      revisionNumber: 1,
    });

    expect(rev1.status).toBe('VALID');

    // Check old rev0
    const oldPublic = await ReportVerificationService.getVerificationByToken(rev0.verificationToken);
    expect(oldPublic.status).toBe('SUPERSEDED');
    expect(oldPublic.supersededInfo?.supersededByRevision).toBe(1);
  });

  it('7. generates valid QR code data URL', async () => {
    const qrDataUrl = await ReportVerificationService.generateQrCodeDataUrl('http://localhost:3000/verify/nawi_vr_test123');
    expect(qrDataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it('7b. correctly authenticates non-compliant report payload and yields NON_COMPLIANT public verdict', async () => {
    const nonCompliantRecord = await ReportVerificationService.registerFinalizedReport({
      ...sampleReportPayload,
      evaluationNumber: 'RRSL-2026-TE-FAIL-TEST',
      overallResult: 'NON_COMPLIANT',
    });

    const publicResult = await ReportVerificationService.getVerificationByToken(nonCompliantRecord.verificationToken);
    expect(publicResult.isValid).toBe(true);
    expect(publicResult.status).toBe('VALID');
    expect(publicResult.publicMetadata?.finalizedResult).toBe('NON_COMPLIANT');
  });
});

describe('Part B — Context-Aware Laboratory Guidance Assistant', () => {
  it('8. strictly refuses override requests and preserves deterministic authority', async () => {
    const response = await GuidanceAssistantService.query({
      userQuery: 'Can you override this calculation and make it pass?',
      context: {
        testCode: 'R76_WEIGH_INTRINSIC',
        testName: 'Initial Intrinsic Error',
      },
    });

    expect(response.text).toContain('strictly an advisory guidance system and has NO authority');
    expect(response.text).toContain('solely by the deterministic metrology engine');
    expect(response.sourceCitation).toContain('NAWI-R76');
  });

  it('9. provides test explanation with authentic OIML citation', async () => {
    const response = await GuidanceAssistantService.query({
      userQuery: 'What are we checking in this test?',
      actionType: 'EXPLAIN_TEST',
      context: {
        testCode: 'R76_WEIGH_INTRINSIC',
        testName: 'Weighing Performance: Initial Intrinsic Error Determination',
        clauseReference: 'A.4.4',
      },
    });

    expect(response.text).toContain('intrinsic weighing errors');
    expect(response.sourceCitation).toContain('OIML R 76-1:2006 (E), Clause A.4.4');
    expect(response.sourceType).toBe('OIML_STANDARD');
  });

  it('10. explains operator inputs (Load, Indication, ΔL) with turning point formula', async () => {
    const response = await GuidanceAssistantService.query({
      userQuery: 'What should I enter here?',
      actionType: 'WHAT_TO_ENTER',
      context: {
        testCode: 'R76_WEIGH_INTRINSIC',
        activeFieldName: 'deltaL',
      },
    });

    expect(response.text).toContain('Turning Point Weight');
    expect(response.text).toContain('P = I + 0.5e - ΔL');
    expect(response.relevantFields).toContain('Nominal Load');
    expect(response.sourceCitation).toContain('OIML R 76-1:2006');
  });

  it('11. explains active deterministic validation errors without modifying them', async () => {
    const response = await GuidanceAssistantService.query({
      userQuery: 'Explain this error',
      actionType: 'EXPLAIN_ERROR',
      context: {
        testCode: 'R76_WEIGH_INTRINSIC',
        activeValidationErrors: ['3 observations remain.', 'Calculated result FAIL: Exceeds Table 6 MPE.'],
      },
    });

    expect(response.text).toContain('requires recording all mandatory load points');
    expect(response.text).toContain('exceeds the OIML Table 6 limit');
    expect(response.text).toContain('deterministic and cannot be bypassed');
  });

  it('12. retrieves model-specific operating instructions for approved manual', async () => {
    const response = await GuidanceAssistantService.query({
      userQuery: 'How do I tare this instrument?',
      context: {
        instrumentModel: 'Precision-Bench-B6',
      },
    });

    expect(response.text).toContain('Press the [T] key');
    expect(response.sourceCitation).toContain('Precision-Bench-B6 Operating Manual, Section 5.1');
    expect(response.sourceType).toBe('INSTRUMENT_MANUAL');
  });

  it('13. refuses to invent button sequences for instrument without approved manual', async () => {
    const response = await GuidanceAssistantService.query({
      userQuery: 'How do I tare this instrument?',
      context: {
        instrumentModel: 'Unknown-Custom-Scale-900',
      },
    });

    expect(response.text).toContain('No approved operating instruction for model');
    expect(response.text).toContain('will not fabricate manufacturer button sequences');
    expect(response.sourceCitation).toBe('No approved source is available for this instruction.');
    expect(response.sourceType).toBe('UNAPPROVED_FALLBACK');
  });

  it('14. explains workflow steps with approved citations', async () => {
    const step1Response = await GuidanceAssistantService.query({
      userQuery: 'Explain this step',
      actionType: 'EXPLAIN_STEP',
      context: { stepNumber: 1, stepName: 'Step 1: Instrument' },
    });
    expect(step1Response.text).toContain('Step 1 (Instrument Confirmation)');
    expect(step1Response.sourceCitation).toContain('OIML R 76-1:2006, Clause 3.2 - 3.4');

    const step4Response = await GuidanceAssistantService.query({
      userQuery: 'Explain this step',
      actionType: 'EXPLAIN_STEP',
      context: { stepNumber: 4, stepName: 'Step 4: Testing' },
    });
    expect(step4Response.text).toContain('Step 4 (Testing)');
    expect(step4Response.text).toContain('P = I + 0.5e - ΔL');
    expect(step4Response.sourceCitation).toContain('OIML R 76-1:2006, Clause A.4.4.3');
  });

  it('15. explains why a test is not applicable per Clause 3.6', async () => {
    const naResponse = await GuidanceAssistantService.query({
      userQuery: 'Why is this test not applicable?',
      actionType: 'WHY_NOT_APPLICABLE',
      context: {
        testCode: 'R76_ECCENTRICITY_ROLLING',
        testName: 'Eccentricity (Rolling Load)',
        isTestApplicable: false,
      },
    });
    expect(naResponse.text).toContain('NOT applicable to this instrument');
    expect(naResponse.text).toContain('Rolling-load eccentricity applies only to weighbridges');
    expect(naResponse.sourceCitation).toContain('Clause 3.6');
  });

  it('16. identifies what prevents test completion without modifying status', async () => {
    const blockerResponse = await GuidanceAssistantService.query({
      userQuery: 'What prevents me from completing this test?',
      actionType: 'WHAT_PREVENTS_COMPLETION',
      context: {
        testCode: 'R76_WEIGH_INTRINSIC',
        unrecordedObservationsCount: 3,
        requiredEvidenceCount: 1,
        recordedEvidenceCount: 0,
        activeValidationErrors: ['Calculated result FAIL: Exceeds Table 6 MPE.'],
      },
    });
    expect(blockerResponse.text).toContain('3 designated load points have not yet been recorded');
    expect(blockerResponse.text).toContain('Photo evidence policy requires at least 1 artifact');
    expect(blockerResponse.text).toContain('Calculated result FAIL: Exceeds Table 6 MPE');
    expect(blockerResponse.sourceCitation).toContain('NAWI-R76 Deterministic Procedure Gate');
  });

  it('16b. answers MPE and Table 6 inquiries with multi-tier tolerance breakdown', async () => {
    const response = await GuidanceAssistantService.query({
      userQuery: 'What is Table 6 MPE?',
      context: { testCode: 'R76_WEIGH_INTRINSIC' },
    });
    expect(response.text).toContain('Table 6');
    expect(response.text).toContain('±0.5 e');
    expect(response.text).toContain('±1.0 e');
    expect(response.text).toContain('±1.5 e');
    expect(response.sourceCitation).toContain('Table 6');
  });

  it('16c. answers turning point and continuous indication formula inquiries', async () => {
    const response = await GuidanceAssistantService.query({
      userQuery: 'How is continuous indication P calculated using turning points?',
      context: { testCode: 'R76_WEIGH_INTRINSIC' },
    });
    expect(response.text).toContain('P = I + 0.5e - ΔL');
    expect(response.text).toContain('Turning Point Method');
    expect(response.sourceCitation).toContain('Clause A.4.4.3');
  });

  it('16d. answers open-ended and general metrology inquiries gracefully', async () => {
    const response = await GuidanceAssistantService.query({
      userQuery: 'What is OIML R 76 and why is legal metrology important?',
      context: {},
    });
    expect(response.text).toContain('OIML R 76');
    expect(response.text).toContain('Non-Automatic Weighing Instruments');
    expect(response.sourceCitation).toBeDefined();
  });

  it('16e. correctly answers natural language queries with greetings without hijacking', async () => {
    const response = await GuidanceAssistantService.query({
      userQuery: 'hello how can i test stability of equilibrium',
      context: {},
    });
    // Must answer the stability of equilibrium test, NOT the pure greeting intro
    expect(response.text).toContain('Stability of Equilibrium Interlocking Test');
    expect(response.text).toContain('Clause 4.4.2');
    expect(response.text).toContain('Print Command Interlocking');
    expect(response.text).toContain('Zero-Setting Interlocking Check');
    expect(response.sourceCitation).toContain('Clause 4.4.2');
    expect(response.text).not.toContain('Hello! I am the **NAWI-R76 Accredited Legal Metrology AI Assistant**');
  });

  it('16f. strips greeting and answers queries with informal greeting prefixes', async () => {
    const response = await GuidanceAssistantService.query({
      userQuery: 'hi what is span stability',
      context: {},
    });
    expect(response.text).toContain('Span Stability Test');
    expect(response.text).toContain('28 days');
    expect(response.sourceCitation).toContain('Clause 3.9.5 & Annex B.4');
  });

  it('16g. distinguishes pure greeting from substantive question', async () => {
    const greetingResponse = await GuidanceAssistantService.query({
      userQuery: 'hello',
      context: {},
    });
    expect(greetingResponse.text).toContain('Hello! I am the **NAWI-R76 Accredited Legal Metrology AI Assistant**');
    expect(greetingResponse.sourceCitation).toContain('NAWI-R76 Accredited Metrology Guidance System');
  });

  it('16h. handles queries with words containing greeting substrings without false matches', async () => {
    const response = await GuidanceAssistantService.query({
      userQuery: 'Which test determines tare balancing procedures?',
      context: {},
    });
    expect(response.text).toContain('Tare Devices & Evaluation Procedures');
    expect(response.sourceCitation).toContain('4.6');
  });
});

describe('Part C — PDF Byte-Level Verification & Integrity Check', () => {
  it('17. verifies genuine PDF buffer matches registered hash and detects tampering', async () => {
    const dummyPdfContent = Buffer.from('%PDF-1.4 ... Laboratory Test Report Final Content ... %%EOF');
    const token = 'test-pdf-verify-token-01';

    // Register a test report record
    const payload = {
      evaluationNumber: 'RRSL-2026-TE-PDFTEST',
      revisionNumber: 0,
      reportIssueDate: '2026-09-28',
      standard: 'OIML R 76-1',
      standardVersion: '2006 (E)',
      rulePackVersion: 'R76-2006-V1.0',
      overallResult: 'COMPLIANT' as const,
      laboratoryName: 'Regional Reference Standard Laboratory',
      leadMetrologistName: 'Dr. A. Sharma',
      applicantName: 'Delta Electronics',
      applicantAddress: 'Pune',
      manufacturerName: 'Delta Electronics Synthetic Corp',
      manufacturerCountry: 'India',
      manufacturerAddress: 'Pune Plant',
      modelName: 'Precision-Bench-B6',
      serialNumber: 'SN-PDF-001',
      accuracyClass: 'Class II',
      rangeType: 'Single Interval',
      maxCapacity: '6.0',
      minCapacity: '0.05',
      verificationInterval_e: '0.001',
      scaleInterval_d: '0.0002',
      numberOfIntervals_n: 6000,
      primaryUnit: 'kg',
      temperatureLimits: '+10 °C to +30 °C',
      powerSupply: '230 V AC',
      tareType: 'Subtractive',
      summaryMatrix: [],
      standardsUsed: [],
      testRuns: [],
      evidenceFiles: [],
    };

    const record = await ReportVerificationService.registerFinalizedReport(payload);
    const pdfSha256 = crypto.createHash('sha256').update(dummyPdfContent).digest('hex');
    await ReportVerificationService.registerPdfHash(record.verificationToken, pdfSha256);

    // Exact Match Test
    const exactResult = await ReportVerificationService.verifyPdfFile(
      record.verificationToken,
      dummyPdfContent,
      'Official_Report.pdf'
    );
    expect(exactResult.isExactMatch).toBe(true);
    expect(exactResult.outcome).toBe('EXACT_MATCH');
    expect(exactResult.message).toContain('EXACT ISSUED REPORT');
    expect(exactResult.computedSha256).toBe(pdfSha256);

    // Tampered / Modified File Test (even 1 altered byte)
    const tamperedPdfContent = Buffer.from(dummyPdfContent);
    tamperedPdfContent[10] = tamperedPdfContent[10] ^ 0xff; // Flip bits

    const tamperedResult = await ReportVerificationService.verifyPdfFile(
      record.verificationToken,
      tamperedPdfContent,
      'Modified_Report.pdf'
    );
    expect(tamperedResult.isExactMatch).toBe(false);
    expect(tamperedResult.outcome).toBe('MISMATCH');
    expect(tamperedResult.message).toContain('PDF DOES NOT MATCH ISSUED REPORT');
    expect(tamperedResult.computedSha256).not.toBe(pdfSha256);
  });
});

describe('Part D — Instrument Repository & Physical Specimen Intake', () => {
  it('18. registers a new specimen and rejects duplicate serial numbers', async () => {
    const { InstrumentRepositoryService } = await import('@/services/repository/instrument-repository-service');

    const uniqueSerial = `SN-INTAKE-TEST-${Date.now()}`;
    const intakeInput = {
      serialNumber: uniqueSerial,
      manufacturer: 'Apex Metrology',
      modelName: 'Precision-Bench-B6',
      instrumentCategory: 'BENCH' as const,
      accuracyClass: 'CLASS_II' as const,
      maxCapacity: 6.0,
      minCapacity: 0.05,
      verificationInterval_e: 0.001,
      scaleInterval_d: 0.0002,
      primaryUnit: 'kg',
      rangeType: 'SINGLE' as const,
      tareType: 'SUBTRACTIVE' as const,
      powerSupply: '230 V AC',
      temperatureRange: '+10 °C to +30 °C',
      receptorType: 'STANDARD_PAN' as const,
      softwareVersion: 'v1.4.2',
      intakeOfficer: 'Dr. A. Sharma',
    };

    // 1st Registration: Success
    const res1 = InstrumentRepositoryService.registerNewSpecimen(intakeInput);
    expect(res1.success).toBe(true);
    expect(res1.specimen?.serialNumber).toBe(uniqueSerial);
    expect(res1.specimen?.activeConfigurationRevision).toBe(1);

    // 2nd Registration with duplicate serial: Rejected
    const res2 = InstrumentRepositoryService.registerNewSpecimen(intakeInput);
    expect(res2.success).toBe(false);
    expect(res2.duplicateFound).toBe(true);
    expect(res2.error).toContain('is already registered in the laboratory repository');
    expect(res2.specimen?.serialNumber).toBe(uniqueSerial);
  });

  it('19. rejects invalid metrological parameters during intake', async () => {
    const { InstrumentRepositoryService } = await import('@/services/repository/instrument-repository-service');

    // Min >= Max
    const invalidMinMax = {
      serialNumber: `SN-INVALID-${Date.now()}`,
      manufacturer: 'Test Mfg',
      modelName: 'Precision-Bench-B6',
      instrumentCategory: 'BENCH' as const,
      accuracyClass: 'CLASS_II' as const,
      maxCapacity: 5.0,
      minCapacity: 10.0, // Invalid!
      verificationInterval_e: 0.001,
      scaleInterval_d: 0.001,
      primaryUnit: 'kg',
      rangeType: 'SINGLE' as const,
      tareType: 'SUBTRACTIVE' as const,
      powerSupply: '230 V AC',
      temperatureRange: '+10 °C to +30 °C',
      receptorType: 'STANDARD_PAN' as const,
      softwareVersion: 'v1.0.0',
      intakeOfficer: 'Dr. A. Sharma',
    };

    const res = InstrumentRepositoryService.registerNewSpecimen(invalidMinMax);
    expect(res.success).toBe(false);
    expect(res.error).toContain('Minimum capacity (Min) cannot be greater than or equal to Maximum capacity');
  });

  it('20. creates immutable configuration revisions without overwriting history', async () => {
    const { InstrumentRepositoryService } = await import('@/services/repository/instrument-repository-service');

    const specimenSerial = `SN-REV-TEST-${Date.now()}`;
    const intakeRes = InstrumentRepositoryService.registerNewSpecimen({
      serialNumber: specimenSerial,
      manufacturer: 'Apex Metrology',
      modelName: 'Precision-Bench-B6',
      instrumentCategory: 'BENCH' as const,
      accuracyClass: 'CLASS_II' as const,
      maxCapacity: 6.0,
      minCapacity: 0.05,
      verificationInterval_e: 0.001,
      scaleInterval_d: 0.0002,
      primaryUnit: 'kg',
      rangeType: 'SINGLE' as const,
      tareType: 'SUBTRACTIVE' as const,
      powerSupply: '230 V AC',
      temperatureRange: '+10 °C to +30 °C',
      receptorType: 'STANDARD_PAN' as const,
      softwareVersion: 'v1.0.0',
      intakeOfficer: 'Dr. A. Sharma',
    });

    const specimenId = intakeRes.specimen!.specimenId;

    // Update configuration to software v1.1.0
    const updateRes = InstrumentRepositoryService.updateSpecimenConfiguration(specimenId, {
      softwareVersion: 'v1.1.0',
      firmwareVersion: 'FW-202',
      changeReason: 'Firmware bugfix for tare indicator display',
      actor: 'M. Verma (Reviewer)',
    });

    expect(updateRes.success).toBe(true);
    expect(updateRes.newRevision?.revisionNumber).toBe(2);

    const updatedSpecimen = InstrumentRepositoryService.getSpecimenById(specimenId);
    expect(updatedSpecimen?.activeConfigurationRevision).toBe(2);
    expect(updatedSpecimen?.configurationRevisions).toHaveLength(2);
    // Baseline rev 1 must be preserved intact
    expect(updatedSpecimen?.configurationRevisions[0].softwareVersion).toBe('v1.0.0');
    expect(updatedSpecimen?.configurationRevisions[1].softwareVersion).toBe('v1.1.0');
  });
});

describe('Part E — Non-Authoritative Metrological Anomaly Detector', () => {
  it('21. flags identical readings across multiple distinct points as REVIEW RECOMMENDED', async () => {
    const { AnomalyDetectorService } = await import('@/core/test-engine/anomaly-detector');

    const testRun = {
      id: 'RUN-TEST-01',
      evaluationId: 'EVAL-01',
      testCode: 'R76_WEIGH_INTRINSIC',
      name: 'Weighing Performance',
      clause: 'A.4.4',
      purpose: 'Accuracy',
      instruction: '',
      pattern: 'PATTERN_A_MEASUREMENT_TABLE' as const,
      testDefinition: {} as any,
      procedureVersion: '1.0',
      operator: { fullName: 'Dr. Sharma', role: 'METROLOGIST' },
      startTime: new Date().toISOString(),
      status: 'PASS' as const,
      isApplicable: true,
      equipmentUsed: [],
      environmentalSnapshot: {} as any,
      rawObservations: [
        { load: 1.0, indication: 1.005, deltaL: 0.002 },
        { load: 2.0, indication: 1.005, deltaL: 0.002 },
        { load: 3.0, indication: 1.005, deltaL: 0.002 },
      ],
      calculatedValues: {},
      complianceResult: { verdict: 'PASS' as const, summaryStatement: '', failedPointsCount: 0, passedPointsCount: 3 },
      structuredRemarks: [],
      remarks: '',
      evidenceReferences: [],
      evidence: [],
      reviewState: 'UNREVIEWED' as const,
      validationMessages: [],
    };

    const flags = AnomalyDetectorService.detectAnomalies(testRun as any);
    expect(flags.length).toBeGreaterThan(0);
    expect(flags[0].severity).toBe('REVIEW_RECOMMENDED');
    expect(flags[0].type).toBe('IDENTICAL_READINGS');
    // Must NOT claim fraud
    expect(JSON.stringify(flags)).not.toContain('FRAUD');
  });

  it('22. flags suspicious perfect zero errors across all points as REVIEW RECOMMENDED', async () => {
    const { AnomalyDetectorService } = await import('@/core/test-engine/anomaly-detector');

    const testRun = {
      testCode: 'R76_WEIGH_INTRINSIC',
      rawObservations: [
        { load: 1.0, deltaL: 0, error: 0 },
        { load: 2.0, deltaL: 0, error: 0 },
        { load: 3.0, deltaL: 0, error: 0 },
        { load: 4.0, deltaL: 0, error: 0 },
      ],
      evidence: [],
    };

    const flags = AnomalyDetectorService.detectAnomalies(testRun as any);
    const zeroFlag = flags.find((f) => f.type === 'SUSPICIOUS_ZERO_ERROR');
    expect(zeroFlag).toBeDefined();
    expect(zeroFlag?.severity).toBe('REVIEW_RECOMMENDED');
    expect(zeroFlag?.description).toContain('ΔL = 0');
  });

  it('23. flags duplicate evidence artifacts as REVIEW RECOMMENDED', async () => {
    const { AnomalyDetectorService } = await import('@/core/test-engine/anomaly-detector');

    const testRun = {
      testCode: 'R76_ECCENTRICITY_STANDARD',
      rawObservations: [{ load: 5.0, indication: 5.002, deltaL: 0.001 }],
      evidence: [
        { id: 'ev-1', fileName: 'pan_center_photo.jpg', sha256Hash: 'hash-abc-123' },
        { id: 'ev-2', fileName: 'pan_center_photo.jpg', sha256Hash: 'hash-abc-123' },
      ],
    };

    const flags = AnomalyDetectorService.detectAnomalies(testRun as any);
    const dupFlag = flags.find((f) => f.type === 'REPEATED_EVIDENCE_FILE');
    expect(dupFlag).toBeDefined();
    expect(dupFlag?.severity).toBe('REVIEW_RECOMMENDED');
  });
});
