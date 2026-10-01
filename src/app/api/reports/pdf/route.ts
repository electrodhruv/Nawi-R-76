import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { PdfReportBuilder } from '@/services/reports/pdf-builder';
import { ReportPayload } from '@/services/reports/report-types';
import { ReportVerificationService } from '@/services/verification/verification-service';

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as ReportPayload;

    // Attach digital verification QR and cryptographic proof if not already supplied
    if (!payload.verificationQrDataUrl) {
      const host = req.headers.get('host') || 'localhost:3000';
      const protocol = req.headers.get('x-forwarded-proto') || 'http';
      const baseUrl = `${protocol}://${host}`;

      const record = await ReportVerificationService.registerFinalizedReport(payload, baseUrl);
      payload.verificationToken = record.verificationToken;
      payload.verificationUrl = record.verificationUrl;
      payload.verificationDigest = record.cryptographicProof.digestSha256;
      payload.signatureAlgorithm = record.cryptographicProof.signatureAlgorithm;
      payload.verificationQrDataUrl = await ReportVerificationService.generateQrCodeDataUrl(record.verificationUrl);
    }

    const pdfData = PdfReportBuilder.generatePdf(payload);

    // Compute cryptographic SHA-256 of final PDF bytes and register with verification service
    if (payload.verificationToken) {
      const pdfBuffer = Buffer.from(pdfData);
      const pdfSha256 = crypto.createHash('sha256').update(pdfBuffer).digest('hex');
      await ReportVerificationService.registerPdfHash(payload.verificationToken, pdfSha256);
    }

    return new Response(pdfData as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="OIML_R76_Report_${payload.evaluationNumber || 'Evaluation'}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF report:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
