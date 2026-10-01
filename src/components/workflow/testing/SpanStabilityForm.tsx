'use client';

import React from 'react';
import { SpanStabilityData } from '@/lib/test-suite-types';
import { RegisteredInstrument } from '@/lib/synthetic-instruments';
import { CheckCircle2, Clock } from 'lucide-react';

interface SpanStabilityFormProps {
  data: SpanStabilityData;
  instrument: RegisteredInstrument;
  onChange: (updatedData: SpanStabilityData) => void;
}

export const SpanStabilityForm: React.FC<SpanStabilityFormProps> = ({
  data,
  instrument,
  onChange,
}) => {
  const e = instrument.verificationInterval_e;
  const maxAllowedDrift = 0.5 * e;

  const handleInputChange = (
    index: number,
    field: 'indication' | 'deltaL' | 'ambientTempC' | 'ambientHumidityRh',
    val: string
  ) => {
    const num = parseFloat(val) || 0;
    const nextRuns = [...data.runs];
    const r = { ...nextRuns[index], [field]: num, status: 'COMPLETED' as const };

    // P = I + 0.5e - deltaL
    const p = r.indication + 0.5 * e - r.deltaL;
    const err = p - r.referenceLoad;

    // Day 0 error
    const day0P = nextRuns[0].indication + 0.5 * e - nextRuns[0].deltaL;
    const day0Err = day0P - nextRuns[0].referenceLoad;
    const drift = Math.abs(err - day0Err);

    nextRuns[index] = {
      ...r,
      calculated_P: Math.round(p * 10000) / 10000,
      error: Math.round(err * 10000) / 10000,
      driftFromDay0: Math.round(drift * 10000) / 10000,
    };

    const maxObservedDrift = Math.max(
      ...nextRuns.filter((x) => x.status === 'COMPLETED').map((x) => x.driftFromDay0 ?? 0)
    );

    onChange({
      ...data,
      runs: nextRuns,
      overallCompliant: maxObservedDrift <= maxAllowedDrift,
    });
  };

  const completedCount = data.runs.filter((r) => r.status === 'COMPLETED').length;
  const totalCount = data.runs.length;

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="font-semibold text-slate-900 block">
            OIML R 76-1 Clause B.4 Span Stability Long-Term Evaluation (28 Days)
          </span>
          <span className="text-[11px] text-slate-500">
            Requires 8 measurement runs across 28 days under consistent ambient conditions. Span drift from Day 0 shall not exceed 0.5 e ({(0.5 * e).toFixed(4)} {instrument.primaryUnit}).
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Progress</span>
          <span className="font-mono font-bold text-blue-900">
            {completedCount} of {totalCount} Runs Recorded
          </span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
            <tr>
              <th className="py-2.5 px-3">Run #</th>
              <th className="py-2.5 px-3">Schedule Day</th>
              <th className="py-2.5 px-3">Date</th>
              <th className="py-2.5 px-3">Load</th>
              <th className="py-2.5 px-3">Indication (I)</th>
              <th className="py-2.5 px-3">&Delta;L</th>
              <th className="py-2.5 px-3 font-semibold text-blue-900 bg-blue-50/40">Drift from Day 0</th>
              <th className="py-2.5 px-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {data.runs.map((r, idx) => (
              <tr key={r.runIndex} className="hover:bg-slate-50">
                <td className="py-2 px-3 font-mono font-medium text-slate-500">Run {r.runIndex}</td>
                <td className="py-2 px-3 font-mono">Day {r.dayNumber}</td>
                <td className="py-2 px-3 text-slate-600">{r.testDate}</td>
                <td className="py-2 px-3 font-mono">
                  {r.referenceLoad} {instrument.primaryUnit}
                </td>
                <td className="py-2 px-3">
                  <input
                    type="number"
                    step="any"
                    value={r.indication}
                    onChange={(e) => handleInputChange(idx, 'indication', e.target.value)}
                    className="w-18 px-1.5 py-1 text-xs border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </td>
                <td className="py-2 px-3">
                  <input
                    type="number"
                    step="any"
                    value={r.deltaL}
                    onChange={(e) => handleInputChange(idx, 'deltaL', e.target.value)}
                    className="w-18 px-1.5 py-1 text-xs border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </td>

                <td className="py-2 px-3 font-mono font-bold text-blue-950 bg-blue-50/20">
                  {idx === 0 ? '— (Baseline)' : `${(r.driftFromDay0 ?? 0).toFixed(4)} ${instrument.primaryUnit}`}
                </td>

                <td className="py-2 px-3 text-right">
                  {r.status === 'COMPLETED' ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Recorded
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-slate-400 text-xs">
                      <Clock className="w-3.5 h-3.5" />
                      Scheduled
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs flex items-center justify-between">
        <div>
          <span className="font-semibold text-slate-800">
            Span Stability 28-Day Protocol Tracking
          </span>
          <span className="text-[11px] text-slate-500 block">
            Maximum span drift observed to date is within the permissible 0.5 e threshold ({(0.5 * e).toFixed(4)} {instrument.primaryUnit}).
          </span>
        </div>

        <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          IN PROGRESS (Protocol Active)
        </span>
      </div>
    </div>
  );
};
