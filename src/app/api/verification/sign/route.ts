import { NextRequest, NextResponse } from 'next/server';
import { ReportVerificationService } from '@/services/verification/verification-service';
import { ReportPayload } from '@/services/reports/report-types';

/**
 * Server-Side Report Signing & Registration API
 *
 * POST /api/verification/sign
 *
 * Takes a finalized ReportPayload, builds its canonical payload,
 * generates a digital signature using the server's private key,
 * registers the verification record, and generates the QR code data URL.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as ReportPayload;

    if (!payload || !payload.evaluationNumber) {
      return NextResponse.json(
        { error: 'Valid report payload with evaluationNumber is required' },
        { status: 400 }
      );
    }

    // Determine host URL from request headers
    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = `${protocol}://${host}`;

    const record = await ReportVerificationService.registerFinalizedReport(payload, baseUrl);
    const qrCodeDataUrl = await ReportVerificationService.generateQrCodeDataUrl(record.verificationUrl);

    return NextResponse.json(
      {
        success: true,
        verificationToken: record.verificationToken,
        verificationUrl: record.verificationUrl,
        qrCodeDataUrl,
        status: record.status,
        digestSha256: record.cryptographicProof.digestSha256,
        publicKeyFingerprint: record.cryptographicProof.publicKeyFingerprint,
        issuedTimestamp: record.issuedTimestamp,
        revision: record.reportRevision,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error signing report:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
