'use client';

import React from 'react';
import { Plus, Trash2, Edit3, XCircle, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

interface CreepViewProps {
  observations: Record<string, unknown>[];
  unit: string;
  eVal: number;
  maxCapacity: number;
  onUpdateObservations: (nextObs: Record<string, unknown>[]) => void;
  onOpenCorrection: (rowIndex: number, fieldKey: string, currentVal: unknown) => void;
  onOpenInvalidate: (rowIndex: number) => void;
}

export const CreepView: React.FC<CreepViewProps> = ({
  observations,
  unit,
  eVal,
  maxCapacity,
  onUpdateObservations,
  onOpenCorrection,
  onOpenInvalidate,
}) => {
  const handleCellChange = (index: number, key: string, val: unknown) => {
    const next = [...observations];
    next[index] = { ...next[index], [key]: val };
    onUpdateObservations(next);
  };

  const handleAddMeasurement = () => {
    const lastElapsed = observations.length > 0
      ? Number(observations[observations.length - 1].elapsedMinutes) || 0
      : 0;
    const nextElapsed = lastElapsed === 0 ? 5 : lastElapsed === 5 ? 15 : lastElapsed === 15 ? 30 : lastElapsed + 30;
    const appliedLoad = observations[0]?.load !== undefined ? Number(observations[0].load) : maxCapacity;
    const initialInd = observations[0]?.indication !== undefined ? Number(observations[0].indication) : appliedLoad;

    const next = [
      ...observations,
      {
        load: appliedLoad,
        elapsedMinutes: nextElapsed,
        indication: initialInd,
        deltaL: Math.round(eVal * 0.5 * 1000) / 1000,
        temperatureC: 20.5,
        recordedTimestamp: new Date().toLocaleTimeString(),
      },
    ];
    onUpdateObservations(next);
  };

  const handleDeleteRow = (index: number) => {
    const next = observations.filter((_, i) => i !== index);
    onUpdateObservations(next);
  };

  // Initial stabilized reading at t = 0
  const initialRow = observations[0] || {};
  const initialInd = Number(initialRow.indication) || 0;
  const initialDL = Number(initialRow.deltaL) || 0;
  const initialP = initialInd + 0.5 * eVal - initialDL;

  // 30-minute early termination evaluation
  const row15 = observations.find((r) => Number(r.elapsedMinutes) === 15 && !r.isInvalidated);
  const row30 = observations.find((r) => Number(r.elapsedMinutes) === 30 && !r.isInvalidated);

  const p15 = row15 ? Number(row15.indication || 0) + 0.5 * eVal - Number(row15.deltaL || 0) : null;
  const p30 = row30 ? Number(row30.indication || 0) + 0.5 * eVal - Number(row30.deltaL || 0) : null;

  const drift0_30 = p30 !== null ? Math.round(Math.abs(p30 - initialP) * 10000) / 10000 : null;
  const drift15_30 = p30 !== null && p15 !== null ? Math.round(Math.abs(p30 - p15) * 10000) / 10000 : null;

  const limit0_30 = Math.round(0.5 * eVal * 10000) / 10000;
  const limit15_30 = Math.round(0.2 * eVal * 10000) / 10000;

  const isEarlyTermQualified = drift0_30 !== null && drift15_30 !== null && drift0_30 <= limit0_30 && drift15_30 <= limit15_30;

  return (
    <div className="space-y-5">
      {/* Workflow Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Creep Test Under Constant Load (Clause A.4.11.1)
          </h2>
          <span className="text-[11px] text-slate-500">
            Record initial indication and time-series observations. Check 30-minute evaluation to terminate early or continue.
          </span>
        </div>

        <button
          type="button"
          onClick={handleAddMeasurement}
          className="inline-flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900 font-semibold px-2.5 py-1 rounded bg-blue-50 border border-blue-200"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add Measurement</span>
        </button>
      </div>

      {/* 30-MINUTE EARLY TERMINATION EVALUATION CARD */}
      <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/70 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              30-Minute Early Termination Evaluation
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">Clause A.4.11.1</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-white p-3 rounded border border-slate-200 space-y-1">
            <span className="text-slate-500 block text-[11px]">Creep Drift (0 to 30 min):</span>
            <div className="flex items-baseline justify-between font-mono">
              <span className="text-base font-bold text-slate-900">
                {drift0_30 !== null ? `${drift0_30} ${unit}` : 'Pending 30 min'}
              </span>
              <span className="text-slate-500 text-xs">Limit: ≤ {limit0_30} {unit} (0.5e)</span>
            </div>
          </div>

          <div className="bg-white p-3 rounded border border-slate-200 space-y-1">
            <span className="text-slate-500 block text-[11px]">Creep Drift (15 to 30 min):</span>
            <div className="flex items-baseline justify-between font-mono">
              <span className="text-base font-bold text-slate-900">
                {drift15_30 !== null ? `${drift15_30} ${unit}` : 'Pending 15/30 min'}
              </span>
              <span className="text-slate-500 text-xs">Limit: ≤ {limit15_30} {unit} (0.2e)</span>
            </div>
          </div>
        </div>

        {/* Decision Banner */}
        {drift0_30 !== null && drift15_30 !== null ? (
          isEarlyTermQualified ? (
            <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded text-xs text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>30-Minute Early Termination SATISFIED:</strong> ΔP(0-30m) ≤ 0.5e and ΔP(15-30m) ≤ 0.2e. Test may be concluded at 30 minutes without continuing to 4 hours.
              </span>
            </div>
          ) : (
            <div className="p-2.5 bg-amber-50 border border-amber-300 rounded text-xs text-amber-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Early Termination Not Satisfied:</strong> Measured creep exceeds 30-minute limits. Continue observations towards full duration (4 hours).
              </span>
            </div>
          )
        ) : (
          <div className="text-[11px] text-slate-500 italic">
            Observations at 15 min and 30 min required to evaluate early termination criteria.
          </div>
        )}
      </div>

      {/* Observations Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
        <table className="w-full text-xs text-left border-collapse table-auto">
          <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-2 px-1 w-8 text-center text-slate-500 whitespace-nowrap">#</th>
              <th className="py-2 px-1 text-center whitespace-nowrap min-w-[70px]">
                <div>Applied L</div>
                <div className="text-[10px] text-slate-400 font-normal">({unit})</div>
              </th>
              <th className="py-2 px-1 text-center whitespace-nowrap min-w-[55px]">
                <div>Elapsed</div>
                <div className="text-[10px] text-slate-400 font-normal">(min)</div>
              </th>
              <th className="py-2 px-1 text-center whitespace-nowrap min-w-[70px]">
                <div>Indication</div>
                <div className="text-[10px] text-slate-400 font-normal">({unit})</div>
              </th>
              <th className="py-2 px-1 text-center whitespace-nowrap min-w-[55px]">
                <div>Extra ΔL</div>
                <div className="text-[10px] text-slate-400 font-normal">({unit})</div>
              </th>
              <th className="py-2 px-1 text-center whitespace-nowrap min-w-[55px]">
                <div>Temp</div>
                <div className="text-[10px] text-slate-400 font-normal">(°C)</div>
              </th>
              <th className="py-2 px-1 text-center bg-slate-100/70 text-slate-600 whitespace-nowrap min-w-[65px]">
                <div>P (Calc)</div>
                <div className="text-[10px] text-slate-400 font-normal">({unit})</div>
              </th>
              <th className="py-2 px-1 text-center bg-slate-100/70 text-slate-600 whitespace-nowrap min-w-[70px]">
                <div>Drift |P-P₀|</div>
                <div className="text-[10px] text-slate-400 font-normal">({unit})</div>
              </th>
              <th className="py-2 px-1 w-16 min-w-[55px] text-center whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white font-mono">
            {observations.map((row, idx) => {
              const isInvalid = Boolean(row.isInvalidated);
              const ind = Number(row.indication) || 0;
              const dl = Number(row.deltaL) || 0;
              const P = ind + 0.5 * eVal - dl;
              const drift = Math.round(Math.abs(P - initialP) * 10000) / 10000;

              return (
                <tr
                  key={idx}
                  className={`hover:bg-slate-50 transition-colors ${
                    isInvalid ? 'bg-rose-50/60 opacity-60' : ''
                  }`}
                >
                  <td className="py-1 px-1 text-center text-slate-400 font-sans">
                    {idx === 0 ? 'P₀' : `#${idx + 1}`}
                    {isInvalid && <span className="block text-[8px] text-red-600 font-bold uppercase">Invalid</span>}
                  </td>

                  {/* Load */}
                  <td className="py-1 px-1">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={row.load !== undefined && row.load !== null ? String(row.load) : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
                          handleCellChange(idx, 'load', val);
                        }
                      }}
                      disabled={isInvalid}
                      placeholder={String(maxCapacity)}
                      className="w-full h-7.5 px-1.5 py-0.5 text-xs border border-slate-200 rounded font-mono text-slate-900 bg-white shadow-2xs hover:border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20 disabled:bg-slate-100"
                    />
                  </td>

                  {/* Elapsed Time */}
                  <td className="py-1 px-1">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={row.elapsedMinutes !== undefined && row.elapsedMinutes !== null ? String(row.elapsedMinutes) : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
                          handleCellChange(idx, 'elapsedMinutes', val);
                        }
                      }}
                      disabled={isInvalid}
                      placeholder={String(idx * 5)}
                      className="w-full h-7.5 px-1.5 py-0.5 text-xs border border-slate-200 rounded font-mono text-slate-900 bg-white shadow-2xs hover:border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20 disabled:bg-slate-100"
                    />
                  </td>

                  {/* Indication */}
                  <td className="py-1 px-1">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={row.indication !== undefined && row.indication !== null ? String(row.indication) : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
                          handleCellChange(idx, 'indication', val);
                        }
                      }}
                      disabled={isInvalid}
                      placeholder="0.0"
                      className="w-full h-7.5 px-1.5 py-0.5 text-xs border border-slate-200 rounded font-mono text-slate-900 bg-white shadow-2xs hover:border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20 disabled:bg-slate-100"
                    />
                  </td>

                  {/* ΔL */}
                  <td className="py-1 px-1">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={row.deltaL !== undefined && row.deltaL !== null ? String(row.deltaL) : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
                          handleCellChange(idx, 'deltaL', val);
                        }
                      }}
                      disabled={isInvalid}
                      placeholder="0.0"
                      className="w-full h-7.5 px-1.5 py-0.5 text-xs border border-slate-200 rounded font-mono text-slate-900 bg-white shadow-2xs hover:border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20 disabled:bg-slate-100"
                    />
                  </td>

                  {/* Temp */}
                  <td className="py-1 px-1">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={row.temperatureC !== undefined && row.temperatureC !== null ? String(row.temperatureC) : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
                          handleCellChange(idx, 'temperatureC', val);
                        }
                      }}
                      disabled={isInvalid}
                      placeholder="20.0"
                      className="w-full h-7.5 px-1.5 py-0.5 text-xs border border-slate-200 rounded font-mono text-slate-900 bg-white shadow-2xs hover:border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20 disabled:bg-slate-100"
                    />
                  </td>

                  {/* Calculated P */}
                  <td className="py-1 px-1 text-center bg-slate-50/70 text-slate-700 text-xs">
                    {P.toFixed(eVal < 0.1 ? 3 : 2)}
                  </td>

                  {/* Drift |P - P0| */}
                  <td className="py-1 px-1 text-center bg-slate-50/70 text-slate-800 text-xs font-semibold">
                    {idx === 0 ? '0.00' : drift.toFixed(eVal < 0.1 ? 3 : 2)}
                  </td>

                  {/* Actions */}
                  <td className="py-1 px-1 text-center">
                    <div className="flex items-center justify-center gap-1 font-sans">
                      <button
                        type="button"
                        onClick={() => onOpenCorrection(idx, 'indication', row.indication)}
                        className="text-slate-500 hover:text-blue-700 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Correct observation"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenInvalidate(idx)}
                        className="text-slate-500 hover:text-amber-700 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Mark observation invalid"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>

                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(idx)}
                          className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Delete reading"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
