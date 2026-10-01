'use client';

import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, Slash, MessageSquare } from 'lucide-react';

interface ChecklistViewProps {
  observations: Record<string, unknown>[];
  testName: string;
  onUpdateObservations: (nextObs: Record<string, unknown>[]) => void;
}

const NA_REASON_OPTIONS = [
  { code: 'NOT_APPLICABLE_CONFIGURATION', label: 'Not applicable for this instrument configuration / receptor type' },
  { code: 'NOT_APPLICABLE_CLASS', label: 'Statutory exemption for instrument accuracy class' },
  { code: 'NO_ANCILLARY_DEVICE', label: 'No ancillary printing / data-storage peripheral connected' },
  { code: 'NO_SOFTWARE_COMPONENT', label: 'Purely mechanical instrument / No software kernel' },
  { code: 'OTHER', label: 'Other laboratory statutory exemption' },
];

export const DEFAULT_ADMIN_ITEMS = [
  { requirement: 'Accuracy Class designation mark (I, II, III, IIII)', clause: '3.10', observation: '', status: 'NOT_TESTED' },
  { requirement: 'Maximum capacity (Max) and Minimum capacity (Min)', clause: '3.10', observation: '', status: 'NOT_TESTED' },
  { requirement: 'Verification scale interval (e) and scale interval (d)', clause: '3.10', observation: '', status: 'NOT_TESTED' },
  { requirement: 'Manufacturer name, trade mark, and serial number', clause: '3.10', observation: '', status: 'NOT_TESTED' },
  { requirement: 'Pattern approval sign and statutory verification area', clause: '3.10', observation: '', status: 'NOT_TESTED' },
];

export const DEFAULT_CONSTRUCTION_ITEMS = [
  { requirement: 'Level indicator and leveling feet', clause: '4.1.2.2', observation: '', status: 'NOT_TESTED' },
  { requirement: 'Zero-setting and zero-tracking bounds (±2% Max)', clause: '4.5', observation: '', status: 'NOT_TESTED' },
  { requirement: 'Tare device subtraction accuracy and NET indication', clause: '4.6', observation: '', status: 'NOT_TESTED' },
  { requirement: 'Physical security sealing of calibration switch', clause: '4.17', observation: '', status: 'NOT_TESTED' },
  { requirement: 'Software version and cryptographic checksum verification', clause: '4.18', observation: '', status: 'NOT_TESTED' },
];

export const ChecklistView: React.FC<ChecklistViewProps> = ({
  observations,
  testName,
  onUpdateObservations,
}) => {
  const [expandedNotes, setExpandedNotes] = useState<Record<number, boolean>>({});

  // Auto-initialize standard statutory questions if observations are empty
  React.useEffect(() => {
    if (!observations || observations.length === 0) {
      const items = testName.toLowerCase().includes('construction') || testName.toLowerCase().includes('sealing')
        ? DEFAULT_CONSTRUCTION_ITEMS
        : DEFAULT_ADMIN_ITEMS;
      onUpdateObservations(items);
    }
  }, [observations, testName, onUpdateObservations]);

  const handleStatusChange = (index: number, newStatus: 'PASS' | 'FAIL' | 'NOT_APPLICABLE') => {
    const next = [...observations];
    const curr: Record<string, unknown> = { ...next[index], status: newStatus };
    if (newStatus === 'NOT_APPLICABLE' && !curr.naReason) {
      curr.naReason = NA_REASON_OPTIONS[0].code;
    }
    next[index] = curr;
    onUpdateObservations(next);
  };

  const handleFieldChange = (index: number, key: string, val: unknown) => {
    const next = [...observations];
    next[index] = { ...next[index], [key]: val };
    onUpdateObservations(next);
  };

  const toggleNote = (index: number) => {
    setExpandedNotes((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            {testName} Checklist Requirements
          </h2>
          <span className="text-[11px] text-slate-500">
            Confirm compliance for each statutory requirement. Selecting N/A requires a structured justification reason.
          </span>
        </div>
      </div>

      {observations.length === 0 && (
        <div className="p-6 text-center bg-white border border-slate-200 rounded-lg space-y-3">
          <p className="text-xs text-slate-500">
            Loading statutory checklist questionnaire...
          </p>
          <button
            type="button"
            onClick={() => {
              const items = testName.toLowerCase().includes('construction') || testName.toLowerCase().includes('sealing')
                ? DEFAULT_CONSTRUCTION_ITEMS
                : DEFAULT_ADMIN_ITEMS;
              onUpdateObservations(items);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold cursor-pointer shadow-xs transition-colors"
          >
            <span>Load Statutory Checklist Requirements</span>
          </button>
        </div>
      )}

      <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-200 bg-white shadow-2xs">
        {observations.map((row, idx) => {
          const status = String(row.status || 'NOT_TESTED');
          const isNA = status === 'NOT_APPLICABLE';
          const isFail = status === 'FAIL';
          const isPass = status === 'PASS';
          const hasNote = Boolean(row.observation || row.note);
          const showNoteField = expandedNotes[idx] || hasNote || isNA;

          return (
            <div key={idx} className="p-3.5 space-y-2.5 transition-colors hover:bg-slate-50/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                {/* Requirement & Clause */}
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900 leading-snug">
                      {String(row.requirement || row.operation || `Requirement #${idx + 1}`)}
                    </span>
                    {Boolean(row.clause) && (
                      <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200">
                        Clause {String(row.clause)}
                      </span>
                    )}
                  </div>
                  {Boolean(row.subtext) && (
                    <p className="text-[11px] text-slate-500">{String(row.subtext)}</p>
                  )}
                </div>

                {/* Status Toggle Buttons: PASS / FAIL / N/A */}
                <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleStatusChange(idx, 'PASS')}
                    className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 transition-all ${
                      isPass
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>PASS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange(idx, 'FAIL')}
                    className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 transition-all ${
                      isFail
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>FAIL</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange(idx, 'NOT_APPLICABLE')}
                    className={`px-2.5 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-all ${
                      isNA
                        ? 'bg-slate-700 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    <Slash className="w-3.5 h-3.5" />
                    <span>N/A</span>
                  </button>

                  {/* Toggle Optional Note */}
                  {!showNoteField && (
                    <button
                      type="button"
                      onClick={() => toggleNote(idx)}
                      className="text-slate-400 hover:text-slate-700 p-1.5 ml-1"
                      title="Add observation note"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* MANDATORY N/A JUSTIFICATION SELECTOR */}
              {isNA && (
                <div className="bg-slate-50 border border-slate-300 rounded p-2.5 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px] uppercase tracking-wide">
                    <Slash className="w-3.5 h-3.5 text-slate-500" />
                    <span>Mandatory Statutory Justification for N/A:</span>
                  </div>
                  <select
                    value={String(row.naReason || NA_REASON_OPTIONS[0].code)}
                    onChange={(e) => handleFieldChange(idx, 'naReason', e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-sans text-slate-800 bg-white focus:outline-none focus:border-blue-600"
                  >
                    {NA_REASON_OPTIONS.map((opt) => (
                      <option key={opt.code} value={opt.code}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* OPTIONAL OBSERVATION / NOTE FIELD */}
              {showNoteField && (
                <div className="pt-1">
                  <input
                    type="text"
                    value={String(row.observation || row.note || '')}
                    onChange={(e) => {
                      handleFieldChange(idx, 'observation', e.target.value);
                      handleFieldChange(idx, 'note', e.target.value);
                    }}
                    placeholder="Observation note / condition details (optional)..."
                    className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded text-slate-800 focus:outline-none focus:border-blue-600 font-sans"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
