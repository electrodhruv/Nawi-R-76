import { NextRequest, NextResponse } from 'next/server';
import { ReportVerificationService } from '@/services/verification/verification-service';

/**
 * Public Verification API Endpoint
 *
 * GET /api/verification/[token]
 *
 * Publicly accessible without authentication.
 * Returns only sanitized public verification metadata and cryptographic proof.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    const verificationResult = await ReportVerificationService.getVerificationByToken(token);

    return NextResponse.json(verificationResult, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Error verifying report:', error);
    return NextResponse.json(
      { error: 'Internal server verification error', isValid: false },
      { status: 500 }
    );
  }
}
