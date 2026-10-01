'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Scale,
  Home,
  ClipboardList,
  Award,
  Camera,
  AlertTriangle,
  BookOpen,
  Search,
  LogOut,
  User,
  ChevronRight,
  ShieldCheck,
  Cpu,
  Database,
} from 'lucide-react';
import { UserProfile, getProfileByRole } from '@/lib/rbac';

export type MainNavView =
  | 'home'
  | 'evaluations'
  | 'standards'
  | 'evidence'
  | 'issues'
  | 'oiml-revisions'
  | 'architecture'
  | 'audit'
  | 'select-instrument'
  | 'workflow';

interface AppSidebarProps {
  currentUser: {
    fullName: string;
    role: string;
    email: string;
  } | null;
  currentView: MainNavView;
  onNavigateView?: (view: MainNavView) => void;
  onLogout: () => void;
  onGoHome?: () => void;
  evaluationNumber?: string | null;
  onToggleGuidance?: () => void;
  onOpenSearch?: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  currentUser,
  currentView,
  onNavigateView,
  onLogout,
  onGoHome,
  evaluationNumber,
  onToggleGuidance,
  onOpenSearch,
}) => {
  const router = useRouter();
  const activeProfile = currentUser ? getProfileByRole(currentUser.role) : null;

  // Base navigation catalog
  const allNavItems: {
    id: MainNavView;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    description?: string;
  }[] = [
    {
      id: 'home',
      label: activeProfile?.role === 'TESTING_OFFICER'
        ? 'Testing Workbench'
        : activeProfile?.role === 'TECHNICAL_REVIEWER'
        ? 'Peer Review Station'
        : activeProfile?.role === 'LABORATORY_DIRECTOR'
        ? 'Directorate KPI'
        : activeProfile?.role === 'AUDITOR_INSPECTOR'
        ? 'Audit Station'
        : 'Statutory Command',
      icon: Home,
      description: activeProfile?.role === 'TESTING_OFFICER'
        ? 'Bench 02 Intake & DAQ'
        : activeProfile?.role === 'TECHNICAL_REVIEWER'
        ? 'Calculation Audit'
        : activeProfile?.role === 'LABORATORY_DIRECTOR'
        ? 'National Oversight'
        : activeProfile?.role === 'AUDITOR_INSPECTOR'
        ? 'Compliance Station'
        : 'Type Approvals',
    },
    {
      id: 'evaluations',
      label: activeProfile?.role === 'TESTING_OFFICER'
        ? 'My Test Queue'
        : activeProfile?.role === 'TECHNICAL_REVIEWER'
        ? 'Audit Queue'
        : activeProfile?.role === 'AUDITOR_INSPECTOR'
        ? 'Archived Reports'
        : 'Evaluations',
      icon: ClipboardList,
      description: activeProfile?.role === 'AUDITOR_INSPECTOR'
        ? 'Read-Only Archive'
        : 'Dossier Register',
    },
    {
      id: 'evidence',
      label: activeProfile?.role === 'AUDITOR_INSPECTOR' ? 'Forensic Hashes' : 'Evidence',
      icon: Camera,
      description: activeProfile?.role === 'AUDITOR_INSPECTOR'
        ? 'SHA-256 Checksums'
        : 'Traceable Repository',
    },
    {
      id: 'issues',
      label: 'Issues & Findings',
      icon: AlertTriangle,
      description: 'Review Discrepancies',
    },
    {
      id: 'standards',
      label: 'Standards',
      icon: Award,
      description: 'Calibration Register',
    },
    {
      id: 'oiml-revisions',
      label: 'OIML Revisions',
      icon: BookOpen,
      description: 'Standards Manager',
    },
    {
      id: 'architecture',
      label: 'Architecture & Docs',
      icon: Cpu,
      description: 'SIH Methodology',
    },
    {
      id: 'audit',
      label: 'Audit Trail',
      icon: Database,
      description: 'Immutable Ledger',
    },
  ];

  // Filter based on active role's statutory permissions
  const navItems = activeProfile
    ? allNavItems.filter((item) => activeProfile.allowedViews.includes(item.id))
    : allNavItems;

  return (
    <aside className="w-64 h-screen sticky top-0 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 z-30 font-sans select-none">
      {/* Top Part: Brand, Search, Navigation */}
      <div className="flex flex-col gap-3 p-4 overflow-y-auto">
        {/* Brand */}
        <div
          onClick={() => {
            if (onGoHome) onGoHome();
            else router.push('/');
          }}
          className="flex items-center gap-3 cursor-pointer group pb-2 border-b border-slate-100"
          title="Return to Home"
        >
          <div className="w-9 h-9 rounded-lg bg-blue-700 flex items-center justify-center text-white shadow-2xs group-hover:bg-blue-800 transition-colors shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 text-sm tracking-tight">NAWI-R76</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                OIML R 76
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block truncate">
              Legal Metrology System
            </span>
          </div>
        </div>

        {/* Role Clearance Pill */}
        {activeProfile && (
          <div className={`p-2 rounded-lg border text-[11px] leading-tight ${activeProfile.badgeColor.bg} ${activeProfile.badgeColor.border}`}>
            <div className="flex items-center justify-between font-bold text-slate-900 mb-0.5">
              <span className="truncate">{activeProfile.roleTitle}</span>
            </div>
            <div className={`text-[10px] font-mono font-medium ${activeProfile.badgeColor.text} truncate`}>
              {activeProfile.statutoryClause}
            </div>
          </div>
        )}

        {/* Global Search Shortcut Button */}
        {onOpenSearch && (
          <button
            type="button"
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-500 hover:text-slate-800 transition-colors shadow-2xs cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-700 transition-colors" />
              <span className="font-medium">Search records...</span>
            </div>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-500 bg-white border border-slate-200 rounded shadow-2xs">
              Ctrl K
            </kbd>
          </button>
        )}

        {/* Navigation Menu */}
        <div className="space-y-1">
          <div className="px-2 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Laboratory Navigation
          </div>

          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (onNavigateView) {
                      onNavigateView(item.id);
                    } else {
                      router.push(item.id === 'home' ? '/' : `/${item.id}`);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-blue-700' : 'text-slate-400'
                      }`}
                    />
                    <div className="min-w-0">
                      <span className="truncate block leading-tight">{item.label}</span>
                      {item.description && (
                        <span className="text-[10px] text-slate-400 block truncate leading-tight mt-0.5">
                          {item.description}
                        </span>
                      )}
                    </div>
                  </div>
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-700 shrink-0" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Active Evaluation Context Pill (if evaluation ongoing) */}
        {evaluationNumber && currentView === 'workflow' && (
          <div className="mt-2 p-2.5 rounded-lg bg-blue-50/70 border border-blue-200 text-xs text-blue-900">
            <div className="flex items-center justify-between text-[10px] text-blue-600 mb-1">
              <span className="font-semibold uppercase tracking-wider">Active Evaluation</span>
              {onToggleGuidance && (
                <button
                  type="button"
                  onClick={onToggleGuidance}
                  className="hover:underline flex items-center gap-0.5 text-blue-700 cursor-pointer"
                  title="Toggle OIML Metrological Guidance"
                >
                  <BookOpen className="w-3 h-3" />
                  <span>Guidance</span>
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                if (onNavigateView) onNavigateView('workflow');
                else router.push('/workflow');
              }}
              className="font-mono font-bold text-slate-800 hover:text-blue-700 block truncate text-left w-full hover:underline"
              title="Return to Evaluation Workspace"
            >
              {evaluationNumber}
            </button>
          </div>
        )}
      </div>

      {/* Bottom Part: Authenticated Metrologist Profile */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/70">
        {currentUser ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                {currentUser.fullName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">
                  {currentUser.fullName}
                </div>
                <div className="text-[10px] text-slate-500 capitalize truncate font-mono">
                  {currentUser.role.replace(/_/g, ' ').toLowerCase()}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              title="Sign out of laboratory session"
              className="p-1.5 rounded-md text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <User className="w-4 h-4" />
            <span>Sign in required</span>
          </div>
        )}
      </div>
    </aside>
  );
};
