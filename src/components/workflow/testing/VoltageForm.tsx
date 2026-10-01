'use client';

import React from 'react';
import { VoltageData } from '@/lib/test-suite-types';
import { RegisteredInstrument } from '@/lib/synthetic-instruments';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface VoltageFormProps {
  data: VoltageData;
  instrument: RegisteredInstrument;
  onChange: (updatedData: VoltageData) => void;
}

export const VoltageForm: React.FC<VoltageFormProps> = ({ data, instrument, onChange }) => {
  const e = instrument.verificationInterval_e;

  const handleInputChange = (
    index: number,
    field: 'actualVoltage' | 'indication' | 'deltaL',
    val: string
  ) => {
    const num = parseFloat(val) || 0;
    const nextPoints = [...data.points];
    const pt = { ...nextPoints[index], [field]: num };

    // P = I + 0.5e - deltaL
    const p = pt.indication + 0.5 * e - pt.deltaL;
    const error = p - pt.load;
    const isPass = Math.abs(error) <= (pt.mpe ?? e);

    nextPoints[index] = {
      ...pt,
      calculatedError: Math.round(error * 10000) / 10000,
      isPass,
    };

    onChange({
      ...data,
      points: nextPoints,
    });
  };

  const handleBlankingChange = (index: number, val: string) => {
    const nextPoints = [...data.points];
    nextPoints[index] = { ...nextPoints[index], blankingBehaviorObserved: val };
    onChange({
      ...data,
      points: nextPoints,
    });
  };

  const allPassed = data.points.every((p) => p.isPass);

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="font-semibold text-slate-900 block">
            OIML R 76-1 Clause A.5.4 Voltage Variation Test &bull; Power Type: {data.supplyType}
          </span>
          <span className="text-[11px] text-slate-500">
            {data.supplyType === 'AC_MAINS' || data.supplyType === 'DUAL'
              ? 'AC Mains variation: Tested at Unom (230 V), +10% Unom (253 V), and -15% Unom (195.5 V).'
              : 'Internal battery variation: Tested down to minimum operating cut-off threshold.'}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Nominal Voltage</span>
          <span className="font-mono font-bold text-blue-900">{data.nominalVoltage}</span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
            <tr>
              <th className="py-2.5 px-3">Voltage Test Condition</th>
              <th className="py-2.5 px-3">Target Voltage</th>
              <th className="py-2.5 px-3">Measured Supply V</th>
              <th className="py-2.5 px-3">Test Load</th>
              <th className="py-2.5 px-3">Indication (I)</th>
              <th className="py-2.5 px-3">&Delta;L</th>
              <th className="py-2.5 px-3 font-semibold text-blue-900 bg-blue-50/40">Error (E)</th>
              <th className="py-2.5 px-3 font-semibold text-blue-900 bg-blue-50/40">Tolerance</th>
              <th className="py-2.5 px-3 text-right">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {data.points.map((pt, idx) => (
              <tr key={pt.id} className={`hover:bg-slate-50 ${!pt.isPass ? 'bg-red-50/60' : ''}`}>
                <td className="py-2.5 px-3 font-medium text-slate-900">{pt.conditionName}</td>
                <td className="py-2.5 px-3 font-mono text-slate-600">{pt.targetVoltage}</td>
                <td className="py-2.5 px-3">
                  <input
                    type="number"
                    step="any"
                    value={pt.actualVoltage}
                    onChange={(e) => handleInputChange(idx, 'actualVoltage', e.target.value)}
                    className="w-18 px-1.5 py-1 text-xs border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </td>
                <td className="py-2.5 px-3 font-mono">
                  {pt.load} {instrument.primaryUnit}
                </td>
                <td className="py-2.5 px-3">
                  <input
                    type="number"
                    step="any"
                    value={pt.indication}
                    onChange={(e) => handleInputChange(idx, 'indication', e.target.value)}
                    className="w-18 px-1.5 py-1 text-xs border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </td>
                <td className="py-2.5 px-3">
                  <input
                    type="number"
                    step="any"
                    value={pt.deltaL}
                    onChange={(e) => handleInputChange(idx, 'deltaL', e.target.value)}
                    className="w-18 px-1.5 py-1 text-xs border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </td>

                <td className="py-2.5 px-3 font-mono font-medium text-blue-950 bg-blue-50/20">
                  {(pt.calculatedError ?? 0) >= 0 ? `+${(pt.calculatedError ?? 0).toFixed(4)}` : (pt.calculatedError ?? 0).toFixed(4)}
                </td>
                <td className="py-2.5 px-3 font-mono text-slate-600 bg-blue-50/20">
                  &plusmn;{(pt.mpe ?? e).toFixed(4)}
                </td>
                <td className="py-2.5 px-3 text-right">
                  {pt.isPass ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>PASS</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-700 font-bold text-xs">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>FAIL</span>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.points.some((p) => p.supplyType === 'BATTERY') && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-2">
          <label className="block font-semibold text-slate-800">
            Low Battery Blanking &amp; Cut-Off Verification (Clause A.5.4.3):
          </label>
          <input
            type="text"
            value={data.points.find((p) => p.blankingBehaviorObserved)?.blankingBehaviorObserved || ''}
            onChange={(e) => {
              const bIdx = data.points.findIndex((p) => p.supplyType === 'BATTERY');
              if (bIdx >= 0) handleBlankingChange(bIdx, e.target.value);
            }}
            placeholder="Record display blanking threshold and annunciator behavior..."
            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600"
          />
        </div>
      )}

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs flex items-center justify-between">
        <div>
          <span className="font-semibold text-slate-800">
            Voltage Variation Test Result
          </span>
          <span className="text-[11px] text-slate-500 block">
            {allPassed
              ? 'Weighing errors remain within permissible limits under prescribed upper and lower voltage variations.'
              : 'Out-of-tolerance error or erroneous indication detected during supply voltage fluctuation.'}
          </span>
        </div>

        {allPassed ? (
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            PASS: Voltage Tolerance Compliant
          </span>
        ) : (
          <span className="text-xs font-bold text-red-700 bg-red-100 border border-red-200 px-2.5 py-1 rounded flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            FAIL: Exceeded Limit Under Voltage Fluctuation
          </span>
        )}
      </div>
    </div>
  );
};
