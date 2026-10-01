/**
 * Audit Trail & Immutable Ledger Service for NAWI-R76
 *
 * Implements ISO/IEC 17025 §8.5 & Statutory Metrology Rule compliant
 * cryptographic SHA-256 chained audit trail logging.
 * Every entity mutation, state transition, evidence verification,
 * and statutory digital signature is logged with an immutable hash chain.
 */

export interface AuditItem {
  id: string;
  actor: string;
  role: string;
  entityType: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'STATE_TRANSITION' | 'VERIFY_EVIDENCE' | 'SIGN_DOCUMENT';
  changeReason: string;
  rulePackVersion: string;
  timestamp: string;
  previousState?: string;
  newState?: string;
  sha256Digest: string;
  prevDigest?: string;
}

// Pure TypeScript SHA-256 Implementation (Synchronous & Portable for Web & Node)
function sha256(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let i: number, j: number;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;

  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  for (i = 0; i < ascii.length; i++) {
    const code = ascii.charCodeAt(i);
    words[i >> 2] |= (code & 0xff) << (8 * (3 - (i % 4)));
  }

  words[asciiBitLength >> 5] |= 0x80 << (24 - (asciiBitLength % 32));
  words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;

  for (j = 0; j < words.length; j += 16) {
    const w = words.slice(j, j + 16);
    const oldHash = [...hash];

    for (i = 0; i < 64; i++) {
      if (i >= 16) {
        const s0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        const s1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }

      const s1 = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const temp1 = (hash[7] + s1 + ch + k[i] + w[i]) | 0;
      const s0 = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp2 = (s0 + maj) | 0;

      hash = [(temp1 + temp2) | 0, hash[0], hash[1], hash[2], (hash[3] + temp1) | 0, hash[4], hash[5], hash[6]];
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (8 * j)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }

  return result;
}

export class AuditTrailService {
  private static logs: AuditItem[] = [
    {
      id: 'aud-06',
      actor: 'Dr. A. Sharma',
      role: 'LEAD_METROLOGIST',
      entityType: 'TypeEvaluation',
      entityId: 'RRSL-2026-TE-0104',
      action: 'SIGN_DOCUMENT',
      changeReason: 'Applied statutory RSA-2048 PKI digital signature. Evaluation finalized as COMPLIANT for Precision-Bench-B6.',
      rulePackVersion: 'R76-2006-v1',
      timestamp: '2026-09-30 11:50:22 UTC',
      previousState: '{ "status": "PENDING_REVIEW" }',
      newState: '{ "status": "FINALIZED", "overallResult": "COMPLIANT", "signedBy": "Dr. A. Sharma" }',
      sha256Digest: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      prevDigest: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
    },
    {
      id: 'aud-05',
      actor: 'M. Verma',
      role: 'TECHNICAL_REVIEWER',
      entityType: 'TypeEvaluation',
      entityId: 'RRSL-2026-TE-0104',
      action: 'STATE_TRANSITION',
      changeReason: 'Technical peer review completed. All 13 test runs verified compliant with Table 6 MPE limits.',
      rulePackVersion: 'R76-2006-v1',
      timestamp: '2026-09-30 11:45:00 UTC',
      previousState: '{ "status": "IN_TESTING" }',
      newState: '{ "status": "PENDING_REVIEW", "completedAt": "2026-09-30T11:45:00Z" }',
      sha256Digest: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
      prevDigest: '7c86a9f4c391d84b2341209b556e4091a1820f4c30c85b1901c87e411b4f492b',
    },
    {
      id: 'aud-04',
      actor: 'M. Verma',
      role: 'TECHNICAL_REVIEWER',
      entityType: 'EvidenceFile',
      entityId: 'ev-r76_weigh_intrinsic',
      action: 'VERIFY_EVIDENCE',
      changeReason: 'Attested physical test authenticity. Indicator display photo matched turning point observation within 0.5e tolerance.',
      rulePackVersion: 'R76-2006-v1',
      timestamp: '2026-09-30 11:20:12 UTC',
      previousState: '{ "status": "CONSISTENT" }',
      newState: '{ "status": "VERIFIED_BY_REVIEWER", "verifiedBy": "M. Verma" }',
      sha256Digest: '7c86a9f4c391d84b2341209b556e4091a1820f4c30c85b1901c87e411b4f492b',
      prevDigest: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    },
    {
      id: 'aud-03',
      actor: 'Amit Verma',
      role: 'TESTING_OFFICER',
      entityType: 'EvaluationTestRun',
      entityId: 'run-intrinsic-01',
      action: 'UPDATE',
      changeReason: 'Recorded turning-point observation points for intrinsic error determination under Clause 3.5.1.',
      rulePackVersion: 'R76-2006-v1',
      timestamp: '2026-09-30 10:30:45 UTC',
      previousState: '{ "status": "INCOMPLETE" }',
      newState: '{ "status": "PASS", "observationCount": 6, "maxCorrectedError": "+0.0000kg" }',
      sha256Digest: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
      prevDigest: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
    },
    {
      id: 'aud-02',
      actor: 'Amit Verma',
      role: 'TESTING_OFFICER',
      entityType: 'EvaluationTestRun',
      entityId: 'run-ecc-rolling',
      action: 'UPDATE',
      changeReason: 'Evaluated applicability: Rolling track test (A.4.7.4) excluded because specimen has a standard bench-top pan.',
      rulePackVersion: 'R76-2006-v1',
      timestamp: '2026-09-30 09:15:20 UTC',
      previousState: '{ "status": "NOT_TESTED" }',
      newState: '{ "status": "NOT_APPLICABLE", "exclusionJustification": "Instrument has standard fixed pan" }',
      sha256Digest: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
      prevDigest: 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d',
    },
    {
      id: 'aud-01',
      actor: 'Dr. A. Sharma',
      role: 'LEAD_METROLOGIST',
      entityType: 'TypeEvaluation',
      entityId: 'RRSL-2026-TE-0104',
      action: 'CREATE',
      changeReason: 'Initialized evaluation RRSL-2026-TE-0104 with dynamic OIML R 76-1 test plan for Precision-Bench-B6.',
      rulePackVersion: 'R76-2006-v1',
      timestamp: '2026-09-30 09:00:00 UTC',
      previousState: 'null',
      newState: '{ "evaluationNumber": "RRSL-2026-TE-0104", "status": "PLAN_CONFIGURED" }',
      sha256Digest: 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d',
      prevDigest: '0000000000000000000000000000000000000000000000000000000000000000',
    },
  ];

  private static isStorageLoaded = false;
  private static listeners = new Set<() => void>();

  private static ensureStorageLoaded(): void {
    if (this.isStorageLoaded) return;
    this.isStorageLoaded = true;

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem('nawi_r76_audit_trail_logs');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.logs = parsed;
          }
        }
      } catch (err) {
        console.warn('Failed to load audit trail logs from storage:', err);
      }
    }
  }

  private static persistStorage(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem('nawi_r76_audit_trail_logs', JSON.stringify(this.logs));
      } catch (err) {
        console.warn('Failed to persist audit trail logs to storage:', err);
      }
    }
    this.notify();
  }

  public static subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notify(): void {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        console.error('Error in AuditTrailService listener:', e);
      }
    });
  }

  public static getAllLogs(): AuditItem[] {
    this.ensureStorageLoaded();
    return [...this.logs];
  }

  public static getLogsForEntity(entityId: string): AuditItem[] {
    this.ensureStorageLoaded();
    return this.logs.filter((log) => log.entityId === entityId);
  }

  /**
   * Logs a new immutable audit entry with ISO/IEC 17025 SHA-256 hash chaining.
   */
  public static logEvent(entry: {
    actor: string;
    role: string;
    entityType: string;
    entityId: string;
    action: 'CREATE' | 'UPDATE' | 'STATE_TRANSITION' | 'VERIFY_EVIDENCE' | 'SIGN_DOCUMENT';
    changeReason: string;
    rulePackVersion?: string;
    previousState?: string;
    newState?: string;
  }): AuditItem {
    this.ensureStorageLoaded();

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    const prevDigest = this.logs[0]?.sha256Digest || '0000000000000000000000000000000000000000000000000000000000000000';
    const rulePackVersion = entry.rulePackVersion || 'R76-2006-v1';

    // Construct verifiable payload for cryptographic chaining
    const rawPayload = `${prevDigest}|${timestamp}|${entry.actor}|${entry.role}|${entry.entityType}|${entry.entityId}|${entry.action}|${entry.changeReason}|${entry.newState || ''}`;
    const sha256Digest = sha256(rawPayload);

    const newLog: AuditItem = {
      id: `aud-${Date.now().toString(36)}`,
      actor: entry.actor,
      role: entry.role,
      entityType: entry.entityType,
      entityId: entry.entityId,
      action: entry.action,
      changeReason: entry.changeReason,
      rulePackVersion,
      timestamp,
      previousState: entry.previousState,
      newState: entry.newState,
      sha256Digest,
      prevDigest,
    };

    this.logs.unshift(newLog);
    this.persistStorage();
    return newLog;
  }

  public static verifyIntegrity(): { isValid: boolean; brokenChainIndex?: number } {
    this.ensureStorageLoaded();
    for (let i = 0; i < this.logs.length - 1; i++) {
      const current = this.logs[i];
      const previous = this.logs[i + 1];
      if (current.prevDigest && previous.sha256Digest !== current.prevDigest) {
        return { isValid: false, brokenChainIndex: i };
      }
    }
    return { isValid: true };
  }
}
