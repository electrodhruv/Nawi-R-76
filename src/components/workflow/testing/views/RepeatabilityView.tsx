'use client';

import React from 'react';
import { Plus, Trash2, Edit3, XCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { getTable6MpeValue } from '@/core/test-engine/interpreters/calculation-interpreter';
import { AccuracyClass } from '@/core/types/metrology';

interface RepeatabilityViewProps {
  observations: Record<string, unknown>[];
  unit: string;
  eVal: number;
  accuracyClass: AccuracyClass;
  maxCapacity: number;
  onUpdateObservations: (nextObs: Record<string, unknown>[]) => void;
  onOpenCorrection: (rowIndex: number, fieldKey: string, currentVal: unknown) => void;
  onOpenInvalidate: (rowIndex: number) => void;
}

export const RepeatabilityView: React.FC<RepeatabilityViewProps> = ({
  observations,
  unit,
  eVal,
  accuracyClass,
  maxCapacity,
  onUpdateObservations,
  onOpenCorrection,
  onOpenInvalidate,
}) => {
  const halfMax = Math.round(maxCapacity * 0.5 * 1000) / 1000;
  const fullMax = maxCapacity;

  // Split into series 1 and series 2
  const s1Indices: number[] = [];
  const s2Indices: number[] = [];

  observations.forEach((obs, idx) => {
    const s = String(obs.series || '');
    if (s === 'SERIES_1' || s === 'Series 1' || s === 'series1') {
      s1Indices.push(idx);
    } else if (s === 'SERIES_2' || s === 'Series 2' || s === 'series2') {
      s2Indices.push(idx);
    } else if (idx < Math.ceil(observations.length / 2)) {
      s1Indices.push(idx);
    } else {
      s2Indices.push(idx);
    }
  });

  const handleCellChange = (origIdx: number, fieldKey: string, val: unknown) => {
    const next = [...observations];
    next[origIdx] = { ...next[origIdx], [fieldKey]: val };
    onUpdateObservations(next);
  };

  const handleAddWeighing = (seriesKey: 'SERIES_1' | 'SERIES_2', nominalLoad: number) => {
    const next = [
      ...observations,
      {
        series: seriesKey,
        weighingNumber: (seriesKey === 'SERIES_1' ? s1Indices.length : s2Indices.length) + 1,
        load: nominalLoad,
        indication: '',
        deltaL: '',
      },
    ];
    onUpdateObservations(next);
  };

  const handleDeleteWeighing = (origIdx: number) => {
    const next = observations.filter((_, i) => i !== origIdx);
    onUpdateObservations(next);
  };

  // Helper to compute metrics for a series
  const computeSeriesMetrics = (indices: number[], nominalLoad: number) => {
    const validRows = indices
      .map((idx) => ({ obs: observations[idx], origIdx: idx }))
      .filter((item) => !item.obs.isInvalidated);

    if (validRows.length === 0) {
      return {
        rows: [],
        maxE: 0,
        minE: 0,
        span: 0,
        mpe: getTable6MpeValue(accuracyClass, nominalLoad, eVal),
        isPass: false,
        count: 0,
      };
    }

    const rows = validRows.map((item, relIdx) => {
      const load = Number(item.obs.load) || nominalLoad;
      const ind = Number(item.obs.indication) || 0;
      const dl = Number(item.obs.deltaL) || 0;
      const P = ind + 0.5 * eVal - dl;
      const E = P - load;
      return {
        origIdx: item.origIdx,
        weighingNum: relIdx + 1,
        load,
        indication: ind,
        deltaL: dl,
        calculated_P: P,
        error_E: E,
        obs: item.obs,
      };
    });

    const errors = rows.map((r) => r.error_E);
    const maxE = Math.max(...errors);
    const minE = Math.min(...errors);
    const span = Math.round(Math.abs(maxE - minE) * 10000) / 10000;
    const mpe = getTable6MpeValue(accuracyClass, nominalLoad, eVal);
    const isPass = span <= mpe + 1e-9;

    return { rows, maxE, minE, span, mpe, isPass, count: rows.length };
  };

  const s1Metrics = computeSeriesMetrics(s1Indices, halfMax);
  const s2Metrics = computeSeriesMetrics(s2Indices, fullMax);

  const renderSeriesTable = (
    seriesTitle: string,
    seriesSub: string,
    seriesKey: 'SERIES_1' | 'SERIES_2',
    nominalLoad: number,
    indices: number[],
    metrics: ReturnType<typeof computeSeriesMetrics>,
    themeColor: 'blue' | 'indigo'
  ) => {
    const isBlue = themeColor === 'blue';
    const borderAccent = isBlue ? 'border-blue-200' : 'border-indigo-200';
    const bgHeader = isBlue ? 'bg-blue-50/70 text-blue-900' : 'bg-indigo-50/70 text-indigo-900';
    const pillBorder = isBlue ? 'border-blue-300' : 'border-indigo-300';

    return (
      <div className={`border ${borderAccent} rounded-lg overflow-hidden bg-white shadow-2xs space-y-0`}>
        {/* Series Header & Metric Banner */}
        <div className={`p-3.5 border-b ${borderAccent} ${bgHeader} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
          <div>
            <div className="font-bold text-sm flex items-center gap-2">
              <span>{seriesTitle}</span>
              <span className={`text-[11px] px-2 py-0.5 rounded font-mono font-medium border ${pillBorder} bg-white/80`}>
                Nominal: {nominalLoad} {unit}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">{seriesSub}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="bg-white/90 px-2.5 py-1 rounded border border-slate-200 text-slate-700">
              Span: <strong className={metrics.isPass ? 'text-slate-900' : 'text-red-700'}>{metrics.span.toFixed(eVal < 0.1 ? 3 : 2)} {unit}</strong>
            </span>
            <span className="bg-white/90 px-2.5 py-1 rounded border border-slate-200 text-slate-600">
              |MPE|: <strong>±{metrics.mpe.toFixed(eVal < 0.1 ? 3 : 2)} {unit}</strong>
            </span>
            <span className="inline-flex items-center gap-1 font-sans font-bold px-2.5 py-1 rounded text-xs">
              {metrics.isPass ? (
                <span className="text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  PASS
                </span>
              ) : (
                <span className="text-red-800 bg-red-100 border border-red-300 px-2 py-0.5 rounded flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                  FAIL
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Table of Observations */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse table-auto">
            <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2 px-1 w-8 text-center text-slate-500 whitespace-nowrap">#</th>
                <th className="py-2 px-1 text-center font-semibold text-slate-700 min-w-[75px]">
                  <div>Applied L</div>
                  <div className="text-[10px] text-slate-400 font-normal">({unit})</div>
                </th>
                <th className="py-2 px-1 text-center font-semibold text-slate-700 min-w-[75px]">
                  <div>Indication I</div>
                  <div className="text-[10px] text-slate-400 font-normal">({unit})</div>
                </th>
                <th className="py-2 px-1 text-center font-semibold text-slate-700 min-w-[60px]">
                  <div>Extra ΔL</div>
                  <div className="text-[10px] text-slate-400 font-normal">({unit})</div>
                </th>
                <th className="py-2 px-1 text-center font-semibold bg-slate-100/70 text-slate-600 min-w-[65px]">
                  <div>P (Calc)</div>
                  <div className="text-[10px] text-slate-400 font-normal">({unit})</div>
                </th>
                <th className="py-2 px-1 text-center font-semibold bg-slate-100/70 text-slate-600 min-w-[65px]">
                  <div>Error E</div>
                  <div className="text-[10px] text-slate-400 font-normal">({unit})</div>
                </th>
                <th className="py-2 px-1 text-center font-semibold text-slate-700 w-16 min-w-[55px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white font-mono">
              {indices.map((origIdx, localIdx) => {
                const obs = observations[origIdx];
                const isInvalid = Boolean(obs.isInvalidated);
                const load = Number(obs.load) || nominalLoad;
                const ind = Number(obs.indication) || 0;
                const dl = Number(obs.deltaL) || 0;
                const P = ind + 0.5 * eVal - dl;
                const E = P - load;

                return (
                  <tr
                    key={origIdx}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isInvalid ? 'bg-rose-50/60 opacity-60' : ''
                    }`}
                  >
                    <td className="py-1 px-1 text-center text-slate-500 font-sans font-medium">
                      #{localIdx + 1}
                      {isInvalid && <span className="block text-[8px] text-red-600 font-bold uppercase">Invalid</span>}
                    </td>

                    {/* Load */}
                    <td className="py-1 px-1">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={obs.load !== undefined && obs.load !== null ? String(obs.load) : ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
                            handleCellChange(origIdx, 'load', val);
                          }
                        }}
                        disabled={isInvalid}
                        placeholder={String(nominalLoad)}
                        className="w-full h-7.5 px-2 py-0.5 text-xs border border-slate-200 rounded font-mono text-slate-900 bg-white shadow-2xs hover:border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400"
                      />
                    </td>

                    {/* Indication */}
                    <td className="py-1 px-1">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={obs.indication !== undefined && obs.indication !== null ? String(obs.indication) : ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
                            handleCellChange(origIdx, 'indication', val);
                          }
                        }}
                        disabled={isInvalid}
                        placeholder="0.0"
                        className="w-full h-7.5 px-2 py-0.5 text-xs border border-slate-200 rounded font-mono text-slate-900 bg-white shadow-2xs hover:border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400"
                      />
                    </td>

                    {/* ΔL */}
                    <td className="py-1 px-1">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={obs.deltaL !== undefined && obs.deltaL !== null ? String(obs.deltaL) : ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
                            handleCellChange(origIdx, 'deltaL', val);
                          }
                        }}
                        disabled={isInvalid}
                        placeholder="0.0"
                        className="w-full h-7.5 px-2 py-0.5 text-xs border border-slate-200 rounded font-mono text-slate-900 bg-white shadow-2xs hover:border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400"
                      />
                    </td>

                    {/* Calculated P */}
                    <td className="py-1 px-1 text-center bg-slate-50/70 text-slate-700 text-xs">
                      {P.toFixed(eVal < 0.1 ? 3 : 2)}
                    </td>

                    {/* Calculated Error E */}
                    <td className="py-1 px-1 text-center bg-slate-50/70 text-slate-800 text-xs font-semibold">
                      {E > 0 ? `+${E.toFixed(eVal < 0.1 ? 3 : 2)}` : E.toFixed(eVal < 0.1 ? 3 : 2)}
                    </td>

                    {/* Actions */}
                    <td className="py-1 px-1 text-center">
                      <div className="flex items-center justify-center gap-1 font-sans">
                        <button
                          type="button"
                          onClick={() => onOpenCorrection(origIdx, 'indication', obs.indication)}
                          className="text-slate-500 hover:text-blue-700 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Correct observation"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenInvalidate(origIdx)}
                          className="text-slate-500 hover:text-amber-700 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Mark observation invalid"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteWeighing(origIdx)}
                          className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Delete weighing"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Series Footer: Add button & Summary Stats */}
        <div className="p-2.5 bg-slate-50/60 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <button
            type="button"
            onClick={() => handleAddWeighing(seriesKey, nominalLoad)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 px-2 py-1 rounded bg-white border border-slate-200 hover:bg-slate-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Weighing to {seriesTitle}</span>
          </button>

          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-3">
            <span>Emax: <strong>{metrics.maxE.toFixed(eVal < 0.1 ? 3 : 2)}</strong></span>
            <span>Emin: <strong>{metrics.minE.toFixed(eVal < 0.1 ? 3 : 2)}</strong></span>
            <span>Span (Emax - Emin): <strong className={metrics.isPass ? 'text-slate-800' : 'text-red-700'}>{metrics.span.toFixed(eVal < 0.1 ? 3 : 2)}</strong></span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Repeatability Series Records (Clause A.4.10)
          </h2>
          <span className="text-[11px] text-slate-500">
            Two distinct series of consecutive weighings at ~50% Max and ~100% Max. Repeatability span (Emax - Emin) must not exceed |MPE|.
          </span>
        </div>
      </div>

      {/* SERIES 1: ~50% Max */}
      {renderSeriesTable(
        'Series 1 (~50% Max)',
        'Consecutive identical loadings at approximately 50% Max',
        'SERIES_1',
        halfMax,
        s1Indices,
        s1Metrics,
        'blue'
      )}

      {/* SERIES 2: ~100% Max */}
      {renderSeriesTable(
        'Series 2 (~100% Max)',
        'Consecutive identical loadings at approximately 100% Max',
        'SERIES_2',
        fullMax,
        s2Indices,
        s2Metrics,
        'indigo'
      )}
    </div>
  );
};
