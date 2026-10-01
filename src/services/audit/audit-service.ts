/**
 * Immutable Audit Service for NAWI-R76
 *
 * Logs every entity mutation, configuration change, and state transition
 * with actor attribution, previous/new state diffs, and mandatory justifications.
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export interface AuditEventParams {
  actorId: string;
  evaluationId?: string | null;
  entityType: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATE_TRANSITION' | 'VERIFY_EVIDENCE';
  previousStateJson?: Prisma.InputJsonValue | null;
  newStateJson?: Prisma.InputJsonValue | null;
  changeReason: string;
  clientIp?: string | null;
  rulePackVersion?: string;
}

export class AuditService {
  /**
   * Records an immutable audit log entry.
   */
  static async record(params: AuditEventParams) {
    if (!params.changeReason || params.changeReason.trim().length === 0) {
      throw new Error('Mandatory changeReason is required for all audit records');
    }

    return await prisma.auditLog.create({
      data: {
        actorId: params.actorId,
        evaluationId: params.evaluationId ?? null,
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        previousStateJson: params.previousStateJson ?? Prisma.DbNull,
        newStateJson: params.newStateJson ?? Prisma.DbNull,
        changeReason: params.changeReason.trim(),
        clientIp: params.clientIp ?? null,
        rulePackVersion: params.rulePackVersion ?? 'R76-2006-v1',
      },
    });
  }

  /**
   * Retrieves chronological audit history for an evaluation.
   */
  static async getHistoryForEvaluation(evaluationId: string) {
    return await prisma.auditLog.findMany({
      where: { evaluationId },
      include: {
        actor: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            accreditationId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
