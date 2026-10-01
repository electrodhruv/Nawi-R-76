'use client';

import React, { useState } from 'react';
import {
  Download,
  ShieldAlert,
  Award,
} from 'lucide-react';
import { PdfReportBuilder } from '@/services/reports/pdf-builder';
import { DocxReportBuilder } from '@/services/reports/docx-builder';
import { ReportPayload } from '@/services/reports/report-types';

export const ReportExporter: React.FC = () => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingDocx, setIsGeneratingDocx] = useState(false);

  // Canonical OIML R 76-2 Report Payload for Avery AWT-3000-Retail
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
    applicantAddress: 'Plot 50-51, Sector 25, Ballabgarh, Faridabad, Haryana 121004',
    manufacturerName: 'Avery Weigh-Tronix India Pvt Ltd',
    manufacturerCountry: 'IN',
    manufacturerAddress: 'Plot 50-51, Sector 25, Ballabgarh, Faridabad, Haryana 121004',

    modelName: 'AWT-3000-Retail',
    tradeName: 'Point-of-Sale Computing Scale',
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
      { itemNumber: '1', clause: '3.10, 4.1', testTitle: 'Administrative & Markings Examination', isApplicable: true, status: 'Passed', justification: null },
      { itemNumber: '2', clause: '3.10, 4.1–18', testTitle: 'Technical Construction & Sealing', isApplicable: true, status: 'Passed', justification: null },
      { itemNumber: '3', clause: 'A.4.4', testTitle: 'Weighing Performance (Initial Intrinsic Error)', isApplicable: true, status: 'Passed', justification: null },
      { itemNumber: '4.1', clause: 'A.4.7.1–3', testTitle: 'Eccentricity with Standard Weights', isApplicable: true, status: 'Passed', justification: null },
      { itemNumber: '4.2', clause: 'A.4.7.4', testTitle: 'Eccentricity with Rolling Load', isApplicable: false, status: 'Not Applicable', justification: 'Instrument is a bench scale with standard pan; rolling track testing not applicable.' },
      { itemNumber: '4.3', clause: 'A.4.7.5', testTitle: 'Eccentricity on Mobile Instruments', isApplicable: false, status: 'Not Applicable', justification: 'Instrument installed on bench; mobile testing not applicable.' },
      { itemNumber: '5', clause: 'A.4.8', testTitle: 'Discrimination Test (1.4d addition)', isApplicable: true, status: 'Passed', justification: null },
      { itemNumber: '6', clause: 'A.4.10', testTitle: 'Repeatability Test (50% & 100% Max)', isApplicable: true, status: 'Passed', justification: null },
      { itemNumber: '7', clause: 'A.4.11.1', testTitle: 'Creep Test (Classes II, III, IIII)', isApplicable: true, status: 'Passed', justification: null },
      { itemNumber: '8', clause: 'A.4.11.2', testTitle: 'Zero Return Test (Residual Indication)', isApplicable: true, status: 'Passed', justification: null },
      { itemNumber: '9', clause: '4.4.2, A.4.12', testTitle: 'Stability of Equilibrium Test', isApplicable: true, status: 'Passed', justification: null },
      { itemNumber: '10', clause: 'A.5.1', testTitle: 'Tilting Sensitivity Test', isApplicable: true, status: 'Passed', justification: null },
      { itemNumber: '11', clause: 'A.5.2', testTitle: 'Warm-up Time Test', isApplicable: true, status: 'Passed', justification: null },
      { itemNumber: '12', clause: 'A.5.3', testTitle: 'Static Temperature Sequence', isApplicable: true, status: 'Passed', justification: null },
      { itemNumber: '13.1', clause: 'A.5.4.1', testTitle: 'Voltage Variation: AC Mains', isApplicable: true, status: 'Passed', justification: null },
      { itemNumber: '13.2', clause: 'A.5.4.3', testTitle: 'Voltage Variation: Internal Battery', isApplicable: true, status: 'Passed', justification: null },
      { itemNumber: '14', clause: 'B.2', testTitle: 'Damp Heat Steady State (48 h)', isApplicable: true, status: 'Passed', justification: null },
      { itemNumber: '15', clause: 'B.3.2', testTitle: 'Electrical Fast Transients (EFT)', isApplicable: true, status: 'Passed', justification: null },
      { itemNumber: '16', clause: 'B.3.3', testTitle: 'Electrostatic Discharge (ESD)', isApplicable: true, status: 'Passed', justification: null },
      { itemNumber: '17', clause: 'B.4', testTitle: 'Span Stability Test (28 Days)', isApplicable: true, status: 'Passed', justification: null },
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
          { seriesIndex: 1, stepIndex: 0, direction: 'INC', nominalLoad: '0.000', indicatedValue: '0.000', turningPoint_dL: '0.0025', calculated_P: '0.000', error_E: '0.000', zeroError_E0: '0.000', correctedError_Ec: '0.000', mpe: '0.0025', result: 'PASS', remarks: 'Zero datum' },
          { seriesIndex: 1, stepIndex: 1, direction: 'INC', nominalLoad: '0.100', indicatedValue: '0.100', turningPoint_dL: '0.0025', calculated_P: '0.100', error_E: '0.000', zeroError_E0: '0.000', correctedError_Ec: '0.000', mpe: '0.0025', result: 'PASS', remarks: 'Min' },
          { seriesIndex: 1, stepIndex: 2, direction: 'INC', nominalLoad: '2.500', indicatedValue: '2.500', turningPoint_dL: '0.0020', calculated_P: '2.5005', error_E: '+0.0005', zeroError_E0: '0.000', correctedError_Ec: '+0.0005', mpe: '0.0025', result: 'PASS', remarks: '500e boundary' },
          { seriesIndex: 1, stepIndex: 3, direction: 'INC', nominalLoad: '5.000', indicatedValue: '5.000', turningPoint_dL: '0.0025', calculated_P: '5.0000', error_E: '0.0000', zeroError_E0: '0.000', correctedError_Ec: '0.0000', mpe: '0.0050', result: 'PASS', remarks: '1000e' },
          { seriesIndex: 1, stepIndex: 4, direction: 'INC', nominalLoad: '10.000', indicatedValue: '10.000', turningPoint_dL: '0.0030', calculated_P: '9.9995', error_E: '-0.0005', zeroError_E0: '0.000', correctedError_Ec: '-0.0005', mpe: '0.0050', result: 'PASS', remarks: '2000e boundary' },
          { seriesIndex: 1, stepIndex: 5, direction: 'INC', nominalLoad: '15.000', indicatedValue: '15.000', turningPoint_dL: '0.0020', calculated_P: '15.0005', error_E: '+0.0005', zeroError_E0: '0.000', correctedError_Ec: '+0.0005', mpe: '0.0075', result: 'PASS', remarks: 'Max' },
        ],
      },
    ],

    standardsUsed: [
      {
        serialNumber: 'STD-F1-2024-015',
        name: 'Class F1 Precision Stainless Steel Set (1 g - 20 kg)',
        weightClass: 'F1',
        certificateNumber: 'RRSL-CAL-2024-F1-4412',
        calibratedBy: 'RRSL Ahmedabad (Accredited)',
        validUntil: '2027-03-31',
        uncertaintyOrError: 'U = 0.25 mg (k=2)',
      },
    ],

    evidenceFiles: [
      {
        id: 'ev-01-a44-zero-img',
        fileName: 'weighing_test_zero_indication.jpg',
        mimeType: 'image/jpeg',
        serverHashSha256: 'a1f89c44e98bc011234567890abcdef0123456789abcdef0123456789abcdef0',
        status: 'VERIFIED_BY_REVIEWER',
        capturedAt: '2026-09-27 10:15 UTC',
        verifiedBy: 'Dr. S. K. Nair',
      },
    ],
  };

  const handleDownloadPdf = () => {
    setIsGeneratingPdf(true);
    try {
      const pdfBytes = PdfReportBuilder.generatePdf(samplePayload);
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `OIML_R76_2_Report_${samplePayload.evaluationNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to generate PDF:', e);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadDocx = async () => {
    setIsGeneratingDocx(true);
    try {
      const docxBuffer = await DocxReportBuilder.generateDocx(samplePayload);
      const blob = new Blob([docxBuffer as unknown as BlobPart], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `OIML_R76_2_Report_${samplePayload.evaluationNumber}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to generate DOCX:', e);
    } finally {
      setIsGeneratingDocx(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Export Actions */}
      <div className="glass-panel p-5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-cyan-400" />
            <h1 className="text-base font-bold text-white tracking-tight">
              OIML R 76-2 Test Report (TRF) Generator
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Official laboratory evaluation report structured according to OIML R 76-2:2007 (E) with neutral legal disclaimer.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadDocx}
            disabled={isGeneratingDocx}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>{isGeneratingDocx ? 'Generating DOCX...' : 'Export DOCX'}</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white transition-colors shadow-sm shadow-cyan-600/30"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download Official PDF'}</span>
          </button>
        </div>
      </div>

      {/* Mandatory Legal Disclaimer Banner */}
      <div className="p-4 rounded-xl bg-red-950/30 border border-red-900/60 text-red-200 space-y-1.5">
        <div className="flex items-center gap-2 font-bold text-xs text-red-400 uppercase tracking-wide">
          <ShieldAlert className="w-4 h-4 text-red-400" />
          Mandatory Non-Authority Legal Disclaimer (OIML R 76-2 Clause 1)
        </div>
        <p className="text-xs text-red-300/90 italic leading-relaxed">
          &ldquo;This document is a laboratory-generated evaluation report structured according to the format of OIML R 76-2:2007. It reflects the experimental results obtained under the test procedures of OIML R 76-1:2006. This report does not constitute an official Certificate of Conformity or legal pattern approval, which may only be issued by the designated Statutory Metrology Authority.&rdquo;
        </p>
      </div>

      {/* Report Document Sheet Preview */}
      <div className="glass-panel rounded-xl border border-slate-800 p-6 space-y-6">
        {/* Title Header */}
        <div className="border-b border-slate-800 pb-4 flex items-start justify-between">
          <div>
            <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest font-semibold block">
              Pattern Evaluation Under OIML R 76-1:2006
            </span>
            <h2 className="text-xl font-bold text-white mt-1">Laboratory Type Evaluation Test Report</h2>
            <span className="text-xs text-slate-400">
              Evaluation Reference: <strong>{samplePayload.evaluationNumber}</strong> &bull; Rev {samplePayload.revisionNumber}
            </span>
          </div>

          <div className="text-right text-xs text-slate-400">
            <div>Testing Lab: <span className="text-white font-medium">{samplePayload.laboratoryName}</span></div>
            <div>Issue Date: <span className="text-white font-medium">{samplePayload.reportIssueDate}</span></div>
            <div>Rule Pack: <span className="text-cyan-400 font-mono">{samplePayload.rulePackVersion}</span></div>
          </div>
        </div>

        {/* Section 1: Instrument Data */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            1. Instrument Identification &amp; Metrological Specifications
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-900/60 p-4 rounded-lg border border-slate-800 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Manufacturer</span>
              <span className="text-white font-medium">{samplePayload.manufacturerName}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Model Name</span>
              <span className="text-white font-medium">{samplePayload.modelName}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Accuracy Class</span>
              <span className="text-cyan-400 font-semibold">{samplePayload.accuracyClass}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Capacity Max / Min</span>
              <span className="text-white font-medium">15 kg / 0.1 kg</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Interval e / d</span>
              <span className="text-white font-medium">5 g / 5 g (n = 3000)</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Tare Mechanism</span>
              <span className="text-white font-medium">Subtractive</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Temperature Range</span>
              <span className="text-white font-medium">-10 °C to +40 °C</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Power Supply</span>
              <span className="text-white font-medium">230 V AC + 6V Batt</span>
            </div>
          </div>
        </div>

        {/* Section 2: Summary Matrix */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            2. Summary of Results Matrix (OIML R 76-2 Items 1–17)
          </h3>
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase font-semibold">
                <tr>
                  <th className="px-3 py-2">Item #</th>
                  <th className="px-3 py-2">Clause</th>
                  <th className="px-3 py-2">Test Title</th>
                  <th className="px-3 py-2 text-center">Applicable</th>
                  <th className="px-3 py-2 text-center">Result</th>
                  <th className="px-3 py-2">Recorded Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300 text-[11px]">
                {samplePayload.summaryMatrix.slice(0, 8).map((item) => (
                  <tr key={item.itemNumber} className="hover:bg-slate-800/30">
                    <td className="px-3 py-2 font-mono font-bold text-white">{item.itemNumber}</td>
                    <td className="px-3 py-2 font-mono text-cyan-400">{item.clause}</td>
                    <td className="px-3 py-2 font-medium text-slate-200">{item.testTitle}</td>
                    <td className="px-3 py-2 text-center font-bold">
                      {item.isApplicable ? 'YES' : 'NO'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.status === 'Passed'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-400 text-[10px] italic">
                      {item.justification ?? 'Compliant with clause requirements'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Traceability and Attestation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
          <div className="bg-slate-900/60 p-4 rounded-lg border border-slate-800 space-y-2 text-xs">
            <span className="font-bold text-white block">Reference Standards Used (Clause 3.7.1)</span>
            <div className="text-slate-400">
              Serial No: <strong className="text-slate-200">STD-F1-2024-015</strong> (Class F1 Stainless Steel Set)<br />
              Calibration Cert: <strong className="text-slate-200">RRSL-CAL-2024-F1-4412</strong> &bull; Valid Until: 2027-03-31<br />
              Error / Uncertainty: <strong className="text-emerald-400">U = 0.25 mg (k=2) &le; 1/3 MPE</strong>
            </div>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-lg border border-slate-800 space-y-2 text-xs">
            <span className="font-bold text-white block">Attestation and Peer Sign-off</span>
            <div className="text-slate-400">
              Lead Testing Officer: <strong className="text-slate-200">Amit Verma</strong> (Accredited Metrologist)<br />
              Technical Reviewer: <strong className="text-slate-200">Dr. S. K. Nair</strong> (Peer Review Accepted)<br />
              Laboratory Signatory: <strong className="text-slate-200">Director General V. K. Malhotra</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
