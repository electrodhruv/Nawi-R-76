'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Edit3, XCircle } from 'lucide-react';
import { getTable6MpeValue } from '@/core/test-engine/interpreters/calculation-interpreter';
import { AccuracyClass } from '@/core/types/metrology';

interface VoltageVariationViewProps {
  observations: Record<string, unknown>[];
  unit: string;
  eVal: number;
  accuracyClass: AccuracyClass;
  maxCapacity: number;
  initialSubtype?: 'AC_MAINS' | 'EXTERNAL_DC' | 'BATTERY' | 'ROAD_VEHICLE_BATTERY';
  onUpdateObservations: (nextObs: Record<string, unknown>[]) => void;
  onOpenCorrection: (rowIndex: number, fieldKey: string, currentVal: unknown) => void;
  onOpenInvalidate: (rowIndex: number) => void;
}

type VoltageSubtype = 'AC_MAINS' | 'EXTERNAL_DC' | 'BATTERY' | 'ROAD_VEHICLE_BATTERY';

export const VoltageVariationView: React.FC<VoltageVariationViewProps> = ({
  observations,
  unit,
  eVal,
  accuracyClass,
  maxCapacity,
  initialSubtype = 'AC_MAINS',
  onUpdateObservations,
  onOpenCorrection,
  onOpenInvalidate,
}) => {
  const [subtype, setSubtype] = useState<VoltageSubtype>(initialSubtype);

  const handleCellChange = (index: number, key: string, val: unknown) => {
    const next = [...observations];
    next[index] = { ...next[index], [key]: val };
    onUpdateObservations(next);
  };

  const handleSwitchSubtype = (newSub: VoltageSubtype) => {
    setSubtype(newSub);
    let newObs: Record<string, unknown>[] = [];
    const halfMax = Math.round(maxCapacity * 0.5 * 1000) / 1000;

    if (newSub === 'AC_MAINS') {
      newObs = [
        { testCondition: 'Nominal Voltage (Unom)', nominalVoltage: 230, targetVoltage: 230, actualVoltage: 230, load: halfMax, indication: halfMax, deltaL: eVal * 0.5 },
        { testCondition: 'Upper Limit (+10% Unom)', nominalVoltage: 230, targetVoltage: 253, actualVoltage: 253, load: halfMax, indication: halfMax, deltaL: eVal * 0.5 },
        { testCondition: 'Lower Limit (-15% Unom)', nominalVoltage: 230, targetVoltage: 195.5, actualVoltage: 195.5, load: halfMax, indication: halfMax, deltaL: eVal * 0.5 },
      ];
    } else if (newSub === 'EXTERNAL_DC') {
      newObs = [
        { testCondition: 'Maximum Specified Voltage (Umax)', specifiedMin: 10.5, specifiedMax: 14.5, actualVoltage: 14.5, load: halfMax, indication: halfMax, deltaL: eVal * 0.5 },
        { testCondition: 'Minimum Specified Voltage (Umin)', specifiedMin: 10.5, specifiedMax: 14.5, actualVoltage: 10.5, load: halfMax, indication: halfMax, deltaL: eVal * 0.5 },
      ];
    } else if (newSub === 'BATTERY') {
      newObs = [
        { testCondition: 'Fully Charged Battery (Nominal)', nominalVoltage: 6.0, actualVoltage: 6.0, load: halfMax, indication: halfMax, deltaL: eVal * 0.5, lowBatteryInhibited: false },
        { testCondition: 'Low Battery Cut-off Voltage', nominalVoltage: 6.0, actualVoltage: 4.8, load: halfMax, indication: halfMax, deltaL: eVal * 0.5, lowBatteryInhibited: true },
      ];
    } else {
      // ROAD VEHICLE BATTERY
      newObs = [
        { testCondition: 'Upper Battery Potential (12V/24V)', vehicleStandard: '12V', targetVoltage: 16.0, actualVoltage: 16.0, load: halfMax, indication: halfMax, deltaL: eVal * 0.5 },
        { testCondition: 'Lower Battery Potential (12V/24V)', vehicleStandard: '12V', targetVoltage: 9.0, actualVoltage: 9.0, load: halfMax, indication: halfMax, deltaL: eVal * 0.5 },
      ];
    }

    onUpdateObservations(newObs);
  };

  const handleAddRow = () => {
    const halfMax = Math.round(maxCapacity * 0.5 * 1000) / 1000;
    const next = [
      ...observations,
      {
        testCondition: `Voltage Point #${observations.length + 1}`,
        actualVoltage: 230,
        load: halfMax,
        indication: halfMax,
        deltaL: Math.round(eVal * 0.5 * 1000) / 1000,
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
      {/* Subtype Selector Tabs (Mandatory Isolation per Section 24) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Voltage Variation Workspace (Clause 3.9.3, A.5.4)
          </h2>
          <span className="text-[11px] text-slate-500">
            Select the applicable power supply subtype. Irrelevant supply fields are completely isolated.
          </span>
        </div>

        <button
          type="button"
          onClick={handleAddRow}
          className="inline-flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900 font-semibold px-2.5 py-1 rounded bg-blue-50 border border-blue-200"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Voltage Point</span>
        </button>
      </div>

      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => handleSwitchSubtype('AC_MAINS')}
          className={`py-2 px-3 text-xs font-semibold border-b-2 transition-colors ${
            subtype === 'AC_MAINS'
              ? 'border-blue-700 text-blue-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          A.5.4.1 AC Mains
        </button>
        <button
          type="button"
          onClick={() => handleSwitchSubtype('EXTERNAL_DC')}
          className={`py-2 px-3 text-xs font-semibold border-b-2 transition-colors ${
            subtype === 'EXTERNAL_DC'
              ? 'border-blue-700 text-blue-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          A.5.4.2 External / Plug-in DC
        </button>
        <button
          type="button"
          onClick={() => handleSwitchSubtype('BATTERY')}
          className={`py-2 px-3 text-xs font-semibold border-b-2 transition-colors ${
            subtype === 'BATTERY'
              ? 'border-blue-700 text-blue-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          A.5.4.3 Battery Internal
        </button>
        <button
          type="button"
          onClick={() => handleSwitchSubtype('ROAD_VEHICLE_BATTERY')}
          className={`py-2 px-3 text-xs font-semibold border-b-2 transition-colors ${
            subtype === 'ROAD_VEHICLE_BATTERY'
              ? 'border-blue-700 text-blue-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          A.5.4.4 Road-Vehicle Battery
        </button>
      </div>

      {/* Test Isolated Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
        <table className="w-full text-xs text-left border-collapse table-auto">
          <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-2 px-1 w-8 text-center text-slate-500 whitespace-nowrap">#</th>
              <th className="py-2 px-1 whitespace-nowrap min-w-[90px] text-slate-700 font-semibold">Test Condition</th>

              {subtype === 'AC_MAINS' && (
                <>
                  <th className="py-2 px-1 text-center whitespace-nowrap min-w-[55px]">
                    <div>Nominal</div>
                    <div className="text-[10px] text-slate-400 font-normal">(V)</div>
                  </th>
                  <th className="py-2 px-1 text-center whitespace-nowrap min-w-[55px]">
                    <div>Target</div>
                    <div className="text-[10px] text-slate-400 font-normal">(V)</div>
                  </th>
                  <th className="py-2 px-1 text-center whitespace-nowrap min-w-[55px]">
                    <div>Actual</div>
                    <div className="text-[10px] text-slate-400 font-normal">(V)</div>
                  </th>
                </>
              )}

              {subtype === 'EXTERNAL_DC' && (
                <>
                  <th className="py-2 px-1 text-center whitespace-nowrap min-w-[55px]">
                    <div>Min</div>
                    <div className="text-[10px] text-slate-400 font-normal">(V)</div>
                  </th>
                  <th className="py-2 px-1 text-center whitespace-nowrap min-w-[55px]">
                    <div>Max</div>
                    <div className="text-[10px] text-slate-400 font-normal">(V)</div>
                  </th>
                  <th className="py-2 px-1 text-center whitespace-nowrap min-w-[55px]">
                    <div>Actual</div>
                    <div className="text-[10px] text-slate-400 font-normal">(V)</div>
                  </th>
                </>
              )}

              {subtype === 'BATTERY' && (
                <>
                  <th className="py-2 px-1 text-center whitespace-nowrap min-w-[55px]">
                    <div>Nominal</div>
                    <div className="text-[10px] text-slate-400 font-normal">(V)</div>
                  </th>
                  <th className="py-2 px-1 text-center whitespace-nowrap min-w-[55px]">
                    <div>Actual</div>
                    <div className="text-[10px] text-slate-400 font-normal">(V)</div>
                  </th>
                  <th className="py-2 px-1 whitespace-nowrap min-w-[110px]">
                    <div>Inhibit Reaction</div>
                  </th>
                </>
              )}

              {subtype === 'ROAD_VEHICLE_BATTERY' && (
                <>
                  <th className="py-2 px-1 text-center whitespace-nowrap min-w-[65px]">Standard</th>
                  <th className="py-2 px-1 text-center whitespace-nowrap min-w-[55px]">
                    <div>Target</div>
                    <div className="text-[10px] text-slate-400 font-normal">(V)</div>
                  </th>
                  <th className="py-2 px-1 text-center whitespace-nowrap min-w-[55px]">
                    <div>Actual</div>
                    <div className="text-[10px] text-slate-400 font-normal">(V)</div>
                  </th>
                </>
              )}

              <th className="py-2 px-1 text-center whitespace-nowrap min-w-[65px]">
                <div>Applied L</div>
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
              <th className="py-2 px-1 text-center bg-slate-100/70 text-slate-600 whitespace-nowrap min-w-[60px]">
                <div>Error E</div>
                <div className="text-[10px] text-slate-400 font-normal">({unit})</div>
              </th>
              <th className="py-2 px-1 text-center bg-slate-100/70 text-slate-600 whitespace-nowrap min-w-[55px]">
                <div>MPE</div>
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
              const loadNum = Number(row.load) || 0;
              const indNum = Number(row.indication) || 0;
              const dlNum = Number(row.deltaL) || 0;

              const P = indNum + 0.5 * eVal - dlNum;
              const E = P - loadNum;
              const mpe = getTable6MpeValue(accuracyClass, loadNum, eVal);
              const isPointPass = Math.abs(E) <= mpe + 1e-9;

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

                  {/* Condition label */}
                  <td className="py-1 px-1 font-sans font-medium text-slate-800 text-xs">
                    {String(row.testCondition || `Step #${idx + 1}`)}
                  </td>

                  {/* SUBTYPE FIELDS */}
                  {subtype === 'AC_MAINS' && (
                    <>
                      <td className="py-1 px-1">
                        <input
                          type="number"
                          value={row.nominalVoltage !== undefined ? String(row.nominalVoltage) : '230'}
                          onChange={(e) => handleCellChange(idx, 'nominalVoltage', parseFloat(e.target.value) || 0)}
                          disabled={isInvalid}
                          className="w-full h-7.5 px-1.5 py-0.5 text-xs border border-slate-200 rounded font-mono text-slate-900 bg-white shadow-2xs hover:border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20 disabled:bg-slate-100 disabled:text-slate-400 transition-all"
                        />
                      </td>
                      <td className="py-1 px-1">
                        <input
                          type="number"
                          value={row.targetVoltage !== undefined ? String(row.targetVoltage) : '230'}
                          onChange={(e) => handleCellChange(idx, 'targetVoltage', parseFloat(e.target.value) || 0)}
                          disabled={isInvalid}
                          className="w-full h-7.5 px-1.5 py-0.5 text-xs border border-slate-200 rounded font-mono text-slate-900 bg-white shadow-2xs hover:border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20 disabled:bg-slate-100 disabled:text-slate-400 transition-all"
                        />
                      </td>
                      <td className="py-1 px-1">
                        <input
                          type="number"
                          value={row.actualVoltage !== undefined ? String(row.actualVoltage) : '230'}
                          onChange={(e) => handleCellChange(idx, 'actualVoltage', parseFloat(e.target.value) || 0)}
                          disabled={isInvalid}
                          className="w-full h-7.5 px-1.5 py-0.5 text-xs border border-slate-200 rounded font-mono text-slate-900 bg-white shadow-2xs hover:border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20 disabled:bg-slate-100 disabled:text-slate-400 transition-all"
                        />
                      </td>
                    </>
                  )}

                  {subtype === 'EXTERNAL_DC' && (
                    <>
                      <td className="py-1 px-1">
                        <input
                          type="number"
                          value={row.specifiedMin !== undefined ? String(row.specifiedMin) : '10.5'}
                          onChange={(e) => handleCellChange(idx, 'specifiedMin', parseFloat(e.target.value) || 0)}
                          disabled={isInvalid}
                          className="w-full h-7.5 px-1.5 py-0.5 text-xs border border-slate-200 rounded font-mono text-slate-900 bg-white shadow-2xs hover:border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20 disabled:bg-slate-100 disabled:text-slate-400 transition-all"
                        />
                      </td>
                      <td className="py-1 px-1">
                        <input
                          type="number"
                          value={row.specifiedMax !== undefined ? String(row.specifiedMax) : '14.5'}
                          onChange={(e) => handleCellChange(idx, 'specifiedMax', parseFloat(e.target.value) || 0)}
                          disabled={isInvalid}
                          className="w-full h-7.5 px-1.5 py-0.5 text-xs border border-slate-200 rounded font-mono text-slate-900 bg-white shadow-2xs hover:border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20 disabled:bg-slate-100 disabled:text-slate-400 transition-all"
                        />
                      </td>
                      <td className="py-1 px-1">
                        <input
                          type="number"
                          value={row.actualVoltage !== undefined ? String(row.actualVoltage) : '12'}
                          onChange={(e) => handleCellChange(idx, 'actualVoltage', parseFloat(e.target.value) || 0)}
                          disabled={isInvalid}
                          className="w-full h-7.5 px-1.5 py-0.5 text-xs border border-slate-200 rounded font-mono text-slate-900 bg-white shadow-2xs hover:border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20 disabled:bg-slate-100 disabled:text-slate-400 transition-all"
                        />
                      </td>
                    </>
                  )}

                  {subtype === 'BATTERY' && (
                    <>
                      <td className="py-1 px-1">
                        <input
                          type="number"
                          value={row.nominalVoltage !== undefined ? String(row.nominalVoltage) : '6.0'}
                          onChange={(e) => handleCellChange(idx, 'nominalVoltage', parseFloat(e.target.value) || 0)}
                          disabled={isInvalid}
                          className="w-full h-7.5 px-1.5 py-0.5 text-xs border border-slate-200 rounded font-mono text-slate-900 bg-white shadow-2xs hover:border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20 disabled:bg-slate-100 disabled:text-slate-400 transition-all"
                        />
                      </td>
                      <td className="py-1 px-1">
                        <input
                          type="number"
                          value={row.actualVoltage !== undefined ? String(row.actualVoltage) : '6.0'}
                          onChange={(e) => handleCellChange(idx, 'actualVoltage', parseFloat(e.target.value) || 0)}
                          disabled={isInvalid}
                          className="w-full h-7.5 px-1.5 py-0.5 text-xs border border-slate-200 rounded font-mono text-slate-900 bg-white shadow-2xs hover:border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20 disabled:bg-slate-100 disabled:text-slate-400 transition-all"
                        />
                      </td>
                      <td className="py-1 px-1 font-sans text-xs">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(row.lowBatteryInhibited)}
                            onChange={(e) => handleCellChange(idx, 'lowBatteryInhibited', e.target.checked)}
                            disabled={isInvalid}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500/20"
                          />
                          <span className="text-slate-700 text-xs">Inhibited</span>
                        </label>
                      </td>
                    </>
                  )}

                  {subtype === 'ROAD_VEHICLE_BATTERY' && (
                    <>
                      <td className="py-1 px-1">
                        <select
                          value={String(row.vehicleStandard || '12V')}
                          onChange={(e) => handleCellChange(idx, 'vehicleStandard', e.target.value)}
                          disabled={isInvalid}
                          className="w-full h-7.5 px-1 py-0.5 text-xs border border-slate-200 rounded font-sans text-slate-800 bg-white shadow-2xs hover:border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20"
                        >
                          <option value="12V">12V</option>
                          <option value="24V">24V</option>
                        </select>
                      </td>
                      <td className="py-1 px-1">
                        <input
                          type="number"
                          value={row.targetVoltage !== undefined ? String(row.targetVoltage) : '16'}
                          onChange={(e) => handleCellChange(idx, 'targetVoltage', parseFloat(e.target.value) || 0)}
                          disabled={isInvalid}
                          className="w-full h-7.5 px-1.5 py-0.5 text-xs border border-slate-200 rounded font-mono text-slate-900 bg-white shadow-2xs hover:border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20 disabled:bg-slate-100 disabled:text-slate-400 transition-all"
                        />
                      </td>
                      <td className="py-1 px-1">
                        <input
                          type="number"
                          value={row.actualVoltage !== undefined ? String(row.actualVoltage) : '16'}
                          onChange={(e) => handleCellChange(idx, 'actualVoltage', parseFloat(e.target.value) || 0)}
                          disabled={isInvalid}
                          className="w-full h-7.5 px-1.5 py-0.5 text-xs border border-slate-200 rounded font-mono text-slate-900 bg-white shadow-2xs hover:border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20 disabled:bg-slate-100 disabled:text-slate-400 transition-all"
                        />
                      </td>
                    </>
                  )}

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
                      className="w-full h-7.5 px-1.5 py-0.5 text-xs border border-slate-200 rounded font-mono text-slate-900 bg-white shadow-2xs hover:border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20 disabled:bg-slate-100 disabled:text-slate-400 transition-all"
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
                      className="w-full h-7.5 px-1.5 py-0.5 text-xs border border-slate-200 rounded font-mono text-slate-900 bg-white shadow-2xs hover:border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20 disabled:bg-slate-100 disabled:text-slate-400 transition-all"
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
                      className="w-full h-7.5 px-1.5 py-0.5 text-xs border border-slate-200 rounded font-mono text-slate-900 bg-white shadow-2xs hover:border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20 disabled:bg-slate-100 disabled:text-slate-400 transition-all"
                    />
                  </td>

                  {/* Calculated Error */}
                  <td className={`py-1 px-1 text-center bg-slate-50/70 text-xs font-semibold ${
                    isPointPass ? 'text-slate-800' : 'text-red-700'
                  }`}>
                    {E > 0 ? `+${E.toFixed(eVal < 0.1 ? 3 : 2)}` : E.toFixed(eVal < 0.1 ? 3 : 2)}
                  </td>

                  {/* MPE */}
                  <td className="py-1 px-1 text-center bg-slate-50/70 text-slate-600 text-xs">
                    ±{mpe.toFixed(eVal < 0.1 ? 3 : 2)}
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
                      className="text-slate-500 hover:text-blue-700 p-1 rounded"
                      title="Correct observation"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenInvalidate(idx)}
                      className="text-slate-500 hover:text-amber-700 p-1 rounded"
                      title="Mark observation invalid"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteRow(idx)}
                      className="text-slate-400 hover:text-red-600 p-1 rounded"
                      title="Delete voltage step"
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
