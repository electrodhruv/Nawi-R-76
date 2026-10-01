'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Edit3, XCircle } from 'lucide-react';

interface ElectricalDisturbancesViewProps {
  observations: Record<string, unknown>[];
  unit: string;
  eVal: number;
  maxCapacity: number;
  onUpdateObservations: (nextObs: Record<string, unknown>[]) => void;
  onOpenCorrection: (rowIndex: number, fieldKey: string, currentVal: unknown) => void;
  onOpenInvalidate: (rowIndex: number) => void;
}

const DISTURBANCE_TYPES = [
  { id: 'BURSTS_EFT', name: 'Electrical Fast Transient / Bursts (IEC 61000-4-4)' },
  { id: 'ESD', name: 'Electrostatic Discharge (IEC 61000-4-2)' },
  { id: 'SURGE', name: 'Surge Immunity (IEC 61000-4-5)' },
  { id: 'VOLTAGE_DIPS', name: 'AC Mains Voltage Dips & Short Interruptions (IEC 61000-4-11)' },
  { id: 'RADIATED_RF', name: 'Radiated Radio-Frequency Fields (IEC 61000-4-3)' },
];

export const ElectricalDisturbancesView: React.FC<ElectricalDisturbancesViewProps> = ({
  observations,
  unit,
  eVal,
  maxCapacity,
  onUpdateObservations,
  onOpenCorrection,
  onOpenInvalidate,
}) => {
  const [selectedType, setSelectedType] = useState<string>(DISTURBANCE_TYPES[0].id);

  const handleCellChange = (index: number, key: string, val: unknown) => {
    const next = [...observations];
    next[index] = { ...next[index], [key]: val };
    onUpdateObservations(next);
  };

  const handleAddRow = () => {
    const typeObj = DISTURBANCE_TYPES.find((d) => d.id === selectedType) || DISTURBANCE_TYPES[0];
    const halfMax = Math.round(maxCapacity * 0.5 * 1000) / 1000;
    const next = [
      ...observations,
      {
        disturbanceType: typeObj.name,
        testEquipment: 'Transient Generator / EFT Coupler',
        testLoad: halfMax,
        baselineIndication: halfMax,
        parameter: selectedType === 'BURSTS_EFT' ? '±1.0 kV (5/50 ns)' : selectedType === 'ESD' ? '±6 kV Contact / ±8 kV Air' : '10 V/m (80-2000 MHz)',
        resultingIndication: halfMax,
        instrumentReaction: 'Normal indication maintained; variation ≤ 1e',
        hasSignificantFault: false,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Electrical Disturbances Immunity Records (Clause 5.4.3, Annex B.3)
          </h2>
          <span className="text-[11px] text-slate-500">
            Disturbances must either produce indication variation ≤ 1.0e ({eVal} {unit}) or be detected and handled as a significant fault (blanked / inhibited).
          </span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-2 py-1 text-xs border border-slate-300 rounded font-sans text-slate-700 bg-white"
          >
            {DISTURBANCE_TYPES.map((dt) => (
              <option key={dt.id} value={dt.id}>
                {dt.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAddRow}
            className="inline-flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900 font-semibold px-2.5 py-1 rounded bg-blue-50 border border-blue-200 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Test Point</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
        <table className="w-full text-xs text-left border-collapse table-auto">
          <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-2 px-1 w-8 text-center text-slate-500 whitespace-nowrap">#</th>
              <th className="py-2 px-1 whitespace-nowrap min-w-[110px]">Disturbance</th>
              <th className="py-2 px-1 text-center whitespace-nowrap min-w-[65px]">
                <div>Load L</div>
                <div className="text-[10px] text-slate-400 font-normal">({unit})</div>
              </th>
              <th className="py-2 px-1 text-center whitespace-nowrap min-w-[65px]">
                <div>Base I₀</div>
                <div className="text-[10px] text-slate-400 font-normal">({unit})</div>
              </th>
              <th className="py-2 px-1 text-center whitespace-nowrap min-w-[65px]">
                <div>Disturbed I</div>
                <div className="text-[10px] text-slate-400 font-normal">({unit})</div>
              </th>
              <th className="py-2 px-1 text-center bg-slate-100/70 text-slate-600 whitespace-nowrap min-w-[55px]">
                <div>ΔI (Calc)</div>
                <div className="text-[10px] text-slate-400 font-normal">({unit})</div>
              </th>
              <th className="py-2 px-1 whitespace-nowrap min-w-[110px]">Reaction / Detection</th>
              <th className="py-2 px-1 bg-slate-100/70 text-center text-slate-600 whitespace-nowrap min-w-[50px]">
                Status
              </th>
              <th className="py-2 px-1 w-16 min-w-[55px] text-center whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-mono">
            {observations.map((row, idx) => {
              const isInvalid = Boolean(row.isInvalidated);
              const baseline = Number(row.baselineIndication ?? row.load) || 0;
              const resulting = Number(row.resultingIndication ?? row.indication) || 0;
              const deltaI = Math.round(Math.abs(resulting - baseline) * 10000) / 10000;
              const limit = eVal;
              const hasSignificantFault = Boolean(row.hasSignificantFault);

              // Compliance: variation <= 1e OR handled as significant fault (inhibited/blanked)
              const isPointPass = deltaI <= limit + 1e-9 || hasSignificantFault;

              return (
                <tr
                  key={idx}
                  className={`hover:bg-slate-50 transition-colors ${
                    isInvalid ? 'bg-rose-50/60 opacity-60' : ''
                  }`}
                >
                  <td className="py-1 px-1 text-center text-slate-400 font-sans">
                    {idx + 1}
                    {isInvalid && <span className="block text-[8px] text-red-600 font-bold uppercase">Invalid</span>}
                  </td>

                  {/* Disturbance Type & Parameter */}
                  <td className="py-1 px-1">
                    <div className="font-sans font-medium text-slate-900 text-xs">
                      {String(row.disturbanceType || 'Disturbance')}
                    </div>
                    <input
                      type="text"
                      value={String(row.parameter || '')}
                      onChange={(e) => handleCellChange(idx, 'parameter', e.target.value)}
                      disabled={isInvalid}
                      placeholder="e.g. ±1.0 kV"
                      className="w-full h-6 px-1.5 py-0.5 text-[10px] border border-slate-200 rounded font-mono text-slate-600 focus:outline-none focus:border-blue-600 mt-0.5 disabled:bg-slate-100"
                    />
                  </td>

                  {/* Load */}
                  <td className="py-1 px-1">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={row.testLoad !== undefined && row.testLoad !== null ? String(row.testLoad) : row.load !== undefined ? String(row.load) : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
                          handleCellChange(idx, 'testLoad', val);
                        }
                      }}
                      disabled={isInvalid}
                      placeholder="0.0"
                      className="w-full h-7.5 px-1.5 py-0.5 text-xs border border-slate-200 rounded font-mono text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20 disabled:bg-slate-100"
                    />
                  </td>

                  {/* Baseline Indication */}
                  <td className="py-1 px-1">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={row.baselineIndication !== undefined && row.baselineIndication !== null ? String(row.baselineIndication) : row.indication !== undefined ? String(row.indication) : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
                          handleCellChange(idx, 'baselineIndication', val);
                        }
                      }}
                      disabled={isInvalid}
                      placeholder="0.0"
                      className="w-full h-7.5 px-1.5 py-0.5 text-xs border border-slate-200 rounded font-mono text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20 disabled:bg-slate-100"
                    />
                  </td>

                  {/* Disturbed Indication */}
                  <td className="py-1 px-1">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={row.resultingIndication !== undefined && row.resultingIndication !== null ? String(row.resultingIndication) : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
                          handleCellChange(idx, 'resultingIndication', val);
                        }
                      }}
                      disabled={isInvalid}
                      placeholder="0.0"
                      className="w-full h-7.5 px-1.5 py-0.5 text-xs border border-slate-200 rounded font-mono text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20 disabled:bg-slate-100"
                    />
                  </td>

                  {/* Calculated deltaI */}
                  <td className={`py-1 px-1 text-center bg-slate-50/70 text-xs font-semibold ${
                    deltaI <= limit ? 'text-slate-800' : 'text-amber-700'
                  }`}>
                    {deltaI.toFixed(eVal < 0.1 ? 3 : 2)}
                  </td>

                  {/* Reaction / Significant fault checkbox */}
                  <td className="py-1 px-1">
                    <input
                      type="text"
                      value={String(row.instrumentReaction || '')}
                      onChange={(e) => handleCellChange(idx, 'instrumentReaction', e.target.value)}
                      disabled={isInvalid}
                      placeholder="Reaction description..."
                      className="w-full h-7.5 px-1.5 py-0.5 text-xs border border-slate-200 rounded font-sans text-slate-800 focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20 disabled:bg-slate-100"
                    />
                    <label className="flex items-center gap-1.5 mt-0.5 text-[10px] font-sans text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasSignificantFault}
                        onChange={(e) => handleCellChange(idx, 'hasSignificantFault', e.target.checked)}
                        disabled={isInvalid}
                        className="rounded border-slate-300 text-blue-600"
                      />
                      <span>Inhibited (Fault)</span>
                    </label>
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
                        onClick={() => onOpenCorrection(idx, 'resultingIndication', row.resultingIndication)}
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
                        title="Delete test point"
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
    </div>
  );
};
