'use client';

import React from 'react';
import { DiscriminationData } from '@/lib/test-suite-types';
import { RegisteredInstrument } from '@/lib/synthetic-instruments';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface DiscriminationFormProps {
  data: DiscriminationData;
  instrument: RegisteredInstrument;
  onChange: (updatedData: DiscriminationData) => void;
}

export const DiscriminationForm: React.FC<DiscriminationFormProps> = ({
  data,
  instrument,
  onChange,
}) => {
  const d = instrument.scaleInterval_d;

  const handleInputChange = (
    index: number,
    field: 'indicationBefore' | 'extraLoad_1_4d' | 'indicationAfter',
    val: string
  ) => {
    const num = parseFloat(val) || 0;
    const nextPoints = [...data.points];
    const pt = { ...nextPoints[index], [field]: num };

    // Recompute observed delta and compliance
    const observedDelta = Math.abs(pt.indicationAfter - pt.indicationBefore);
    // Clause A.4.8: An additional load equal to 1.4d placed gently on the instrument
    // shall cause an unambiguous change of the display by at least 1d
    const isPass = observedDelta >= d * 0.99; // allows floating rounding tolerance

    nextPoints[index] = {
      ...pt,
      observedDelta: Math.round(observedDelta * 10000) / 10000,
      isPass,
    };

    onChange({
      ...data,
      points: nextPoints,
    });
  };

  const allPassed = data.points.every((p) => p.isPass);

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700 flex items-center justify-between">
        <div>
          <span className="font-semibold block text-slate-900">
            OIML R 76-1 Clause A.4.8 Discrimination Requirement
          </span>
          <span className="text-[11px] text-slate-500">
            An additional load &Delta;L equal to 1.4 d ({1.4 * d} {instrument.primaryUnit}) deposited gently shall produce an unambiguous indication advance of &ge; 1 d ({d} {instrument.primaryUnit}).
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Scale Interval (d)</span>
          <span className="font-mono font-bold text-blue-900">
            {d} {instrument.primaryUnit}
          </span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
            <tr>
              <th className="py-2.5 px-3">Test Load Point</th>
              <th className="py-2.5 px-3">Load (L)</th>
              <th className="py-2.5 px-3">Indication Before</th>
              <th className="py-2.5 px-3">Extra Load (1.4 d)</th>
              <th className="py-2.5 px-3">Indication After</th>
              <th className="py-2.5 px-3 font-semibold text-blue-900 bg-blue-50/40">Observed Advance (&Delta;)</th>
              <th className="py-2.5 px-3 font-semibold text-blue-900 bg-blue-50/40">Required Advance</th>
              <th className="py-2.5 px-3 text-right">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {data.points.map((pt, idx) => (
              <tr key={pt.id} className={`hover:bg-slate-50 ${!pt.isPass ? 'bg-red-50/60' : ''}`}>
                <td className="py-2.5 px-3 font-medium text-slate-900">{pt.loadPointName}</td>
                <td className="py-2.5 px-3 font-mono">
                  {pt.load} {instrument.primaryUnit}
                </td>
                <td className="py-2.5 px-3">
                  <input
                    type="number"
                    step="any"
                    value={pt.indicationBefore}
                    onChange={(e) => handleInputChange(idx, 'indicationBefore', e.target.value)}
                    className="w-20 px-1.5 py-1 text-xs border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </td>
                <td className="py-2.5 px-3">
                  <input
                    type="number"
                    step="any"
                    value={pt.extraLoad_1_4d}
                    onChange={(e) => handleInputChange(idx, 'extraLoad_1_4d', e.target.value)}
                    className="w-20 px-1.5 py-1 text-xs border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </td>
                <td className="py-2.5 px-3">
                  <input
                    type="number"
                    step="any"
                    value={pt.indicationAfter}
                    onChange={(e) => handleInputChange(idx, 'indicationAfter', e.target.value)}
                    className="w-20 px-1.5 py-1 text-xs border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </td>

                <td className="py-2.5 px-3 font-mono font-bold text-blue-950 bg-blue-50/20">
                  {pt.observedDelta.toFixed(4)} {instrument.primaryUnit}
                </td>
                <td className="py-2.5 px-3 font-mono text-slate-600 bg-blue-50/20">
                  &ge; {d.toFixed(4)} {instrument.primaryUnit}
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

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs flex items-center justify-between">
        <div>
          <span className="font-semibold text-slate-800">
            Discrimination Status across All Evaluated Points
          </span>
          <span className="text-[11px] text-slate-500 block">
            Evaluated at Min, 50% Max, and 100% Max per OIML Clause A.4.8.
          </span>
        </div>

        {allPassed ? (
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded">
            PASS: All load points display unambiguous response &ge; 1 d
          </span>
        ) : (
          <span className="text-xs font-bold text-red-700 bg-red-100 border border-red-200 px-2.5 py-1 rounded">
            FAIL: Instrument failed to discriminate 1.4 d load
          </span>
        )}
      </div>
    </div>
  );
};
