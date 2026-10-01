'use client';

import React from 'react';
import { Plus, Trash2, Edit3, XCircle } from 'lucide-react';
import { getTable6MpeValue } from '@/core/test-engine/interpreters/calculation-interpreter';
import { AccuracyClass } from '@/core/types/metrology';

interface WeighingPerformanceViewProps {
  observations: Record<string, unknown>[];
  unit: string;
  eVal: number;
  accuracyClass: AccuracyClass;
  maxCapacity: number;
  onUpdateObservations: (nextObs: Record<string, unknown>[]) => void;
  onOpenCorrection: (rowIndex: number, fieldKey: string, currentVal: unknown) => void;
  onOpenInvalidate: (rowIndex: number) => void;
  allowAddRows?: boolean;
  allowDeleteRows?: boolean;
}

export const WeighingPerformanceView: React.FC<WeighingPerformanceViewProps> = ({
  observations,
  unit,
  eVal,
  accuracyClass,
  maxCapacity,
  onUpdateObservations,
  onOpenCorrection,
  onOpenInvalidate,
  allowAddRows = true,
  allowDeleteRows = true,
}) => {
  const handleCellChange = (index: number, key: string, val: unknown) => {
    const next = [...observations];
    next[index] = { ...next[index], [key]: val };
    onUpdateObservations(next);
  };

  const handleAddRow = (direction: 'INC' | 'DEC' = 'INC') => {
    const next = [
      ...observations,
      {
        direction,
        load: '',
        indication: '',
        deltaL: '',
      },
    ];
    onUpdateObservations(next);
  };

  const handleDeleteRow = (index: number) => {
    const next = observations.filter((_, i) => i !== index);
    onUpdateObservations(next);
  };

  const handleInitializeStandardPoints = () => {
    const halfMax = Math.round(maxCapacity * 0.5 * 1000) / 1000;
    const minCap = Math.round(eVal * 20 * 1000) / 1000;
    const points = [
      { direction: 'INC' as const, load: 0, indication: '', deltaL: '' },
      { direction: 'INC' as const, load: minCap, indication: '', deltaL: '' },
      { direction: 'INC' as const, load: halfMax, indication: '', deltaL: '' },
      { direction: 'INC' as const, load: maxCapacity, indication: '', deltaL: '' },
      { direction: 'DEC' as const, load: halfMax, indication: '', deltaL: '' },
      { direction: 'DEC' as const, load: 0, indication: '', deltaL: '' },
    ];
    onUpdateObservations(points);
  };

  // Find zero error for corrected error Ec calculation
  const zeroRow = observations.find((r) => Number(r.load) === 0 && !r.isInvalidated);
  const zeroP = zeroRow
    ? Number(zeroRow.indication || 0) + 0.5 * eVal - Number(zeroRow.deltaL || 0)
    : 0;
  const zeroE = zeroRow ? zeroP - Number(zeroRow.load || 0) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Raw Operator Observations
          </h2>
          <span className="text-[11px] text-slate-500">
            Enter test load, indicated value, and additional weights (ΔL) for turning point calculation
          </span>
        </div>

        {allowAddRows && (
          <div className="flex items-center gap-1.5">
            {observations.length === 0 && (
              <button
                type="button"
                onClick={handleInitializeStandardPoints}
                className="inline-flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900 font-semibold px-2.5 py-1 rounded bg-blue-50 border border-blue-200 cursor-pointer"
                title="Initialize standard OIML R 76 nominal test load points (Min, 50% Max, Max)"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Initialize 6 OIML Points</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => handleAddRow('INC')}
              className="inline-flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900 font-semibold px-2.5 py-1 rounded bg-blue-50 border border-blue-200"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Ascending Load</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddRow('DEC')}
              className="inline-flex items-center gap-1 text-xs text-slate-700 hover:text-slate-900 font-semibold px-2.5 py-1 rounded bg-slate-100 border border-slate-300"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Descending Load</span>
            </button>
          </div>
        )}
      </div>

      <div className="border border-slate-200 rounded-xl shadow-2xs bg-white overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse table-auto">
          <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-2 px-1.5 w-7 text-center whitespace-nowrap text-slate-500">#</th>
              <th className="py-2 px-1.5 min-w-[85px] whitespace-nowrap">Direction</th>
              <th className="py-2 px-1 text-center font-semibold text-slate-700 min-w-[70px]">
                Load L
                <span className="block text-[9px] text-slate-400 font-normal leading-none mt-0.5">({unit})</span>
              </th>
              <th className="py-2 px-1 text-center font-semibold text-slate-700 min-w-[70px]">
                Indication I
                <span className="block text-[9px] text-slate-400 font-normal leading-none mt-0.5">({unit})</span>
              </th>
              <th className="py-2 px-1 text-center font-semibold text-slate-700 min-w-[55px]">
                ΔL
                <span className="block text-[9px] text-slate-400 font-normal leading-none mt-0.5">({unit})</span>
              </th>
              <th className="py-2 px-1 text-center font-semibold bg-slate-100/70 text-slate-600 min-w-[65px]">
                P (Preview)
                <span className="block text-[9px] font-normal leading-none mt-0.5">({unit})</span>
              </th>
              <th className="py-2 px-1 text-center font-semibold bg-slate-100/70 text-slate-600 min-w-[65px]">
                Ec (Preview)
                <span className="block text-[9px] font-normal leading-none mt-0.5">({unit})</span>
              </th>
              <th className="py-2 px-1 text-center font-semibold bg-slate-100/70 text-slate-600 min-w-[55px]">
                MPE
                <span className="block text-[9px] font-normal leading-none mt-0.5">({unit})</span>
              </th>
              <th className="py-2 px-1 text-center font-semibold bg-slate-100/70 text-slate-600 min-w-[55px]">
                Status
              </th>
              <th className="py-2 px-1 text-center font-semibold text-slate-700 w-16 min-w-[55px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white font-mono">
            {observations.length === 0 && (
              <tr>
                <td colSpan={10} className="py-10 px-4 text-center text-slate-500 bg-slate-50/50">
                  <div className="flex flex-col items-center justify-center gap-2 max-w-md mx-auto font-sans">
                    <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                      <Plus className="w-5 h-5" />
                    </div>
                    <p className="font-bold text-slate-800 text-xs">Fresh Instrument &bull; Clean Observation Workspace</p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      This available instrument has zero prefilled data. You can manually enter test loads or initialize standard OIML R 76-1 test points.
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={handleInitializeStandardPoints}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold shadow-xs transition-colors"
                      >
                        <span>Initialize Standard Load Sequence</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddRow('INC')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-xs font-semibold transition-colors"
                      >
                        <span>Add Single Point</span>
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            )}
            {observations.map((row, idx) => {
              const isInvalid = Boolean(row.isInvalidated);
              const dir = String(row.direction || 'INC').toUpperCase();
              const isInputComplete = row.load !== '' && row.load !== undefined && row.load !== null &&
                                      row.indication !== '' && row.indication !== undefined && row.indication !== null;
              const loadNum = Number(row.load) || 0;
              const indNum = Number(row.indication) || 0;
              const dlNum = Number(row.deltaL) || 0;

              // Read-only calculated values for preview
              const P = indNum + 0.5 * eVal - dlNum;
              const E = P - loadNum;
              const Ec = E - zeroE;
              const mpe = getTable6MpeValue(accuracyClass, loadNum, eVal);
              const isPointPass = isInputComplete ? Math.abs(Ec) <= mpe + 1e-9 : false;

              return (
                <tr
                  key={idx}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    isInvalid ? 'bg-rose-50/60 opacity-60' : ''
                  }`}
                >
                  <td className="py-1.5 px-1.5 text-center text-slate-400 font-sans text-xs">
                    <span className="font-semibold">{idx + 1}</span>
                    {isInvalid && (
                      <span className="block text-[8px] text-red-600 font-bold uppercase">Invalid</span>
                    )}
                  </td>

                  {/* Direction */}
                  <td className="py-1.5 px-1.5">
                    <select
                      value={dir === 'DEC' || dir === 'DESCENDING' ? 'DEC' : 'INC'}
                      onChange={(e) => handleCellChange(idx, 'direction', e.target.value)}
                      disabled={isInvalid}
                      className="w-full h-7.5 px-1.5 py-0.5 text-xs border border-slate-200 rounded font-sans focus:outline-none focus:border-blue-600 bg-white"
                    >
                      <option value="INC">↑ Inc</option>
                      <option value="DEC">↓ Dec</option>
                    </select>
                  </td>

                  {/* Load L */}
                  <td className="py-1.5 px-1">
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
                      placeholder="0.0"
                      className="w-full h-7.5 px-1 py-0.5 text-xs text-center border border-slate-200 rounded font-mono text-slate-900 bg-white hover:border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400"
                    />
                  </td>

                  {/* Indication I */}
                  <td className="py-1.5 px-1">
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
                      className="w-full h-7.5 px-1 py-0.5 text-xs text-center border border-slate-200 rounded font-mono text-slate-900 bg-white hover:border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400"
                    />
                  </td>

                  {/* ΔL */}
                  <td className="py-1.5 px-1">
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
                      className="w-full h-7.5 px-1 py-0.5 text-xs text-center border border-slate-200 rounded font-mono text-slate-900 bg-white hover:border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400"
                    />
                  </td>

                  {/* READ-ONLY: P */}
                  <td className="py-1.5 px-1 text-center bg-slate-50/70 text-slate-700 font-mono text-xs">
                    {isInputComplete ? P.toFixed(eVal < 0.1 ? 3 : 2) : '—'}
                  </td>

                  {/* READ-ONLY: Ec */}
                  <td className={`py-1.5 px-1 text-center bg-slate-50/70 font-mono text-xs font-semibold ${
                    !isInputComplete ? 'text-slate-400' : isPointPass ? 'text-slate-800' : 'text-red-700'
                  }`}>
                    {isInputComplete ? (Ec > 0 ? `+${Ec.toFixed(eVal < 0.1 ? 3 : 2)}` : Ec.toFixed(eVal < 0.1 ? 3 : 2)) : '—'}
                  </td>

                  {/* READ-ONLY: MPE */}
                  <td className="py-1.5 px-1 text-center bg-slate-50/70 text-slate-600 font-mono text-xs">
                    ±{mpe.toFixed(eVal < 0.1 ? 3 : 2)}
                  </td>

                  {/* READ-ONLY: Status */}
                  <td className="py-1.5 px-1 text-center bg-slate-50/70 font-sans font-bold text-[10px]">
                    {!isInputComplete ? (
                      <span className="text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full font-medium">
                        —
                      </span>
                    ) : isPointPass ? (
                      <span className="text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5">
                        PASS
                      </span>
                    ) : (
                      <span className="text-red-700 bg-red-100/80 px-1.5 py-0.5 rounded-full">
                        FAIL
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-1.5 px-2 text-center flex items-center justify-center gap-1 font-sans">
                    <button
                      type="button"
                      onClick={() => onOpenCorrection(idx, 'indication', row.indication)}
                      className="text-slate-500 hover:text-blue-700 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Correct observation (with audit log)"
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

                    {allowDeleteRows && (
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(idx)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Delete row"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
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
