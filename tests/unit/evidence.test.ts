/**
 * Tests for EvidenceService cryptographic hashing and consistency evaluation.
 */

import { describe, it, expect } from 'vitest';
import { EvidenceService } from '@/services/evidence/evidence-service';

describe('EvidenceService - Cryptographic Hashing & Verification', () => {
  it('computes correct authoritative SHA-256 digest for byte buffers', () => {
    // NIST Known-Answer / Standard test vectors
    const emptyBuffer = Buffer.from('');
    expect(EvidenceService.computeServerDigest(emptyBuffer)).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    );

    const testBuffer = Buffer.from('NAWI-R76-OIML-EVALUATION-TEST');
    const digest = EvidenceService.computeServerDigest(testBuffer);
    expect(digest).toHaveLength(64);
    expect(/^[0-9a-f]{64}$/.test(digest)).toBe(true);
  });
});
