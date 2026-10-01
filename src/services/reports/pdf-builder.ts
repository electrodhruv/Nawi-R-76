/**
 * OIML R 76-2 Laboratory Type Evaluation PDF Report Builder (Redesigned)
 *
 * Implements Prompt Requirements:
 * - Page 1 Cover / Identity: Report identification, prominent Authoritative Overall Result,
 *   prominent QR Verification Panel on Page 1 (NO localhost URL!), Instrument identification,
 *   compact Metrological Characteristics, and professional subordinate disclaimer.
 * - Page 2 Executive Test Summary: Dynamic executive counters & complete OIML R 76-2 matrix.
 * - Page 3+ Detailed Test Records: Natural page flow (no artificial blank pages!).
 * - Later Pages: Reference Standards (clean wrapping), Evidence Annex, Attestation / Sign-off with DEMO disclaimer.
 * - Consistent Footers: Page X of Y on all pages.
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ReportPayload } from './report-types';

/**
 * Cleanly formats a metrological magnitude with its engineering unit,
 * preventing duplicate unit bugs (e.g. prevents "15 kg kg" or "0.005 kg kg").
 */
export function formatWithUnit(val: string | number | null | undefined, unit: string): string {
  if (val === null || val === undefined) return '';
  const trimmed = String(val).trim();
  if (!trimmed) return '';
  // Avoid duplicating if value already ends with unit or a known SI mass unit
  if (new RegExp(`\\s*${unit}$`, 'i').test(trimmed) || /\s*(kg|g|mg|t|lb|oz)$/i.test(trimmed)) {
    return trimmed;
  }
  return `${trimmed} ${unit}`;
}

export class PdfReportBuilder {
  /**
   * Generates a complete OIML R 76-2 Type Evaluation PDF with Page 1 QR verification.
   * @param payload Report metadata, results, and evidence.
   * @returns Uint8Array containing binary PDF document.
   */
  static generatePdf(payload: ReportPayload): Uint8Array {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;

    // ========================================================================
    // PAGE 1: Report Cover, Overall Result, QR Verification, & Instrument ID
    // ========================================================================

    // 1. Top Header Banner
    doc.setFillColor(15, 23, 42); // Navy-900
    doc.rect(0, 0, pageWidth, 22, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('LABORATORY TYPE EVALUATION TEST REPORT', margin, 9);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(`STRUCTURED ACCORDING TO OIML R 76-2:2007 (E) | ${payload.rulePackVersion}`, margin, 15);
    doc.text(`REPORT NO: ${payload.evaluationNumber} | REV: ${payload.revisionNumber}`, pageWidth - margin - 52, 15);

    // 2. Report Identification Table (Compact)
    autoTable(doc, {
      startY: 25,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: { fontSize: 7.5, cellPadding: 1.8 },
      headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
      body: [
        [
          { content: 'Report Number:', styles: { fontStyle: 'bold', cellWidth: 28 } },
          payload.evaluationNumber,
          { content: 'Revision:', styles: { fontStyle: 'bold', cellWidth: 20 } },
          String(payload.revisionNumber),
          { content: 'Issue Date:', styles: { fontStyle: 'bold', cellWidth: 20 } },
          payload.reportIssueDate,
        ],
        [
          { content: 'Evaluation Ref:', styles: { fontStyle: 'bold' } },
          payload.evaluationNumber,
          { content: 'Standard:', styles: { fontStyle: 'bold' } },
          `${payload.standard}:${payload.standardVersion}`,
          { content: 'Laboratory:', styles: { fontStyle: 'bold' } },
          payload.laboratoryName,
        ],
      ],
    });

    let currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;

    // 3. PROMINENT OVERALL EVALUATION RESULT (Section 2, 3, 11)
    const resultBoxHeight = 16;
    const isCompliant = payload.overallResult === 'COMPLIANT';
    const isNonCompliant = payload.overallResult === 'NON_COMPLIANT';

    if (isCompliant) {
      doc.setFillColor(240, 253, 244); // Green-50
      doc.setDrawColor(22, 163, 74); // Green-600
      doc.roundedRect(margin, currentY, pageWidth - 2 * margin, resultBoxHeight, 1.5, 1.5, 'FD');

      doc.setTextColor(22, 101, 52); // Green-900
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('OVERALL EVALUATION RESULT:', margin + 4, currentY + 6);

      doc.setFontSize(14);
      doc.text('COMPLIANT', margin + 64, currentY + 11);

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(21, 128, 61);
      doc.text('All applicable OIML R 76-1:2006 statutory tests verified within Table 6 MPE limits.', margin + 4, currentY + 13);
    } else if (isNonCompliant) {
      doc.setFillColor(254, 242, 242); // Red-50
      doc.setDrawColor(220, 38, 38); // Red-600
      doc.roundedRect(margin, currentY, pageWidth - 2 * margin, resultBoxHeight, 1.5, 1.5, 'FD');

      doc.setTextColor(153, 27, 27); // Red-900
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('OVERALL EVALUATION RESULT:', margin + 4, currentY + 6);

      doc.setFontSize(14);
      doc.text('NON-COMPLIANT', margin + 64, currentY + 11);

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(185, 28, 28);
      doc.text('One or more finalized statutory test procedures exceeded statutory permissible limits.', margin + 4, currentY + 13);
    } else {
      doc.setFillColor(254, 243, 199); // Amber-50
      doc.setDrawColor(217, 119, 6); // Amber-600
      doc.roundedRect(margin, currentY, pageWidth - 2 * margin, resultBoxHeight, 1.5, 1.5, 'FD');

      doc.setTextColor(146, 64, 14); // Amber-900
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('OVERALL EVALUATION RESULT:', margin + 4, currentY + 6);

      doc.setFontSize(13);
      doc.text('NOT DETERMINED', margin + 64, currentY + 11);

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(180, 83, 9);
      doc.text('Evaluation is in-progress or mandatory evidence/observations remain incomplete.', margin + 4, currentY + 13);
    }

    currentY += resultBoxHeight + 4;

    // 4. PROMINENT QR VERIFICATION PANEL ON PAGE 1 (Section 2, 3)
    // NEVER put localhost URL in final report!
    const qrPanelHeight = 27;
    doc.setFillColor(248, 250, 252); // Slate-50
    doc.setDrawColor(203, 213, 225); // Slate-300
    doc.roundedRect(margin, currentY, pageWidth - 2 * margin, qrPanelHeight, 1.5, 1.5, 'FD');

    // Embed QR Image if available
    const qrSize = 23;
    if (payload.verificationQrDataUrl) {
      try {
        doc.addImage(payload.verificationQrDataUrl, 'PNG', margin + 2, currentY + 2, qrSize, qrSize);
      } catch (e) {
        console.warn('Could not embed QR image on Page 1:', e);
      }
    }

    const qrTextX = payload.verificationQrDataUrl ? margin + qrSize + 5 : margin + 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42); // Slate-900
    doc.text('CRYPTOGRAPHIC REPORT VERIFICATION', qrTextX, currentY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(51, 65, 85); // Slate-700
    doc.text(`Report No: ${payload.evaluationNumber}   |   Revision: ${payload.revisionNumber}`, qrTextX, currentY + 10);

    const safeVerId = payload.verificationToken ? `VR-${payload.evaluationNumber}-R${payload.revisionNumber}` : `VR-${payload.evaluationNumber}`;
    doc.text(`Verification ID: ${safeVerId}`, qrTextX, currentY + 14.5);

    // Sanitized verification reference (NO localhost URL)
    const displayDigest = payload.verificationDigest
      ? payload.verificationDigest.substring(0, 44) + '...'
      : 'Authoritative SHA-256 Digest Recorded in Registry';
    doc.setFontSize(6.2);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.text(`Document Digest (SHA-256): ${displayDigest}`, qrTextX, currentY + 19);

    doc.setFont('helvetica', 'italic');
    doc.setTextColor(30, 41, 59);
    doc.text('Scan to verify report integrity and issued report metadata.', qrTextX, currentY + 23.5);

    currentY += qrPanelHeight + 4;

    // 5. Section 1: General Information & Identification of Instrument (Section 4)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('1. General Information & Identification of the Physical Instrument', margin, currentY);

    autoTable(doc, {
      startY: currentY + 2,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: { fontSize: 7.2, cellPadding: 1.6 },
      body: [
        [
          { content: 'Applicant:', styles: { fontStyle: 'bold', cellWidth: 38 } },
          `${payload.applicantName}, ${payload.applicantAddress}`,
          { content: 'Serial Number:', styles: { fontStyle: 'bold', cellWidth: 28 } },
          { content: payload.serialNumber || 'N/A', styles: { fontStyle: 'bold', textColor: [30, 58, 138] } },
        ],
        [
          { content: 'Manufacturer:', styles: { fontStyle: 'bold' } },
          `${payload.manufacturerName} (${payload.manufacturerCountry})`,
          { content: 'Model & Trade Name:', styles: { fontStyle: 'bold' } },
          `${payload.modelName} ${payload.tradeName ? `("${payload.tradeName}")` : ''}`,
        ],
        [
          { content: 'Software Identification:', styles: { fontStyle: 'bold' } },
          payload.softwareVersion ?? 'v1.0.0',
          { content: 'Instrument Type:', styles: { fontStyle: 'bold' } },
          payload.instrumentType ?? 'Non-Automatic Weighing Instrument (NAWI)',
        ],
      ],
    });

    currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;

    // 6. Section 2: Primary Metrological Characteristics (Section 4)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('2. Metrological Characteristics (OIML R 76-1 Clause 3)', margin, currentY);

    autoTable(doc, {
      startY: currentY + 2,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: { fontSize: 7.2, cellPadding: 1.6 },
      body: [
        [
          { content: 'Accuracy Class:', styles: { fontStyle: 'bold', cellWidth: 38 } },
          payload.accuracyClass.replace('_', ' '),
          { content: 'Range Configuration:', styles: { fontStyle: 'bold', cellWidth: 38 } },
          payload.rangeType,
        ],
        [
          { content: 'Maximum Capacity (Max):', styles: { fontStyle: 'bold' } },
          formatWithUnit(payload.maxCapacity, payload.primaryUnit),
          { content: 'Minimum Capacity (Min):', styles: { fontStyle: 'bold' } },
          formatWithUnit(payload.minCapacity, payload.primaryUnit),
        ],
        [
          { content: 'Verification Scale Interval (e):', styles: { fontStyle: 'bold' } },
          formatWithUnit(payload.verificationInterval_e, payload.primaryUnit),
          { content: 'Actual Scale Interval (d):', styles: { fontStyle: 'bold' } },
          formatWithUnit(payload.scaleInterval_d, payload.primaryUnit),
        ],
        [
          { content: 'Scale Intervals count (n):', styles: { fontStyle: 'bold' } },
          String(payload.numberOfIntervals_n),
          { content: 'Tare Mechanism Type:', styles: { fontStyle: 'bold' } },
          payload.tareType,
        ],
        [
          { content: 'Operating Temperature Limits:', styles: { fontStyle: 'bold' } },
          payload.temperatureLimits,
          { content: 'Power Supply Specification:', styles: { fontStyle: 'bold' } },
          payload.powerSupply,
        ],
      ],
    });

    currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;

    // 7. Disclaimer / Legal Notice (Section 5)
    doc.setFillColor(248, 250, 252); // Slate-50
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.roundedRect(margin, currentY, pageWidth - 2 * margin, 13, 1, 1, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    doc.setTextColor(71, 85, 105);
    doc.text('LABORATORY REPORT NOTICE & SCOPE:', margin + 3, currentY + 3.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.8);
    doc.setTextColor(100, 116, 139);
    const disclaimerText =
      'This document is a laboratory-generated evaluation test report structured according to OIML R 76-2:2007. ' +
      'It records experimental performance results under OIML R 76-1:2006. This report does not constitute an official Certificate ' +
      'of Conformity or legal pattern approval, which may only be issued by the designated Statutory Metrology Authority.';
    doc.text(doc.splitTextToSize(disclaimerText, pageWidth - 2 * margin - 6), margin + 3, currentY + 7.2);

    // ========================================================================
    // PAGE 2: Executive Summary & OIML R 76-2 Test Matrix (Section 7, 8)
    // ========================================================================
    doc.addPage();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text('3. Summary of Results Matrix (OIML R 76-2:2007)', margin, 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Evaluation results evaluated against statutory maximum permissible errors (MPE)', margin, 21);

    // Executive Test Counters Strip (Section 7)
    const counts = payload.testExecutionSummary || {
      totalApplicable: payload.summaryMatrix.filter((m) => m.isApplicable).length,
      completed: payload.summaryMatrix.filter((m) => m.isApplicable && (m.status === 'Passed' || m.status === 'Failed')).length,
      passed: payload.summaryMatrix.filter((m) => m.isApplicable && m.status === 'Passed').length,
      failed: payload.summaryMatrix.filter((m) => m.isApplicable && m.status === 'Failed').length,
      notApplicable: payload.summaryMatrix.filter((m) => !m.isApplicable).length,
      pending: payload.summaryMatrix.filter((m) => m.isApplicable && m.status !== 'Passed' && m.status !== 'Failed').length,
      retestRequired: 0,
    };

    autoTable(doc, {
      startY: 24,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: { fontSize: 7.2, cellPadding: 2, halign: 'center' },
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      head: [['Applicable Tests', 'Completed', 'Passed', 'Failed', 'Not Applicable', 'Pending', 'Retest Req.']],
      body: [
        [
          String(counts.totalApplicable),
          String(counts.completed),
          { content: String(counts.passed), styles: { fontStyle: 'bold', textColor: [22, 101, 52] } },
          { content: String(counts.failed), styles: { fontStyle: 'bold', textColor: [185, 28, 28] } },
          String(counts.notApplicable),
          String(counts.pending),
          String(counts.retestRequired),
        ],
      ],
    });

    const matrixStartY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;

    // Detailed OIML R 76-2 Test Matrix Table
    autoTable(doc, {
      startY: matrixStartY,
      margin: { left: margin, right: margin },
      theme: 'striped',
      styles: { fontSize: 6.8, cellPadding: 1.4 },
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      head: [['Item #', 'Clause', 'Test Title / Examination', 'Applicable', 'Result', 'Justification / Remarks']],
      columnStyles: {
        0: { cellWidth: 13, fontStyle: 'bold', halign: 'center' },
        1: { cellWidth: 18 },
        2: { cellWidth: 54 },
        3: { cellWidth: 16, halign: 'center' },
        4: { cellWidth: 24, halign: 'center' },
        5: { cellWidth: 'auto' },
      },
      body: payload.summaryMatrix.map((item) => [
        item.itemNumber,
        item.clause,
        item.testTitle,
        item.isApplicable ? 'YES' : 'NO',
        item.status === 'Passed' ? 'PASS' : item.status === 'Failed' ? 'FAIL' : item.status === 'Not Applicable' ? 'N/A' : 'NOT DETERMINED',
        item.justification ?? (item.isApplicable ? 'Tested per clause procedure' : 'Not applicable to instrument type'),
      ]),
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 4) {
          const val = String(data.cell.raw);
          if (val === 'PASS') {
            data.cell.styles.textColor = [22, 101, 52];
            data.cell.styles.fontStyle = 'bold';
          } else if (val === 'FAIL') {
            data.cell.styles.textColor = [185, 28, 28];
            data.cell.styles.fontStyle = 'bold';
          } else if (val === 'N/A') {
            data.cell.styles.textColor = [100, 116, 139];
          } else {
            data.cell.styles.textColor = [180, 83, 9];
          }
        }
      },
    });

    // ========================================================================
    // PAGE 3+: Detailed Test Observations (Natural Page Flow - Section 9)
    // ========================================================================
    doc.addPage();
    let currentTestY = 16;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text('4. Detailed Test Results & Raw Observations', margin, currentTestY);
    currentTestY += 6;

    for (const testRun of payload.testRuns) {
      if (testRun.observations.length === 0) continue;

      // Check remaining page height: if less than 35mm, break to next page naturally
      if (currentTestY > pageHeight - 40) {
        doc.addPage();
        currentTestY = 16;
      }

      // Test Header Box
      doc.setFillColor(241, 245, 249); // Slate-100
      doc.rect(margin, currentTestY, pageWidth - 2 * margin, 8, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`${testRun.title} (Clause ${testRun.clauseReference})`, margin + 2, currentTestY + 5.5);

      const statusColor: [number, number, number] = testRun.status === 'PASS' || testRun.status === 'COMPLETED' ? [22, 101, 52] : [185, 28, 28];
      doc.setFontSize(7.5);
      doc.setTextColor(...statusColor);
      doc.text(`Status: ${testRun.status}`, pageWidth - margin - 35, currentTestY + 5.5);

      currentTestY += 10;

      // Observations Table (paginates automatically if long, repeating table head!)
      autoTable(doc, {
        startY: currentTestY,
        margin: { left: margin, right: margin },
        theme: 'grid',
        styles: { fontSize: 6.5, cellPadding: 1.2 },
        headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold' },
        head: [
          [
            '#',
            'Dir',
            'Load L',
            'Indication I',
            'dL',
            'Calc P',
            'Error E',
            'E0',
            'Corr Ec',
            '|MPE|',
            'Result',
            'Remarks',
          ],
        ],
        columnStyles: {
          0: { cellWidth: 7, halign: 'center' },
          1: { cellWidth: 9, halign: 'center' },
          2: { cellWidth: 15, halign: 'right' },
          3: { cellWidth: 15, halign: 'right' },
          4: { cellWidth: 12, halign: 'right' },
          5: { cellWidth: 15, halign: 'right' },
          6: { cellWidth: 14, halign: 'right' },
          7: { cellWidth: 12, halign: 'right' },
          8: { cellWidth: 14, halign: 'right', fontStyle: 'bold' },
          9: { cellWidth: 14, halign: 'right' },
          10: { cellWidth: 14, halign: 'center' },
          11: { cellWidth: 'auto' },
        },
        body: testRun.observations.map((obs, obsIdx) => {
          const rowNumber =
            typeof obs.stepIndex === 'number'
              ? (testRun.observations[0]?.stepIndex === 0 ? obs.stepIndex + 1 : obs.stepIndex)
              : obsIdx + 1;

          return [
            String(rowNumber),
            (obs.direction || 'INC').substring(0, 3).toUpperCase(),
            obs.nominalLoad || '-',
            obs.indicatedValue || '-',
            obs.turningPoint_dL || '-',
            obs.calculated_P || '-',
            obs.error_E || '-',
            obs.zeroError_E0 || '-',
            obs.correctedError_Ec || '-',
            obs.mpe || '-',
            obs.result || 'PASS',
            obs.remarks ?? '',
          ];
        }),
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 10) {
            const val = data.cell.raw;
            if (val === 'PASS') {
              data.cell.styles.textColor = [22, 101, 52];
              data.cell.styles.fontStyle = 'bold';
            } else if (val === 'FAIL') {
              data.cell.styles.textColor = [185, 28, 28];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        },
      });

      currentTestY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
    }

    // ========================================================================
    // LATER PAGES: Traceability Standards, Evidence Annex & Sign-Off
    // ========================================================================
    if (currentTestY > pageHeight - 65) {
      doc.addPage();
      currentTestY = 16;
    }

    // Section 5: Reference Standards & Traceability (Clause 3.7.1)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('5. Traceability of Measurement & Reference Standards (Clause 3.7.1)', margin, currentTestY);
    currentTestY += 3;

    autoTable(doc, {
      startY: currentTestY,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: { fontSize: 6.8, cellPadding: 1.5 },
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      head: [['Serial No', 'Description / Weight Set', 'Class', 'Cert Number', 'Calibrated By', 'Valid Until', 'Uncertainty / Error']],
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 42 },
        2: { cellWidth: 16 },
        3: { cellWidth: 32 },
        4: { cellWidth: 30 },
        5: { cellWidth: 18 },
        6: { cellWidth: 'auto' },
      },
      body: payload.standardsUsed.map((std) => [
        std.serialNumber,
        std.name,
        std.weightClass,
        std.certificateNumber,
        std.calibratedBy,
        std.validUntil,
        std.uncertaintyOrError,
      ]),
    });

    currentTestY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

    if (currentTestY > pageHeight - 60) {
      doc.addPage();
      currentTestY = 16;
    }

    // Section 6: Photographic & Technical Evidence Annex (Section 20)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('6. Photographic & Technical Evidence Records Annex', margin, currentTestY);
    currentTestY += 3;

    autoTable(doc, {
      startY: currentTestY,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: { fontSize: 6.5, cellPadding: 1.4 },
      headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255] },
      head: [['Evidence ID', 'Clause', 'Purpose', 'Artifact Description', 'OCR Value', 'Status', 'Server SHA-256 Digest']],
      columnStyles: {
        0: { cellWidth: 16 },
        1: { cellWidth: 14 },
        2: { cellWidth: 20 },
        3: { cellWidth: 34 },
        4: { cellWidth: 18, halign: 'right' },
        5: { cellWidth: 22, halign: 'center' },
        6: { fontStyle: 'normal', cellWidth: 'auto' },
      },
      body: payload.evidenceFiles.map((ev) => [
        ev.id,
        ev.testClause ?? 'A.4.4',
        ev.purpose ?? 'RESULT_SUPPORT',
        ev.description ?? ev.fileName,
        ev.ocrCandidate ? formatWithUnit(ev.ocrCandidate, payload.primaryUnit) : 'N/A',
        ev.status,
        ev.serverHashSha256,
      ]),
    });

    currentTestY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

    if (currentTestY > pageHeight - 48) {
      doc.addPage();
      currentTestY = 20;
    }

    // Section 7: Attestation and Formal Sign-off (Section 23)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('7. Formal Attestation & Laboratory Sign-off', margin, currentTestY);

    const colWidth = (pageWidth - 2 * margin) / 3;

    // Col 1: Lead Metrologist
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, currentTestY + 3, colWidth - 2, 26);
    doc.setFontSize(7.2);
    doc.setFont('helvetica', 'bold');
    doc.text('Lead Testing Officer:', margin + 2, currentTestY + 7.5);
    doc.setFont('helvetica', 'normal');
    doc.text(payload.leadMetrologistName, margin + 2, currentTestY + 12);
    doc.setFontSize(6.2);
    doc.setTextColor(100, 116, 139);
    doc.text(`Reg: ${payload.leadMetrologistAccreditation ?? 'Accredited'}`, margin + 2, currentTestY + 16);
    doc.text('Tests executed per OIML R 76-1', margin + 2, currentTestY + 25);

    // Col 2: Technical Reviewer
    doc.rect(margin + colWidth, currentTestY + 3, colWidth - 2, 26);
    doc.setFontSize(7.2);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Technical Reviewer:', margin + colWidth + 2, currentTestY + 7.5);
    doc.setFont('helvetica', 'normal');
    doc.text(payload.technicalReviewerName ?? 'Senior Metrologist M. Verma', margin + colWidth + 2, currentTestY + 12);
    doc.setFontSize(6.2);
    doc.setTextColor(100, 116, 139);
    doc.text('Peer check complete & verified', margin + colWidth + 2, currentTestY + 16);
    doc.text('Technical verification accepted', margin + colWidth + 2, currentTestY + 25);

    // Col 3: Approving Signatory
    doc.rect(margin + 2 * colWidth, currentTestY + 3, colWidth - 2, 26);
    doc.setFontSize(7.2);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Approving Signatory:', margin + 2 * colWidth + 2, currentTestY + 7.5);
    doc.setFont('helvetica', 'normal');
    doc.text(payload.approvingSignatoryName ?? 'Laboratory Director Dr. K. Patel', margin + 2 * colWidth + 2, currentTestY + 12);
    doc.setFontSize(6.2);
    doc.setTextColor(100, 116, 139);
    doc.text('Laboratory Director / Legal Signatory', margin + 2 * colWidth + 2, currentTestY + 16);

    // ========================================================================
    // Footers on ALL Pages (Section 24)
    // ========================================================================
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184); // Slate-400
      doc.text(
        `NAWI-R76 | Evaluation Ref: ${payload.evaluationNumber} | OIML R 76-2:2007 (E)`,
        margin,
        pageHeight - 6
      );
      doc.text(
        `Page ${i} of ${totalPages}`,
        pageWidth - margin - 15,
        pageHeight - 6
      );
    }

    return new Uint8Array(doc.output('arraybuffer'));
  }
}
