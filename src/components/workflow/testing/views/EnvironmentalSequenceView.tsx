'use client';

import React from 'react';
import { Plus, Trash2, Edit3, XCircle } from 'lucide-react';
import { AccuracyClass } from '@/core/types/metrology';
import { ObservationSchema } from '@/core/test-engine/types';

interface EnvironmentalSequenceViewProps {
  testCode: string;
  observations: Record<string, unknown>[];
  unit: string;
  eVal: number;
  accuracyClass: AccuracyClass;
  maxCapacity: number;
  schema: ObservationSchema;
  onUpdateObservations: (nextObs: Record<string, unknown>[]) => void;
  onOpenCorrection: (rowIndex: number, fieldKey: string, currentVal: unknown) => void;
  onOpenInvalidate: (rowIndex: number) => void;
}

export const EnvironmentalSequenceView: React.FC<EnvironmentalSequenceViewProps> = ({
  testCode,
  observations,
  unit,
  eVal,
  accuracyClass,
  maxCapacity,
  schema,
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
    const newRow: Record<string, unknown> = {};
    schema.fields.forEach((f) => {
      newRow[f.key] = f.type === 'NUMBER' ? 0 : '';
    });
    onUpdateObservations([...observations, newRow]);
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
            Observation Records
          </h2>
          <span className="text-[11px] text-slate-500">
            Enter test condition parameters, applied loads, and observed indications
          </span>
        </div>

        {schema.allowAddRows && (
          <button
            type="button"
            onClick={handleAddRow}
            className="inline-flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900 font-semibold px-2.5 py-1 rounded bg-blue-50 border border-blue-200"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Row</span>
          </button>
        )}
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
        <table className="w-full text-xs text-left border-collapse table-auto">
          <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-2 px-1 w-8 text-center text-slate-500 whitespace-nowrap">#</th>
              {schema.fields.map((f) => (
                <th key={f.key} className="py-2 px-1 text-center whitespace-nowrap min-w-[70px]">
                  <div>{f.label}</div>
                  {f.unitKey && (
                    <div className="text-[10px] font-normal text-slate-400 font-mono">
                      ({f.unitKey === 'primaryUnit' ? unit : f.unitKey === 'celsius' ? '°C' : f.unitKey === 'minute' ? 'min' : f.unitKey})
                    </div>
                  )}
                </th>
              ))}
              <th className="py-2 px-1 w-16 min-w-[55px] text-center whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-mono">
            {observations.map((row, rowIdx) => {
              const isInvalid = Boolean(row.isInvalidated);

              return (
                <tr
                  key={rowIdx}
                  className={`hover:bg-slate-50 transition-colors ${
                    isInvalid ? 'bg-rose-50/60 opacity-60' : ''
                  }`}
                >
                  <td className="py-1 px-1 text-center text-slate-400 font-sans">
                    {rowIdx + 1}
                    {isInvalid && <span className="block text-[8px] text-red-600 font-bold uppercase">Invalid</span>}
                  </td>

                  {schema.fields.map((f) => {
                    const val = row[f.key];

                    if (f.readOnly) {
                      return (
                        <td key={f.key} className="py-1 px-1 text-slate-800 font-sans font-medium text-center whitespace-nowrap">
                          {String(val ?? '')}
                        </td>
                      );
                    }

                    if (f.type === 'SELECT' && f.options) {
                      return (
                        <td key={f.key} className="py-1 px-1">
                          <select
                            value={String(val ?? f.options[0]?.value)}
                            onChange={(e) => handleCellChange(rowIdx, f.key, e.target.value)}
                            disabled={isInvalid}
                            className="w-full h-7.5 px-1 py-0.5 text-xs border border-slate-200 rounded font-sans text-slate-800 bg-white shadow-2xs hover:border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20 disabled:bg-slate-100"
                          >
                            {f.options.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </td>
                      );
                    }

                    return (
                      <td key={f.key} className="py-1 px-1">
                        <input
                          type="text"
                          inputMode={f.type === 'NUMBER' ? 'decimal' : 'text'}
                          value={val !== undefined && val !== null ? String(val) : ''}
                          onChange={(e) => {
                            const inputVal = e.target.value;
                            if (f.type === 'NUMBER') {
                              if (inputVal === '' || /^-?\d*\.?\d*$/.test(inputVal)) {
                                handleCellChange(rowIdx, f.key, inputVal);
                              }
                            } else {
                              handleCellChange(rowIdx, f.key, inputVal);
                            }
                          }}
                          disabled={isInvalid}
                          placeholder={f.placeholder}
                          className="w-full h-7.5 px-1.5 py-0.5 text-xs border border-slate-200 rounded font-mono text-slate-900 bg-white shadow-2xs hover:border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20 disabled:bg-slate-100 disabled:text-slate-400 transition-all"
                        />
                      </td>
                    );
                  })}

                  <td className="py-1 px-1 text-center">
                    <div className="flex items-center justify-center gap-1 font-sans">
                      <button
                        type="button"
                        onClick={() => {
                          const targetKey = schema.fields.find((f) => f.key === 'indication' || f.key === 'netIndication' || f.key === 'residualIndication')?.key || schema.fields[0].key;
                          onOpenCorrection(rowIdx, targetKey, row[targetKey]);
                        }}
                        className="text-slate-500 hover:text-blue-700 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Correct observation"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenInvalidate(rowIdx)}
                        className="text-slate-500 hover:text-amber-700 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Mark observation invalid"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>

                      {schema.allowDeleteRows && (
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(rowIdx)}
                          className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Delete row"
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
