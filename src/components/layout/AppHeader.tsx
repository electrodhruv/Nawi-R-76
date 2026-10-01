'use client';

import React from 'react';
import { Scale, LogOut, User, BookOpen, Search } from 'lucide-react';

export type MainNavView =
  | 'home'
  | 'evaluations'
  | 'standards'
  | 'evidence'
  | 'issues'
  | 'select-instrument'
  | 'workflow';

interface AppHeaderProps {
  currentUser: {
    fullName: string;
    role: string;
    email: string;
  } | null;
  currentView: MainNavView;
  onNavigateView: (view: MainNavView) => void;
  onLogout: () => void;
  onGoHome: () => void;
  evaluationNumber?: string | null;
  onToggleGuidance?: () => void;
  onOpenSearch?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentUser,
  currentView,
  onNavigateView,
  onLogout,
  onGoHome,
  evaluationNumber,
  onToggleGuidance,
  onOpenSearch,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer shrink-0" onClick={onGoHome}>
          <div className="w-8 h-8 rounded bg-blue-700 flex items-center justify-center text-white shadow-2xs">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm tracking-tight">NAWI-R76</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                OIML R 76
              </span>
            </div>
            <span className="text-[11px] text-slate-500 hidden md:inline">
              Legal Metrology Evaluation System
            </span>
          </div>
        </div>

        {/* Global Operational Navigation (Section 16 requirement) */}
        <nav className="hidden lg:flex items-center gap-1 mx-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => onNavigateView('home')}
            className={`px-2.5 py-1.5 rounded-md transition-colors cursor-pointer ${
              currentView === 'home'
                ? 'bg-slate-100 text-blue-700 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Home
          </button>

          <button
            type="button"
            onClick={() => onNavigateView('evaluations')}
            className={`px-2.5 py-1.5 rounded-md transition-colors cursor-pointer ${
              currentView === 'evaluations'
                ? 'bg-slate-100 text-blue-700 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Evaluations
          </button>

          <button
            type="button"
            onClick={() => onNavigateView('standards')}
            className={`px-2.5 py-1.5 rounded-md transition-colors cursor-pointer ${
              currentView === 'standards'
                ? 'bg-slate-100 text-blue-700 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Standards
          </button>

          <button
            type="button"
            onClick={() => onNavigateView('evidence')}
            className={`px-2.5 py-1.5 rounded-md transition-colors cursor-pointer ${
              currentView === 'evidence'
                ? 'bg-slate-100 text-blue-700 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Evidence
          </button>

          <button
            type="button"
            onClick={() => onNavigateView('issues')}
            className={`px-2.5 py-1.5 rounded-md transition-colors cursor-pointer ${
              currentView === 'issues'
                ? 'bg-slate-100 text-blue-700 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Issues &amp; Findings
          </button>
        </nav>

        {/* Right Section: Search, Context, Guidance & User */}
        <div className="flex items-center gap-2.5">
          {/* Global Search Button (Section 17 requirement) */}
          {onOpenSearch && (
            <button
              type="button"
              onClick={onOpenSearch}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-md text-xs border border-slate-200 transition-colors cursor-pointer"
              title="Global Search across Evaluations, Serials, Evidence, and Standards"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline text-slate-500 font-medium">Search...</span>
            </button>
          )}

          {evaluationNumber && currentView === 'workflow' && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200">
              <span className="text-slate-400">Eval:</span>
              <span className="font-mono font-semibold text-slate-800">{evaluationNumber}</span>
            </div>
          )}

          {/* Help & Guidance */}
          {onToggleGuidance && (
            <button
              type="button"
              onClick={onToggleGuidance}
              className="inline-flex items-center gap-1 px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-md text-xs font-semibold border border-slate-200 transition-colors shadow-2xs cursor-pointer"
              title="Open Context-Aware Laboratory Guidance"
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-700" />
              <span className="hidden md:inline">Guidance</span>
            </button>
          )}

          {currentUser ? (
            <div className="flex items-center gap-2 pl-1 border-l border-slate-200">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-900">{currentUser.fullName}</span>
                <span className="text-[10px] text-slate-400 capitalize">
                  {currentUser.role.replace(/_/g, ' ').toLowerCase()}
                </span>
              </div>
              <button
                type="button"
                onClick={onLogout}
                title="Log out"
                className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <User className="w-3.5 h-3.5" />
              <span>Sign in required</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
