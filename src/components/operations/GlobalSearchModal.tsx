'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  Scale,
  FileText,
  Camera,
  Award,
  Layers,
  ExternalLink,
  ArrowRight,
  Info,
} from 'lucide-react';
import { EvaluationRegisterService } from '@/services/operations/evaluation-register-service';
import { EvidenceRegisterService } from '@/services/evidence/evidence-register-service';
import { ReferenceStandardsService } from '@/services/repository/reference-standards-service';
import { InstrumentRepositoryService } from '@/services/repository/instrument-repository-service';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEvaluation: (evaluationNumber: string) => void;
  onSelectInstrument?: (serialNumber: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectEvaluation,
  onSelectInstrument,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const allEvaluations = useMemo(() => EvaluationRegisterService.getAllEvaluations(), []);
  const allEvidence = useMemo(() => EvidenceRegisterService.getAllEvidence(), []);
  const allStandards = useMemo(() => ReferenceStandardsService.getAllStandards(), []);

  // Compute relational search results
  const searchResults = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term || term.length < 2) return null;

    // Matching Evaluations
    const matchedEvals = allEvaluations.filter(
      (e) =>
        e.evaluationNumber.toLowerCase().includes(term) ||
        e.serialNumber.toLowerCase().includes(term) ||
        e.manufacturer.toLowerCase().includes(term) ||
        e.modelName.toLowerCase().includes(term) ||
        (e.reportNumber && e.reportNumber.toLowerCase().includes(term))
    );

    // Matching Instruments / Physical Serials
    const matchedSerials = Array.from(
      new Set(
        allEvaluations
          .filter(
            (e) =>
              e.serialNumber.toLowerCase().includes(term) ||
              e.manufacturer.toLowerCase().includes(term) ||
              e.modelName.toLowerCase().includes(term)
          )
          .map((e) => e.serialNumber)
      )
    ).map((serial) => {
      const relatedEval = allEvaluations.find((e) => e.serialNumber === serial);
      const relatedEvidence = allEvidence.filter((ev) => ev.evaluationNumber === relatedEval?.evaluationNumber);
      return {
        serialNumber: serial,
        modelName: relatedEval?.modelName || 'Unknown Model',
        manufacturer: relatedEval?.manufacturer || 'Unknown Manufacturer',
        relatedEvaluation: relatedEval?.evaluationNumber,
        reportNumber: relatedEval?.reportNumber,
        evidenceCount: relatedEvidence.length,
        evidenceIds: relatedEvidence.map((ev) => ev.id).slice(0, 3),
      };
    });

    // Matching Evidence records
    const matchedEvidence = allEvidence.filter(
      (ev) =>
        ev.id.toLowerCase().includes(term) ||
        ev.evaluationNumber.toLowerCase().includes(term) ||
        ev.fileName.toLowerCase().includes(term) ||
        ev.description.toLowerCase().includes(term)
    );

    // Matching Reference Standards
    const matchedStandards = allStandards.filter(
      (s) =>
        s.standardId.toLowerCase().includes(term) ||
        s.description.toLowerCase().includes(term) ||
        s.serialNumber.toLowerCase().includes(term) ||
        s.certificateNumber.toLowerCase().includes(term)
    );

    const totalCount =
      matchedEvals.length + matchedSerials.length + matchedEvidence.length + matchedStandards.length;

    return {
      evaluations: matchedEvals,
      instruments: matchedSerials,
      evidence: matchedEvidence,
      standards: matchedStandards,
      totalCount,
    };
  }, [searchTerm, allEvaluations, allEvidence, allStandards]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 backdrop-blur-xs p-4 pt-16 sm:pt-20">
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-slate-200 gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Evaluation No, Serial No, Model, Evidence ID, Report No, Standard ID..."
            className="flex-1 bg-transparent border-0 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
            autoFocus
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded"
          >
            Esc
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {!searchTerm || searchTerm.length < 2 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              <Search className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="font-medium text-slate-600">Contextual Relational Search</p>
              <p className="mt-1 text-slate-400">
                Type a serial number (e.g. <code>SN-RS-26003</code>), evaluation number, or standard ID.
              </p>
            </div>
          ) : searchResults && searchResults.totalCount === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              <Info className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="font-medium text-slate-600">No matching laboratory records found.</p>
            </div>
          ) : (
            searchResults && (
              <div className="space-y-4">
                {/* 1. RELATIONAL INSTRUMENT SPECIMEN MATCHES */}
                {searchResults.instruments.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Physical Instruments &amp; Relational Map
                    </span>
                    {searchResults.instruments.map((inst) => (
                      <div
                        key={inst.serialNumber}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-blue-400 transition-colors cursor-pointer text-xs space-y-2"
                        onClick={() => {
                          if (inst.relatedEvaluation) {
                            onSelectEvaluation(inst.relatedEvaluation);
                            onClose();
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Scale className="w-4 h-4 text-blue-700" />
                            <span className="font-mono font-bold text-slate-900">
                              {inst.serialNumber}
                            </span>
                            <span className="text-slate-600">({inst.modelName} &bull; {inst.manufacturer})</span>
                          </div>
                          <span className="text-[11px] text-blue-700 font-semibold flex items-center gap-1">
                            Inspect <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>

                        {/* Relational Links per Section 17 */}
                        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200/80 text-[11px] font-mono text-slate-600">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Evaluations:</span>
                            <span className="font-bold text-slate-800">{inst.relatedEvaluation || 'None'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Evidence:</span>
                            <span>{inst.evidenceIds.join(', ') || 'None'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Reports:</span>
                            <span>{inst.reportNumber || 'None'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. EVALUATIONS */}
                {searchResults.evaluations.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Evaluations
                    </span>
                    {searchResults.evaluations.map((ev) => (
                      <div
                        key={ev.id}
                        onClick={() => {
                          onSelectEvaluation(ev.evaluationNumber);
                          onClose();
                        }}
                        className="p-2.5 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-mono font-bold text-blue-700">{ev.evaluationNumber}</span>
                          <span className="text-slate-600 ml-2 font-mono">[{ev.serialNumber}]</span>
                          <span className="text-slate-500 ml-1">{ev.modelName}</span>
                        </div>
                        <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {ev.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 3. EVIDENCE */}
                {searchResults.evidence.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Evidence
                    </span>
                    {searchResults.evidence.map((ev) => (
                      <div
                        key={ev.id}
                        onClick={() => {
                          onSelectEvaluation(ev.evaluationNumber);
                          onClose();
                        }}
                        className="p-2.5 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <Camera className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-mono font-bold text-slate-800">{ev.id}</span>
                          <span className="text-slate-500 truncate max-w-[300px]">{ev.description}</span>
                        </div>
                        <span className="font-mono text-[11px] text-blue-700">
                          {ev.evaluationNumber}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 4. REFERENCE STANDARDS */}
                {searchResults.standards.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Reference Standards
                    </span>
                    {searchResults.standards.map((std) => (
                      <div
                        key={std.standardId}
                        className="p-2.5 bg-white border border-slate-200 rounded text-xs flex items-center justify-between"
                      >
                        <div>
                          <span className="font-mono font-bold text-blue-700">{std.standardId}</span>
                          <span className="text-slate-700 ml-2">{std.description}</span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500">
                          Valid until {std.validUntil}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
