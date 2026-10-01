'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AppSidebar, MainNavView } from './AppSidebar';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { GlobalSearchModal } from '@/components/operations/GlobalSearchModal';
import { AIChatBubble } from '@/components/guidance/AIChatBubble';
import { ShieldCheck } from 'lucide-react';
import { PRESET_USER_PROFILES } from '@/lib/rbac';

export interface UserSession {
  fullName: string;
  role: string;
  email: string;
}

interface LaboratoryShellProps {
  children: React.ReactNode;
  activeNav?: MainNavView;
  evaluationNumber?: string;
  chatContext?: any;
  subHeader?: React.ReactNode;
}

export const LaboratoryShell: React.FC<LaboratoryShellProps> = ({
  children,
  activeNav,
  evaluationNumber,
  chatContext,
  subHeader,
}) => {
  const router = useRouter();
  const pathname = usePathname();

  // Authentication State with LocalStorage Persistence
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('nawi_r76_active_user');
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    } finally {
      setIsAuthLoaded(true);
    }
  }, []);

  // Global Ctrl+K / Cmd+K Search Shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogin = (user: UserSession) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('nawi_r76_active_user', JSON.stringify(user));
    } catch (e) {
      console.warn('Failed to save user session to localStorage:', e);
    }
  };

  const handleLogout = async () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('nawi_r76_active_user');
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.warn('Failed to clear user session from localStorage:', e);
    }
    router.push('/');
  };

  // Determine current active navigation view based on route or prop
  const currentView: MainNavView =
    activeNav ||
    (pathname === '/'
      ? 'home'
      : pathname.startsWith('/evaluations')
      ? 'evaluations'
      : pathname.startsWith('/workflow')
      ? 'workflow'
      : pathname.startsWith('/select-instrument')
      ? 'select-instrument'
      : pathname.startsWith('/standards')
      ? 'standards'
      : pathname.startsWith('/evidence')
      ? 'evidence'
      : pathname.startsWith('/issues')
      ? 'issues'
      : pathname.startsWith('/audit')
      ? 'audit'
      : pathname.startsWith('/oiml-revisions')
      ? 'oiml-revisions'
      : pathname.startsWith('/architecture')
      ? 'architecture'
      : 'home');

  if (!isAuthLoaded) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-blue-700 border-t-transparent animate-spin" />
          <span className="text-xs font-semibold text-slate-500">Initializing Laboratory Station...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthScreen onLoginSuccess={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans">
      {/* Fixed Left Laboratory Navigation Sidebar */}
      <AppSidebar
        currentUser={currentUser}
        currentView={currentView}
        onNavigateView={(v) => {
          const route = v === 'home' ? '/' : `/${v}`;
          router.push(route);
        }}
        onLogout={handleLogout}
        onGoHome={() => router.push('/')}
        evaluationNumber={evaluationNumber}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Global Relational Search Modal (Ctrl+K) */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectEvaluation={(evalNum) => {
          setIsSearchOpen(false);
          router.push(`/workflow?eval=${evalNum}&step=4`);
        }}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {subHeader}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
          {children}
        </main>

        {/* Official Statutory Footer */}
        <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-slate-500">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              <span>
                <strong>NAWI-R76 Laboratory Evaluation System</strong> &bull; Regional Reference Standard Laboratory
              </span>
            </div>

            <div className="flex items-center gap-4 text-[11px] text-slate-400">
              <span>OIML R 76-1:2006 (E) &bull; R 76-2:2007 (E)</span>
              <span>Accredited Legal Metrology Testing</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Floating AI Metrology Chatbot Bubble */}
      <AIChatBubble context={chatContext || { evaluationNumber }} />
    </div>
  );
};
