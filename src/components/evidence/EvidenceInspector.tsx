'use client';

import React, { useState } from 'react';
import {
  CheckCircle,
  Upload,
  Camera,
  Hash,
  Eye,
  FileCheck,
  Shield,
} from 'lucide-react';

export const EvidenceInspector: React.FC = () => {
  const [evidenceList, setEvidenceList] = useState([
    {
      id: 'ev-01',
      fileName: 'intrinsic_error_max_15kg_pan.jpg',
      mimeType: 'image/jpeg',
      fileSize: '2.4 MB',
      capturedAt: '2026-09-27 10:14:22 UTC',
      serverHashSha256: 'a1f89c44e98bc011234567890abcdef0123456789abcdef0123456789abcdef0',
      clientHash: 'a1f89c44e98bc011234567890abcdef0123456789abcdef0123456789abcdef0',
      hashMatch: true,
      ocrCandidate: {
        extractedText: '15.000 kg',
        numericValue: 15.0,
        unit: 'kg',
        confidence: 0.994,
      },
      observationRecordedValue: 15.0,
      delta: 0.0,
      status: 'VERIFIED_BY_REVIEWER' as const,
      verifiedBy: 'Dr. S. K. Nair (Technical Reviewer)',
    },
    {
      id: 'ev-02',
      fileName: 'repeatability_50pct_series1.jpg',
      mimeType: 'image/jpeg',
      fileSize: '1.8 MB',
      capturedAt: '2026-09-27 10:45:00 UTC',
      serverHashSha256: '7b890123456789abcdef0123456789abcdef0123456789abcdef0123456789ab',
      clientHash: '7b890123456789abcdef0123456789abcdef0123456789abcdef0123456789ab',
      hashMatch: true,
      ocrCandidate: {
        extractedText: '7.502 kg',
        numericValue: 7.502,
        unit: 'kg',
        confidence: 0.982,
      },
      observationRecordedValue: 7.5,
      delta: 0.002, // 2 g, within 0.5e = 2.5 g
      status: 'CONSISTENT' as const,
      verifiedBy: null,
    },
    {
      id: 'ev-03',
      fileName: 'eccentricity_corner_quadrant_2.jpg',
      mimeType: 'image/jpeg',
      fileSize: '3.1 MB',
      capturedAt: '2026-09-27 11:10:15 UTC',
      serverHashSha256: '9900aabbccddeeff00112233445566778899aabbccddeeff0011223344556677',
      clientHash: '9900aabbccddeeff00112233445566778899aabbccddeeff0011223344556677',
      hashMatch: true,
      ocrCandidate: {
        extractedText: '4.985 kg',
        numericValue: 4.985,
        unit: 'kg',
        confidence: 0.812,
      },
      observationRecordedValue: 5.0,
      delta: 0.015, // 15 g > 0.5e (2.5 g)
      status: 'DISCREPANCY' as const,
      verifiedBy: null,
    },
  ]);

  const [selectedEvidence, setSelectedEvidence] = useState(evidenceList[0]);

  const handleAttest = (id: string) => {
    setEvidenceList((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: 'VERIFIED_BY_REVIEWER' as const,
              verifiedBy: 'Dr. S. K. Nair (Technical Reviewer)',
            }
          : item
      )
    );
    if (selectedEvidence.id === id) {
      setSelectedEvidence((prev) => ({
        ...prev,
        status: 'VERIFIED_BY_REVIEWER' as const,
        verifiedBy: 'Dr. S. K. Nair (Technical Reviewer)',
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="glass-panel p-5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            <h1 className="text-base font-bold text-white tracking-tight">
              Authoritative Evidence Verification &amp; Assisted OCR
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Server-recomputed SHA-256 cryptographic digests, assisted OCR candidate extraction, and human reviewer attestation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors">
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
            <span>Camera Capture</span>
          </button>
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white transition-colors">
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Evidence</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Evidence List & Deep Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Evidence List (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          {evidenceList.map((ev) => (
            <div
              key={ev.id}
              onClick={() => setSelectedEvidence(ev)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                selectedEvidence.id === ev.id
                  ? 'bg-slate-800/80 border-cyan-500/50 shadow-md shadow-cyan-950/40'
                  : 'glass-panel border-slate-800 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">{ev.fileName}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {ev.fileSize} &bull; {ev.capturedAt}
                  </div>
                </div>

                {ev.status === 'VERIFIED_BY_REVIEWER' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                    ATTESTED
                  </span>
                )}
                {ev.status === 'CONSISTENT' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-400 border border-blue-800">
                    CONSISTENT
                  </span>
                )}
                {ev.status === 'DISCREPANCY' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800">
                    DISCREPANCY
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>SHA-256: {ev.serverHashSha256.substring(0, 12)}...</span>
                <span className="text-cyan-400 font-sans font-medium">Inspect &rarr;</span>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Detailed Verification Inspector (7 Cols) */}
        <div className="lg:col-span-7 glass-panel rounded-xl border border-slate-800 p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white">{selectedEvidence.fileName}</h2>
              <span className="text-xs text-slate-400 font-mono">ID: {selectedEvidence.id}</span>
            </div>
            <button
              onClick={() => handleAttest(selectedEvidence.id)}
              disabled={selectedEvidence.status === 'VERIFIED_BY_REVIEWER'}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedEvidence.status === 'VERIFIED_BY_REVIEWER'
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800 cursor-default'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>
                {selectedEvidence.status === 'VERIFIED_BY_REVIEWER'
                  ? 'Attested by Reviewer'
                  : 'Attest Physical Authenticity'}
              </span>
            </button>
          </div>

          {/* Epistemic Layer 1: File Integrity (Cryptographic Digest) */}
          <div className="p-3.5 bg-slate-900/80 rounded-lg border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-cyan-400" />
                Layer 1: Server-Authoritative Cryptographic Digest
              </span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/80">
                INTEGRITY VERIFIED
              </span>
            </div>
            <div className="p-2 bg-slate-950 rounded font-mono text-[11px] text-cyan-300 break-all border border-slate-800">
              {selectedEvidence.serverHashSha256}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <CheckCircle className="w-3 h-3 text-emerald-400" />
              <span>Recomputed by server upon receipt. Matches client transmission digest.</span>
            </div>
          </div>

          {/* Epistemic Layer 2: Assisted OCR Consistency Check */}
          <div className="p-3.5 bg-slate-900/80 rounded-lg border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-indigo-400" />
                Layer 2: Assisted OCR Consistency Evaluation
              </span>
              <span className="text-[10px] text-slate-400">
                Confidence: {(selectedEvidence.ocrCandidate.confidence * 100).toFixed(1)}%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">OCR Display Candidate</span>
                <span className="text-sm font-bold text-white font-mono">
                  {selectedEvidence.ocrCandidate.extractedText}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Non-authoritative candidate</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Metrologist Entry (L)</span>
                <span className="text-sm font-bold text-cyan-400 font-mono">
                  {selectedEvidence.observationRecordedValue.toFixed(3)} kg
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Observation Point Record</span>
              </div>
            </div>

            <div
              className={`p-2.5 rounded border text-xs flex items-center justify-between ${
                selectedEvidence.delta <= 0.0025
                  ? 'bg-blue-950/40 border-blue-800 text-blue-300'
                  : 'bg-amber-950/40 border-amber-800 text-amber-300'
              }`}
            >
              <span>
                Deviation &Delta; = <strong>{(selectedEvidence.delta * 1000).toFixed(1)} g</strong> (Tolerance &le; 0.5e = 2.5 g)
              </span>
              <span className="font-bold">
                {selectedEvidence.delta <= 0.0025 ? 'CONSISTENT' : 'DISCREPANCY FLAGGED'}
              </span>
            </div>
          </div>

          {/* Epistemic Layer 3: Physical Truth Attestation */}
          <div className="p-3.5 bg-slate-900/80 rounded-lg border border-slate-800 space-y-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Layer 3: Human Metrologist Attestation of Physical Truth
            </span>
            <p className="text-[11px] text-slate-400">
              {selectedEvidence.verifiedBy ? (
                <span className="text-emerald-300">
                  Physical test authenticity attested by: <strong>{selectedEvidence.verifiedBy}</strong>
                </span>
              ) : (
                <span className="text-amber-400">
                  Pending peer reviewer manual attestation before evaluation approval.
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
