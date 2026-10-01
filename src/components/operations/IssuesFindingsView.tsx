'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  User,
  Info,
  ChevronRight,
  Check,
  ArrowRight,
} from 'lucide-react';
import {
  EvaluationFinding,
  FindingSeverity,
  FindingStatus,
  FindingType,
  IssuesFindingsService,
} from '@/services/operations/issues-findings-service';

interface IssuesFindingsViewProps {
  evaluationFilter?: string; // If provided, shows findings only for this evaluation
  onOpenEvaluation?: (evaluationNumber: string) => void;
  onOpenTestRun?: (testCode: string) => void;
}

type FindingTabType = 'ALL' | 'BLOCKING' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'VERIFIED';

export const IssuesFindingsView: React.FC<IssuesFindingsViewProps> = ({
  evaluationFilter,
  onOpenEvaluation,
  onOpenTestRun,
}) => {
  const [findings, setFindings] = useState<EvaluationFinding[]>(() =>
    evaluationFilter
      ? IssuesFindingsService.getFindingsForEvaluation(evaluationFilter)
      : IssuesFindingsService.getAllFindings()
  );
  const [activeTab, setActiveTab] = useState<FindingTabType>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');

  // Formatter for Finding Types
  const formatFindingType = (type: FindingType) => {
    switch (type) {
      case 'MISSING_DATA':
        return 'Missing Data';
      case 'INVALID_OBSERVATION':
        return 'Invalid Observation';
      case 'MISSING_EVIDENCE':
        return 'Missing Evidence';
      case 'PROCEDURE_INCOMPLETE':
        return 'Procedure Incomplete';
      case 'RETEST_REQUIRED':
        return 'Retest Required';
      case 'METROLOGICAL_FAIL':
        return 'Metrological Fail';
      case 'IDENTIFICATION_DISCREPANCY':
        return 'Identity Discrepancy';
      case 'CALCULATION_REVIEW':
        return 'Calculation Review';
      default:
        return type;
    }
  };

  // Filtered Findings
  const filteredFindings = useMemo(() => {
    return findings.filter((f) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        f.id.toLowerCase().includes(term) ||
        f.evaluationNumber.toLowerCase().includes(term) ||
        f.testName.toLowerCase().includes(term) ||
        f.clause.toLowerCase().includes(term) ||
        f.description.toLowerCase().includes(term) ||
        f.assignedTo.toLowerCase().includes(term);

      if (!matchesSearch) return false;

      switch (activeTab) {
        case 'ALL':
          return true;
        case 'BLOCKING':
          return f.severity === 'BLOCKING';
        case 'OPEN':
          return f.status === 'OPEN';
        case 'IN_PROGRESS':
          return f.status === 'IN_PROGRESS';
        case 'RESOLVED':
          return f.status === 'RESOLVED';
        case 'VERIFIED':
          return f.status === 'VERIFIED';
        default:
          return true;
      }
    });
  }, [findings, activeTab, searchTerm]);

  // Tab counts
  const counts = useMemo(() => {
    return {
      all: findings.length,
      blocking: findings.filter((f) => f.severity === 'BLOCKING').length,
      open: findings.filter((f) => f.status === 'OPEN').length,
      inProgress: findings.filter((f) => f.status === 'IN_PROGRESS').length,
      resolved: findings.filter((f) => f.status === 'RESOLVED').length,
      verified: findings.filter((f) => f.status === 'VERIFIED').length,
    };
  }, [findings]);

  const handleResolveFinding = (id: string) => {
    if (!resolutionNote.trim()) return;
    const updated = IssuesFindingsService.updateFindingStatus(id, 'RESOLVED', resolutionNote);
    if (updated) {
      setFindings(
        evaluationFilter
          ? IssuesFindingsService.getFindingsForEvaluation(evaluationFilter)
          : IssuesFindingsService.getAllFindings()
      );
      setResolvingId(null);
      setResolutionNote('');
    }
  };

  const getStatusBadge = (status: FindingStatus) => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
            <Clock className="w-3 h-3 text-red-600" />
            OPEN
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            IN PROGRESS
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            <CheckCircle2 className="w-3 h-3 text-blue-600" />
            RESOLVED
          </span>
        );
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            VERIFIED
          </span>
        );
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              {evaluationFilter ? `Issues & Findings (${evaluationFilter})` : 'Issues & Findings Register'}
            </h1>
            <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {filteredFindings.length} Items
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Technical review discrepancies, observation non-compliances, and required retests. All records remain permanently traceable.
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-blue-700 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All Findings ({counts.all})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('BLOCKING')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'BLOCKING'
                ? 'bg-red-700 text-white shadow-2xs'
                : 'text-red-700 hover:bg-red-50'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            Blocking ({counts.blocking})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('OPEN')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'OPEN'
                ? 'bg-blue-700 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Open ({counts.open})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('IN_PROGRESS')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'IN_PROGRESS'
                ? 'bg-blue-700 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            In Progress ({counts.inProgress})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('RESOLVED')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'RESOLVED'
                ? 'bg-blue-700 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Resolved ({counts.resolved})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('VERIFIED')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'VERIFIED'
                ? 'bg-blue-700 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Verified ({counts.verified})
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search findings by ID, evaluation, test name, clause, description..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-md text-xs placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>
      </div>

      {/* Main Findings Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">Finding ID</th>
                <th className="py-2.5 px-3">Evaluation</th>
                <th className="py-2.5 px-3">Test / Clause</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Description &amp; Resolution</th>
                <th className="py-2.5 px-3">Logged By</th>
                <th className="py-2.5 px-3">Assigned To</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredFindings.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <Info className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600">No findings matched your filter.</p>
                  </td>
                </tr>
              ) : (
                filteredFindings.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Finding ID */}
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-blue-700">
                        {f.id}
                      </span>
                    </td>

                    {/* Evaluation */}
                    <td className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => onOpenEvaluation && onOpenEvaluation(f.evaluationNumber)}
                        className="font-mono text-slate-800 hover:text-blue-700 hover:underline"
                      >
                        {f.evaluationNumber}
                      </button>
                    </td>

                    {/* Test / Clause */}
                    <td className="py-3 px-3 max-w-[180px]">
                      <button
                        type="button"
                        onClick={() => onOpenTestRun && onOpenTestRun(f.testCode)}
                        className="text-left group"
                      >
                        <div className="font-medium text-slate-800 truncate group-hover:text-blue-700 group-hover:underline">
                          {f.testName}
                        </div>
                        <div className="text-[11px] text-slate-400">{f.clause}</div>
                      </button>
                    </td>

                    {/* Type */}
                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {formatFindingType(f.type)}
                      </span>
                    </td>

                    {/* Severity */}
                    <td className="py-3 px-3">
                      {f.severity === 'BLOCKING' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                          <AlertOctagon className="w-3 h-3 text-red-600" />
                          BLOCKING
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          WARNING
                        </span>
                      )}
                    </td>

                    {/* Description & Resolution Notes */}
                    <td className="py-3 px-3 max-w-[260px]">
                      <p className="text-slate-800 leading-snug">{f.description}</p>
                      {f.resolutionNotes && (
                        <div className="mt-1 p-1.5 bg-emerald-50/70 border border-emerald-200 rounded text-[11px] text-emerald-900">
                          <strong>Resolution: </strong>{f.resolutionNotes}
                          <span className="block text-[10px] text-emerald-700 mt-0.5">
                            By {f.resolvedBy} on {f.resolvedAt?.split('T')[0]}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Created By */}
                    <td className="py-3 px-3 text-slate-600 text-[11px]">
                      <div>{f.createdBy}</div>
                      <div className="text-slate-400 font-mono text-[10px]">{f.createdAt.split('T')[0]}</div>
                    </td>

                    {/* Assigned To */}
                    <td className="py-3 px-3 text-slate-700 font-medium text-[11px]">
                      {f.assignedTo}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3">
                      {getStatusBadge(f.status)}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-3 text-right">
                      {f.status !== 'RESOLVED' && f.status !== 'VERIFIED' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setResolvingId(f.id);
                            setResolutionNote('');
                          }}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-[11px] font-semibold transition-colors"
                        >
                          Resolve
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-mono">Archived</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolution Notes Modal */}
      {resolvingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Resolve Finding {resolvingId}
            </h3>
            <p className="text-xs text-slate-600">
              Provide mandatory metrological notes explaining how this finding was investigated and resolved. This explanation will remain permanently recorded in the audit history.
            </p>
            <textarea
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="e.g. Table 6 tolerance confirmed against OIML R 76-1 limit. Standard deviation re-verified."
              rows={3}
              className="w-full text-xs p-2.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResolvingId(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!resolutionNote.trim()}
                onClick={() => handleResolveFinding(resolvingId)}
                className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white rounded text-xs font-semibold"
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
