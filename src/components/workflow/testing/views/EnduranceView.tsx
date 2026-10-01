'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { getTable6MpeValue } from '@/core/test-engine/interpreters/calculation-interpreter';
import { AccuracyClass } from '@/core/types/metrology';

interface EnduranceViewProps {
  observations: Record<string, unknown>[];
  unit: string;
  eVal: number;
  accuracyClass: AccuracyClass;
  maxCapacity: number;
  onUpdateObservations: (nextObs: Record<string, unknown>[]) => void;
}

export const EnduranceView: React.FC<EnduranceViewProps> = ({
  observations,
  unit,
  eVal,
  accuracyClass,
  maxCapacity,
  onUpdateObservations,
}) => {
  const row = observations[0] || {};
  const halfMax = Math.round(maxCapacity * 0.5 * 1000) / 1000;

  const targetLoad = Number(row.targetLoad) || halfMax;
  const targetCycles = Number(row.targetCycles) || 100000;
  const completedCycles = Number(row.completedCycles ?? row.cyclesCompleted) || 100000;
  const preError = Number(row.preWeighingError) || 0;
  const postError = Number(row.postWeighingError) || 0;
  const isMechanicallyIntact = row.isMechanicallyIntact !== false;

  const errorShift = Math.round(Math.abs(postError - preError) * 10000) / 10000;
  const mpe = getTable6MpeValue(accuracyClass, targetLoad, eVal);
  const isPass = errorShift <= mpe + 1e-9 && isMechanicallyIntact && completedCycles >= targetCycles;

  const handleUpdateField = (key: string, val: unknown) => {
    const next = [{ ...row, [key]: val }];
    onUpdateObservations(next);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
          Endurance Durability Testing (Clause 3.9.4.3, Clause A.6)
        </h2>
        <span className="text-[11px] text-slate-500">
          Three-stage evaluation: Pre-test weighing → 100,000 repetitive load cycles → Post-test weighing. Durability shift |E_post - E_pre| must not exceed Table 6 MPE.
        </span>
      </div>

      {/* THREE-STAGE WORKFLOW STEPPER */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* STAGE 1: PRE-ENDURANCE */}
        <div className="border border-slate-200 rounded-lg p-4 bg-white shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="font-bold text-xs text-blue-900 uppercase tracking-wide">
              Stage 1 &bull; Pre-Endurance
            </span>
            <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold font-mono">
              Baseline
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                Baseline Weighing Error E_pre ({unit}):
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={row.preWeighingError !== undefined && row.preWeighingError !== null ? String(row.preWeighingError) : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
                    handleUpdateField('preWeighingError', val);
                  }
                }}
                placeholder="0.0"
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Error determined from initial weighing performance test at nominal endurance load ({targetLoad} {unit}).
            </p>
          </div>
        </div>

        {/* STAGE 2: ENDURANCE CYCLING */}
        <div className="border border-slate-200 rounded-lg p-4 bg-white shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="font-bold text-xs text-indigo-900 uppercase tracking-wide">
              Stage 2 &bull; Repetitive Cycling
            </span>
            <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-bold font-mono">
              100,000 Cycles
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                Target Applied Load ({unit}):
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={row.targetLoad !== undefined && row.targetLoad !== null ? String(row.targetLoad) : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
                    handleUpdateField('targetLoad', val);
                  }
                }}
                placeholder={String(halfMax)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                Cycles Completed:
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={row.completedCycles !== undefined && row.completedCycles !== null ? String(row.completedCycles) : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^\d*$/.test(val)) {
                    handleUpdateField('completedCycles', val);
                  }
                }}
                placeholder={String(targetCycles)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>

            <label className="flex items-center gap-2 pt-1 font-sans text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isMechanicallyIntact}
                onChange={(e) => handleUpdateField('isMechanicallyIntact', e.target.checked)}
                className="rounded border-slate-300 text-blue-600"
              />
              <span>Mechanically intact; no structural failure</span>
            </label>
          </div>
        </div>

        {/* STAGE 3: POST-ENDURANCE */}
        <div className="border border-slate-200 rounded-lg p-4 bg-white shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="font-bold text-xs text-emerald-900 uppercase tracking-wide">
              Stage 3 &bull; Post-Endurance
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold font-mono">
              Final Verification
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                Final Weighing Error E_post ({unit}):
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={row.postWeighingError !== undefined && row.postWeighingError !== null ? String(row.postWeighingError) : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
                    handleUpdateField('postWeighingError', val);
                  }
                }}
                placeholder="0.0"
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Error determined from final weighing performance test at nominal load ({targetLoad} {unit}) after cycling.
            </p>
          </div>
        </div>
      </div>

      {/* CALCULATED DURABILITY COMPLIANCE CARD */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-bold text-xs text-slate-800 uppercase tracking-wide">
            Durability Result Evaluation
          </span>
          <span className="text-[11px] font-mono text-slate-500">Clause A.6</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-white p-3.5 border border-slate-200 rounded-md">
          <div>
            <span className="text-slate-500 block text-[11px]">Durability Shift |E_post - E_pre|:</span>
            <span className={`text-base font-bold font-mono ${isPass ? 'text-slate-900' : 'text-red-700'}`}>
              {errorShift.toFixed(eVal < 0.1 ? 3 : 2)} {unit}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block text-[11px]">Statutory Tolerance MPE(L):</span>
            <span className="text-base font-bold font-mono text-slate-700">
              ±{mpe.toFixed(eVal < 0.1 ? 3 : 2)} {unit}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block text-[11px]">Durability Verdict:</span>
            <div className="mt-0.5">
              {isPass ? (
                <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  PASS
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-800 border border-red-300 px-2.5 py-1 rounded text-xs font-bold">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                  FAIL
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
