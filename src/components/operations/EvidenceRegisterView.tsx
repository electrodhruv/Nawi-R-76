'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Camera,
  FileText,
  Award,
  Video,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Hash,
  Clock,
  User,
  Info,
  X,
  FileCheck,
  Eye,
} from 'lucide-react';
import {
  EvidenceRecord,
  EvidenceRegisterService,
  EvidenceType,
  EvidencePurposeCategory,
  EvidenceReviewStatus,
} from '@/services/evidence/evidence-register-service';

interface EvidenceRegisterViewProps {
  onOpenEvaluation?: (evaluationNumber: string) => void;
}

type EvidenceFilterType =
  | 'ALL'
  | 'PHOTOS'
  | 'DOCUMENTS'
  | 'CERTIFICATES'
  | 'VIDEOS'
  | 'UNLINKED'
  | 'VERIFICATION_ISSUES';

export const EvidenceRegisterView: React.FC<EvidenceRegisterViewProps> = ({
  onOpenEvaluation,
}) => {
  const [evidenceList, setEvidenceList] = useState<EvidenceRecord[]>(() =>
    EvidenceRegisterService.getAllEvidence()
  );

  React.useEffect(() => {
    const unsubscribe = EvidenceRegisterService.subscribe(() => {
      setEvidenceList(EvidenceRegisterService.getAllEvidence());
    });
    return unsubscribe;
  }, []);

  const [activeFilter, setActiveFilter] = useState<EvidenceFilterType>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceRecord | null>(null);

  // Purpose Category Formatter
  const formatPurpose = (purpose: EvidencePurposeCategory) => {
    switch (purpose) {
      case 'IDENTITY':
        return 'Instrument Identity';
      case 'NAMEPLATE':
        return 'Nameplate Verification';
      case 'TEST_SETUP':
        return 'Test Setup & Environment';
      case 'OBSERVATION_EVIDENCE':
        return 'Observation Indication';
      case 'REFERENCE_STANDARD':
        return 'Reference Standard';
      case 'ENVIRONMENTAL_CONDITION':
        return 'Environmental Condition';
      case 'SUPPORTING_DOCUMENT':
        return 'Supporting Document';
      default:
        return purpose;
    }
  };

  // Filtered Evidence
  const filteredEvidence = useMemo(() => {
    return evidenceList.filter((item) => {
      // Search term filter
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        item.id.toLowerCase().includes(term) ||
        item.evaluationNumber.toLowerCase().includes(term) ||
        (item.testName && item.testName.toLowerCase().includes(term)) ||
        (item.clause && item.clause.toLowerCase().includes(term)) ||
        item.fileName.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term) ||
        item.uploadedBy.toLowerCase().includes(term);

      if (!matchesSearch) return false;

      // Filter tabs
      switch (activeFilter) {
        case 'ALL':
          return true;
        case 'PHOTOS':
          return item.type === 'PHOTO';
        case 'DOCUMENTS':
          return item.type === 'DOCUMENT';
        case 'CERTIFICATES':
          return item.type === 'CERTIFICATE';
        case 'VIDEOS':
          return item.type === 'VIDEO';
        case 'UNLINKED':
          return !item.testCode;
        case 'VERIFICATION_ISSUES':
          return (
            item.status === 'DISCREPANCY' ||
            item.integrityStatus === 'TAMPER_DETECTED' ||
            item.consistencyVerdict === 'DISCREPANCY'
          );
        default:
          return true;
      }
    });
  }, [evidenceList, activeFilter, searchTerm]);

  // Counts for tabs
  const counts = useMemo(() => {
    return {
      all: evidenceList.length,
      photos: evidenceList.filter((e) => e.type === 'PHOTO').length,
      documents: evidenceList.filter((e) => e.type === 'DOCUMENT').length,
      certificates: evidenceList.filter((e) => e.type === 'CERTIFICATE').length,
      videos: evidenceList.filter((e) => e.type === 'VIDEO').length,
      unlinked: evidenceList.filter((e) => !e.testCode).length,
      issues: evidenceList.filter(
        (e) =>
          e.status === 'DISCREPANCY' ||
          e.integrityStatus === 'TAMPER_DETECTED' ||
          e.consistencyVerdict === 'DISCREPANCY'
      ).length,
    };
  }, [evidenceList]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              Evidence Register
            </h1>
            <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {filteredEvidence.length} Records
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Centralized evidentiary repository ensuring legal traceability, SHA-256 cryptographic digests, and OIR verification.
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeFilter === 'ALL'
                ? 'bg-blue-700 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All Evidence ({counts.all})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('PHOTOS')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeFilter === 'PHOTOS'
                ? 'bg-blue-700 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Photos ({counts.photos})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('DOCUMENTS')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeFilter === 'DOCUMENTS'
                ? 'bg-blue-700 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Documents ({counts.documents})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('CERTIFICATES')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeFilter === 'CERTIFICATES'
                ? 'bg-blue-700 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            Certificates ({counts.certificates})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('VIDEOS')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeFilter === 'VIDEOS'
                ? 'bg-blue-700 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            Videos ({counts.videos})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('UNLINKED')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeFilter === 'UNLINKED'
                ? 'bg-blue-700 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Unlinked ({counts.unlinked})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('VERIFICATION_ISSUES')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeFilter === 'VERIFICATION_ISSUES'
                ? 'bg-red-700 text-white shadow-2xs'
                : 'text-red-700 hover:bg-red-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Verification Issues ({counts.issues})
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Evidence ID, Evaluation, Test, Clause, File Name, or Uploaded By..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-md text-xs placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>
      </div>

      {/* Main Evidence Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">Evidence ID</th>
                <th className="py-2.5 px-3">Evaluation</th>
                <th className="py-2.5 px-3">Test / Clause</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Purpose</th>
                <th className="py-2.5 px-3">Captured / Uploaded</th>
                <th className="py-2.5 px-3">Uploaded By</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Integrity</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredEvidence.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <Info className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600">No evidence records matched your criteria.</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Check your search term or select another filter view.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredEvidence.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    onClick={() => setSelectedEvidence(item)}
                  >
                    {/* ID */}
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-blue-700 group-hover:underline">
                        {item.id}
                      </span>
                    </td>

                    {/* Evaluation */}
                    <td className="py-3 px-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onOpenEvaluation) onOpenEvaluation(item.evaluationNumber);
                        }}
                        className="font-mono text-slate-700 hover:text-blue-700 hover:underline"
                      >
                        {item.evaluationNumber}
                      </button>
                    </td>

                    {/* Test / Clause */}
                    <td className="py-3 px-3 max-w-[200px]">
                      {item.testName ? (
                        <div>
                          <div className="font-medium text-slate-800 truncate" title={item.testName}>
                            {item.testName}
                          </div>
                          <div className="text-[11px] text-slate-400">{item.clause}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unlinked specimen intake</span>
                      )}
                    </td>

                    {/* Type */}
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {item.type === 'PHOTO' && <Camera className="w-3 h-3 text-slate-500" />}
                        {item.type === 'DOCUMENT' && <FileText className="w-3 h-3 text-slate-500" />}
                        {item.type === 'CERTIFICATE' && <Award className="w-3 h-3 text-slate-500" />}
                        {item.type === 'VIDEO' && <Video className="w-3 h-3 text-slate-500" />}
                        {item.type}
                      </span>
                    </td>

                    {/* Purpose */}
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-800 border border-blue-200">
                        {formatPurpose(item.purpose)}
                      </span>
                    </td>

                    {/* Captured Date */}
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                      {new Date(item.capturedAt).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    {/* Uploaded By */}
                    <td className="py-3 px-3 text-slate-600 truncate max-w-[140px]">
                      {item.uploadedBy}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3">
                      {item.status === 'VERIFIED' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Verified
                        </span>
                      )}
                      {item.status === 'DISCREPANCY' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                          <AlertTriangle className="w-3 h-3" />
                          Discrepancy
                        </span>
                      )}
                      {item.status === 'UPLOADED' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          <Clock className="w-3 h-3" />
                          Uploaded
                        </span>
                      )}
                      {item.status === 'SUPERSEDED' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          Superseded
                        </span>
                      )}
                    </td>

                    {/* Integrity */}
                    <td className="py-3 px-3">
                      {item.integrityStatus === 'HASH_VERIFIED' ? (
                        <span
                          className="inline-flex items-center gap-1 text-[11px] text-blue-700 font-medium"
                          title={`SHA-256: ${item.serverHashSha256}`}
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                          SHA-256 OK
                        </span>
                      ) : item.integrityStatus === 'TAMPER_DETECTED' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-red-700 font-bold">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                          Tampered
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Pending</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvidence(item);
                        }}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Evidence Details Modal / Drawer */}
      {selectedEvidence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-2xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                    {selectedEvidence.id}
                  </span>
                  <span className="text-xs font-semibold text-slate-800">
                    {formatPurpose(selectedEvidence.purpose)}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-1">
                  {selectedEvidence.fileName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvidence(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Purpose & Evidentiary Statement */}
            <div className="bg-slate-50 border border-slate-200 rounded p-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Evidentiary Value &amp; Legal Traceability Purpose
              </span>
              <p className="text-xs text-slate-800 mt-1 leading-relaxed">
                {selectedEvidence.description}
              </p>
            </div>

            {/* Traceability Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-white border border-slate-200 rounded p-2.5">
                <span className="text-[11px] text-slate-400 block">Evaluation Number</span>
                <span className="font-mono font-bold text-slate-800">
                  {selectedEvidence.evaluationNumber}
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded p-2.5">
                <span className="text-[11px] text-slate-400 block">Test &amp; Clause</span>
                <span className="font-medium text-slate-800 truncate block">
                  {selectedEvidence.clause || 'Administrative Intake'}
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded p-2.5">
                <span className="text-[11px] text-slate-400 block">Uploaded By</span>
                <span className="font-medium text-slate-800 truncate block">
                  {selectedEvidence.uploadedBy}
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded p-2.5">
                <span className="text-[11px] text-slate-400 block">Timestamp</span>
                <span className="font-mono text-slate-700">
                  {new Date(selectedEvidence.capturedAt).toISOString()}
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded p-2.5">
                <span className="text-[11px] text-slate-400 block">Evidence Status</span>
                <span className="font-bold text-emerald-700">
                  {selectedEvidence.status}
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded p-2.5">
                <span className="text-[11px] text-slate-400 block">MIME Type</span>
                <span className="font-mono text-slate-600">
                  {selectedEvidence.mimeType}
                </span>
              </div>
            </div>

            {/* OCR & Consistency Result if available */}
            {selectedEvidence.ocrExtractedValue && (
              <div className="border border-slate-200 rounded p-3 bg-amber-50/40">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-900 uppercase">
                    OCR Extraction &amp; Observation Consistency
                  </span>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded font-bold ${
                      selectedEvidence.consistencyVerdict === 'CONSISTENT'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {selectedEvidence.consistencyVerdict === 'CONSISTENT'
                      ? 'Consistent With Observation'
                      : 'Discrepancy Detected'}
                  </span>
                </div>
                <div className="mt-2 text-xs flex items-center gap-4">
                  <div>
                    <span className="text-slate-500 text-[11px]">Extracted Text: </span>
                    <strong className="font-mono text-slate-900">{selectedEvidence.ocrExtractedValue}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px]">Confidence: </span>
                    <strong className="font-mono text-slate-900">
                      {Math.round((selectedEvidence.ocrConfidence || 0) * 100)}%
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* SHA-256 Cryptographic Digest */}
            <div className="bg-slate-900 text-slate-200 rounded p-3 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                <span className="flex items-center gap-1 font-semibold text-slate-300">
                  <Hash className="w-3.5 h-3.5 text-blue-400" /> SHA-256 Cryptographic Hash
                </span>
                <span className="text-emerald-400 font-bold">Tamper Verified</span>
              </div>
              <p className="break-all text-[11px] text-slate-300">
                {selectedEvidence.serverHashSha256}
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              {onOpenEvaluation && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenEvaluation(selectedEvidence.evaluationNumber);
                    setSelectedEvidence(null);
                  }}
                  className="inline-flex items-center gap-1 text-xs text-blue-700 hover:underline font-semibold"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Jump to Evaluation {selectedEvidence.evaluationNumber}
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedEvidence(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold ml-auto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
