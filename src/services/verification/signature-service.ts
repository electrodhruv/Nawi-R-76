/**
 * Server-Side Cryptographic Signature Service for NAWI-R76
 *
 * Implements digital signature generation and verification for laboratory evaluation reports.
 * Uses RSA-SHA256 with PKCS#1 v1.5 padding.
 *
 * SECURITY INVARIANT:
 * The private signing key is stored strictly on the server and is never exposed to the client.
 */

import crypto from 'crypto';

export interface SignatureResult {
  digestSha256: string;
  signatureBase64: string;
  algorithm: string;
  publicKeyFingerprint: string;
}

export class ReportSignatureService {
  private static privateKeyPem: string | null = null;
  private static publicKeyPem: string | null = null;
  private static publicKeyFingerprint: string | null = null;

  /**
   * Initializes or retrieves the server keypair.
   * Uses globalThis to ensure the keypair remains consistent across route handlers,
   * server components, and dev module reloads.
   */
  private static ensureKeyPair(): { privateKey: string; publicKey: string; fingerprint: string } {
    const globalKeyStore = globalThis as unknown as {
      __NAWI_SIGNING_KEYS__?: { privateKey: string; publicKey: string; fingerprint: string };
    };

    if (globalKeyStore.__NAWI_SIGNING_KEYS__) {
      this.privateKeyPem = globalKeyStore.__NAWI_SIGNING_KEYS__.privateKey;
      this.publicKeyPem = globalKeyStore.__NAWI_SIGNING_KEYS__.publicKey;
      this.publicKeyFingerprint = globalKeyStore.__NAWI_SIGNING_KEYS__.fingerprint;
      return globalKeyStore.__NAWI_SIGNING_KEYS__;
    }

    if (this.privateKeyPem && this.publicKeyPem && this.publicKeyFingerprint) {
      const keys = {
        privateKey: this.privateKeyPem,
        publicKey: this.publicKeyPem,
        fingerprint: this.publicKeyFingerprint,
      };
      globalKeyStore.__NAWI_SIGNING_KEYS__ = keys;
      return keys;
    }

    if (process.env.NAWI_SIGNING_PRIVATE_KEY && process.env.NAWI_SIGNING_PUBLIC_KEY) {
      this.privateKeyPem = process.env.NAWI_SIGNING_PRIVATE_KEY;
      this.publicKeyPem = process.env.NAWI_SIGNING_PUBLIC_KEY;
    } else {
      // Generate standard 2048-bit RSA keypair
      const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem',
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem',
        },
      });

      this.privateKeyPem = privateKey;
      this.publicKeyPem = publicKey;
    }

    // Compute public key fingerprint (SHA-256 of public key DER)
    const pubDer = crypto.createPublicKey(this.publicKeyPem).export({ type: 'spki', format: 'der' });
    this.publicKeyFingerprint = crypto.createHash('sha256').update(pubDer).digest('hex').substring(0, 32).toUpperCase();

    const keys = {
      privateKey: this.privateKeyPem,
      publicKey: this.publicKeyPem,
      fingerprint: this.publicKeyFingerprint,
    };
    globalKeyStore.__NAWI_SIGNING_KEYS__ = keys;
    return keys;
  }

  /**
   * Computes the SHA-256 cryptographic digest of a canonical payload string.
   */
  public static computeDigest(canonicalString: string): string {
    return crypto.createHash('sha256').update(canonicalString, 'utf8').digest('hex');
  }

  /**
   * Digitally signs a canonical report payload string using the server's private key.
   */
  public static signCanonicalPayload(canonicalString: string): SignatureResult {
    const { privateKey, fingerprint } = this.ensureKeyPair();

    const digestSha256 = this.computeDigest(canonicalString);

    const sign = crypto.createSign('SHA256');
    sign.update(canonicalString, 'utf8');
    sign.end();

    const signatureBase64 = sign.sign(privateKey, 'base64');

    return {
      digestSha256,
      signatureBase64,
      algorithm: 'RSA-SHA256',
      publicKeyFingerprint: fingerprint,
    };
  }

  /**
   * Cryptographically verifies the digital signature of a canonical report payload string.
   */
  public static verifySignature(
    canonicalString: string,
    signatureBase64: string,
    publicKeyPemOverride?: string
  ): boolean {
    try {
      const pubKey = publicKeyPemOverride || this.ensureKeyPair().publicKey;
      const verify = crypto.createVerify('SHA256');
      verify.update(canonicalString, 'utf8');
      verify.end();

      return verify.verify(pubKey, signatureBase64, 'base64');
    } catch (err) {
      console.error('[ReportSignatureService] Verification error:', err);
      return false;
    }
  }

  /**
   * Returns the server's public key in PEM format.
   */
  public static getPublicKeyPem(): string {
    return this.ensureKeyPair().publicKey;
  }

  /**
   * Returns the public key fingerprint (hex).
   */
  public static getPublicKeyFingerprint(): string {
    return this.ensureKeyPair().fingerprint;
  }
}
