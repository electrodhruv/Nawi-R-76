'use client';

import React from 'react';
import {
  FileText,
  CheckCircle,
  Clock,
  Scale,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface EvaluationItem {
  id: string;
  evaluationNumber: string;
  revisionNumber: number;
  modelName: string;
  manufacturer: string;
  accuracyClass: string;
  maxCapacity: string;
  verificationInterval_e: string;
  status: 'DRAFT' | 'PLAN_CONFIGURED' | 'IN_TESTING' | 'PENDING_REVIEW' | 'APPROVED' | 'SUPERSEDED';
  completedTests: number;
  totalTests: number;
  leadMetrologist: string;
  updatedAt: string;
}

interface EvaluationDashboardProps {
  onSelectEvaluation: (evaluationId: string) => void;
  onOpenWorkbench: () => void;
}

export const EvaluationDashboard: React.FC<EvaluationDashboardProps> = ({
  onSelectEvaluation,
  onOpenWorkbench,
}) => {
  const evaluations: EvaluationItem[] = [
    {
      id: 'eval-01',
      evaluationNumber: 'RRSL-2026-TE-0104',
      revisionNumber: 1,
      modelName: 'AWT-3000-Retail',
      manufacturer: 'Avery Weigh-Tronix India Pvt Ltd',
      accuracyClass: 'Class III',
      maxCapacity: '15 kg',
      verificationInterval_e: '5 g',
      status: 'IN_TESTING',
      completedTests: 18,
      totalTests: 23,
      leadMetrologist: 'Amit Verma',
      updatedAt: 'Today, 11:45 AM',
    },
    {
      id: 'eval-02',
      evaluationNumber: 'RRSL-2026-TE-0105',
      revisionNumber: 1,
      modelName: 'XPR-205',
      manufacturer: 'Mettler Toledo Metrology AG',
      accuracyClass: 'Class I',
      maxCapacity: '220 g',
      verificationInterval_e: '1 mg',
      status: 'PENDING_REVIEW',
      completedTests: 15,
      totalTests: 15,
      leadMetrologist: 'Dr. Rajesh Sharma',
      updatedAt: 'Yesterday, 04:20 PM',
    },
    {
      id: 'eval-03',
      evaluationNumber: 'RRSL-2026-TE-0098',
      revisionNumber: 1,
      modelName: 'WB-60T-Axle',
      manufacturer: 'Essae-Teraoka Ltd',
      accuracyClass: 'Class III',
      maxCapacity: '60 000 kg',
      verificationInterval_e: '20 kg',
      status: 'APPROVED',
      completedTests: 21,
      totalTests: 21,
      leadMetrologist: 'Amit Verma',
      updatedAt: '2 days ago',
    },
  ];

  const getStatusBadge = (status: EvaluationItem['status']) => {
    switch (status) {
      case 'IN_TESTING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5 animate-spin" />
            In Testing
          </span>
        );
      case 'PENDING_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/30">
            <Layers className="w-3.5 h-3.5" />
            Pending Review
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle className="w-3.5 h-3.5" />
            Approved
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Active Evaluations</span>
            <FileText className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">3</span>
            <span className="text-xs text-slate-500">evaluations assigned</span>
          </div>
          <div className="mt-3 flex items-center text-xs text-cyan-400 font-medium">
            <span>2 in progress &bull; 1 approved</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total OIML Tests Run</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">54</span>
            <span className="text-xs text-emerald-400 font-semibold">Verified</span>
          </div>
          <div className="mt-3 flex items-center text-xs text-slate-400">
            <span>Evaluated against Table 6 MPE</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Calibrated Standards</span>
            <Scale className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">5 / 5</span>
            <span className="text-xs text-emerald-400">All Valid</span>
          </div>
          <div className="mt-3 flex items-center text-xs text-slate-400">
            <span>Class E2, F1, M1 with NABL/RRSL certs</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Active Rule Pack</span>
            <Calendar className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-cyan-400 font-mono tracking-tight">R76-2006</span>
            <span className="text-xs text-slate-400">v1 (Pinned)</span>
          </div>
          <div className="mt-3 flex items-center text-xs text-indigo-300">
            <span>OIML R 76-1:2006 Table 6 Rules</span>
          </div>
        </div>
      </div>

      {/* Main Evaluations Table */}
      <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white tracking-tight">
              Type Evaluation Applications (OIML R 76-1 / R 76-2)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Laboratory evaluation registry with versioned standard adherence and tamper-evident audit links
            </p>
          </div>
          <button
            onClick={onOpenWorkbench}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white transition-colors shadow-sm shadow-cyan-600/30"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Launch Metrology Workbench</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
              <tr>
                <th className="px-6 py-3">Evaluation Ref</th>
                <th className="px-6 py-3">Instrument Model</th>
                <th className="px-6 py-3">Manufacturer</th>
                <th className="px-6 py-3">Class &amp; Capacity</th>
                <th className="px-6 py-3">Test Progress</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {evaluations.map((ev) => {
                const progressPct = Math.round((ev.completedTests / ev.totalTests) * 100);
                return (
                  <tr key={ev.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-mono font-semibold text-white text-xs">{ev.evaluationNumber}</div>
                      <div className="text-[11px] text-slate-500">Rev {ev.revisionNumber} &bull; {ev.updatedAt}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-slate-100">{ev.modelName}</div>
                      <div className="text-[11px] text-slate-400">Lead: {ev.leadMetrologist}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-300">{ev.manufacturer}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-cyan-400">{ev.accuracyClass}</div>
                      <div className="text-[11px] text-slate-400">
                        Max: {ev.maxCapacity} | e = {ev.verificationInterval_e}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              progressPct === 100 ? 'bg-emerald-500' : 'bg-cyan-500'
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">
                          {ev.completedTests}/{ev.totalTests} ({progressPct}%)
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(ev.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => {
                          onSelectEvaluation(ev.id);
                          onOpenWorkbench();
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 border border-slate-700 transition-colors"
                      >
                        <span>Open</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
