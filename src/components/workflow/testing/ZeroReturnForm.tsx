'use client';

import React from 'react';
import { ZeroReturnData } from '@/lib/test-suite-types';
import { RegisteredInstrument } from '@/lib/synthetic-instruments';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface ZeroReturnFormProps {
  data: ZeroReturnData;
  instrument: RegisteredInstrument;
  onChange: (updatedData: ZeroReturnData) => void;
}

export const ZeroReturnForm: React.FC<ZeroReturnFormProps> = ({ data, instrument, onChange }) => {
  const e = instrument.verificationInterval_e;
  const maxLimit = 0.5 * e;

  const handleInputChange = (field: 'residualIndication' | 'residualDeltaL', val: string) => {
    const num = parseFloat(val) || 0;
    const next = { ...data, [field]: num };

    // P = I + 0.5e - deltaL
    const resP = next.residualIndication + 0.5 * e - next.residualDeltaL;
    const residualError = Math.abs(resP - next.preLoadZero);
    const isPass = residualError <= maxLimit;

    onChange({
      ...next,
      calculatedResidualZero: Math.round(residualError * 10000) / 10000,
      maxPermissibleLimit: Math.round(maxLimit * 10000) / 10000,
      isPass,
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700 flex items-center justify-between">
        <div>
          <span className="font-semibold block text-slate-900">
            OIML R 76-1 Clause A.4.11.2 Zero Return Requirement
          </span>
          <span className="text-[11px] text-slate-500">
            Upon complete load removal after the creep test, the residual indication at zero shall not exceed 0.5 e ({(0.5 * e).toFixed(4)} {instrument.primaryUnit}).
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Allowed Limit</span>
          <span className="font-mono font-bold text-blue-900">
            &le; {(0.5 * e).toFixed(4)} {instrument.primaryUnit}
          </span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Pre-Load Zero Datum
            </label>
            <div className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded font-mono text-slate-800">
              {data.preLoadZero.toFixed(4)} {instrument.primaryUnit}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Load Removal Timestamp
            </label>
            <div className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded font-mono text-slate-800">
              {data.removalTimestamp}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Residual Zero Indication (I_res)
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="any"
                value={data.residualIndication}
                onChange={(e) => handleInputChange('residualIndication', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:border-blue-600"
              />
              <span className="text-[10px] text-slate-400">{instrument.primaryUnit}</span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Residual &Delta;L
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="any"
                value={data.residualDeltaL}
                onChange={(e) => handleInputChange('residualDeltaL', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:border-blue-600"
              />
              <span className="text-[10px] text-slate-400">{instrument.primaryUnit}</span>
            </div>
          </div>
        </div>

        {/* Calculated Output Strip */}
        <div className="border-t border-slate-100 pt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-slate-500 block text-[11px]">Calculated Residual Zero Error:</span>
            <span className="font-mono text-sm font-bold text-blue-950">
              {(data.calculatedResidualZero ?? 0).toFixed(4)} {instrument.primaryUnit}
            </span>
          </div>

          {data.isPass ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 border border-emerald-200 text-emerald-800 font-semibold rounded text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              PASS: Residual error is within 0.5 e tolerance
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 border border-red-200 text-red-800 font-bold rounded text-xs">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              FAIL: Residual zero error exceeds 0.5 e
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
