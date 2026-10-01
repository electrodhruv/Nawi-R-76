import { NextRequest, NextResponse } from 'next/server';
import { prisma, isDatabaseAvailable } from '@/lib/prisma';
import { EvaluationWorkflowService } from '@/services/workflow/evaluation-workflow';
import { z } from 'zod';

const CreateEvaluationRequestSchema = z.object({
  instrumentId: z.string().uuid(),
  leadMetrologistId: z.string().uuid(),
  evaluationNumber: z.string().min(3).max(50),
  reviewerId: z.string().uuid().optional(),
  signatoryId: z.string().uuid().optional(),
  changeReason: z.string().min(5).optional(),
});

export async function GET() {
  try {
    if (await isDatabaseAvailable()) {
      try {
        const evaluations = await prisma.typeEvaluation.findMany({
        include: {
          instrument: {
            include: {
              manufacturer: true,
            },
          },
          leadMetrologist: {
            select: {
              id: true,
              fullName: true,
              email: true,
              accreditationId: true,
            },
          },
          testRuns: {
            select: {
              id: true,
              status: true,
              testDefinition: {
                select: {
                  testCode: true,
                  clauseReference: true,
                  title: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (evaluations && evaluations.length > 0) {
        return NextResponse.json({ success: true, evaluations });
      }
    } catch (dbErr) {
      console.warn('Database query fallback in /api/evaluations:', (dbErr as Error).message);
    }
  }

    // Graceful fallback to registered laboratory evaluations
    const { EvaluationRegisterService } = await import('@/services/operations/evaluation-register-service');
    const fallbackList = EvaluationRegisterService.getAllEvaluations();

    return NextResponse.json(
      { success: true, evaluations: fallbackList, isFallback: true },
      { headers: { 'X-Database-Fallback': 'true' } }
    );
  } catch (error) {
    console.error('Error fetching evaluations:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = CreateEvaluationRequestSchema.parse(body);

    const clientIp = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip');

    const evaluation = await EvaluationWorkflowService.createEvaluationWithPlan({
      instrumentId: validated.instrumentId,
      leadMetrologistId: validated.leadMetrologistId,
      evaluationNumber: validated.evaluationNumber,
      reviewerId: validated.reviewerId,
      signatoryId: validated.signatoryId,
      changeReason: validated.changeReason,
      clientIp,
    });

    return NextResponse.json({ success: true, evaluation }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: error.issues },
        { status: 400 }
      );
    }
    console.error('Error creating evaluation:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
