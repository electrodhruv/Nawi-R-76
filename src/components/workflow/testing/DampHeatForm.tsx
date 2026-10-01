'use client';

import React from 'react';
import { DampHeatData } from '@/lib/test-suite-types';
import { RegisteredInstrument } from '@/lib/synthetic-instruments';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface DampHeatFormProps {
  data: DampHeatData;
  instrument: RegisteredInstrument;
  onChange: (updatedData: DampHeatData) => void;
}

export const DampHeatForm: React.FC<DampHeatFormProps> = ({ data, instrument, onChange }) => {
  const e = instrument.verificationInterval_e;

  const handleInputChange = (field: keyof DampHeatData, val: string) => {
    const num = parseFloat(val) || 0;
    const next = { ...data, [field]: num };

    // Zero shift between post-recovery and pre-exposure
    const zeroShift = Math.abs(next.postRecoveryZero - next.preExposureZero);
    // Limit: zero shift <= 1 e and max error <= MPE
    const isPass = zeroShift <= e && Math.abs(next.postRecoveryMaxError) <= 1.5 * e;

    onChange({
      ...next,
      zeroShift: Math.round(zeroShift * 10000) / 10000,
      mpeTolerance: e,
      isPass,
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="font-semibold text-slate-900 block">
            OIML R 76-1 Clause B.2 Damp Heat, Steady State (Climatic Chamber)
          </span>
          <span className="text-[11px] text-slate-500">
            Exposed to {data.chamberTempC} &deg;C at {data.chamberHumidityRh}% RH for {data.durationHours} hours. Zero shift after 24 h recovery shall not exceed 1 e ({e} {instrument.primaryUnit}).
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Max Permissible Zero Shift</span>
          <span className="font-mono font-bold text-blue-900">
            &le; {e.toFixed(4)} {instrument.primaryUnit}
          </span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
            <tr>
              <th className="py-2.5 px-3">Test Phase</th>
              <th className="py-2.5 px-3">Chamber Conditions</th>
              <th className="py-2.5 px-3">Zero Indication (I0)</th>
              <th className="py-2.5 px-3">Max Load Error (Ec)</th>
              <th className="py-2.5 px-3 font-semibold text-blue-900 bg-blue-50/40">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            <tr className="hover:bg-slate-50">
              <td className="py-2.5 px-3 font-medium text-slate-900">1. Pre-Exposure Baseline</td>
              <td className="py-2.5 px-3 text-slate-600">+20 &deg;C &bull; 50% RH</td>
              <td className="py-2.5 px-3">
                <input
                  type="number"
                  step="any"
                  value={data.preExposureZero}
                  onChange={(e) => handleInputChange('preExposureZero', e.target.value)}
                  className="w-20 px-1.5 py-1 text-xs border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </td>
              <td className="py-2.5 px-3">
                <input
                  type="number"
                  step="any"
                  value={data.preExposureMaxError}
                  onChange={(e) => handleInputChange('preExposureMaxError', e.target.value)}
                  className="w-20 px-1.5 py-1 text-xs border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </td>
              <td className="py-2.5 px-3 text-slate-500 bg-blue-50/20 font-medium">Reference Datum</td>
            </tr>

            <tr className="hover:bg-slate-50">
              <td className="py-2.5 px-3 font-medium text-slate-900">2. In-Chamber (48 h Exposure)</td>
              <td className="py-2.5 px-3 text-slate-600">
                +{data.chamberTempC} &deg;C &bull; {data.chamberHumidityRh}% RH
              </td>
              <td className="py-2.5 px-3">
                <input
                  type="number"
                  step="any"
                  value={data.duringExposureZero}
                  onChange={(e) => handleInputChange('duringExposureZero', e.target.value)}
                  className="w-20 px-1.5 py-1 text-xs border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </td>
              <td className="py-2.5 px-3">
                <input
                  type="number"
                  step="any"
                  value={data.duringExposureMaxError}
                  onChange={(e) => handleInputChange('duringExposureMaxError', e.target.value)}
                  className="w-20 px-1.5 py-1 text-xs border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </td>
              <td className="py-2.5 px-3 text-blue-900 bg-blue-50/20 font-medium">Exposed</td>
            </tr>

            <tr className="hover:bg-slate-50">
              <td className="py-2.5 px-3 font-medium text-slate-900">3. Post-Recovery (24 h at 20 &deg;C)</td>
              <td className="py-2.5 px-3 text-slate-600">+20 &deg;C &bull; 50% RH</td>
              <td className="py-2.5 px-3">
                <input
                  type="number"
                  step="any"
                  value={data.postRecoveryZero}
                  onChange={(e) => handleInputChange('postRecoveryZero', e.target.value)}
                  className="w-20 px-1.5 py-1 text-xs border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </td>
              <td className="py-2.5 px-3">
                <input
                  type="number"
                  step="any"
                  value={data.postRecoveryMaxError}
                  onChange={(e) => handleInputChange('postRecoveryMaxError', e.target.value)}
                  className="w-20 px-1.5 py-1 text-xs border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </td>
              <td className="py-2.5 px-3 font-bold bg-blue-50/20 text-emerald-700">Recovered</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs flex items-center justify-between">
        <div>
          <span className="font-semibold text-slate-800">
            Damp Heat Post-Recovery Residual Zero Shift: {(data.zeroShift ?? 0).toFixed(4)} {instrument.primaryUnit}
          </span>
          <span className="text-[11px] text-slate-500 block">
            Permissible tolerance limit under Clause B.2: &le; 1 e ({(data.mpeTolerance ?? e).toFixed(4)} {instrument.primaryUnit}).
          </span>
        </div>

        {data.isPass ? (
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            PASS: Immunity to Damp Heat Confirmed
          </span>
        ) : (
          <span className="text-xs font-bold text-red-700 bg-red-100 border border-red-200 px-2.5 py-1 rounded flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            FAIL: Zero Shift Exceeds 1 e
          </span>
        )}
      </div>
    </div>
  );
};
