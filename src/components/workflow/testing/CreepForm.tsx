'use client';

import React from 'react';
import { CreepData } from '@/lib/test-suite-types';
import { RegisteredInstrument } from '@/lib/synthetic-instruments';
import { CheckCircle2, AlertTriangle, Plus, Trash2 } from 'lucide-react';

interface CreepFormProps {
  data: CreepData;
  instrument: RegisteredInstrument;
  onChange: (updatedData: CreepData) => void;
}

export const CreepForm: React.FC<CreepFormProps> = ({ data, instrument, onChange }) => {
  const e = instrument.verificationInterval_e;

  const handleInputChange = (index: number, field: 'elapsedMinutes' | 'indication' | 'deltaL', val: string) => {
    const num = parseFloat(val) || 0;
    const nextObs = [...data.observations];
    nextObs[index] = { ...nextObs[index], [field]: num };

    // Initial P0 at index 0
    const p0 = nextObs[0].indication + 0.5 * e - nextObs[0].deltaL;

    const evaluated = nextObs.map((obs) => {
      const p = obs.indication + 0.5 * e - obs.deltaL;
      const drift = Math.abs(p - p0);
      return {
        ...obs,
        calculated_P: Math.round(p * 10000) / 10000,
        driftFromInitial: Math.round(drift * 10000) / 10000,
      };
    });

    // Check early termination at 30 min
    const pt30 = evaluated.find((o) => o.elapsedMinutes === 30);
    const pt15 = evaluated.find((o) => o.elapsedMinutes === 15);

    let earlyTerminationQualified = false;
    if (pt30) {
      const drift30 = pt30.driftFromInitial ?? 0;
      const drift15to30 = pt15 ? Math.abs((pt30.calculated_P ?? 0) - (pt15.calculated_P ?? 0)) : 0;
      earlyTerminationQualified = drift30 <= 0.5 * e && drift15to30 <= 0.2 * e;
    }

    onChange({
      ...data,
      initialReading_P0: Math.round(p0 * 10000) / 10000,
      observations: evaluated,
      earlyTerminationQualified,
      isPass: earlyTerminationQualified || evaluated.every((o) => (o.driftFromInitial ?? 0) <= 1.5 * e),
    });
  };

  const handleAddObservation = () => {
    const lastMinutes = data.observations.length > 0 ? data.observations[data.observations.length - 1].elapsedMinutes : 0;
    const newMinutes = lastMinutes + 30;
    const lastObs = data.observations[data.observations.length - 1];

    const newPt = {
      id: `cr-${Date.now()}`,
      elapsedMinutes: newMinutes,
      indication: lastObs ? lastObs.indication : data.appliedLoad,
      deltaL: lastObs ? lastObs.deltaL : e * 0.5,
      calculated_P: lastObs ? lastObs.calculated_P : data.appliedLoad,
      driftFromInitial: lastObs ? lastObs.driftFromInitial : 0,
    };

    onChange({
      ...data,
      observations: [...data.observations, newPt],
    });
  };

  const handleRemoveObservation = (index: number) => {
    if (data.observations.length <= 1) return;
    const nextObs = data.observations.filter((_, i) => i !== index);
    onChange({
      ...data,
      observations: nextObs,
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="font-semibold text-slate-900 block">
            Clause A.4.11.1 Creep Evaluation &bull; Applied Load: {data.appliedLoad} {instrument.primaryUnit} (~Max)
          </span>
          <span className="text-[11px] text-slate-500">
            Initial stabilized reading P0 recorded at t = 0 min. Early termination after 30 min is permissible if |P30 &minus; P0| &le; 0.5 e and |P30 &minus; P15| &le; 0.2 e.
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block uppercase">Initial Reading (P0)</span>
            <span className="font-mono font-bold text-blue-900">
              {(data.initialReading_P0 ?? data.appliedLoad).toFixed(4)} {instrument.primaryUnit}
            </span>
          </div>

          <button
            type="button"
            onClick={handleAddObservation}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-blue-700" />
            <span>Add Timestamp</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
            <tr>
              <th className="py-2.5 px-3">Elapsed Time</th>
              <th className="py-2.5 px-3">Indication (I)</th>
              <th className="py-2.5 px-3">&Delta;L</th>
              <th className="py-2.5 px-3 font-semibold text-blue-900 bg-blue-50/40">Calculated P</th>
              <th className="py-2.5 px-3 font-semibold text-blue-900 bg-blue-50/40">Drift from P0 (|P - P0|)</th>
              <th className="py-2.5 px-3 font-semibold text-blue-900 bg-blue-50/40">Early Term. Limit</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {data.observations.map((obs, idx) => (
              <tr key={obs.id} className="hover:bg-slate-50">
                <td className="py-2 px-3">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={obs.elapsedMinutes}
                      onChange={(e) => handleInputChange(idx, 'elapsedMinutes', e.target.value)}
                      className="w-16 px-1.5 py-1 text-xs border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                    <span className="text-[10px] text-slate-400">min</span>
                  </div>
                </td>
                <td className="py-2 px-3">
                  <input
                    type="number"
                    step="any"
                    value={obs.indication}
                    onChange={(e) => handleInputChange(idx, 'indication', e.target.value)}
                    className="w-20 px-1.5 py-1 text-xs border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </td>
                <td className="py-2 px-3">
                  <input
                    type="number"
                    step="any"
                    value={obs.deltaL}
                    onChange={(e) => handleInputChange(idx, 'deltaL', e.target.value)}
                    className="w-20 px-1.5 py-1 text-xs border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </td>

                <td className="py-2 px-3 font-mono font-medium text-blue-950 bg-blue-50/20">
                  {(obs.calculated_P ?? 0).toFixed(4)}
                </td>
                <td className="py-2 px-3 font-mono font-semibold text-slate-900 bg-blue-50/20">
                  {idx === 0 ? '— (Reference)' : `${(obs.driftFromInitial ?? 0).toFixed(4)} ${instrument.primaryUnit}`}
                </td>
                <td className="py-2 px-3 font-mono text-slate-500 bg-blue-50/20 text-[11px]">
                  {obs.elapsedMinutes === 30 ? `\u2264 ${(0.5 * e).toFixed(4)} (0.5 e)` : obs.elapsedMinutes === 15 ? '\u2014' : '\u2264 |MPE|'}
                </td>
                <td className="py-2 px-3 text-right">
                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveObservation(idx)}
                      className="text-slate-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
            30-Minute Early Termination Status: {data.earlyTerminationQualified ? 'QUALIFIED' : 'NOT QUALIFIED (Continue to 4h)'}
          </span>
          <span className="text-[11px] text-slate-500 block">
            {data.earlyTerminationQualified
              ? 'Drift at 30 min is within 0.5 e and difference between 15 min and 30 min does not exceed 0.2 e. Test may terminate early.'
              : 'Drift conditions not satisfied for 30-minute early termination.'}
          </span>
        </div>

        {data.isPass ? (
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            PASS: Creep Compliant
          </span>
        ) : (
          <span className="text-xs font-bold text-red-700 bg-red-100 border border-red-200 px-2.5 py-1 rounded flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            FAIL: Excessive Drift
          </span>
        )}
      </div>
    </div>
  );
};
