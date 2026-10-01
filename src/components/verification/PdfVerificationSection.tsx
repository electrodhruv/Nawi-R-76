'use client';

import React, { useState } from 'react';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { PdfVerificationResult } from '@/services/verification/verification-types';

interface PdfVerificationSectionProps {
  token: string;
  expectedHash?: string;
}

export const PdfVerificationSection: React.FC<PdfVerificationSectionProps> = ({
  token,
  expectedHash,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<PdfVerificationResult | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const handleVerify = async () => {
    if (!selectedFile) return;

    setIsVerifying(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('token', token);

      const res = await fetch('/api/verification/verify-file', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Failed to verify PDF file');
      }

      const data: PdfVerificationResult = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setError('Unable to verify PDF file at this time. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="border-t border-slate-200 p-6 bg-slate-50/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-700" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Verify Issued PDF Document
          </h3>
        </div>
        <span className="text-[11px] text-slate-500 font-medium">
          Cryptographic Integrity Check
        </span>
      </div>

      <p className="text-xs text-slate-600 mb-4 leading-relaxed">
        Upload the PDF test report file you received to verify whether its byte content exactly matches the authentic signed copy issued by the accredited laboratory.
      </p>

      {/* File Upload Zone */}
      {!result ? (
        <div className="space-y-3">
          <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-lg p-5 text-center bg-white transition-colors">
            <input
              type="file"
              accept=".pdf,application/pdf"
              id="pdf-verify-upload"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="pdf-verify-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <div className="text-xs font-semibold text-slate-800">
                {selectedFile ? selectedFile.name : 'Click to select or drag PDF file here'}
              </div>
              <div className="text-[11px] text-slate-400">
                {selectedFile
                  ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                  : 'Official OIML R 76-2 Laboratory Test Report (.pdf)'}
              </div>
            </label>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            {selectedFile && (
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-md bg-white hover:bg-slate-50"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={handleVerify}
              disabled={!selectedFile || isVerifying}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Computing SHA-256 Digest...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify PDF File</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Verification Outcome Card */
        <div className="space-y-4">
          {result.isExactMatch ? (
            /* EXACT ISSUED REPORT */
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-200 text-emerald-900">
                      Exact Match
                    </span>
                    <span className="text-[11px] text-emerald-800 font-medium font-mono">
                      {result.fileName}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-emerald-950 mt-1">
                    EXACT ISSUED REPORT
                  </h4>
                  <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                    Cryptographic SHA-256 digest matches the officially issued laboratory PDF byte-for-byte. The document has not been altered, modified, or re-signed.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* PDF DOES NOT MATCH ISSUED REPORT */
            <div className="p-4 rounded-xl bg-red-50 border border-red-200">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-200 text-red-900">
                      Mismatch
                    </span>
                    <span className="text-[11px] text-red-800 font-medium font-mono">
                      {result.fileName}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-red-950 mt-1">
                    PDF DOES NOT MATCH ISSUED REPORT
                  </h4>
                  <p className="text-xs text-red-900 mt-1 leading-relaxed">
                    The cryptographic digest of the uploaded file differs from the official signed laboratory copy. The document may have been altered, edited, or re-saved by an unauthorized third party.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Expandable Technical Details */}
          <div className="border border-slate-200 rounded-lg p-3 bg-white text-xs">
            <button
              type="button"
              onClick={() => setShowTechnicalDetails((prev) => !prev)}
              className="w-full flex items-center justify-between text-slate-700 hover:text-slate-900 font-medium text-[11px]"
            >
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>Technical Cryptographic Details</span>
              </div>
              {showTechnicalDetails ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            {showTechnicalDetails && (
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-[11px] font-mono text-slate-700">
                <div>
                  <span className="text-slate-400 block text-[10px] font-sans">
                    COMPUTED SHA-256 (UPLOADED FILE)
                  </span>
                  <span className="break-all text-slate-900">{result.computedSha256}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] font-sans">
                    EXPECTED SHA-256 (SIGNED ISSUED RECORD)
                  </span>
                  <span className="break-all text-slate-900">
                    {result.expectedSha256 || expectedHash || 'Not recorded'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] font-sans">
                    VERIFIED AT
                  </span>
                  <span>{result.verifiedAt}</span>
                </div>
              </div>
            )}
          </div>

          {/* Action to verify another file */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Verify Another File</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
