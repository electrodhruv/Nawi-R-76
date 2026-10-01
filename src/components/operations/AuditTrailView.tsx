'use client';

import React, { useState } from 'react';
import {
  Database,
  Clock,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  FileText,
  User,
  ArrowUpDown,
  Hash,
} from 'lucide-react';

import {
  AuditItem,
  AuditTrailService,
} from '@/services/operations/audit-trail-service';

export const AuditTrailView: React.FC = () => {
  const [logs, setLogs] = useState<AuditItem[]>(() => AuditTrailService.getAllLogs());
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  React.useEffect(() => {
    const unsubscribe = AuditTrailService.subscribe(() => {
      setLogs(AuditTrailService.getAllLogs());
    });
    return unsubscribe;
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.changeReason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold">
              <Database className="w-4 h-4" />
            </div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight">
              Cryptographic Audit Trail &amp; Ledger
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
              Immutable Chain of Custody
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            Statutory metrological audit register logging every entity mutation, observation entry,
            and state transition with actor attribution, timestamp, and SHA-256 cryptographic chaining.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Events</span>
            <span className="font-bold text-blue-700 text-xs">{logs.length} Immutable Logs</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by actor, reason, entity ID..."
            className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600 font-sans"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500 text-[11px]">Filter Action:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-700 bg-white focus:outline-none focus:border-blue-600"
          >
            <option value="ALL">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="STATE_TRANSITION">STATE_TRANSITION</option>
            <option value="VERIFY_EVIDENCE">VERIFY_EVIDENCE</option>
            <option value="SIGN_DOCUMENT">SIGN_DOCUMENT</option>
          </select>
        </div>
      </div>

      {/* Audit Log Timeline Entries */}
      <div className="space-y-3">
        {filteredLogs.map((log) => (
          <div
            key={log.id}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:border-slate-300 transition-all space-y-3"
          >
            {/* Top row of card */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-slate-400 font-bold text-[11px]">{log.id.toUpperCase()}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
                    log.action === 'SIGN_DOCUMENT'
                      ? 'bg-purple-100 text-purple-800 border border-purple-300'
                      : log.action === 'STATE_TRANSITION'
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : log.action === 'VERIFY_EVIDENCE'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {log.action}
                </span>
                <span className="text-slate-500 text-[11px]">Entity: <strong className="text-slate-800">{log.entityType} ({log.entityId})</strong></span>
              </div>

              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{log.timestamp}</span>
              </div>
            </div>

            {/* Description & Justification */}
            <p className="text-xs text-slate-800 leading-relaxed font-sans">{log.changeReason}</p>

            {/* Actor and Cryptographic hash footer */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  Actor: <strong className="text-slate-800">{log.actor}</strong> ({log.role.replace(/_/g, ' ')})
                </span>
              </div>

              <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                <Hash className="w-3 h-3 text-blue-600" />
                <span>SHA-256: {log.sha256Digest.slice(0, 16)}...</span>
                <span title="Ledger Hash Verified">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 ml-1" />
                </span>
              </div>
            </div>
          </div>
        ))}

        {filteredLogs.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 text-xs">
            No audit records match the selected filters.
          </div>
        )}
      </div>
    </div>
  );
};
