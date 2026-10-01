'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Send,
  HelpCircle,
  BookOpen,
  ShieldAlert,
  ChevronRight,
  Info,
  Scale,
} from 'lucide-react';
import {
  GuidanceActionType,
  GuidanceContext,
  GuidanceResponse,
} from '@/services/guidance/knowledge-types';

interface LabAssistantWidgetProps {
  context: GuidanceContext;
}

interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
  sourceCitation?: string;
  sourceType?: string;
  timestamp: string;
}

export const LabAssistantWidget: React.FC<LabAssistantWidgetProps> = ({ context }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'assistant',
      text:
        'Hello. I am the NAWI Lab Assistant. I provide context-aware metrological guidance, ' +
        'OIML R 76 procedure explanations, approved laboratory SOPs, and instrument operating instructions.',
      sourceCitation: 'NAWI-R76 Accredited Metrology Guidance System',
      sourceType: 'APPLICATION_HELP',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const quickActions: Array<{ label: string; action: GuidanceActionType }> = [
    { label: 'Explain this test', action: 'EXPLAIN_TEST' },
    { label: 'What should I enter?', action: 'WHAT_TO_ENTER' },
    { label: 'What equipment do I need?', action: 'EQUIPMENT_NEEDED' },
    { label: 'What evidence is needed?', action: 'EVIDENCE_NEEDED' },
    { label: 'Explain this error', action: 'EXPLAIN_ERROR' },
    { label: 'Show procedure', action: 'SHOW_PROCEDURE' },
  ];

  const handleSend = async (queryText?: string, action?: GuidanceActionType) => {
    const q = queryText ?? inputQuery;
    if (!q && !action) return;

    const userMsg: ChatMessage = {
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
          sender: 'assistant',
          text: 'Unable to retrieve guidance at this time. Please check your network connection.',
          sourceCitation: 'System Communication Error',
          sourceType: 'UNAPPROVED_FALLBACK',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <aside aria-label="Laboratory Guidance Assistant" className="fixed bottom-5 right-5 z-40">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-lg border border-slate-700 text-xs font-semibold tracking-wide transition-all transform hover:scale-105 active:scale-95"
          title="Open NAWI Lab Assistant"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Lab Assistant</span>
          {context.testName && (
            <span className="hidden sm:inline-block max-w-[120px] truncate text-[11px] text-slate-300 border-l border-slate-700 pl-2">
              {context.clauseReference ?? context.testName}
            </span>
          )}
        </button>
      )}

      {/* Popover Assistant Window */}
      {isOpen && (
        <div className="w-[390px] sm:w-[430px] max-h-[580px] bg-white border border-slate-300 rounded-xl shadow-2xl flex flex-col overflow-hidden text-slate-900 animate-in fade-in slide-in-from-bottom-2 duration-150">
          {/* Header */}
          <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
                <Scale className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold tracking-tight">NAWI Lab Assistant</h3>
                <p className="text-[10px] text-slate-400">Context-Aware Laboratory Guidance</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded transition-colors"
              title="Close Assistant"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Active Context Banner */}
          <div className="bg-slate-100/90 border-b border-slate-200 px-3.5 py-1.5 text-[11px] text-slate-600 flex items-center justify-between">
            <div className="truncate mr-2">
              <span className="font-semibold text-slate-700">Context: </span>
              <span>{context.testName ? `${context.testName} (${context.clauseReference ?? ''})` : `Step ${context.stepNumber ?? 1}: ${context.stepName ?? 'Instrument'}`}</span>
            </div>
            {context.instrumentModel && (
              <span className="shrink-0 bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-700">
                {context.instrumentModel}
              </span>
            )}
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 p-3.5 space-y-3 overflow-y-auto max-h-[300px] text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`p-3 rounded-lg max-w-[90%] leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-blue-700 text-white'
                      : 'bg-slate-50 border border-slate-200 text-slate-800'
                  }`}
                >
                  <p className="whitespace-pre-line">{m.text}</p>

                  {/* Verbatim Source Citation Box */}
                  {m.sourceCitation && m.sender === 'assistant' && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-start gap-1.5 text-[10.5px]">
                      <BookOpen className="w-3.5 h-3.5 text-blue-700 shrink-0 mt-0.5" />
                      <div className="leading-tight">
                        <span className="font-semibold text-slate-700">Source: </span>
                        <span className={m.sourceType === 'UNAPPROVED_FALLBACK' ? 'text-amber-800 italic' : 'text-slate-600'}>
                          {m.sourceCitation}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 px-1">{m.timestamp}</span>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-slate-500 text-xs italic p-2 bg-slate-50 rounded border border-slate-200 w-fit">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                <span>Searching approved laboratory knowledge...</span>
              </div>
            )}
          </div>

          {/* Quick Help Chips */}
          <div className="px-3.5 py-2 border-t border-slate-200 bg-slate-50">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Quick Help
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickActions.map((qa) => (
                <button
                  key={qa.action}
                  type="button"
                  onClick={() => handleSend(qa.label, qa.action)}
                  className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[11px] text-slate-700 transition-colors shadow-2xs hover:border-slate-300"
                >
                  {qa.label}
                </button>
              ))}
            </div>
          </div>

          {/* User Input Field */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 border-t border-slate-200 bg-white flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask a question about this test or instrument..."
              className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || isLoading}
              className="p-2 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-200 text-white rounded-lg transition-colors shrink-0 shadow-xs"
              title="Send Query"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Bottom Safety Disclaimer */}
          <div className="bg-slate-100 px-3.5 py-1.5 border-t border-slate-200 text-[10px] text-slate-500 text-center">
            Guidance only &bull; Formal compliance decisions are evaluated strictly against statutory OIML R 76 rules.
          </div>
        </div>
      )}
    </aside>
  );
};
