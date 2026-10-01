'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Send,
  RotateCcw,
  BookOpen,
  Scale,
  ShieldAlert,
  Info,
  ChevronDown,
  HelpCircle,
  Bot,
  User,
  ExternalLink,
} from 'lucide-react';
import {
  GuidanceActionType,
  GuidanceContext,
  GuidanceResponse,
  KnowledgeSourceType,
} from '@/services/guidance/knowledge-types';

interface AIChatBubbleProps {
  context: GuidanceContext;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  sourceCitation?: string;
  sourceType?: KnowledgeSourceType;
  suggestedFollowUps?: string[];
  timestamp: string;
}

export const AIChatBubble: React.FC<AIChatBubbleProps> = ({ context }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-initial',
      sender: 'assistant',
      text:
        'Hello! I am your **OIML R 76 Metrology AI Assistant**.\n\n' +
        'I provide accredited guidance on OIML R 76-1:2006 statutory tolerances, Table 6 MPE limits, turning point formulas (P = I + 0.5e - ΔL), test procedures, and reference standards.\n\n' +
        'How can I help with your laboratory evaluation today?',
      sourceCitation: 'OIML R 76-1:2006 Accredited Guidance System',
      sourceType: 'OIML_STANDARD',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [messages, isOpen]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSend = async (queryText?: string, action?: GuidanceActionType) => {
    const q = (queryText ?? inputQuery).trim();
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

      if (!res.ok) throw new Error('AI Guidance query failed');
      const data: GuidanceResponse = await res.json();

      const assistantMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        sender: 'assistant',
        text: data.text,
        sourceCitation: data.sourceCitation,
        sourceType: data.sourceType,
        suggestedFollowUps: data.suggestedFollowUps,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `ast-err-${Date.now()}`,
          sender: 'assistant',
          text: 'Unable to reach the metrology engine. Please verify local connectivity.',
          sourceCitation: 'System Communication Exception',
          sourceType: 'UNAPPROVED_FALLBACK',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `msg-reset-${Date.now()}`,
        sender: 'assistant',
        text: 'Conversation reset. Ask any question about OIML R 76, formulas, or active testing.',
        sourceCitation: 'OIML R 76-1:2006 Guidance',
        sourceType: 'OIML_STANDARD',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const getSourceBadge = (sourceType?: KnowledgeSourceType, citation?: string) => {
    if (!citation) return null;

    switch (sourceType) {
      case 'OIML_STANDARD':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            <BookOpen className="w-3 h-3 text-blue-600 shrink-0" />
            <span className="truncate max-w-[280px]">{citation}</span>
          </span>
        );
      case 'LAB_SOP':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Scale className="w-3 h-3 text-emerald-600 shrink-0" />
            <span className="truncate max-w-[280px]">{citation}</span>
          </span>
        );
      case 'INSTRUMENT_MANUAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-800 border border-purple-200">
            <Info className="w-3 h-3 text-purple-600 shrink-0" />
            <span className="truncate max-w-[280px]">{citation}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <HelpCircle className="w-3 h-3 text-slate-500 shrink-0" />
            <span className="truncate max-w-[280px]">{citation}</span>
          </span>
        );
    }
  };

  const renderInlineStyles = (text: string, isUser: boolean) => {
    // Split on **bold** and *italic*
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className={isUser ? 'font-bold text-white' : 'font-semibold text-slate-900'}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <em key={i} className={isUser ? 'italic text-blue-100' : 'italic text-slate-600'}>
            {part.slice(1, -1)}
          </em>
        );
      }
      return part;
    });
  };

  const renderCleanMessage = (rawText: string, isUser: boolean) => {
    if (isUser) {
      return <div className="whitespace-pre-line leading-relaxed">{rawText}</div>;
    }

    // Sanitize any stray LaTeX / mathematical tokens
    const clean = rawText
      .replace(/\\Delta/g, 'Δ')
      .replace(/\\le/g, '≤')
      .replace(/\\ge/g, '≥')
      .replace(/\\pm/g, '±')
      .replace(/\^\\circ\\text\{C\}/g, '°C')
      .replace(/\^\\circ C/g, '°C')
      .replace(/\\mathbf\{([^}]+)\}/g, '$1')
      .replace(/\\text\{([^}]+)\}/g, '$1')
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1/$2')
      .replace(/\\times/g, '×')
      .replace(/\\approx/g, '≈')
      .replace(/\$\$/g, '')
      .replace(/\$/g, '')
      .replace(/\\%/g, '%');

    const lines = clean.split('\n');
    return (
      <div className="space-y-1 leading-relaxed text-xs">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) {
            return <div key={idx} className="h-1" />;
          }

          // Headers: ### Title
          if (trimmed.startsWith('### ')) {
            return (
              <h4 key={idx} className="font-bold text-slate-900 text-xs mt-1.5 mb-0.5">
                {renderInlineStyles(trimmed.replace(/^###\s+/, ''), false)}
              </h4>
            );
          }

          // Bullet point lines: • or -
          if (trimmed.startsWith('• ') || trimmed.startsWith('- ')) {
            const bulletText = trimmed.replace(/^[•\-]\s+/, '');
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-0.5 my-0.5">
                <span className="text-blue-500 font-bold shrink-0 leading-none mt-1">•</span>
                <div className="flex-1">{renderInlineStyles(bulletText, false)}</div>
              </div>
            );
          }

          // Numbered lines: e.g. "1. ..."
          const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
          if (numberedMatch) {
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-0.5 my-0.5">
                <span className="text-blue-600 font-semibold shrink-0">{numberedMatch[1]}.</span>
                <div className="flex-1">{renderInlineStyles(numberedMatch[2], false)}</div>
              </div>
            );
          }

          // Regular paragraph
          return <p key={idx}>{renderInlineStyles(trimmed, false)}</p>;
        })}
      </div>
    );
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* ========================================================================= */}
      {/* 1. EXPANDED CHAT WINDOW (Floating Card)                                  */}
      {/* ========================================================================= */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="OIML Metrology AI Assistant"
          className="absolute bottom-16 right-0 w-[420px] max-w-[calc(100vw-2.5rem)] h-[620px] max-h-[calc(100vh-7rem)] bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-xs">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-xs font-bold tracking-tight">OIML Metrology AI</h2>
                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 bg-blue-500/20 text-blue-300 rounded border border-blue-500/40">
                    R 76
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                  <span>Accredited Assistant &bull; Online</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <button
                type="button"
                onClick={handleClearChat}
                className="p-1.5 rounded-lg hover:text-white hover:bg-slate-800 transition-colors"
                title="Clear conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:text-white hover:bg-slate-800 transition-colors"
                title="Minimize chat"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Context Banner Strip (Active Specimen & Test) */}
          {(context.instrumentModel || context.testName) && (
            <div className="px-3.5 py-1.5 bg-slate-100/90 border-b border-slate-200 text-[11px] text-slate-700 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-semibold text-slate-900 truncate">
                  {context.instrumentModel || 'Instrument'}
                </span>
                {context.testName && (
                  <span className="text-blue-700 truncate font-medium">
                    &bull; {context.testName}
                  </span>
                )}
              </div>
              {context.stepName && (
                <span className="text-[10px] font-mono text-slate-500 shrink-0">
                  {context.stepName}
                </span>
              )}
            </div>
          )}


          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${
                  m.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 leading-relaxed text-xs shadow-2xs ${
                    m.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-xs'
                      : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-bl-xs'
                  }`}
                >
                  {renderCleanMessage(m.text, m.sender === 'user')}

                  {/* Source Authority Badge */}
                  {m.sender === 'assistant' && m.sourceCitation && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200/80">
                      {getSourceBadge(m.sourceType, m.sourceCitation)}
                    </div>
                  )}
                </div>


                <span className="text-[9px] text-slate-400 mt-1 px-1">
                  {m.sender === 'user' ? 'You' : 'Metrology AI'} &bull; {m.timestamp}
                </span>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-slate-500 text-xs italic bg-slate-50 border border-slate-200 rounded-xl p-3 max-w-[80%] shadow-2xs">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" />
                </div>
                <span>Consulting OIML R 76 standards...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Input Area */}
          <div className="p-3 bg-white border-t border-slate-200 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl p-1 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white focus-within:border-transparent transition-all shadow-2xs"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Type your metrological question..."
                className="flex-1 px-3 py-1.5 text-xs bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !inputQuery.trim()}
                className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer shadow-xs"
                title="Send query"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
            <div className="mt-1.5 flex items-center justify-between text-[9px] text-slate-400 px-1">
              <span>Advisory guidance &bull; Calculations governed by metrology engine</span>
              <span>Enter ↵</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. FLOATING CHAT BUBBLE BUTTON (Fixed in Bottom-Right Corner)            */}
      {/* ========================================================================= */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative group w-14 h-14 rounded-full bg-gradient-to-tr from-blue-700 via-indigo-600 to-blue-500 hover:from-blue-800 hover:via-indigo-700 hover:to-blue-600 text-white shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
        title={isOpen ? 'Close OIML AI Assistant' : 'Open OIML AI Metrology Assistant'}
      >
        {/* Pulsing Emerald Active Dot */}
        <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white" />
        </span>

        {isOpen ? (
          <X className="w-6 h-6 transition-transform duration-200" />
        ) : (
          <div className="flex items-center justify-center">
            <MessageSquare className="w-6 h-6 transition-transform duration-200 group-hover:scale-110" />
          </div>
        )}

        {/* Hover Tooltip (When Closed) */}
        {!isOpen && (
          <span className="absolute right-16 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-md pointer-events-none">
            OIML AI Assistant
          </span>
        )}
      </button>
    </div>
  );
};
