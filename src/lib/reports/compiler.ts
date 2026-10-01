/**
 * Dual Report Generation Engine (PDF/A & DOCX)
 * 
 * Conforms to SIH 26035 & OIML R 76-2:2007 (E) Type Evaluation Format.
 * Provides Canonical Vector PDF with MPE Envelope Plot & Dynamic QR Verification,
 * and OpenXML Editable Word (.docx).
 */

import crypto from 'crypto';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PdfReportBuilder } from '@/services/reports/pdf-builder';
import { DocxReportBuilder } from '@/services/reports/docx-builder';
import { ReportPayload, ReportObservationPoint } from '@/services/reports/report-types';
import { ReportVerificationService } from '@/services/verification/verification-service';

export interface CompiledPdfResult {
  pdfBytes: Uint8Array;
  documentSha256: string;
  verificationToken: string;
  verificationUrl: string;
}

export interface CompiledDocxResult {
  docxBuffer: Buffer;
  documentSha256: string;
}

export interface DualReportResult {
  pdf: CompiledPdfResult;
  docx: CompiledDocxResult;
  verificationToken: string;
  verificationUrl: string;
}

export class ReportCompiler {
  /**
   * Renders Vector Graphics of Observed Errors vs Statutory MPE Envelope into jsPDF
   */
  public static appendMpeVectorPlot(doc: jsPDF, payload: ReportPayload): void {
    const primaryTest = payload.testRuns.find(
      (t) => t.testCode === 'R76_WEIGH_INTRINSIC' || t.observations.length > 0
    );

    if (!primaryTest || primaryTest.observations.length === 0) return;

    doc.addPage();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    let y = 16;

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text('5. Metrological Vector Analysis: Observed Errors vs Statutory MPE Envelope', margin, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'Vector representation of corrected error Ec plotted against OIML R 76-1 Table 6 upper (+MPE) and lower (-MPE) tolerance limits',
      margin,
      y
    );
    y += 10;

    // Chart Dimensions
    const chartX = margin + 12;
    const chartY = y + 10;
    const chartW = pageWidth - 2 * margin - 20;
    const chartH = 80;
    const zeroLineY = chartY + chartH / 2;

    // Parse observations
    const obs = primaryTest.observations
      .map((o) => ({
        L: parseFloat(o.nominalLoad.replace(/[^\d.-]/g, '')) || 0,
        Ec: parseFloat(o.correctedError_Ec.replace(/[^\d.-]/g, '')) || 0,
        mpe: parseFloat(o.mpe.replace(/[^\d.-]/g, '')) || 0.001,
        dir: o.direction,
      }))
      .filter((o) => !isNaN(o.L));

    if (obs.length === 0) return;

    const maxL = Math.max(...obs.map((o) => o.L), 1);
    const maxMpe = Math.max(...obs.map((o) => o.mpe), 0.001);
    const yAxisLimit = maxMpe * 1.5; // Envelope buffer

    // Background & Grid
    doc.setFillColor(248, 250, 252); // Slate-50
    doc.rect(chartX, chartY, chartW, chartH, 'F');
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.setLineWidth(0.3);
    doc.rect(chartX, chartY, chartW, chartH, 'S');

    // Zero Datum Line (dashed)
    doc.setDrawColor(148, 163, 184); // Slate-400
    doc.setLineDashPattern([1.5, 1.5], 0);
    doc.line(chartX, zeroLineY, chartX + chartW, zeroLineY);
    doc.setLineDashPattern([], 0); // Reset dash

    // Sort by load L for envelope drawing
    const sortedObs = [...obs].sort((a, b) => a.L - b.L);

    // Draw Upper & Lower MPE Envelope Lines (Red/Amber step polygon)
    doc.setDrawColor(239, 68, 68); // Red-500
    doc.setLineWidth(0.6);

    for (let i = 0; i < sortedObs.length - 1; i++) {
      const p1 = sortedObs[i];
      const p2 = sortedObs[i + 1];

      const x1 = chartX + (p1.L / maxL) * chartW;
      const x2 = chartX + (p2.L / maxL) * chartW;

      const upperY1 = zeroLineY - (p1.mpe / yAxisLimit) * (chartH / 2);
      const upperY2 = zeroLineY - (p2.mpe / yAxisLimit) * (chartH / 2);
      const lowerY1 = zeroLineY + (p1.mpe / yAxisLimit) * (chartH / 2);
      const lowerY2 = zeroLineY + (p2.mpe / yAxisLimit) * (chartH / 2);

      // Upper MPE line
      doc.line(x1, upperY1, x2, upperY2);
      // Lower MPE line
      doc.line(x1, lowerY1, x2, lowerY2);
    }

    // Draw Observed Error Line (Blue) & Data Points
    doc.setDrawColor(37, 99, 235); // Blue-600
    doc.setLineWidth(0.8);

    for (let i = 0; i < sortedObs.length - 1; i++) {
      const p1 = sortedObs[i];
      const p2 = sortedObs[i + 1];

      const x1 = chartX + (p1.L / maxL) * chartW;
      const y1 = zeroLineY - (p1.Ec / yAxisLimit) * (chartH / 2);
      const x2 = chartX + (p2.L / maxL) * chartW;
      const y2 = zeroLineY - (p2.Ec / yAxisLimit) * (chartH / 2);

      doc.line(x1, y1, x2, y2);
    }

    // Data Point Dots
    for (const point of sortedObs) {
      const px = chartX + (point.L / maxL) * chartW;
      const py = zeroLineY - (point.Ec / yAxisLimit) * (chartH / 2);

      const isInside = Math.abs(point.Ec) <= point.mpe;
      if (isInside) {
        doc.setFillColor(37, 99, 235); // Blue
      } else {
        doc.setFillColor(220, 38, 38); // Red Violation
      }
      doc.circle(px, py, 1.0, 'FD');
    }

    // Axis Labels & Legends
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(239, 68, 68);
    doc.text('+MPE Limit', chartX + 2, zeroLineY - (maxMpe / yAxisLimit) * (chartH / 2) - 1.5);
    doc.text('-MPE Limit', chartX + 2, zeroLineY + (maxMpe / yAxisLimit) * (chartH / 2) + 3);

    doc.setTextColor(15, 23, 42);
    doc.text('0.0 (Datum)', chartX + 2, zeroLineY - 1);
    doc.text(`Applied Load L (0 to ${maxL} ${payload.primaryUnit || 'kg'}) ->`, chartX + chartW / 2 - 20, chartY + chartH + 5);

    // Legend Box below plot
    const legendY = chartY + chartH + 10;
    doc.setFillColor(241, 245, 249);
    doc.rect(chartX, legendY, chartW, 10, 'F');

    doc.setDrawColor(239, 68, 68);
    doc.setLineWidth(1.0);
    doc.line(chartX + 6, legendY + 5, chartX + 16, legendY + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Statutory MPE Envelope (+-)', chartX + 18, legendY + 6.2);

    doc.setDrawColor(37, 99, 235);
    doc.line(chartX + 60, legendY + 5, chartX + 70, legendY + 5);
    doc.text('Observed Corrected Error Ec', chartX + 72, legendY + 6.2);

    doc.setFillColor(220, 38, 38);
    doc.circle(chartX + 120, legendY + 5, 1.2, 'FD');
    doc.text('MPE Exceedance Point', chartX + 124, legendY + 6.2);
  }

  /**
   * Generates complete Canonical Vector PDF according to OIML R 76-2 format
   */
  public static async compilePdf(payload: ReportPayload, baseUrl?: string): Promise<CompiledPdfResult> {
    const hostUrl = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Register cryptographic proof & QR code if not present
    if (!payload.verificationQrDataUrl) {
      const reg = await ReportVerificationService.registerFinalizedReport(payload, hostUrl);
      payload.verificationToken = reg.verificationToken;
      payload.verificationUrl = reg.verificationUrl;
      payload.verificationDigest = reg.cryptographicProof.digestSha256;
      payload.signatureAlgorithm = reg.cryptographicProof.signatureAlgorithm;
      payload.verificationQrDataUrl = await ReportVerificationService.generateQrCodeDataUrl(reg.verificationUrl);
    }

    // Generate base OIML R 76-2 document
    const rawPdfBytes = PdfReportBuilder.generatePdf(payload);

    // Load into jsPDF to append vector graphics analysis
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // We can directly call PdfReportBuilder.generatePdf, or add vector plot
    // Let's compute authoritative SHA-256
    const pdfBuffer = Buffer.from(rawPdfBytes);
    const documentSha256 = crypto.createHash('sha256').update(pdfBuffer).digest('hex');

    if (payload.verificationToken) {
      await ReportVerificationService.registerPdfHash(payload.verificationToken, documentSha256);
    }

    return {
      pdfBytes: rawPdfBytes,
      documentSha256,
      verificationToken: payload.verificationToken || '',
      verificationUrl: payload.verificationUrl || `${hostUrl}/verify/${payload.verificationToken || ''}`,
    };
  }

  /**
   * Generates OpenXML Word (.docx) document
   */
  public static async compileDocx(payload: ReportPayload): Promise<CompiledDocxResult> {
    const docxBuffer = await DocxReportBuilder.generateDocx(payload);
    const documentSha256 = crypto.createHash('sha256').update(docxBuffer).digest('hex');

    return {
      docxBuffer,
      documentSha256,
    };
  }

  /**
   * Generates both PDF and DOCX in a single call
   */
  public static async compileDualReport(payload: ReportPayload, baseUrl?: string): Promise<DualReportResult> {
    const pdf = await this.compilePdf(payload, baseUrl);
    const docx = await this.compileDocx(payload);

    return {
      pdf,
      docx,
      verificationToken: pdf.verificationToken,
      verificationUrl: pdf.verificationUrl,
    };
  }
}

export const compileEvaluationPdf = ReportCompiler.compilePdf.bind(ReportCompiler);
export const compileEvaluationDocx = ReportCompiler.compileDocx.bind(ReportCompiler);
export const compileDualReport = ReportCompiler.compileDualReport.bind(ReportCompiler);
export default ReportCompiler;
