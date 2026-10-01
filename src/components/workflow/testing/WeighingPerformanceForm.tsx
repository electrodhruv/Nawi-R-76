'use client';

import React, { useState } from 'react';
import Decimal from 'decimal.js';
import { WeighingObsPoint } from '@/lib/test-suite-types';
import { RegisteredInstrument } from '@/lib/synthetic-instruments';
import { calculateTurningPoint } from '@/core/engine/turning-points';
import { CheckCircle2, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

interface WeighingPerformanceFormProps {
  observations: WeighingObsPoint[];
  instrument: RegisteredInstrument;
  onChange: (updatedObservations: WeighingObsPoint[]) => void;
}

export const WeighingPerformanceForm: React.FC<WeighingPerformanceFormProps> = ({
  observations,
  instrument,
  onChange,
}) => {
  const [showFormulas, setShowFormulas] = useState(false);

  const handleInputChange = (index: number, field: 'load' | 'indication' | 'deltaL', val: string) => {
    const parsed = parseFloat(val) || 0;
    const next = [...observations];
    next[index] = { ...next[index], [field]: parsed };

    // Recompute with metrology engine
    const zeroPt = next[0];
    const zeroCalc = calculateTurningPoint({
      load: zeroPt.load,
      indication: zeroPt.indication,
      additionalLoad_dL: zeroPt.deltaL,
      e: instrument.verificationInterval_e,
    });
    const zeroError_E0 = zeroCalc.error_E;

    const evaluated = next.map((obs) => {
      const tp = calculateTurningPoint({
        load: obs.load,
        indication: obs.indication,
        additionalLoad_dL: obs.deltaL,
        e: instrument.verificationInterval_e,
        zeroError_E0,
        accuracyClass: instrument.accuracyClass,
      });
      const mpeMag = tp.mpe?.magnitude ?? new Decimal(0);
      const isPass = tp.correctedError_Ec.abs().lte(mpeMag);
      return {
        ...obs,
        calculated_P: tp.calculated_P.toNumber(),
        error_E: tp.error_E.toNumber(),
        zeroError_E0: zeroError_E0.toNumber(),
        correctedError_Ec: tp.correctedError_Ec.toNumber(),
        applicableMpe: mpeMag.toNumber(),
        isPass,
      };
    });

    onChange(evaluated);
  };

  const hasFailure = observations.some((r) => r.isPass === false);

  return (
    <div className="space-y-4">
      {/* Observation Input & Calculated Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
            <tr>
              <th className="py-2.5 px-3">#</th>
              <th className="py-2.5 px-3">Dir</th>
              <th className="py-2.5 px-3">Test Load (L)</th>
              <th className="py-2.5 px-3">Indication (I)</th>
              <th className="py-2.5 px-3">&Delta;L (Turning Point)</th>
              <th className="py-2.5 px-3 font-semibold text-blue-900 bg-blue-50/40">Calculated P</th>
              <th className="py-2.5 px-3 font-semibold text-blue-900 bg-blue-50/40">Corrected Error (Ec)</th>
              <th className="py-2.5 px-3 font-semibold text-blue-900 bg-blue-50/40">MPE (Table 6)</th>
              <th className="py-2.5 px-3 text-right">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {observations.map((row, idx) => (
              <tr key={row.id} className={`hover:bg-slate-50 ${row.isPass === false ? 'bg-red-50/60' : ''}`}>
                <td className="py-2 px-3 font-mono text-slate-500">{row.step}</td>
                <td className="py-2 px-3 font-mono text-slate-600">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                      row.direction === 'INC' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {row.direction}
                  </span>
                </td>
                <td className="py-2 px-3">
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={row.load}
                      onChange={(e) => handleInputChange(idx, 'load', e.target.value)}
                      className="w-20 px-1.5 py-1 text-xs border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                    <span className="text-[10px] text-slate-400">{instrument.primaryUnit}</span>
                  </div>
                </td>
                <td className="py-2 px-3">
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={row.indication}
                      onChange={(e) => handleInputChange(idx, 'indication', e.target.value)}
                      className="w-20 px-1.5 py-1 text-xs border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                    <span className="text-[10px] text-slate-400">{instrument.primaryUnit}</span>
                  </div>
                </td>
                <td className="py-2 px-3">
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={row.deltaL}
                      onChange={(e) => handleInputChange(idx, 'deltaL', e.target.value)}
                      className="w-20 px-1.5 py-1 text-xs border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                    <span className="text-[10px] text-slate-400">{instrument.primaryUnit}</span>
                  </div>
                </td>

                {/* Server-authoritative calculated columns */}
                <td className="py-2 px-3 font-mono text-blue-950 font-medium bg-blue-50/20">
                  {(row.calculated_P ?? 0).toFixed(4)}
                </td>
                <td className="py-2 px-3 font-mono font-medium bg-blue-50/20">
                  <span className={(row.correctedError_Ec ?? 0) > 0 ? 'text-slate-900' : 'text-slate-700'}>
                    {(row.correctedError_Ec ?? 0) >= 0
                      ? `+${(row.correctedError_Ec ?? 0).toFixed(4)}`
                      : (row.correctedError_Ec ?? 0).toFixed(4)}
                  </span>
                </td>
                <td className="py-2 px-3 font-mono text-slate-600 bg-blue-50/20">
                  &plusmn;{(row.applicableMpe ?? 0).toFixed(4)}
                </td>
                <td className="py-2 px-3 text-right">
                  {row.isPass ? (
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

      {/* Calculations & Summary Banner */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowFormulas(!showFormulas)}
          className="inline-flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900 font-medium"
        >
          <span>{showFormulas ? 'Hide technical metrology formulas' : 'View technical metrology formulas'}</span>
          {showFormulas ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {hasFailure ? (
          <span className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded">
            Out-of-tolerance error detected under Clause A.4.4
          </span>
        ) : (
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded">
            All observation points comply with Table 6 MPE limits
          </span>
        )}
      </div>

      {showFormulas && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 space-y-1">
          <div className="font-semibold text-slate-800">OIML R 76-1:2006 Clause A.4.4.3 Formulas:</div>
          <div className="font-mono text-[11px] text-slate-700">
            P = I + 0.5e &minus; &Delta;L &bull; Error: E = P &minus; L &bull; Corrected Error: Ec = E &minus; E0
          </div>
          <div className="text-[11px] text-slate-500">
            Zero error datum E0 = {(observations[0]?.zeroError_E0 ?? 0).toFixed(4)} {instrument.primaryUnit}.
            MPE bounds derived dynamically from Table 6 for {instrument.accuracyClass.replace('_', ' ')}.
          </div>
        </div>
      )}
    </div>
  );
};
