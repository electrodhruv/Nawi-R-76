'use client';

import React from 'react';
import { Plus, Trash2, Edit3, XCircle } from 'lucide-react';

interface DiscriminationViewProps {
  observations: Record<string, unknown>[];
  unit: string;
  dVal: number;
  maxCapacity: number;
  onUpdateObservations: (nextObs: Record<string, unknown>[]) => void;
  onOpenCorrection: (rowIndex: number, fieldKey: string, currentVal: unknown) => void;
  onOpenInvalidate: (rowIndex: number) => void;
}

export const DiscriminationView: React.FC<DiscriminationViewProps> = ({
  observations,
  unit,
  dVal,
  maxCapacity,
  onUpdateObservations,
  onOpenCorrection,
  onOpenInvalidate,
}) => {
  const handleCellChange = (index: number, key: string, val: unknown) => {
    const next = [...observations];
    const current = next[index] || {};
    const updated: Record<string, unknown> = { ...current };

    if (key === 'load') {
      updated.load = val;
      updated.baseLoad = val;
    } else if (key === 'initialIndication') {
      updated.initialIndication = val;
      updated.baseIndication = val;
      updated.indicationBefore = val;
      updated.indication = val;
    } else if (key === 'additionalLoad') {
      updated.additionalLoad = val;
      updated.extraLoad_1_4d = val;
      updated.deltaL = val;
    } else if (key === 'finalIndication') {
      updated.finalIndication = val;
      updated.newIndication = val;
      updated.indicationAfter = val;
    } else {
      updated[key] = val;
    }

    if (!updated.loadPoint) {
      updated.loadPoint = String(current.loadPoint || current.loadPointName || `Point #${index + 1}`);
      updated.loadPointName = updated.loadPoint;
    }

    next[index] = updated;
    onUpdateObservations(next);
  };

  const handleAddRow = () => {
    const next = [
      ...observations,
      {
        loadPoint: `Point #${observations.length + 1}`,
        loadPointName: `Point #${observations.length + 1}`,
        load: '',
        baseLoad: '',
        initialIndication: '',
        baseIndication: '',
        indicationBefore: '',
        indication: '',
        additionalLoad: '',
        extraLoad_1_4d: '',
        deltaL: '',
        finalIndication: '',
        newIndication: '',
        indicationAfter: '',
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
            Discrimination Observations (Clause A.4.8)
          </h2>
          <span className="text-[11px] text-slate-500">
            An additional load equal to 1.4d gently placed on the load receptor must produce an indication change of at least 1d ({dVal} {unit}).
          </span>
        </div>

        <button
          type="button"
          onClick={handleAddRow}
          className="inline-flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900 font-semibold px-2.5 py-1 rounded bg-blue-50 border border-blue-200"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Load Point</span>
        </button>
      </div>

      <div className="border border-slate-200 rounded-xl shadow-2xs bg-white overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse table-auto">
          <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-2 px-1.5 w-7 text-center whitespace-nowrap text-slate-500">#</th>
              <th className="py-2 px-1 text-center font-semibold text-slate-700 min-w-[75px]">
                Test Load L
                <span className="block text-[9px] text-slate-400 font-normal leading-none mt-0.5">({unit})</span>
              </th>
              <th className="py-2 px-1 text-center font-semibold text-slate-700 min-w-[75px]">
                Initial Ind. I₁
                <span className="block text-[9px] text-slate-400 font-normal leading-none mt-0.5">({unit})</span>
              </th>
              <th className="py-2 px-1 text-center font-semibold text-slate-700 min-w-[75px]">
                Extra ΔL (1.4d)
                <span className="block text-[9px] text-slate-400 font-normal leading-none mt-0.5">({unit})</span>
              </th>
              <th className="py-2 px-1 text-center font-semibold text-slate-700 min-w-[75px]">
                Final Ind. I₂
                <span className="block text-[9px] text-slate-400 font-normal leading-none mt-0.5">({unit})</span>
              </th>
              <th className="py-2 px-1 text-center font-semibold bg-slate-100/70 text-slate-600 min-w-[65px]">
                Response ΔI
                <span className="block text-[9px] font-normal leading-none mt-0.5">({unit})</span>
              </th>
              <th className="py-2 px-1 text-center font-semibold bg-slate-100/70 text-slate-600 min-w-[65px]">
                Required
                <span className="block text-[9px] font-normal leading-none mt-0.5">(≥ 1d)</span>
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
              const isInputComplete = (row.load !== '' && row.load !== undefined && row.load !== null || row.baseLoad !== '' && row.baseLoad !== undefined && row.baseLoad !== null) &&
                                      (row.initialIndication !== '' && row.initialIndication !== undefined && row.initialIndication !== null || row.indication !== '' && row.indication !== undefined && row.indication !== null) &&
                                      (row.finalIndication !== '' && row.finalIndication !== undefined && row.finalIndication !== null || row.newIndication !== '' && row.newIndication !== undefined && row.newIndication !== null);
              const testLoad = Number(row.load ?? row.baseLoad) || 0;
              const i1 = Number(row.initialIndication ?? row.baseIndication ?? row.indicationBefore ?? row.indication) || 0;
              const extraL = Number(row.additionalLoad ?? row.extraLoad_1_4d ?? row.deltaL) || Math.round(1.4 * dVal * 10000) / 10000;
              const i2 = Number(row.finalIndication ?? row.newIndication ?? row.indicationAfter) || 0;

              // Response calculation (Read-Only Preview)
              const deltaI = Math.round(Math.abs(i2 - i1) * 10000) / 10000;
              const requiredMin = dVal;
              const isPointPass = isInputComplete ? deltaI >= requiredMin - 1e-9 : false;

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

                  {/* Test Load */}
                  <td className="py-1.5 px-1">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={row.load !== undefined && row.load !== null ? String(row.load) : row.baseLoad !== undefined ? String(row.baseLoad) : ''}
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

                  {/* Initial Indication I1 */}
                  <td className="py-1.5 px-1">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={row.initialIndication !== undefined ? String(row.initialIndication) : row.baseIndication !== undefined ? String(row.baseIndication) : row.indicationBefore !== undefined ? String(row.indicationBefore) : row.indication !== undefined ? String(row.indication) : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
                          handleCellChange(idx, 'initialIndication', val);
                        }
                      }}
                      disabled={isInvalid}
                      placeholder="0.0"
                      className="w-full h-7.5 px-1 py-0.5 text-xs text-center border border-slate-200 rounded font-mono text-slate-900 bg-white hover:border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400"
                    />
                  </td>

                  {/* Additional Load deltaL (1.4d) */}
                  <td className="py-1.5 px-1">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={row.additionalLoad !== undefined && row.additionalLoad !== null ? String(row.additionalLoad) : row.extraLoad_1_4d !== undefined ? String(row.extraLoad_1_4d) : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
                          handleCellChange(idx, 'additionalLoad', val);
                        }
                      }}
                      disabled={isInvalid}
                      placeholder={String(Math.round(1.4 * dVal * 10000) / 10000)}
                      className="w-full h-7.5 px-1 py-0.5 text-xs text-center border border-slate-200 rounded font-mono text-slate-900 bg-white hover:border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400"
                    />
                  </td>

                  {/* Final Indication I2 */}
                  <td className="py-1.5 px-1">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={row.finalIndication !== undefined ? String(row.finalIndication) : row.newIndication !== undefined ? String(row.newIndication) : row.indicationAfter !== undefined ? String(row.indicationAfter) : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
                          handleCellChange(idx, 'finalIndication', val);
                        }
                      }}
                      disabled={isInvalid}
                      placeholder="0.0"
                      className="w-full h-7.5 px-1 py-0.5 text-xs text-center border border-slate-200 rounded font-mono text-slate-900 bg-white hover:border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400"
                    />
                  </td>

                  {/* Response deltaI (Read-Only) */}
                  <td className={`py-1.5 px-1 text-center bg-slate-50/70 text-xs font-mono font-semibold ${
                    !isInputComplete ? 'text-slate-400' : isPointPass ? 'text-slate-800' : 'text-red-700'
                  }`}>
                    {isInputComplete ? deltaI.toFixed(dVal < 0.1 ? 3 : 2) : '—'}
                  </td>

                  {/* Required Change >= d (Read-Only) */}
                  <td className="py-1.5 px-1 text-center bg-slate-50/70 text-slate-600 text-xs font-mono">
                    ≥ {requiredMin.toFixed(dVal < 0.1 ? 3 : 2)}
                  </td>

                  {/* Status (Read-Only) */}
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
                  <td className="py-1 px-1 text-center flex items-center justify-center gap-0.5 font-sans">
                    <button
                      type="button"
                      onClick={() => onOpenCorrection(idx, 'finalIndication', row.finalIndication)}
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
