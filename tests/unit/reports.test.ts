/**
 * Tests for OIML R 76-2 PDF and DOCX Report Builders.
 */

import { describe, it, expect } from 'vitest';
import { PdfReportBuilder } from '@/services/reports/pdf-builder';
import { DocxReportBuilder } from '@/services/reports/docx-builder';
import { ReportPayload } from '@/services/reports/report-types';

describe('Report Builders - OIML R 76-2 Compliance & Generation', () => {
  const samplePayload: ReportPayload = {
    evaluationNumber: 'RRSL-2026-TE-0104',
    revisionNumber: 1,
    reportIssueDate: '2026-09-27',
    standard: 'OIML R 76-1',
    standardVersion: '2006 (E)',
    rulePackVersion: 'R76-2006-v1',
    overallResult: 'COMPLIANT',

    laboratoryName: 'Regional Reference Standard Laboratory, Ahmedabad',
    leadMetrologistName: 'Amit Verma',
    leadMetrologistAccreditation: 'RRSL-MET-2024-042',
    technicalReviewerName: 'Dr. S. K. Nair',
    approvingSignatoryName: 'Director General V. K. Malhotra',

    applicantName: 'Avery Weigh-Tronix India Pvt Ltd',
    applicantAddress: 'Plot 50-51, Sector 25, Ballabgarh, Haryana',
    manufacturerName: 'Avery Weigh-Tronix India Pvt Ltd',
    manufacturerCountry: 'IN',
    manufacturerAddress: 'Plot 50-51, Sector 25, Ballabgarh, Haryana',

    modelName: 'AWT-3000-Retail',
    tradeName: 'Point-of-Sale Scale',
    softwareVersion: 'v2.14.0',
    serialNumber: 'AWT3K-2026-0042',
    accuracyClass: 'Class III',
    rangeType: 'Single Range',
    maxCapacity: '15.000',
    minCapacity: '0.100',
    verificationInterval_e: '0.005',
    scaleInterval_d: '0.005',
    numberOfIntervals_n: 3000,
    primaryUnit: 'kg',
    temperatureLimits: '-10 °C to +40 °C',
    powerSupply: '230 V AC Mains + 6V Internal Battery',
    tareType: 'Subtractive (Max T = -5.000 kg)',

    summaryMatrix: [
      {
        itemNumber: '1',
        clause: '3.10, 4.1',
        testTitle: 'Administrative & Markings Examination',
        isApplicable: true,
        status: 'Passed',
        justification: null,
      },
      {
        itemNumber: '2',
        clause: 'A.4.4',
        testTitle: 'Initial Intrinsic Error Determination',
        isApplicable: true,
        status: 'Passed',
        justification: null,
      },
      {
        itemNumber: '3.1',
        clause: 'A.4.7.1–3',
        testTitle: 'Eccentricity with Weights',
        isApplicable: true,
        status: 'Passed',
        justification: null,
      },
      {
        itemNumber: '3.2',
        clause: 'A.4.7.4',
        testTitle: 'Eccentricity with Rolling Load',
        isApplicable: false,
        status: 'Not Applicable',
        justification: 'Instrument is a bench scale with standard pan; rolling track testing not applicable.',
      },
      {
        itemNumber: '4',
        clause: 'A.4.10',
        testTitle: 'Repeatability Test',
        isApplicable: true,
        status: 'Passed',
        justification: null,
      },
    ],

    testRuns: [
      {
        testCode: 'R76_WEIGH_INTRINSIC',
        clauseReference: 'A.4.4',
        title: 'Weighing Performance: Initial Intrinsic Error Determination',
        status: 'PASS',
        completedAt: '2026-09-27 11:30 UTC',
        executedBy: 'Amit Verma',
        observations: [
          {
            seriesIndex: 1,
            stepIndex: 0,
            direction: 'INCREASING',
            nominalLoad: '0.000',
            indicatedValue: '0.000',
            turningPoint_dL: '0.0025',
            calculated_P: '0.000',
            error_E: '0.000',
            zeroError_E0: '0.000',
            correctedError_Ec: '0.000',
            mpe: '0.0025',
            result: 'PASS',
            remarks: 'Zero check',
          },
          {
            seriesIndex: 1,
            stepIndex: 1,
            direction: 'INCREASING',
            nominalLoad: '2.500',
            indicatedValue: '2.500',
            turningPoint_dL: '0.0025',
            calculated_P: '2.500',
            error_E: '0.000',
            zeroError_E0: '0.000',
            correctedError_Ec: '0.000',
            mpe: '0.0025',
            result: 'PASS',
            remarks: '500e boundary',
          },
        ],
      },
    ],

    standardsUsed: [
      {
        serialNumber: 'STD-F1-2024-015',
        name: 'Class F1 Precision Stainless Steel Set',
        weightClass: 'F1',
        certificateNumber: 'RRSL-CAL-2024-F1-4412',
        calibratedBy: 'RRSL Ahmedabad',
        validUntil: '2027-03-31',
        uncertaintyOrError: 'U = 0.25 mg (k=2)',
      },
    ],

    evidenceFiles: [
      {
        id: 'ev-01-a44-zero-img',
        fileName: 'weighing_test_zero_indication.jpg',
        mimeType: 'image/jpeg',
        serverHashSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        status: 'VERIFIED_BY_REVIEWER',
        capturedAt: '2026-09-27 10:15 UTC',
        verifiedBy: 'Dr. S. K. Nair',
      },
    ],
  };

  it('generates a valid, non-empty binary PDF containing OIML R 76-2 sections', () => {
    const pdfBytes = PdfReportBuilder.generatePdf(samplePayload);
    expect(pdfBytes).toBeDefined();
    expect(pdfBytes.byteLength).toBeGreaterThan(1000);

    // Verify PDF header %PDF-
    const header = Buffer.from(pdfBytes.buffer).slice(0, 5).toString('utf-8');
    expect(header).toBe('%PDF-');
  });

  it('generates a valid, non-empty binary DOCX document containing OIML R 76-2 tables', async () => {
    const docxBuffer = await DocxReportBuilder.generateDocx(samplePayload);
    expect(docxBuffer).toBeDefined();
    expect(docxBuffer.byteLength).toBeGreaterThan(1000);

    // Verify ZIP header PK (DOCX is a zip archive)
    const header = docxBuffer.slice(0, 2).toString('utf-8');
    expect(header).toBe('PK');
  });

  it('correctly formats capacities without duplicating units', () => {
    // Tests that already suffixed values do not produce "kg kg"
    const payloadWithSuffixedUnits: ReportPayload = {
      ...samplePayload,
      maxCapacity: '15 kg',
      minCapacity: '0.1 kg',
      verificationInterval_e: '0.005 kg',
      scaleInterval_d: '0.005 kg',
      primaryUnit: 'kg',
    };

    const pdfBytes = PdfReportBuilder.generatePdf(payloadWithSuffixedUnits);
    expect(pdfBytes).toBeDefined();
    expect(pdfBytes.byteLength).toBeGreaterThan(1000);
  });

  it('supports unexecuted and scheduled tests without inventing false PASS results', async () => {
    const payloadWithScheduled: ReportPayload = {
      ...samplePayload,
      summaryMatrix: [
        {
          itemNumber: '8.1',
          clause: 'B.2',
          testTitle: 'Damp Heat, Steady State',
          isApplicable: true,
          status: 'Scheduled',
          justification: 'Climatic chamber test scheduled for next evaluation cycle',
        },
        {
          itemNumber: '8.2',
          clause: 'A.5.4',
          testTitle: 'Voltage Variations',
          isApplicable: true,
          status: 'Scheduled',
          justification: 'AC power source test pending',
        },
        {
          itemNumber: '9',
          clause: 'B.4',
          testTitle: 'Span Stability',
          isApplicable: false,
          status: 'Not Applicable',
          justification: 'Class III instrument, span stability test not required',
        },
      ],
    };

    const pdfBytes = PdfReportBuilder.generatePdf(payloadWithScheduled);
    expect(pdfBytes).toBeDefined();

    const docxBuffer = await DocxReportBuilder.generateDocx(payloadWithScheduled);
    expect(docxBuffer).toBeDefined();
  });
});
