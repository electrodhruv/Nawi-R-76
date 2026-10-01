'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  CheckCircle2,
  X,
  FileCheck2,
  AlertCircle,
  QrCode,
  Fingerprint,
} from 'lucide-react';
import { UserProfile } from '@/lib/rbac';

export interface SignatureMetadata {
  signatoryName: string;
  signatoryRole: string;
  accreditationId: string;
  department: string;
  signedAt: string;
  certificateAuthority: string;
  keyAlgorithm: string;
  signatureDigestSha256: string;
  certificateSerial: string;
  pinVerified: boolean;
}

interface DigitalSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  evaluationNumber: string;
  specimenModel: string;
  specimenSerial: string;
  onSignComplete: (meta: SignatureMetadata) => void;
}

export const DigitalSignatureModal: React.FC<DigitalSignatureModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  evaluationNumber,
  specimenModel,
  specimenSerial,
  onSignComplete,
}) => {
  const [pin, setPin] = useState('1234');
  const [isSigning, setIsSigning] = useState(false);
  const [signStep, setSignStep] = useState<'INPUT' | 'SEALING' | 'SUCCESS'>('INPUT');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApplySignature = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || pin.trim().length < 4) {
      setError('Please enter a valid 4-digit laboratory security PIN (Demo default: 1234)');
      return;
    }

    setError(null);
    setIsSigning(true);
    setSignStep('SEALING');

    // Simulate cryptographic RSA-2048 PKI signing operation
    setTimeout(() => {
      const now = new Date();
      const meta: SignatureMetadata = {
        signatoryName: currentUser.fullName,
        signatoryRole: currentUser.roleTitle,
        accreditationId: currentUser.accreditationId,
        department: currentUser.department,
        signedAt: now.toISOString(),
        certificateAuthority: 'National Legal Metrology PKI Trust Network (Class 3 Root CA)',
        keyAlgorithm: 'RSA-2048 with SHA-256 Digest (FIPS 186-4)',
        signatureDigestSha256: '9f83ac42c8d203e87611ab9f048d423985a1f2c9e7821034ba823901de49bc12',
        certificateSerial: `NMI-DSC-2026-${currentUser.accreditationId.replace(/[^0-9]/g, '').slice(0, 4) || '8801'}`,
        pinVerified: true,
      };

      setSignStep('SUCCESS');
      setTimeout(() => {
        setIsSigning(false);
        onSignComplete(meta);
      }, 700);
    }, 1100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">Statutory Digital Signature Authorization</h2>
              <p className="text-[11px] text-slate-300">OIML R 76-1 Type Approval Legal Attestation</p>
            </div>
          </div>
          <button
            type="button"
            disabled={isSigning}
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs text-slate-700">
          {signStep === 'SEALING' ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-14 h-14 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="font-bold text-slate-900 text-sm">Applying Cryptographic RSA-2048 Signature...</div>
              <p className="text-[11px] text-slate-500">
                Hashing test payload with SHA-256 and sealing with National PKI Token
              </p>
            </div>
          ) : signStep === 'SUCCESS' ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="font-bold text-slate-900 text-sm">Document Cryptographically Signed &amp; Sealed!</div>
              <p className="text-[11px] text-slate-500">
                Type Approval Evaluation locked with immutable tamper-evident stamp.
              </p>
            </div>
          ) : (
            <>
              {/* Document Context Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
                <div className="flex items-center justify-between text-[11px] border-b border-slate-200/80 pb-2">
                  <span className="text-slate-500">Evaluation Dossier</span>
                  <span className="font-mono font-bold text-blue-700">{evaluationNumber}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Specimen</span>
                    <span className="font-semibold text-slate-800">{specimenModel}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Serial Number</span>
                    <span className="font-mono font-semibold text-slate-800">{specimenSerial}</span>
                  </div>
                </div>
              </div>

              {/* Signatory Identity Card */}
              <div className="border border-blue-200 bg-blue-50/50 rounded-lg p-3.5 flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  {currentUser.avatarInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">{currentUser.fullName}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                      {currentUser.roleTitle}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5 truncate">{currentUser.department}</div>
                  <div className="text-[10px] font-mono text-slate-500 mt-1 flex items-center gap-1.5">
                    <Fingerprint className="w-3 h-3 text-blue-600" />
                    <span>Accreditation: {currentUser.accreditationId}</span>
                  </div>
                </div>
              </div>

              {/* Certificate Security Notice */}
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-[11px]">
                <KeyRound className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  Signing with <strong>Class 3 Metrological Signatory Token</strong>. Applying this signature
                  authoritatively locks all 13 test verdicts and authorizes the generation of the official OIML R 76-1 certificate.
                </div>
              </div>

              {/* Form Input for PIN */}
              <form onSubmit={handleApplySignature} className="space-y-4 pt-1">
                {error && (
                  <div className="p-2.5 rounded bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700 text-xs">
                      Metrologist Passphrase / Security PIN
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">Demo Default: 1234</span>
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      autoFocus
                      required
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder="Enter 4-digit PIN"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-900 tracking-widest focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-mono"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <FileCheck2 className="w-4 h-4" />
                    <span>Authorize &amp; Sign Certificate</span>
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
