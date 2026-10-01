'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileText,
  Camera,
  History,
  AlertOctagon,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Layers,
} from 'lucide-react';
import {
  EvaluationRecord,
  EvaluationRegisterService,
  NextActionInfo,
} from '@/services/operations/evaluation-register-service';
import { IssuesFindingsService } from '@/services/operations/issues-findings-service';
import { EvidenceRegisterService } from '@/services/evidence/evidence-register-service';
import { EvaluationReadinessModal } from './EvaluationReadinessModal';
import { InstrumentHistoryModal } from '../operations/InstrumentHistoryModal';

interface EvaluationOverviewCardProps {
  evaluationRecord: EvaluationRecord;
  onNavigateToStep: (step: 1 | 2 | 3 | 4 | 5 | 6) => void;
  onSelectTest?: (testCode: string) => void;
  isCompact?: boolean;
}

export const EvaluationOverviewCard: React.FC<EvaluationOverviewCardProps> = ({
  evaluationRecord,
  onNavigateToStep,
  onSelectTest,
  isCompact = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(isCompact);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showReadinessModal, setShowReadinessModal] = useState(false);
  const [showInstrumentHistory, setShowInstrumentHistory] = useState(false);

  // Sync collapsed state when isCompact changes (e.g. stepping into/out of Step 4)
  React.useEffect(() => {
    setIsCollapsed(isCompact);
  }, [isCompact]);

  const nextActionInfo: NextActionInfo = EvaluationRegisterService.computeNextAction(evaluationRecord);
  const readiness = EvaluationRegisterService.checkReadiness(evaluationRecord);
  const openFindings = IssuesFindingsService.getFindingsForEvaluation(evaluationRecord.evaluationNumber).filter(
    (f) => f.status === 'OPEN' || f.status === 'IN_PROGRESS'
  );
  const evidenceItems = EvidenceRegisterService.getEvidenceForEvaluation(evaluationRecord.evaluationNumber);

  // Compact Collapsed 1-Line Bar (for Step 4 Testing to maximize workspace height)
  if (isCollapsed) {
    return (
      <>
        <div className="bg-white border border-slate-200 rounded-lg shadow-2xs px-4 py-2 flex items-center justify-between gap-3 text-xs font-sans">
          {/* Left: Specimen Identity & Numbers */}
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 shrink-0">
              {evaluationRecord.evaluationNumber}
            </span>
            <span className="font-bold text-slate-800 truncate">
              {evaluationRecord.modelName}
            </span>
            <span className="text-slate-400">&bull;</span>
            <span className="text-slate-600 truncate hidden sm:inline">
              {evaluationRecord.manufacturer}
            </span>
            <span className="text-slate-400 hidden md:inline">&bull;</span>
            <button
              type="button"
              onClick={() => setShowInstrumentHistory(true)}
              className="font-mono text-slate-600 hover:text-blue-700 hover:underline cursor-pointer hidden md:inline"
              title="View instrument history"
            >
              SN: {evaluationRecord.serialNumber}
            </button>
            <span className="text-slate-400 hidden lg:inline">&bull;</span>
            <span className="text-blue-700 font-semibold hidden lg:inline">
              Class {evaluationRecord.accuracyClass}
            </span>
          </div>

          {/* Right: Status, Progress, Readiness, Expand Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline-block font-mono text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {evaluationRecord.completedTestsCount} / {evaluationRecord.applicableTestsCount} tests
            </span>

            <span className="font-mono font-bold text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
              {evaluationRecord.status.replace(/_/g, ' ')}
            </span>

            <button
              type="button"
              onClick={() => setShowReadinessModal(true)}
              className={`px-2 py-1 text-[11px] font-semibold rounded border transition-colors flex items-center gap-1 cursor-pointer ${
                readiness.isReady
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
            >
              {readiness.isReady ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-3 h-3 text-amber-600" />
              )}
              <span>Readiness</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCollapsed(false)}
              className="px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded flex items-center gap-1 cursor-pointer transition-colors"
              title="Expand full evaluation dashboard"
            >
              <span>Expand</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Modals available even when collapsed */}
        <EvaluationReadinessModal
          isOpen={showReadinessModal}
          onClose={() => setShowReadinessModal(false)}
          evaluationNumber={evaluationRecord.evaluationNumber}
          readiness={readiness}
          onNavigateToStep={onNavigateToStep}
          onStartTesting={() => onNavigateToStep(4)}
        />
        {showInstrumentHistory && (
          <InstrumentHistoryModal
            serialNumber={evaluationRecord.serialNumber}
            onClose={() => setShowInstrumentHistory(false)}
          />
        )}
      </>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-2xs p-5 space-y-4 font-sans">
      {/* Top Header: Evaluation Identity */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
              {evaluationRecord.evaluationNumber}
            </span>
            <span className="text-xs font-bold text-slate-800">
              {evaluationRecord.modelName} &bull; {evaluationRecord.manufacturer}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
            <span>
              Serial:{' '}
              <button
                type="button"
                onClick={() => setShowInstrumentHistory(true)}
                className="font-mono font-semibold text-slate-800 hover:text-blue-700 hover:underline cursor-pointer"
                title="View physical instrument lifecycle history"
              >
                {evaluationRecord.serialNumber}
              </button>
            </span>
            <span>&bull;</span>
            <span>Class: <strong>{evaluationRecord.accuracyClass}</strong></span>
            <span>&bull;</span>
            <span>Operator: <strong>{evaluationRecord.assignedOperator}</strong></span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowReadinessModal(true)}
            className={`px-2.5 py-1 text-xs font-semibold rounded border transition-colors flex items-center gap-1.5 cursor-pointer ${
              readiness.isReady
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
            }`}
          >
            {readiness.isReady ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span>Readiness Check</span>
          </button>

          <button
            type="button"
            onClick={() => setShowTimeline((prev) => !prev)}
            className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>Timeline</span>
            {showTimeline ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded flex items-center gap-1 cursor-pointer transition-colors"
            title="Collapse to compact bar"
          >
            <span>Minimize</span>
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Core Operational Grid: Result, Status, Progress, Next Action, Blockers */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
        {/* OVERALL RESULT */}
        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
          <span className="text-[11px] text-slate-400 block font-medium uppercase tracking-wider">
            Overall Result
          </span>
          <div className="mt-1">
            {evaluationRecord.overallResult === 'PASS' && (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> PASS
              </span>
            )}
            {evaluationRecord.overallResult === 'FAIL' && (
              <span className="text-red-700 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> FAIL
              </span>
            )}
            {evaluationRecord.overallResult === 'PENDING' && (
              <span className="text-slate-700 font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> NOT DETERMINED
              </span>
            )}
          </div>
        </div>

        {/* STATUS */}
        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
          <span className="text-[11px] text-slate-400 block font-medium uppercase tracking-wider">
            Status
          </span>
          <span className="mt-1 inline-block font-mono font-bold text-slate-800">
            {evaluationRecord.status.replace(/_/g, ' ')}
          </span>
        </div>

        {/* PROGRESS */}
        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
          <span className="text-[11px] text-slate-400 block font-medium uppercase tracking-wider">
            Progress
          </span>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-mono font-bold text-slate-800">
              {evaluationRecord.completedTestsCount} / {evaluationRecord.applicableTestsCount}
            </span>
            <span className="text-[10px] text-slate-500">tests</span>
          </div>
        </div>

        {/* NEXT ACTION (Prompt Section 13) */}
        <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded sm:col-span-2 flex flex-col justify-between">
          <div>
            <span className="text-[11px] text-blue-700 block font-bold uppercase tracking-wider">
              Next Action
            </span>
            <span className="text-xs text-blue-950 font-semibold mt-0.5 block leading-snug">
              {nextActionInfo.nextAction}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToStep(nextActionInfo.recommendedStep)}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 mt-1 self-start cursor-pointer hover:underline"
          >
            <span>Proceed to Step {nextActionInfo.recommendedStep}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Blockers Row if any exist */}
      {nextActionInfo.blockers.length > 0 && (
        <div className="p-2.5 bg-red-50 border border-red-200 rounded text-xs flex items-center gap-2 text-red-900">
          <AlertOctagon className="w-4 h-4 text-red-600 shrink-0" />
          <div>
            <strong>Blockers: </strong>
            <span>{nextActionInfo.blockers.join(' &bull; ')}</span>
          </div>
        </div>
      )}

      {/* Summary Snippets: Findings, Evidence, Report */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
        {/* Issues & Findings summary */}
        <div className="p-2.5 border border-slate-200 rounded flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-slate-400" />
            <div>
              <span className="font-semibold text-slate-800 block">Issues &amp; Findings</span>
              <span className="text-[11px] text-slate-500">
                {openFindings.length > 0 ? `${openFindings.length} open issue(s)` : 'No active discrepancies'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToStep(5)}
            className="text-[11px] text-blue-700 font-semibold hover:underline"
          >
            View
          </button>
        </div>

        {/* Evidence Count */}
        <div className="p-2.5 border border-slate-200 rounded flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-slate-400" />
            <div>
              <span className="font-semibold text-slate-800 block">Traceable Evidence</span>
              <span className="text-[11px] text-slate-500">{evidenceItems.length} records verified</span>
            </div>
          </div>
          <span className="text-[11px] font-mono text-slate-500">SHA-256</span>
        </div>

        {/* Report Status */}
        <div className="p-2.5 border border-slate-200 rounded flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            <div>
              <span className="font-semibold text-slate-800 block">OIML Report</span>
              <span className="text-[11px] text-slate-500 font-mono">
                {evaluationRecord.reportNumber || 'Draft (Step 6)'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToStep(6)}
            className="text-[11px] text-blue-700 font-semibold hover:underline"
          >
            Inspect
          </button>
        </div>
      </div>

      {/* Chronological Evaluation Timeline (Prompt Section 7) */}
      {showTimeline && (
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-blue-700" />
              Chronological Evaluation Activity Timeline
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">
              Immutable Audit Events
            </span>
          </div>

          <div className="relative pl-4 space-y-3 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {evaluationRecord.timeline.map((event) => (
              <div key={event.id} className="relative text-xs">
                <div className="absolute -left-4 top-1 w-2 h-2 rounded-full bg-blue-700 ring-2 ring-white" />
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">{event.eventName}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(event.timestamp).toLocaleString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                {event.details && (
                  <p className="text-[11px] text-slate-600 mt-0.5">{event.details}</p>
                )}
                <span className="text-[10px] text-slate-400 block mt-0.5">Actor: {event.actor}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Readiness Check Modal */}
      <EvaluationReadinessModal
        isOpen={showReadinessModal}
        onClose={() => setShowReadinessModal(false)}
        evaluationNumber={evaluationRecord.evaluationNumber}
        readiness={readiness}
        onNavigateToStep={onNavigateToStep}
        onStartTesting={() => onNavigateToStep(4)}
      />

      {/* Physical Instrument History Modal */}
      {showInstrumentHistory && (
        <InstrumentHistoryModal
          serialNumber={evaluationRecord.serialNumber}
          onClose={() => setShowInstrumentHistory(false)}
        />
      )}
    </div>
  );
};
