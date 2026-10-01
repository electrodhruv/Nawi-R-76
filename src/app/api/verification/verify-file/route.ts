import { NextRequest, NextResponse } from 'next/server';
import { ReportVerificationService } from '@/services/verification/verification-service';

/**
 * Public File Verification Endpoint
 *
 * POST /api/verification/verify-file
 *
 * Compares the cryptographic SHA-256 digest of an uploaded PDF against the
 * server-registered hash for the given verification token.
 * Detects any byte-level tampering or forgery in distributed reports.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const token = formData.get('token') as string | null;

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required.' },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: 'PDF file is required for verification.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const verificationResult = await ReportVerificationService.verifyPdfFile(
      token,
      buffer,
      file.name
    );

    return NextResponse.json(verificationResult, { status: 200 });
  } catch (error) {
    console.error('Error verifying PDF file:', error);
    return NextResponse.json(
      {
        error: 'Failed to process and verify PDF file.',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
