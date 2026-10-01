'use client';

import React from 'react';
import { Plus, Trash2, Edit3, XCircle } from 'lucide-react';

interface SpanStabilityViewProps {
  observations: Record<string, unknown>[];
  unit: string;
  eVal: number;
  maxCapacity: number;
  targetCount?: number;
  onUpdateObservations: (nextObs: Record<string, unknown>[]) => void;
  onOpenCorrection: (rowIndex: number, fieldKey: string, currentVal: unknown) => void;
  onOpenInvalidate: (rowIndex: number) => void;
}

export const SpanStabilityView: React.FC<SpanStabilityViewProps> = ({
  observations,
  unit,
  eVal,
  maxCapacity,
  targetCount = 8,
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
    const newIdx = observations.length + 1;
    const lastDays = observations.length > 0
      ? Number(observations[observations.length - 1].elapsedDays) || 0
      : 0;

    const next = [
      ...observations,
      {
        runIndex: newIdx,
        recordedDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
        elapsedDays: lastDays + (newIdx === 2 ? 0.5 : 3),
        load: maxCapacity,
        indication: maxCapacity,
        deltaL: Math.round(eVal * 0.5 * 1000) / 1000,
        temperatureC: 20.4,
        humidityPercent: 48,
        pressureHpa: 1013,
      },
    ];
    onUpdateObservations(next);
  };

  const handleDeleteRow = (index: number) => {
    const next = observations.filter((_, i) => i !== index);
    onUpdateObservations(next);
  };

  // Base measurement #1 span reference
  const firstRow = observations[0];
  const baseP = firstRow
    ? Number(firstRow.indication || 0) + 0.5 * eVal - Number(firstRow.deltaL || 0)
    : 0;
  const baseL = firstRow ? Number(firstRow.load || maxCapacity) : maxCapacity;
  const baseSpan = baseP - baseL;

  const validCount = observations.filter((o) => !o.isInvalidated).length;
  const progressPercent = Math.min(100, Math.round((validCount / targetCount) * 100));

  return (
    <div className="space-y-4">
      {/* Progress Counter & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 border border-slate-200 rounded-lg shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Span Stability Time Series (Clause 3.9.5, Annex B.4)
            </h2>
            <span className="text-[11px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold font-mono">
              Measurements: {validCount} / {targetCount}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Periodic measurements over 28 days under variable laboratory ambient conditions. Span variation relative to initial measurement must not exceed 0.5e ({eVal * 0.5} {unit}).
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddMeasurement}
          className="inline-flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900 font-semibold px-3 py-1.5 rounded bg-blue-50 border border-blue-200 shrink-0 self-start sm:self-center"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add Measurement</span>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
        <div
          className="bg-blue-600 h-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Measurements Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
        <table className="w-full text-xs text-left border-collapse table-auto">
          <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-2 px-1 w-8 text-center text-slate-500 whitespace-nowrap">#</th>
              <th className="py-2 px-1 text-center whitespace-nowrap min-w-[75px]">Date</th>
              <th className="py-2 px-1 text-center whitespace-nowrap min-w-[50px]">
                <div>Days</div>
                <div className="text-[10px] text-slate-400 font-normal">(d)</div>
              </th>
              <th className="py-2 px-1 text-center whitespace-nowrap min-w-[65px]">
                <div>Ref Load</div>
                <div className="text-[10px] text-slate-400 font-normal">({unit})</div>
              </th>
              <th className="py-2 px-1 text-center whitespace-nowrap min-w-[65px]">
                <div>Indication</div>
                <div className="text-[10px] text-slate-400 font-normal">({unit})</div>
              </th>
              <th className="py-2 px-1 text-center whitespace-nowrap min-w-[55px]">
                <div>Extra ΔL</div>
                <div className="text-[10px] text-slate-400 font-normal">({unit})</div>
              </th>
              <th className="py-2 px-1 text-center whitespace-nowrap min-w-[50px]">
                <div>Temp</div>
                <div className="text-[10px] text-slate-400 font-normal">(°C)</div>
              </th>
              <th className="py-2 px-1 text-center whitespace-nowrap min-w-[45px]">
                <div>RH</div>
                <div className="text-[10px] text-slate-400 font-normal">(%)</div>
              </th>
              <th className="py-2 px-1 text-center whitespace-nowrap min-w-[55px]">
                <div>Press</div>
                <div className="text-[10px] text-slate-400 font-normal">(hPa)</div>
              </th>
              <th className="py-2 px-1 text-center bg-slate-100/70 text-slate-600 whitespace-nowrap min-w-[55px]">
                <div>Drift</div>
                <div className="text-[10px] text-slate-400 font-normal">({unit})</div>
              </th>
              <th className="py-2 px-1 bg-slate-100/70 text-center text-slate-600 whitespace-nowrap min-w-[50px]">
                Status
              </th>
              <th className="py-2 px-1 w-16 min-w-[55px] text-center whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-mono">
            {observations.map((row, idx) => {
              const isInvalid = Boolean(row.isInvalidated);
              const loadNum = Number(row.load) || maxCapacity;
              const indNum = Number(row.indication) || 0;
              const dlNum = Number(row.deltaL) || 0;

              const P = indNum + 0.5 * eVal - dlNum;
              const span = P - loadNum;
              const drift = Math.round(Math.abs(span - baseSpan) * 10000) / 10000;
              const limit = eVal * 0.5;
              const isPointPass = idx === 0 || drift <= limit + 1e-9;

              return (
                <tr
                  key={idx}
                  className={`hover:bg-slate-50 transition-colors ${
                    isInvalid ? 'bg-rose-50/60 opacity-60' : ''
                  }`}
                >
                  <td className="py-1 px-1 text-center text-slate-400 font-sans">
                    #{idx + 1}
                    {isInvalid && <span className="block text-[8px] text-red-600 font-bold uppercase">Invalid</span>}
                  </td>

                  {/* Date */}
                  <td className="py-1 px-1">
                    <input
                      type="text"
                      value={String(row.recordedDate || '')}
                      onChange={(e) => handleCellChange(idx, 'recordedDate', e.target.value)}
                      disabled={isInvalid}
                      className="w-full h-7.5 px-1 py-0.5 text-xs border border-slate-200 rounded font-mono text-slate-800 focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20 disabled:bg-slate-100"
                    />
                  </td>

                  {/* Elapsed Days */}
                  <td className="py-1 px-1">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={row.elapsedDays !== undefined ? String(row.elapsedDays) : String(idx * 3)}
                      onChange={(e) => handleCellChange(idx, 'elapsedDays', parseFloat(e.target.value) || 0)}
                      disabled={isInvalid}
                      className="w-full h-7.5 px-1 py-0.5 text-xs border border-slate-200 rounded font-mono text-slate-800 focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20 disabled:bg-slate-100"
                    />
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
                      className="w-full h-7.5 px-1.5 py-0.5 text-xs border border-slate-200 rounded font-mono text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20 disabled:bg-slate-100"
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
                      className="w-full h-7.5 px-1.5 py-0.5 text-xs border border-slate-200 rounded font-mono text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20 disabled:bg-slate-100"
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
                      className="w-full h-7.5 px-1.5 py-0.5 text-xs border border-slate-200 rounded font-mono text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20 disabled:bg-slate-100"
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
                      className="w-full h-7.5 px-1 py-0.5 text-xs border border-slate-200 rounded font-mono text-slate-800 disabled:bg-slate-100"
                    />
                  </td>

                  {/* RH */}
                  <td className="py-1 px-1">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={row.humidityPercent !== undefined && row.humidityPercent !== null ? String(row.humidityPercent) : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
                          handleCellChange(idx, 'humidityPercent', val);
                        }
                      }}
                      disabled={isInvalid}
                      placeholder="50"
                      className="w-full h-7.5 px-1 py-0.5 text-xs border border-slate-200 rounded font-mono text-slate-800 disabled:bg-slate-100"
                    />
                  </td>

                  {/* Pressure */}
                  <td className="py-1 px-1">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={row.pressureHpa !== undefined && row.pressureHpa !== null ? String(row.pressureHpa) : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
                          handleCellChange(idx, 'pressureHpa', val);
                        }
                      }}
                      disabled={isInvalid}
                      placeholder="1013"
                      className="w-full h-7.5 px-1 py-0.5 text-xs border border-slate-200 rounded font-mono text-slate-800 disabled:bg-slate-100"
                    />
                  </td>

                  {/* Span Drift */}
                  <td className={`py-1 px-1 text-center bg-slate-50/70 text-xs font-semibold ${
                    isPointPass ? 'text-slate-800' : 'text-red-700'
                  }`}>
                    {idx === 0 ? 'Datum' : `${drift.toFixed(eVal < 0.1 ? 3 : 2)}`}
                  </td>

                  {/* Status */}
                  <td className="py-1 px-1 bg-slate-50/70 text-center font-sans font-bold text-[10px]">
                    {isPointPass ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                        PASS
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
                        FAIL
                      </span>
                    )}
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
                          title="Delete measurement"
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
