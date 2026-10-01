import { Router, Request, Response } from 'express';
import crypto from 'crypto';

export const verificationRouter = Router();

interface StoredVerification {
  token: string;
  reportNumber: string;
  serialNumber: string;
  finalizedResult: 'COMPLIANT' | 'NON_COMPLIANT';
  status: 'VALID' | 'REVOKED' | 'SUPERSEDED' | 'SIGNATURE_INVALID';
  digestSha256: string;
  signature: string;
  publicKeyFingerprint: string;
  issuedAt: string;
  revokedAt?: string;
  revocationReason?: string;
  newRevision?: number;
}

const tokenStore = new Map<string, StoredVerification>();

// Pre-seed demo token
tokenStore.set('demo-token-0104-valid', {
  token: 'demo-token-0104-valid',
  reportNumber: 'RRSL-2026-TE-0104',
  serialNumber: 'SN-BS-26001',
  finalizedResult: 'COMPLIANT',
  status: 'VALID',
  digestSha256: 'a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890',
  signature: '3045022100...[ECDSA-P256-SHA256-DIGITAL-SIGNATURE]...',
  publicKeyFingerprint: 'SHA256:4a8f9c2d1e0b3a7f6c5e4d3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3',
  issuedAt: '2026-09-29T11:45:00Z',
});

/**
 * POST /api/verification/sign
 * Signs an evaluation payload and registers digital certificate verification record
 */
verificationRouter.post('/sign', (req: Request, res: Response) => {
  try {
    const payload = req.body || {};
    const reportNumber = payload.evaluationNumber || `RRSL-${Date.now()}`;
    const serialNumber = payload.serialNumber || 'UNKNOWN-SERIAL';
    const isNonCompliant =
      payload.overallResult === 'NON_COMPLIANT' ||
      payload.overallResult === 'FAIL' ||
      payload.summaryMatrix?.some((s: any) => s.status === 'Failed') ||
      payload.testRuns?.some((t: any) => t.status === 'NON_COMPLIANT' || t.status === 'FAIL');

    const finalizedResult: 'COMPLIANT' | 'NON_COMPLIANT' = isNonCompliant ? 'NON_COMPLIANT' : 'COMPLIANT';

    // Canonical digest
    const canonicalString = JSON.stringify({
      reportNumber,
      serialNumber,
      finalizedResult,
      revision: payload.revisionNumber || 1,
    });

    const digestSha256 = crypto.createHash('sha256').update(canonicalString).digest('hex');
    const token = `vtok-${crypto.randomBytes(8).toString('hex')}`;
    const publicKeyFingerprint = `SHA256:${crypto.createHash('sha256').update('RRSL-PUBLIC-KEY-2026').digest('hex')}`;
    const signature = crypto.createHmac('sha256', 'METROLOGY_PRIVATE_KEY_2026').update(digestSha256).digest('hex');

    const record: StoredVerification = {
      token,
      reportNumber,
      serialNumber,
      finalizedResult,
      status: 'VALID',
      digestSha256,
      signature: `SIG-ECDSA-${signature.substring(0, 32)}`,
      publicKeyFingerprint,
      issuedAt: new Date().toISOString(),
    };

    tokenStore.set(token, record);
    if (reportNumber === 'RRSL-2026-TE-0104') {
      tokenStore.set('demo-token-0104-valid', {
        ...record,
        token: 'demo-token-0104-valid',
      });
    }

    const host = String(req.headers.host || 'localhost:5000');
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const verificationUrl = `${protocol}://${host.replace(':5000', ':3000')}/verify/${token}`;

    return res.json({
      success: true,
      verificationToken: token,
      verificationUrl,
      status: record.status,
      digestSha256,
      publicKeyFingerprint,
      signature: record.signature,
      finalizedResult,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/verification/verify/:token
 * Validates a certificate token and returns authoritative authenticity details
 */
verificationRouter.get('/verify/:token', (req: Request, res: Response) => {
  const token = String(req.params.token);
  const record = tokenStore.get(token);

  if (!record) {
    return res.status(404).json({
      isValid: false,
      status: 'NOT_FOUND',
      error: `Verification token ${token} does not exist in authoritative registry.`,
    });
  }

  return res.json({
    isValid: record.status === 'VALID',
    token: record.token,
    reportNumber: record.reportNumber,
    serialNumber: record.serialNumber,
    finalizedResult: record.finalizedResult,
    status: record.status,
    digestSha256: record.digestSha256,
    signature: record.signature,
    publicKeyFingerprint: record.publicKeyFingerprint,
    issuedAt: record.issuedAt,
    revokedAt: record.revokedAt,
    revocationReason: record.revocationReason,
    newRevision: record.newRevision,
  });
});

/**
 * POST /api/verification/revoke
 * Simulates revocation / superseding of a digital verification certificate
 */
verificationRouter.post('/revoke', (req: Request, res: Response) => {
  const { token, action, reason, newRevision } = req.body;
  const record = tokenStore.get(token);

  if (!record) {
    return res.status(404).json({ error: `Token ${token} not found.` });
  }

  if (action === 'REVOKE') {
    record.status = 'REVOKED';
    record.revokedAt = new Date().toISOString();
    record.revocationReason = reason || 'Statutory revocation by Lead Metrologist.';
  } else if (action === 'SUPERSEDE') {
    record.status = 'SUPERSEDED';
    record.newRevision = newRevision || 2;
  } else if (action === 'TAMPER') {
    record.status = 'SIGNATURE_INVALID';
  }

  return res.json({
    success: true,
    token: record.token,
    status: record.status,
  });
});
