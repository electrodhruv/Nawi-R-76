'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  HelpCircle,
  BookOpen,
  Scale,
  ShieldAlert,
  Info,
  ChevronRight,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import {
  GuidanceActionType,
  GuidanceContext,
  GuidanceResponse,
  KnowledgeSourceType,
} from '@/services/guidance/knowledge-types';

interface GuidanceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  context: GuidanceContext;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  sourceCitation?: string;
  sourceType?: KnowledgeSourceType;
  timestamp: string;
}

export const GuidanceDrawer: React.FC<GuidanceDrawerProps> = ({
  isOpen,
  onClose,
  context,
}) => {
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-initial',
      sender: 'assistant',
      text:
        'Welcome to the NAWI Lab Guidance Assistant. I provide context-aware metrological guidance, ' +
        'OIML R 76 procedure explanations, approved laboratory SOPs, and instrument operating instructions.\n\n' +
        'All technical guidance is grounded in approved metrological sources and clearly cited. ' +
        'Compliance decisions and calculations are strictly evaluated per statutory standards.',
      sourceCitation: 'NAWI-R76 Accredited Metrology Guidance System',
      sourceType: 'APPLICATION_HELP',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const quickActions: Array<{ label: string; action: GuidanceActionType }> = [
    { label: 'Explain this step', action: 'EXPLAIN_STEP' },
    { label: 'Explain this test', action: 'EXPLAIN_TEST' },
    { label: 'What should I enter?', action: 'WHAT_TO_ENTER' },
    { label: 'What equipment is needed?', action: 'EQUIPMENT_NEEDED' },
    { label: 'What evidence is needed?', action: 'EVIDENCE_NEEDED' },
    { label: 'Explain this error', action: 'EXPLAIN_ERROR' },
    { label: 'Show procedure', action: 'SHOW_PROCEDURE' },
    { label: 'How do I use this instrument?', action: 'HOW_TO_USE_INSTRUMENT' },
    { label: 'Why is this test not applicable?', action: 'WHY_NOT_APPLICABLE' },
    { label: 'What prevents me from completing this test?', action: 'WHAT_PREVENTS_COMPLETION' },
  ];

  const handleSend = async (queryText?: string, action?: GuidanceActionType) => {
    const q = queryText ?? inputQuery;
    if (!q && !action) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: q || (action ? action.replace(/_/g, ' ') : ''),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/guidance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userQuery: q,
          actionType: action,
          context,
        }),
      });

      if (!res.ok) throw new Error('Guidance request failed');
      const data: GuidanceResponse = await res.json();

      const assistantMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        sender: 'assistant',
        text: data.text,
        sourceCitation: data.sourceCitation,
        sourceType: data.sourceType,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `ast-err-${Date.now()}`,
          sender: 'assistant',
          text: 'Unable to retrieve guidance at this time. Please check your network connection.',
          sourceCitation: 'No approved source is available for this instruction.',
          sourceType: 'UNAPPROVED_FALLBACK',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getSourceBadge = (sourceType?: KnowledgeSourceType, citation?: string) => {
    if (!citation) return null;

    switch (sourceType) {
      case 'OIML_STANDARD':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            <BookOpen className="w-3 h-3 text-blue-600" />
            <span>OIML Standard: {citation}</span>
          </span>
        );
      case 'LAB_SOP':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Scale className="w-3 h-3 text-emerald-600" />
            <span>Approved SOP: {citation}</span>
          </span>
        );
      case 'INSTRUMENT_MANUAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-800 border border-purple-200">
            <Info className="w-3 h-3 text-purple-600" />
            <span>Approved Manual: {citation}</span>
          </span>
        );
      case 'APPLICATION_HELP':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <HelpCircle className="w-3 h-3 text-slate-500" />
            <span>Application Help: {citation}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <ShieldAlert className="w-3 h-3 text-amber-600" />
            <span>{citation}</span>
          </span>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Dim Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Right Panel */}
      <aside
        aria-label="Laboratory Help & Guidance Drawer"
        className="relative w-full max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-right duration-200 font-sans"
      >
        {/* Drawer Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-bold tracking-tight">Help &amp; Guidance</h2>
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 bg-blue-800/80 text-blue-200 rounded border border-blue-600">
                  OIML R 76
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Context-Aware Accredited Metrology Assistant
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Context Strip */}
        <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 text-xs text-slate-700 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 text-[11px]">Workflow:</span>
            <span className="font-semibold text-slate-900 text-[11px]">
              {context.stepName || 'Instrument Confirmation'}
            </span>
          </div>
          {context.instrumentModel && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-[11px]">Model:</span>
              <span className="font-mono font-bold text-slate-900 text-[11px]">
                {context.instrumentModel}
              </span>
            </div>
          )}
          {context.testName && (
            <div className="w-full text-[11px] text-blue-800 font-medium truncate pt-0.5 border-t border-slate-200/60">
              Active: {context.testName} {context.clauseReference && `(${context.clauseReference})`}
            </div>
          )}
        </div>

        {/* Quick Actions Scroll Area */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center justify-between">
            <span>Quick Guidance Actions</span>
            <span className="text-[10px] text-slate-400 font-normal">Contextual</span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
            {quickActions.map((qa) => (
              <button
                key={qa.action}
                type="button"
                onClick={() => handleSend(undefined, qa.action)}
                disabled={isLoading}
                className="text-[11px] px-2.5 py-1 bg-white hover:bg-blue-50 hover:text-blue-800 hover:border-blue-300 text-slate-700 rounded-md border border-slate-200 font-medium shadow-2xs transition-colors shrink-0 disabled:opacity-50"
              >
                {qa.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white text-xs">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${
                m.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[92%] rounded-xl px-3.5 py-2.5 shadow-2xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-blue-700 text-white rounded-br-xs'
                    : 'bg-slate-50 text-slate-900 border border-slate-200 rounded-bl-xs'
                }`}
              >
                <div className="whitespace-pre-line text-[12px]">{m.text}</div>

                {/* Source Citation Block */}
                {m.sender === 'assistant' && m.sourceCitation && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200">
                    <div className="flex items-center gap-1 mb-1 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                      <span>Source Authority</span>
                    </div>
                    {getSourceBadge(m.sourceType, m.sourceCitation)}
                  </div>
                )}
              </div>

              <span className="text-[10px] text-slate-400 mt-1 px-1">
                {m.sender === 'user' ? 'You' : 'NAWI Lab Guidance'} &bull; {m.timestamp}
              </span>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-slate-500 text-xs italic bg-slate-50 border border-slate-200 rounded-lg p-3 max-w-[80%]">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
              <span>Searching approved OIML standards, SOPs, and operating manuals...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Safety Disclaimer Banner */}
        <div className="px-4 py-1.5 bg-amber-50 border-t border-amber-200 text-[10px] text-amber-900 flex items-center gap-1.5 shrink-0">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Advisory only &bull; Calculations &amp; compliance governed solely by metrology engine.</span>
        </div>

        {/* Bottom Input Box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask about procedure, tolerances, or how to operate this model..."
            className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputQuery.trim()}
            className="p-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white rounded-lg transition-colors shrink-0"
            title="Send query"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </aside>
    </div>
  );
};
