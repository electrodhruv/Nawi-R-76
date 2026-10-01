'use client';

import React from 'react';
import { Plus, Trash2, Edit3, XCircle } from 'lucide-react';
import { getTable6MpeValue } from '@/core/test-engine/interpreters/calculation-interpreter';
import { AccuracyClass } from '@/core/types/metrology';

interface TareViewProps {
  observations: Record<string, unknown>[];
  unit: string;
  eVal: number;
  accuracyClass: AccuracyClass;
  maxCapacity: number;
  onUpdateObservations: (nextObs: Record<string, unknown>[]) => void;
  onOpenCorrection: (rowIndex: number, fieldKey: string, currentVal: unknown) => void;
  onOpenInvalidate: (rowIndex: number) => void;
}

export const TareView: React.FC<TareViewProps> = ({
  observations,
  unit,
  eVal,
  accuracyClass,
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

  const handleAddRow = () => {
    const next = [
      ...observations,
      {
        tareLoad: '',
        netLoad: '',
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Tare Device Weighing Records (Clause 4.6, A.4.5)
          </h2>
          <span className="text-[11px] text-slate-500">
            Weighing performance with tare balancing/subtraction. Net indication error must be within applicable MPE for the net load.
          </span>
        </div>

        <button
          type="button"
          onClick={handleAddRow}
          className="inline-flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900 font-semibold px-2.5 py-1 rounded bg-blue-50 border border-blue-200"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Tare Step</span>
        </button>
      </div>

      <div className="border border-slate-200 rounded-xl shadow-2xs bg-white overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse table-auto">
          <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-2 px-1.5 w-7 text-center whitespace-nowrap text-slate-500">#</th>
              <th className="py-2 px-1 text-center font-semibold text-slate-700 min-w-[75px]">
                Tare Load T
                <span className="block text-[9px] text-slate-400 font-normal leading-none mt-0.5">({unit})</span>
              </th>
              <th className="py-2 px-1 text-center font-semibold text-slate-700 min-w-[75px]">
                Net Load L_net
                <span className="block text-[9px] text-slate-400 font-normal leading-none mt-0.5">({unit})</span>
              </th>
              <th className="py-2 px-1 text-center font-semibold text-slate-700 min-w-[75px]">
                Net Indication I
                <span className="block text-[9px] text-slate-400 font-normal leading-none mt-0.5">({unit})</span>
              </th>
              <th className="py-2 px-1 text-center font-semibold text-slate-700 min-w-[55px]">
                ΔL
                <span className="block text-[9px] text-slate-400 font-normal leading-none mt-0.5">({unit})</span>
              </th>
              <th className="py-2 px-1 text-center font-semibold bg-slate-100/70 text-slate-600 min-w-[65px]">
                P_net (Calc)
                <span className="block text-[9px] font-normal leading-none mt-0.5">({unit})</span>
              </th>
              <th className="py-2 px-1 text-center font-semibold bg-slate-100/70 text-slate-600 min-w-[65px]">
                Error E_net
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
            {observations.map((row, idx) => {
              const isInvalid = Boolean(row.isInvalidated);
              const tareL = Number(row.tareLoad ?? row.tareValue) || 0;
              const isInputComplete = row.netLoad !== '' && row.netLoad !== undefined && row.netLoad !== null &&
                                      row.indication !== '' && row.indication !== undefined && row.indication !== null;
              const netL = Number(row.netLoad ?? row.load) || 0;
              const netInd = Number(row.indication ?? row.netIndication) || 0;
              const dl = Number(row.deltaL) || 0;

              // Calculated values (Read-Only Preview)
              const P = netInd + 0.5 * eVal - dl;
              const E = P - netL;
              const mpe = getTable6MpeValue(accuracyClass, netL, eVal);
              const isPointPass = isInputComplete ? Math.abs(E) <= mpe + 1e-9 : false;

              return (
                <tr
                  key={idx}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    isInvalid ? 'bg-rose-50/60 opacity-60' : ''
                  }`}
                >
                  <td className="py-1.5 px-1.5 text-center text-slate-400 font-sans text-xs">
                    <span className="font-semibold">{idx + 1}</span>
                    {isInvalid && <span className="block text-[8px] text-red-600 font-bold uppercase">Invalid</span>}
                  </td>

                  {/* Tare Load */}
                  <td className="py-1.5 px-1">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={row.tareLoad !== undefined ? String(row.tareLoad) : row.tareValue !== undefined ? String(row.tareValue) : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
                          handleCellChange(idx, 'tareLoad', val);
                        }
                      }}
                      disabled={isInvalid}
                      placeholder="0.0"
                      className="w-full h-7.5 px-1 py-0.5 text-xs text-center border border-slate-200 rounded font-mono text-slate-900 bg-white hover:border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400"
                    />
                  </td>

                  {/* Net Load */}
                  <td className="py-1.5 px-1">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={row.netLoad !== undefined ? String(row.netLoad) : row.load !== undefined ? String(row.load) : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
                          handleCellChange(idx, 'netLoad', val);
                        }
                      }}
                      disabled={isInvalid}
                      placeholder="0.0"
                      className="w-full h-7.5 px-1 py-0.5 text-xs text-center border border-slate-200 rounded font-mono text-slate-900 bg-white hover:border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400"
                    />
                  </td>

                  {/* Net Indication */}
                  <td className="py-1.5 px-1">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={row.indication !== undefined ? String(row.indication) : row.netIndication !== undefined ? String(row.netIndication) : ''}
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

                  {/* Calculated P_net */}
                  <td className="py-1.5 px-1 text-center bg-slate-50/70 text-slate-700 text-xs font-mono">
                    {isInputComplete ? P.toFixed(eVal < 0.1 ? 3 : 2) : '—'}
                  </td>

                  {/* Calculated Error E_net */}
                  <td className={`py-1.5 px-1 text-center bg-slate-50/70 text-xs font-mono font-semibold ${
                    !isInputComplete ? 'text-slate-400' : isPointPass ? 'text-slate-800' : 'text-red-700'
                  }`}>
                    {isInputComplete ? (E > 0 ? `+${E.toFixed(eVal < 0.1 ? 3 : 2)}` : E.toFixed(eVal < 0.1 ? 3 : 2)) : '—'}
                  </td>

                  {/* MPE(L_net) */}
                  <td className="py-1.5 px-1 text-center bg-slate-50/70 text-slate-600 text-xs font-mono">
                    ±{mpe.toFixed(eVal < 0.1 ? 3 : 2)}
                  </td>

                  {/* Status */}
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

                    <button
                      type="button"
                      onClick={() => handleDeleteRow(idx)}
                      className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Delete observation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
