'use client';

import React, { useState } from 'react';
import {
  Database,
  Clock,
  Shield,
} from 'lucide-react';

interface AuditItem {
  id: string;
  actor: string;
  role: string;
  entityType: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'STATE_TRANSITION' | 'VERIFY_EVIDENCE';
  changeReason: string;
  rulePackVersion: string;
  timestamp: string;
  previousState?: string;
  newState?: string;
}

export const AuditTrailViewer: React.FC = () => {
  const [auditLogs] = useState<AuditItem[]>([
    {
      id: 'aud-05',
      actor: 'Dr. S. K. Nair',
      role: 'TECHNICAL_REVIEWER',
      entityType: 'TypeEvaluation',
      entityId: 'eval-01',
      action: 'STATE_TRANSITION',
      changeReason: 'Technical peer review completed. All 18 completed test runs verified compliant with Table 6 MPE limits.',
      rulePackVersion: 'R76-2006-v1',
      timestamp: '2026-09-27 11:45:00 UTC',
      previousState: '{ "status": "IN_TESTING" }',
      newState: '{ "status": "PENDING_REVIEW", "completedAt": "2026-09-27T11:45:00Z" }',
    },
    {
      id: 'aud-04',
      actor: 'Dr. S. K. Nair',
      role: 'TECHNICAL_REVIEWER',
      entityType: 'EvidenceFile',
      entityId: 'ev-01',
      action: 'VERIFY_EVIDENCE',
      changeReason: 'Attested physical test authenticity. Indicator display matched turning point load within 0.5e.',
      rulePackVersion: 'R76-2006-v1',
      timestamp: '2026-09-27 11:20:12 UTC',
      previousState: '{ "status": "CONSISTENT" }',
      newState: '{ "status": "VERIFIED_BY_REVIEWER", "verifiedBy": "Dr. S. K. Nair" }',
    },
    {
      id: 'aud-03',
      actor: 'Amit Verma',
      role: 'TESTING_OFFICER',
      entityType: 'EvaluationTestRun',
      entityId: 'run-a44-01',
      action: 'UPDATE',
      changeReason: 'Recorded 10 turning-point observation points for intrinsic error determination under Clause A.4.4.',
      rulePackVersion: 'R76-2006-v1',
      timestamp: '2026-09-27 10:30:45 UTC',
      previousState: '{ "status": "INCOMPLETE" }',
      newState: '{ "status": "PASS", "observationCount": 10, "maxError": "+0.5g" }',
    },
    {
      id: 'aud-02',
      actor: 'Amit Verma',
      role: 'TESTING_OFFICER',
      entityType: 'EvaluationTestRun',
      entityId: 'run-ecc-rolling',
      action: 'UPDATE',
      changeReason: 'Evaluated applicability: Rolling track test (A.4.7.4) excluded because instrument has a standard fixed pan.',
      rulePackVersion: 'R76-2006-v1',
      timestamp: '2026-09-27 09:15:20 UTC',
      previousState: '{ "status": "NOT_TESTED" }',
      newState: '{ "status": "NOT_APPLICABLE", "exclusionJustification": "Instrument has standard fixed pan" }',
    },
    {
      id: 'aud-01',
      actor: 'Amit Verma',
      role: 'TESTING_OFFICER',
      entityType: 'TypeEvaluation',
      entityId: 'eval-01',
      action: 'CREATE',
      changeReason: 'Initialized evaluation RRSL-2026-TE-0104 with dynamic OIML R 76-1 test plan for Precision-Bench-B6.',
      rulePackVersion: 'R76-2006-v1',
      timestamp: '2026-09-27 09:00:00 UTC',
      previousState: 'null',
      newState: '{ "evaluationNumber": "RRSL-2026-TE-0104", "status": "PLAN_CONFIGURED" }',
    },
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            <h1 className="text-base font-bold text-white tracking-tight">
              Immutable Metrological Audit Trail
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tamper-evident append-only ledger of all configuration changes, observation submissions, and review attestations.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-400">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Append-Only Integrity Enforced</span>
        </div>
      </div>

      {/* Audit Log Stream */}
      <div className="space-y-4">
        {auditLogs.map((log) => (
          <div
            key={log.id}
            className="glass-panel rounded-xl border border-slate-800 p-4 space-y-3 hover:border-slate-700 transition-colors"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    log.action === 'STATE_TRANSITION'
                      ? 'bg-purple-950 text-purple-400 border border-purple-800'
                      : log.action === 'VERIFY_EVIDENCE'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : log.action === 'CREATE'
                      ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                      : 'bg-blue-950 text-blue-400 border border-blue-800'
                  }`}
                >
                  {log.action}
                </span>
                <span className="text-xs font-mono font-bold text-white">{log.entityType}</span>
                <span className="text-[11px] text-slate-500 font-mono">({log.entityId})</span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400">
                <div className="flex items-center gap-1 font-mono text-[11px] text-cyan-400">
                  <Shield className="w-3 h-3" />
                  <span>{log.rulePackVersion}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px]">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>{log.timestamp}</span>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-200 leading-relaxed">
              <strong className="text-white">Actor:</strong> {log.actor} ({log.role}) &bull;{' '}
              <strong className="text-white">Justification:</strong> &ldquo;{log.changeReason}&rdquo;
            </div>

            {/* State Diffs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-[11px] font-mono">
              <div className="bg-slate-950 p-2.5 rounded border border-slate-900">
                <span className="text-slate-500 text-[10px] uppercase block mb-1">Previous State</span>
                <div className="text-slate-400 break-all">{log.previousState}</div>
              </div>
              <div className="bg-slate-950 p-2.5 rounded border border-slate-900">
                <span className="text-slate-500 text-[10px] uppercase block mb-1">New State</span>
                <div className="text-cyan-300 break-all">{log.newState}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
