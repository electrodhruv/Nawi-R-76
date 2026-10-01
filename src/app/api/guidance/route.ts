import { NextRequest, NextResponse } from 'next/server';
import { GuidanceAssistantService } from '@/services/guidance/assistant-service';
import { GuidanceRequest } from '@/services/guidance/knowledge-types';

/**
 * Context-Aware Laboratory Guidance Assistant API
 *
 * POST /api/guidance
 */
export async function POST(req: NextRequest) {
  try {
    const request = (await req.json()) as GuidanceRequest;
    const response = await GuidanceAssistantService.query(request);

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Guidance API error:', error);
    return NextResponse.json(
      {
        text: 'An error occurred while retrieving laboratory guidance.',
        sourceCitation: 'System Exception',
        sourceType: 'UNAPPROVED_FALLBACK',
        safetyDisclaimer: 'Advisory guidance only.',
      },
      { status: 500 }
    );
  }
}
