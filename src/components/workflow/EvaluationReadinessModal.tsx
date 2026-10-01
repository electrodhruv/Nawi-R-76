'use client';

import React from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  X,
  Play,
} from 'lucide-react';
import {
  ReadinessCheckResult,
  ReadinessCheckItem,
} from '@/services/operations/evaluation-register-service';

interface EvaluationReadinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluationNumber: string;
  readiness: ReadinessCheckResult;
  onNavigateToStep: (step: 1 | 2 | 3 | 4 | 5 | 6) => void;
  onStartTesting: () => void;
}

export const EvaluationReadinessModal: React.FC<EvaluationReadinessModalProps> = ({
  isOpen,
  onClose,
  evaluationNumber,
  readiness,
  onNavigateToStep,
  onStartTesting,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                {evaluationNumber}
              </span>
              <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                Pre-Test Verification
              </span>
            </div>
            <h2 className="text-sm font-bold text-slate-900 mt-1">
              Evaluation Readiness Check
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Callout Banner */}
        <div
          className={`p-3.5 rounded-lg border flex items-center gap-3 ${
            readiness.isReady
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          {readiness.isReady ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <div>
            <span className="font-bold text-xs uppercase tracking-wide block">
              {readiness.isReady ? 'READY TO BEGIN TESTING' : 'NOT READY — PREREQUISITES PENDING'}
            </span>
            <p className="text-xs mt-0.5 opacity-90">
              {readiness.isReady
                ? 'All mandatory identity records, valid reference standards, and parameters are verified.'
                : `${readiness.blockers.length} operational blocker(s) must be addressed before accredited testing.`}
            </p>
          </div>
        </div>

        {/* Compact Checklist (Prompt Sections 11 & 12) */}
        <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden bg-slate-50/50">
          {readiness.checks.map((check) => (
            <div
              key={check.id}
              className="p-3 flex items-center justify-between gap-3 text-xs bg-white"
            >
              <div className="flex items-center gap-2.5">
                {check.isSatisfied ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <div>
                  <span className={`font-medium ${check.isSatisfied ? 'text-slate-800' : 'text-red-900 font-bold'}`}>
                    {check.label}
                  </span>
                  {check.blockerMessage && (
                    <span className="block text-[11px] text-red-700 mt-0.5">
                      {check.blockerMessage}
                    </span>
                  )}
                </div>
              </div>

              {/* Direct Action Link (Section 12 requirement) */}
              {!check.isSatisfied && check.actionLabel && check.actionStep && (
                <button
                  type="button"
                  onClick={() => {
                    onNavigateToStep(check.actionStep!);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 px-2 py-1 rounded border border-blue-200 hover:bg-blue-100 transition-colors"
                >
                  <span>{check.actionLabel}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold"
          >
            Close
          </button>

          {readiness.isReady ? (
            <button
              type="button"
              onClick={() => {
                onStartTesting();
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold shadow-2xs"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Begin Testing Workspace</span>
            </button>
          ) : (
            <span className="text-[11px] text-slate-400 italic">
              Resolve blockers above to begin testing
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
