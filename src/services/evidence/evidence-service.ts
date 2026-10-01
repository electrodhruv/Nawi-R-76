/**
 * Evidence Verification & Integrity Service for NAWI-R76
 *
 * Implements server-authoritative SHA-256 hashing, client digest comparison,
 * and assisted OCR consistency evaluation with human attestation workflows.
 */

import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';
import { EvidenceStatus, EvidenceUploadMethod } from '@prisma/client';
import Decimal from 'decimal.js';

export interface IngestEvidenceParams {
  evaluationId: string;
  testRunId?: string | null;
  uploaderId: string;
  sessionId?: string | null;
  uploadMethod: EvidenceUploadMethod;
  storageUrl: string;
  fileBuffer: Buffer;
  mimeType: string;
  clientPreliminaryHash?: string | null;
  capturedAt?: Date | null;
  deviceModel?: string | null;
  cameraMake?: string | null;
  clientIp?: string | null;
  notes?: string | null;
}

export class EvidenceService {
  /**
   * Computes authoritative server SHA-256 cryptographic digest.
   */
  static computeServerDigest(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Authoritatively ingests and hashes an evidence file.
   */
  static async ingestEvidence(params: IngestEvidenceParams) {
    const serverHash = this.computeServerDigest(params.fileBuffer);

    // Verify against client preliminary hash if supplied
    if (params.clientPreliminaryHash && params.clientPreliminaryHash.toLowerCase() !== serverHash.toLowerCase()) {
      console.warn(
        `[INTEGRITY ALERT] Client preliminary hash (${params.clientPreliminaryHash}) does not match server digest (${serverHash})`
      );
    }

    const evidenceFile = await prisma.evidenceFile.create({
      data: {
        evaluationId: params.evaluationId,
        testRunId: params.testRunId ?? null,
        uploaderId: params.uploaderId,
        sessionId: params.sessionId ?? null,
        uploadMethod: params.uploadMethod,
        storageUrl: params.storageUrl,
        serverHashSha256: serverHash,
        clientPreliminaryHash: params.clientPreliminaryHash ?? null,
        mimeType: params.mimeType,
        fileSizeBytes: BigInt(params.fileBuffer.byteLength),
        capturedAt: params.capturedAt ?? null,
        status: EvidenceStatus.UNVERIFIED,
        metadata: {
          create: {
            deviceModel: params.deviceModel ?? null,
            cameraMake: params.cameraMake ?? null,
            clientIp: params.clientIp ?? null,
            notes: params.notes ?? null,
          },
        },
      },
      include: {
        metadata: true,
      },
    });

    return evidenceFile;
  }

  /**
   * Records candidate OCR extraction result (Assisted OCR only - non-authoritative).
   */
  static async recordOcrCandidate(params: {
    evidenceFileId: string;
    extractedValue: string;
    extractedUnit?: string;
    confidenceScore: number;
    rawOcrText?: string;
  }) {
    return await prisma.evidenceOCRResult.create({
      data: {
        evidenceFileId: params.evidenceFileId,
        extractedValue: params.extractedValue,
        extractedUnit: params.extractedUnit ?? null,
        confidenceScore: new Decimal(params.confidenceScore),
        rawOcrText: params.rawOcrText ?? null,
      },
    });
  }

  /**
   * Evaluates consistency between OCR candidate value and recorded observation point.
   */
  static async evaluateConsistency(params: {
    evidenceFileId: string;
    observationPointId: string;
    ocrExtractedNumber: number;
    scaleInterval_e: number;
  }) {
    const obs = await prisma.observationPoint.findUnique({
      where: { id: params.observationPointId },
    });

    if (!obs) {
      throw new Error(`Observation point ${params.observationPointId} not found`);
    }

    const indicated = new Decimal(obs.indicatedValue_I.toString());
    const extracted = new Decimal(params.ocrExtractedNumber);
    const delta = indicated.minus(extracted).abs();

    // Tolerant up to 0.5e for rounding / digit boundaries
    const maxTolerance = new Decimal(params.scaleInterval_e).times(0.5);
    const isDiscrepancy = delta.greaterThan(maxTolerance);

    const link = await prisma.evidenceObservationLink.upsert({
      where: {
        evidenceFileId_observationPointId: {
          evidenceFileId: params.evidenceFileId,
          observationPointId: params.observationPointId,
        },
      },
      update: {
        isDiscrepancy,
        discrepancyDelta: delta,
      },
      create: {
        evidenceFileId: params.evidenceFileId,
        observationPointId: params.observationPointId,
        isDiscrepancy,
        discrepancyDelta: delta,
      },
    });

    // Update evidence file status
    const newStatus = isDiscrepancy ? EvidenceStatus.DISCREPANCY : EvidenceStatus.CONSISTENT;
    await prisma.evidenceFile.update({
      where: { id: params.evidenceFileId },
      data: { status: newStatus },
    });

    return { link, status: newStatus, delta: delta.toNumber() };
  }

  /**
   * Human metrologist / reviewer attestation of evidence.
   */
  static async attestEvidence(params: {
    evidenceFileId: string;
    reviewerId: string;
    notes?: string;
  }) {
    return await prisma.evidenceFile.update({
      where: { id: params.evidenceFileId },
      data: {
        status: EvidenceStatus.VERIFIED_BY_REVIEWER,
      },
    });
  }
}
