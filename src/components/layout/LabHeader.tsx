'use client';

import React from 'react';
import { Scale, ShieldCheck, Award, FileSpreadsheet, Activity, Database, CheckCircle2 } from 'lucide-react';

export type NavTab = 'dashboard' | 'workbench' | 'planner' | 'evidence' | 'reports' | 'audit';

interface LabHeaderProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  activeRole: string;
  onRoleChange: (role: string) => void;
}

export const LabHeader: React.FC<LabHeaderProps> = ({
  activeTab,
  onTabChange,
  activeRole,
  onRoleChange,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50">
      {/* Top Identity Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-cyan-600 to-sky-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Scale className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-white text-base">NAWI-R76</span>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider rounded bg-cyan-950 text-cyan-400 border border-cyan-800/80">
                LABORATORY TYPE EVALUATION
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Regional Reference Standard Laboratory (RRSL) &bull; Legal Metrology Division
            </p>
          </div>
        </div>

        {/* Standard Version & Pinned Rule Pack */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700/60 text-xs">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-slate-300 font-medium">Standard:</span>
            <span className="text-emerald-400 font-semibold">OIML R 76-1:2006 / R 76-2</span>
            <span className="text-slate-500">|</span>
            <span className="text-cyan-400 font-mono text-[11px]">R76-2006-v1</span>
          </div>

          {/* Persona Switcher */}
          <div className="flex items-center gap-2 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 text-xs">
            <Award className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-slate-400">Role:</span>
            <select
              value={activeRole}
              onChange={(e) => onRoleChange(e.target.value)}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer pr-1"
            >
              <option value="TESTING_OFFICER" className="bg-slate-800 text-white">
                Amit Verma (Testing Officer)
              </option>
              <option value="TECHNICAL_REVIEWER" className="bg-slate-800 text-white">
                Dr. S. K. Nair (Technical Reviewer)
              </option>
              <option value="APPROVING_SIGNATORY" className="bg-slate-800 text-white">
                DG V. K. Malhotra (Signatory)
              </option>
              <option value="LAB_MANAGER" className="bg-slate-800 text-white">
                Priya Patel (Lab Manager)
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 sm:space-x-4 py-2 overflow-x-auto">
          <button
            onClick={() => onTabChange('dashboard')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>Dashboard &amp; Evaluations</span>
          </button>

          <button
            onClick={() => onTabChange('workbench')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'workbench'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Scale className="h-4 w-4" />
            <span>Metrology Workbench</span>
          </button>

          <button
            onClick={() => onTabChange('planner')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'planner'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Dynamic Test Planner</span>
          </button>

          <button
            onClick={() => onTabChange('evidence')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'evidence'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Assisted OCR &amp; Evidence</span>
          </button>

          <button
            onClick={() => onTabChange('reports')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'reports'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Award className="h-4 w-4" />
            <span>OIML R 76-2 Reports</span>
          </button>

          <button
            onClick={() => onTabChange('audit')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'audit'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Database className="h-4 w-4" />
            <span>Audit Trail</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
