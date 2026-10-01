'use client';

import React from 'react';
import { EccentricityData } from '@/lib/test-suite-types';
import { RegisteredInstrument } from '@/lib/synthetic-instruments';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface EccentricityFormProps {
  data: EccentricityData;
  instrument: RegisteredInstrument;
  onChange: (updatedData: EccentricityData) => void;
}

export const EccentricityForm: React.FC<EccentricityFormProps> = ({
  data,
  instrument,
  onChange,
}) => {
  const e = instrument.verificationInterval_e;
  const mpeAllowed = e; // Under A.4.7, max permissible difference is <= 1 e

  const handleInputChange = (index: number, field: 'load' | 'indication' | 'deltaL', val: string) => {
    const num = parseFloat(val) || 0;
    const nextObs = [...data.observations];
    nextObs[index] = { ...nextObs[index], [field]: num };

    // Recompute turning point P for all points
    // P = I + 0.5e - deltaL
    const centerPt = nextObs[0];
    const centerP = centerPt.indication + 0.5 * e - centerPt.deltaL;

    let maxDiff = 0;
    const recomputed = nextObs.map((obs, i) => {
      const p = obs.indication + 0.5 * e - obs.deltaL;
      const error_E = p - obs.load;
      const diffFromCenter = Math.abs(p - centerP);
      if (i > 0 && diffFromCenter > maxDiff) maxDiff = diffFromCenter;
      const isPass = i === 0 ? Math.abs(error_E) <= mpeAllowed : diffFromCenter <= mpeAllowed;

      return {
        ...obs,
        calculated_P: Math.round(p * 10000) / 10000,
        error_E: Math.round(error_E * 10000) / 10000,
        diffFromCenter: Math.round(diffFromCenter * 10000) / 10000,
        isPass,
      };
    });

    onChange({
      ...data,
      observations: recomputed,
      maxDiff: Math.round(maxDiff * 10000) / 10000,
      mpeAllowed,
    });
  };

  const hasFailure = data.observations.some((o) => o.isPass === false);

  return (
    <div className="space-y-4">
      {/* Geometry Notification Banner */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3 text-xs text-blue-900 flex items-center justify-between">
        <div>
          <span className="font-semibold uppercase tracking-wide">
            Load Receptor Geometry: {instrument.receptorType.replace('_', ' ')}
          </span>
          <span className="block text-[11px] text-blue-700 mt-0.5">
            {instrument.receptorType === 'ROLLING_TRACK'
              ? 'Clause A.4.7.4 (Rolling-load): Tested at beginning, middle, and end in forward and reverse directions with 50% Max.'
              : 'Clause A.4.7.1 (Quarter-segments): Tested at center and 4 eccentric quadrants with 1/3 Max test load.'}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Prescribed Load</span>
          <span className="font-mono font-bold text-blue-950">
            {data.testLoad} {instrument.primaryUnit}
          </span>
        </div>
      </div>

      {/* Observation Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
            <tr>
              <th className="py-2.5 px-3">Position / Location</th>
              <th className="py-2.5 px-3">Test Load</th>
              <th className="py-2.5 px-3">Indication (I)</th>
              <th className="py-2.5 px-3">&Delta;L</th>
              <th className="py-2.5 px-3 font-semibold text-blue-900 bg-blue-50/40">Calculated P</th>
              <th className="py-2.5 px-3 font-semibold text-blue-900 bg-blue-50/40">Error (E)</th>
              <th className="py-2.5 px-3 font-semibold text-blue-900 bg-blue-50/40">Diff from Center</th>
              <th className="py-2.5 px-3 text-right">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {data.observations.map((obs, idx) => (
              <tr key={obs.id} className={`hover:bg-slate-50 ${obs.isPass === false ? 'bg-red-50/60' : ''}`}>
                <td className="py-2.5 px-3 font-medium text-slate-900">{obs.position}</td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="any"
                      value={obs.load}
                      onChange={(e) => handleInputChange(idx, 'load', e.target.value)}
                      className="w-18 px-1.5 py-1 text-xs border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                    <span className="text-[10px] text-slate-400">{instrument.primaryUnit}</span>
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="any"
                      value={obs.indication}
                      onChange={(e) => handleInputChange(idx, 'indication', e.target.value)}
                      className="w-18 px-1.5 py-1 text-xs border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                    <span className="text-[10px] text-slate-400">{instrument.primaryUnit}</span>
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="any"
                      value={obs.deltaL}
                      onChange={(e) => handleInputChange(idx, 'deltaL', e.target.value)}
                      className="w-18 px-1.5 py-1 text-xs border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                    <span className="text-[10px] text-slate-400">{instrument.primaryUnit}</span>
                  </div>
                </td>

                <td className="py-2.5 px-3 font-mono font-medium text-blue-950 bg-blue-50/20">
                  {(obs.calculated_P ?? 0).toFixed(4)}
                </td>
                <td className="py-2.5 px-3 font-mono bg-blue-50/20">
                  {(obs.error_E ?? 0) >= 0 ? `+${(obs.error_E ?? 0).toFixed(4)}` : (obs.error_E ?? 0).toFixed(4)}
                </td>
                <td className="py-2.5 px-3 font-mono font-medium text-slate-900 bg-blue-50/20">
                  {idx === 0 ? '— (Datum)' : `${(obs.diffFromCenter ?? 0).toFixed(4)}`}
                </td>
                <td className="py-2.5 px-3 text-right">
                  {obs.isPass ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>PASS</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-700 font-bold text-xs">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>FAIL</span>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Authoritative Calculated Verdict */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs flex items-center justify-between">
        <div>
          <span className="font-semibold text-slate-800">
            Maximum Inter-Position Difference: {(data.maxDiff ?? 0).toFixed(4)} {instrument.primaryUnit}
          </span>
          <span className="text-[11px] text-slate-500 block">
            Applicable Clause A.4.7 Limit: &le; 1 e ({(data.mpeAllowed ?? e).toFixed(4)} {instrument.primaryUnit})
          </span>
        </div>

        {hasFailure ? (
          <span className="text-xs font-bold text-red-700 bg-red-100 border border-red-200 px-2.5 py-1 rounded">
            FAIL: Difference exceeds 1 e
          </span>
        ) : (
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded">
            PASS: Compliant with Clause A.4.7
          </span>
        )}
      </div>
    </div>
  );
};
