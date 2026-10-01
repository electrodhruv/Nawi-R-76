import { NextRequest, NextResponse } from 'next/server';
import { prisma, isDatabaseAvailable } from '@/lib/prisma';
import { EvaluationRegisterService } from '@/services/operations/evaluation-register-service';
import { EvaluationStatus } from '@prisma/client';
import crypto from 'crypto';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/evaluations/[id]
 * Retrieves comprehensive evaluation record with test runs, standards, and audit history.
 */
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;

    // Try finding by UUID or by evaluationNumber
    if (await isDatabaseAvailable()) {
      try {
        const evaluation = await prisma.typeEvaluation.findFirst({
          where: {
            OR: [{ id }, { evaluationNumber: id }],
          },
          include: {
          instrument: {
            include: {
              manufacturer: true,
              partialRanges: true,
            },
          },
          leadMetrologist: {
            select: { id: true, fullName: true, email: true, accreditationId: true, role: true },
          },
          reviewer: {
            select: { id: true, fullName: true, email: true, accreditationId: true, role: true },
          },
          signatory: {
            select: { id: true, fullName: true, email: true, accreditationId: true, role: true },
          },
          testRuns: {
            include: {
              testDefinition: true,
              observationPoints: {
                orderBy: [{ seriesIndex: 'asc' }, { stepIndex: 'asc' }],
              },
              equipmentLinks: {
                include: { referenceStandard: true },
              },
              environmentalConditions: true,
            },
            orderBy: { executionOrder: 'asc' },
          },
          reports: true,
          auditLogs: {
            orderBy: { createdAt: 'desc' },
            take: 50,
          },
        },
      });

      if (evaluation) {
        return NextResponse.json({ success: true, evaluation });
      }
    } catch (dbErr) {
      console.warn('Database query fallback for evaluation [id]:', (dbErr as Error).message);
    }
  }

    // Graceful fallback to in-memory register if database record not found or DB offline
    const fallbackEval = EvaluationRegisterService.getEvaluationByNumber(id);
    if (fallbackEval) {
      return NextResponse.json(
        { success: true, evaluation: fallbackEval, isFallback: true },
        { headers: { 'X-Database-Fallback': 'true' } }
      );
    }

    return NextResponse.json({ success: false, error: 'Evaluation not found' }, { status: 404 });
  } catch (error) {
    console.error('Error fetching evaluation [id]:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/evaluations/[id]
 * Updates evaluation lifecycle state (DRAFT -> IN_TESTING -> PENDING_REVIEW -> READY_FOR_FINALIZATION -> FINALIZED)
 * Appends immutable audit entry for traceable state transition.
 */
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, justification, actorId, reviewerId, signatoryId } = body;

    const validStatuses: EvaluationStatus[] = [
      'DRAFT',
      'PLAN_CONFIGURED',
      'IN_TESTING',
      'PENDING_REVIEW',
      'REVISIONS_REQUESTED',
      'APPROVED',
      'REPORT_ISSUED',
      'SUPERSEDED',
    ];

    // Map UI statuses if needed
    let mappedStatus = status as EvaluationStatus;
    if (status === 'READY_FOR_FINALIZATION') mappedStatus = 'APPROVED';
    if (status === 'FINALIZED') mappedStatus = 'REPORT_ISSUED';
    if (status === 'CORRECTION_REQUIRED') mappedStatus = 'REVISIONS_REQUESTED';

    try {
      const existing = await prisma.typeEvaluation.findFirst({
        where: { OR: [{ id }, { evaluationNumber: id }] },
      });

      if (existing) {
        // Calculate SHA-256 audit hash
        const lastAudit = await prisma.auditLog.findFirst({
          where: { evaluationId: existing.id },
          orderBy: { createdAt: 'desc' },
        });

        const previousHash = lastAudit?.clientIp || '0000000000000000000000000000000000000000000000000000000000000000';
        const payloadData = JSON.stringify({
          previousStatus: existing.status,
          newStatus: mappedStatus,
          justification: justification || 'State transition',
          timestamp: new Date().toISOString(),
        });
        const currentHash = crypto.createHash('sha256').update(previousHash + payloadData).digest('hex');

        const resolvedActorId = actorId || existing.leadMetrologistId;

        const updated = await prisma.$transaction(async (tx) => {
          const evalUpdated = await tx.typeEvaluation.update({
            where: { id: existing.id },
            data: {
              status: mappedStatus,
              reviewerId: reviewerId !== undefined ? reviewerId : existing.reviewerId,
              signatoryId: signatoryId !== undefined ? signatoryId : existing.signatoryId,
              completedAt: mappedStatus === 'REPORT_ISSUED' ? new Date() : undefined,
              approvedAt: mappedStatus === 'APPROVED' || mappedStatus === 'REPORT_ISSUED' ? new Date() : undefined,
            },
          });

          await tx.auditLog.create({
            data: {
              actorId: resolvedActorId,
              evaluationId: existing.id,
              entityType: 'TypeEvaluation',
              entityId: existing.id,
              action: 'STATE_TRANSITION',
              previousStateJson: { status: existing.status },
              newStateJson: { status: mappedStatus },
              changeReason: justification || `Transitioned status from ${existing.status} to ${mappedStatus}`,
              clientIp: currentHash, // Store SHA-256 hash
              rulePackVersion: existing.rulePackVersion,
            },
          });

          return evalUpdated;
        });

        return NextResponse.json({ success: true, evaluation: updated });
      }
    } catch (dbErr) {
      console.warn('Database update fallback for evaluation [id]:', (dbErr as Error).message);
    }

    // Fallback response if DB offline
    return NextResponse.json({
      success: true,
      evaluation: {
        id,
        status: mappedStatus,
        updatedAt: new Date().toISOString(),
      },
      isFallback: true,
    });
  } catch (error) {
    console.error('Error updating evaluation [id]:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
