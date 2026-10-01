import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  HelpCircle,
  FileText,
  Lock,
  Calendar,
  Building2,
  Scale,
  Award,
  ExternalLink,
} from 'lucide-react';
import { ReportVerificationService } from '@/services/verification/verification-service';
import { PublicVerificationResult } from '@/services/verification/verification-types';
import { PdfVerificationSection } from '@/components/verification/PdfVerificationSection';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function VerifyPage({ params }: PageProps) {
  const { token } = await params;
  const result: PublicVerificationResult = await ReportVerificationService.getVerificationByToken(token);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col items-center py-10 px-4 sm:px-6">
      {/* Top National/Laboratory Header */}
      <div className="w-full max-w-2xl mb-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200/80 text-slate-700 text-xs font-semibold uppercase tracking-wider mb-3">
          <Scale className="w-3.5 h-3.5 text-blue-700" />
          <span>Regional Reference Standard Laboratory &bull; Metrology Portal</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Laboratory Report Verification
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Cryptographic Authenticity &amp; Integrity Verification for OIML R 76 Evaluation Reports
        </p>
      </div>

      {/* Main Verification Card */}
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {/* Status Hero Banner */}
        {result.status === 'VALID' && (
          <div className={`${result.publicMetadata?.finalizedResult === 'NON_COMPLIANT' ? 'bg-red-50/70 border-b border-red-200' : 'bg-emerald-50 border-b border-emerald-200'} p-6 flex items-start gap-4`}>
            <div className={`w-10 h-10 rounded-full ${result.publicMetadata?.finalizedResult === 'NON_COMPLIANT' ? 'bg-red-600' : 'bg-emerald-600'} text-white flex items-center justify-center shrink-0 shadow-xs`}>
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${result.publicMetadata?.finalizedResult === 'NON_COMPLIANT' ? 'bg-red-200 text-red-900' : 'bg-emerald-200 text-emerald-900'}`}>
                  Authentic &amp; Valid
                </span>
                <span className={`text-xs font-medium ${result.publicMetadata?.finalizedResult === 'NON_COMPLIANT' ? 'text-red-700' : 'text-emerald-700'}`}>Digital Signature Verified</span>
                {result.publicMetadata?.finalizedResult === 'NON_COMPLIANT' && (
                  <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-600 text-white">
                    Verdict: NON-COMPLIANT
                  </span>
                )}
              </div>
              <h2 className={`text-base font-bold mt-1 ${result.publicMetadata?.finalizedResult === 'NON_COMPLIANT' ? 'text-red-950' : 'text-emerald-950'}`}>
                {result.publicMetadata?.finalizedResult === 'NON_COMPLIANT'
                  ? '✓ VERIFIED LABORATORY REPORT — STATUTORY VERDICT: NON-COMPLIANT'
                  : '✓ VERIFIED LABORATORY REPORT'}
              </h2>
              <p className={`text-xs mt-0.5 leading-relaxed ${result.publicMetadata?.finalizedResult === 'NON_COMPLIANT' ? 'text-red-800' : 'text-emerald-800'}`}>
                {result.publicMetadata?.finalizedResult === 'NON_COMPLIANT'
                  ? 'This evaluation report was issued by an accredited laboratory and its digital signature is authentic. The statutory evaluation concluded that one or more test observations exceeded statutory OIML R 76-1 Table 6 MPE tolerances.'
                  : 'This evaluation report was issued by an accredited laboratory. The canonical report payload matches the server digital signature and has not been altered.'}
              </p>
            </div>
          </div>
        )}

        {result.status === 'SUPERSEDED' && (
          <div className="bg-amber-50 border-b border-amber-200 p-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                  Superseded
                </span>
                <span className="text-xs text-amber-800 font-medium">
                  Superseded by Revision {result.supersededInfo?.supersededByRevision ?? 2}
                </span>
              </div>
              <h2 className="text-base font-bold text-amber-950 mt-1">
                ⚠ SUPERSEDED REPORT REVISION
              </h2>
              <p className="text-xs text-amber-900 mt-0.5 leading-relaxed">
                This report revision is historical and has been superseded by a newer approved revision. Please obtain the latest finalized report revision.
              </p>
            </div>
          </div>
        )}

        {result.status === 'REVOKED' && (
          <div className="bg-rose-50 border-b border-rose-200 p-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-200 text-rose-900">
                  Revoked
                </span>
                <span className="text-xs text-rose-700 font-medium">Invalidated</span>
              </div>
              <h2 className="text-base font-bold text-rose-950 mt-1">
                ✕ REPORT FORMALLY REVOKED
              </h2>
              <p className="text-xs text-rose-900 mt-0.5 leading-relaxed">
                This evaluation report has been formally revoked by the issuing authority. It is no longer legally or technically valid.
              </p>
              {result.revocationInfo && (
                <div className="mt-2 p-2 rounded bg-rose-100/70 border border-rose-200 text-[11px] text-rose-900">
                  <span className="font-semibold">Revocation Reason: </span>
                  {result.revocationInfo.reason}
                </div>
              )}
            </div>
          </div>
        )}

        {result.status === 'SIGNATURE_INVALID' && (
          <div className="bg-red-50 border-b border-red-200 p-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-200 text-red-900">
                  Tampered / Invalid
                </span>
                <span className="text-xs text-red-700 font-medium">Cryptographic Failure</span>
              </div>
              <h2 className="text-base font-bold text-red-950 mt-1">
                ✕ SIGNATURE VERIFICATION FAILED
              </h2>
              <p className="text-xs text-red-900 mt-0.5 leading-relaxed">
                The cryptographic digital signature for this record failed verification against the registered public key. The report may have been tampered with or corrupted.
              </p>
            </div>
          </div>
        )}

        {result.status === 'NOT_FOUND' && (
          <div className="bg-slate-100 border-b border-slate-200 p-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                Not Found
              </span>
              <h2 className="text-base font-bold text-slate-900 mt-1">
                ✕ NO VERIFICATION RECORD LOCATED
              </h2>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                No matching evaluation record was found for token: <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px] font-mono">{token}</code>. Please confirm the QR code was scanned from an authentic report.
              </p>
            </div>
          </div>
        )}

        {/* Public Metadata Table (Safe public facts only) */}
        {result.publicMetadata && (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Report Identification &amp; Pattern Details</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
                  <span className="text-slate-400 block text-[11px] mb-0.5">Report Reference Number</span>
                  <span className="font-semibold text-slate-900 font-mono text-sm">
                    {result.publicMetadata.reportNumber}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
                  <span className="text-slate-400 block text-[11px] mb-0.5">Report Revision</span>
                  <span className="font-semibold text-slate-900">
                    Revision {result.publicMetadata.revision}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
                  <span className="text-slate-400 block text-[11px] mb-0.5">Instrument Model</span>
                  <span className="font-semibold text-slate-900">
                    {result.publicMetadata.instrumentModel}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
                  <span className="text-slate-400 block text-[11px] mb-0.5">Instrument Serial Number</span>
                  <span className="font-semibold text-slate-900 font-mono">
                    {result.publicMetadata.serialNumber}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
                  <span className="text-slate-400 block text-[11px] mb-0.5">Manufacturer</span>
                  <span className="font-semibold text-slate-900">
                    {result.publicMetadata.manufacturer}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
                  <span className="text-slate-400 block text-[11px] mb-0.5">Accuracy Class</span>
                  <span className="font-semibold text-slate-900">
                    {result.publicMetadata.accuracyClass}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
                  <span className="text-slate-400 block text-[11px] mb-0.5">Evaluation Standard</span>
                  <span className="font-semibold text-slate-900">
                    {result.publicMetadata.standard}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
                  <span className="text-slate-400 block text-[11px] mb-0.5">Rule-Pack Version</span>
                  <span className="font-semibold text-slate-900 font-mono">
                    {result.publicMetadata.rulePack}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
                  <span className="text-slate-400 block text-[11px] mb-0.5">Evaluation Verdict</span>
                  <span
                    className={`inline-flex items-center gap-1 font-bold text-xs px-2 py-0.5 rounded ${
                      result.publicMetadata.finalizedResult === 'COMPLIANT'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {result.publicMetadata.finalizedResult === 'COMPLIANT' ? 'COMPLIANT (PASS)' : 'NON-COMPLIANT (FAIL)'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
                  <span className="text-slate-400 block text-[11px] mb-0.5">Issue Date</span>
                  <span className="font-semibold text-slate-900">
                    {result.publicMetadata.issueDate}
                  </span>
                </div>
              </div>
            </div>

            {/* Cryptographic Proof Drawer */}
            {result.cryptographicProof && (
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Cryptographic Proof &amp; Signature Attestation</span>
                </h4>

                <div className="space-y-2 text-[11px] font-mono text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[10px]">SIGNATURE ALGORITHM</span>
                    <span>{result.cryptographicProof.signatureAlgorithm} (PKCS#1 v1.5 / SHA-256)</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">ISSUING KEY FINGERPRINT</span>
                    <span className="text-slate-800">{result.cryptographicProof.publicKeyFingerprint}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">CANONICAL PAYLOAD SHA-256 DIGEST</span>
                    <span className="break-all text-slate-800">{result.cryptographicProof.digestSha256}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">TIMESTAMP OF ATTESTATION</span>
                    <span>{result.cryptographicProof.issuedTimestamp}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Interactive PDF Verification Upload & Authenticity Check */}
        {result.status !== 'NOT_FOUND' && (
          <PdfVerificationSection
            token={token}
            expectedHash={result.pdfSha256Digest}
          />
        )}

        {/* Footer Guarantee */}
        <div className="bg-slate-100 border-t border-slate-200 px-6 py-3 text-[11px] text-slate-500 flex items-center justify-between">
          <span>NAWI-R76 Public Verification Service</span>
          <span>Verified At: {result.verifiedAt.split('T')[0]}</span>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="w-full max-w-2xl mt-4 text-center text-[11px] text-slate-400 leading-relaxed">
        This public verification portal verifies cryptographic authenticity and current status without exposing private evidence, internal laboratory credentials, or operator audit trails.
      </div>
    </div>
  );
}
