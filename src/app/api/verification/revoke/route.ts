import { NextRequest, NextResponse } from 'next/server';
import { ReportVerificationService } from '@/services/verification/verification-service';

/**
 * Report Revocation & Status Modification API (Demo & Administrative)
 *
 * POST /api/verification/revoke
 */
export async function POST(req: NextRequest) {
  try {
    const { token, reason, action, newRevision } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    if (action === 'TAMPER') {
      const success = await ReportVerificationService.tamperSignatureForDemo(token);
      return NextResponse.json({ success, action: 'TAMPER' }, { status: 200 });
    }

    if (action === 'SUPERSEDE') {
      const success = await ReportVerificationService.supersedeReport(token, newRevision ?? 2);
      return NextResponse.json({ success, action: 'SUPERSEDE' }, { status: 200 });
    }

    const success = await ReportVerificationService.revokeReport(
      token,
      reason || 'Formal revocation by Directorate of Legal Metrology.'
    );

    return NextResponse.json({ success, action: 'REVOKE' }, { status: 200 });
  } catch (error) {
    console.error('Error modifying report status:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
