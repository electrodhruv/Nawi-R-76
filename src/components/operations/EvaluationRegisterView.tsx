'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  Play,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Award,
  Layers,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import {
  EvaluationRecord,
  EvaluationRegisterService,
  EvaluationWorkflowStatus,
} from '@/services/operations/evaluation-register-service';

interface EvaluationRegisterViewProps {
  currentUser: {
    fullName: string;
    role: string;
    email: string;
  } | null;
  onOpenEvaluation: (evalRecord: EvaluationRecord, targetStep?: 1 | 2 | 3 | 4 | 5 | 6) => void;
  onStartNewEvaluation: () => void;
}

type FilterTabType =
  | 'ALL'
  | 'MY_WORK'
  | 'IN_TESTING'
  | 'PENDING_REVIEW'
  | 'CORRECTION_REQUIRED'
  | 'READY_FOR_FINALIZATION'
  | 'FINALIZED';

type SortOptionType = 'RECENT' | 'OLDEST' | 'NEWEST' | 'STATUS';

export const EvaluationRegisterView: React.FC<EvaluationRegisterViewProps> = ({
  currentUser,
  onOpenEvaluation,
  onStartNewEvaluation,
}) => {
  const [evaluations, setEvaluations] = useState<EvaluationRecord[]>(() =>
    EvaluationRegisterService.getAllEvaluations()
  );

  React.useEffect(() => {
    // Subscribe to live client-side pub/sub events
    const unsubscribe = EvaluationRegisterService.subscribe(() => {
      setEvaluations(EvaluationRegisterService.getAllEvaluations());
    });

    let isMounted = true;
    fetch('/api/evaluations')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : Array.isArray(data?.evaluations) ? data.evaluations : null;
        if (isMounted && list && list.length > 0) {
          // If server returned records not in fallback, merge them
          if (!data?.isFallback) {
            list.forEach((rec: any) => {
              if (rec.evaluationNumber) {
                EvaluationRegisterService.upsertEvaluation(rec);
              }
            });
          }
          setEvaluations(EvaluationRegisterService.getAllEvaluations());
        }
      })
      .catch((err) => {
        console.warn('Evaluations API fallback to local cache:', err);
      });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const [activeFilter, setActiveFilter] = useState<FilterTabType>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<SortOptionType>('RECENT');

  // Filtering Logic
  const filteredEvaluations = useMemo(() => {
    return evaluations.filter((ev) => {
      // Search filter
      const matchesSearch =
        ev.evaluationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ev.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ev.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ev.modelName.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // Tab filter
      if (activeFilter === 'ALL') return true;
      if (activeFilter === 'MY_WORK') {
        const loggedInName = currentUser?.fullName?.toLowerCase().trim() || 'dr. a. sharma';
        return ev.assignedOperator.toLowerCase().includes(loggedInName);
      }
      return ev.status === activeFilter;
    });
  }, [evaluations, activeFilter, searchTerm, currentUser]);

  // Sorting Logic
  const sortedEvaluations = useMemo(() => {
    const list = [...filteredEvaluations];
    switch (sortOption) {
      case 'RECENT':
        return list.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
      case 'NEWEST':
        return list.sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
      case 'OLDEST':
        return list.sort((a, b) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime());
      case 'STATUS':
        return list.sort((a, b) => a.status.localeCompare(b.status));
      default:
        return list;
    }
  }, [filteredEvaluations, sortOption]);

  const getStatusBadge = (status: EvaluationWorkflowStatus) => {
    const baseClasses =
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap shadow-2xs shrink-0';

    switch (status) {
      case 'IN_TESTING':
        return (
          <span className={`${baseClasses} bg-blue-50 text-blue-700 border border-blue-200/90`}>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shrink-0" />
            <span>In Testing</span>
          </span>
        );
      case 'PENDING_REVIEW':
        return (
          <span className={`${baseClasses} bg-amber-50 text-amber-700 border border-amber-200/90`}>
            <Clock className="w-3 h-3 text-amber-600 shrink-0" />
            <span>Pending Review</span>
          </span>
        );
      case 'CORRECTION_REQUIRED':
        return (
          <span className={`${baseClasses} bg-red-50 text-red-700 border border-red-200/90`}>
            <AlertTriangle className="w-3 h-3 text-red-600 shrink-0" />
            <span>Correction Required</span>
          </span>
        );
      case 'READY_FOR_FINALIZATION':
        return (
          <span className={`${baseClasses} bg-indigo-50 text-indigo-700 border border-indigo-200/90`}>
            <ShieldCheck className="w-3 h-3 text-indigo-600 shrink-0" />
            <span>Ready for Finalization</span>
          </span>
        );
      case 'FINALIZED':
        return (
          <span className={`${baseClasses} bg-emerald-50 text-emerald-700 border border-emerald-200/90`}>
            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
            <span>Finalized</span>
          </span>
        );
      default:
        return null;
    }
  };

  const getOverallResultBadge = (result: string) => {
    const baseClasses =
      'w-16 h-5.5 inline-flex items-center justify-center rounded-full text-[10.5px] font-semibold whitespace-nowrap shadow-2xs shrink-0';

    switch (result) {
      case 'PASS':
        return (
          <span className={`${baseClasses} bg-emerald-50 text-emerald-700 border border-emerald-200/90`}>
            PASS
          </span>
        );
      case 'FAIL':
        return (
          <span className={`${baseClasses} bg-red-50 text-red-700 border border-red-200/90`}>
            FAIL
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-slate-100 text-slate-600 border border-slate-200`}>
            PENDING
          </span>
        );
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Primary Work Queue
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Evaluation Register</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Central repository for statutory evaluations of Non-Automatic Weighing Instruments under OIML R 76.
          </p>
        </div>

        <button
          type="button"
          onClick={onStartNewEvaluation}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium shadow-xs transition-colors cursor-pointer self-start sm:self-center"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Evaluation</span>
        </button>
      </div>

      {/* Filter Tabs and Controls */}
      <div className="flex flex-col gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 [scrollbar-width:none]">
          <button
            type="button"
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              activeFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All Evaluations ({evaluations.length})
          </button>

          {/* Section 2: "My Work" as a filter */}
          <button
            type="button"
            onClick={() => setActiveFilter('MY_WORK')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === 'MY_WORK'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'text-blue-700 hover:bg-blue-50 border border-blue-200/60'
            }`}
            title="Show evaluations assigned to current user"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>My Evaluations</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('IN_TESTING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              activeFilter === 'IN_TESTING'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            In Testing
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('PENDING_REVIEW')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              activeFilter === 'PENDING_REVIEW'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Pending Review
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('CORRECTION_REQUIRED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              activeFilter === 'CORRECTION_REQUIRED'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Correction Required
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('READY_FOR_FINALIZATION')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              activeFilter === 'READY_FOR_FINALIZATION'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Ready for Finalization
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('FINALIZED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              activeFilter === 'FINALIZED'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Finalized
          </button>
        </div>

        {/* Search & Sort Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by evaluation number, serial number, manufacturer, or model..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span>Sort:</span>
            </div>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOptionType)}
              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="RECENT">Recently Updated</option>
              <option value="NEWEST">Newest First</option>
              <option value="OLDEST">Oldest First</option>
              <option value="STATUS">By Status</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Evaluations Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="px-4 py-2.5 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {sortedEvaluations.length} evaluation(s)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-600 font-semibold text-[11px] whitespace-nowrap">
              <tr>
                <th className="py-2.5 px-3 text-left">Evaluation / Serial</th>
                <th className="py-2.5 px-3 text-left">Instrument & Manufacturer</th>
                <th className="py-2.5 px-3 text-left">Status</th>
                <th className="py-2.5 px-3 text-left">Assigned Operator</th>
                <th className="py-2.5 px-3 text-left">Progress</th>
                <th className="py-2.5 px-3 text-left">Overall Result</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {sortedEvaluations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No evaluations match the selected filter or search query.
                  </td>
                </tr>
              ) : (
                sortedEvaluations.map((ev) => (
                  <tr
                    key={ev.id}
                    onClick={() => {
                      const step =
                        ev.status === 'FINALIZED'
                          ? 6
                          : ev.status === 'PENDING_REVIEW' || ev.status === 'READY_FOR_FINALIZATION'
                          ? 5
                          : 4;
                      onOpenEvaluation(ev, step);
                    }}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    {/* Evaluation No. & Serial */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="font-mono font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                        {ev.evaluationNumber}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500 mt-0.5">
                        SN: {ev.serialNumber}
                      </div>
                    </td>

                    {/* Instrument Model & Manufacturer */}
                    <td className="py-2.5 px-3 min-w-0 max-w-[240px]">
                      <div className="font-medium text-slate-900 truncate" title={ev.modelName}>
                        {ev.modelName}
                      </div>
                      <div
                        className="text-[11px] text-slate-500 truncate mt-0.5"
                        title={`${ev.manufacturer}${ev.tradeName ? ` (${ev.tradeName})` : ''}`}
                      >
                        <span>{ev.manufacturer}</span>
                        {ev.tradeName && <span className="text-slate-400"> • {ev.tradeName}</span>}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {getStatusBadge(ev.status)}
                    </td>

                    {/* Assigned Operator */}
                    <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                      {ev.assignedOperator}
                    </td>

                    {/* Progress */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="font-mono text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {ev.completedTestsCount} / {ev.applicableTestsCount} tests
                      </span>
                    </td>

                    {/* Overall Result */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {getOverallResultBadge(ev.overallResult)}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const step =
                            ev.status === 'FINALIZED'
                              ? 6
                              : ev.status === 'PENDING_REVIEW' || ev.status === 'READY_FOR_FINALIZATION'
                              ? (currentUser?.role === 'LEAD_METROLOGIST' ? 6 : 5)
                              : 4;
                          onOpenEvaluation(ev, step);
                        }}
                        className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>{ev.status === 'PENDING_REVIEW' && currentUser?.role === 'LEAD_METROLOGIST' ? 'Review & Sign' : 'Open'}</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
