'use client';

import React from 'react';
import { TemperatureData } from '@/lib/test-suite-types';
import { RegisteredInstrument } from '@/lib/synthetic-instruments';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface TemperatureFormProps {
  data: TemperatureData;
  instrument: RegisteredInstrument;
  onChange: (updatedData: TemperatureData) => void;
}

export const TemperatureForm: React.FC<TemperatureFormProps> = ({
  data,
  instrument,
  onChange,
}) => {
  const e = instrument.verificationInterval_e;

  const handleInputChange = (
    index: number,
    field: 'actualTempC' | 'chamberHumidityRh' | 'zeroIndication' | 'zeroDeltaL' | 'maxLoadIndication' | 'maxLoadDeltaL',
    val: string
  ) => {
    const num = parseFloat(val) || 0;
    const nextStages = [...data.stages];
    const stage = { ...nextStages[index], [field]: num };

    // P = I + 0.5e - deltaL
    const pZero = stage.zeroIndication + 0.5 * e - stage.zeroDeltaL;
    const pMax = stage.maxLoadIndication + 0.5 * e - stage.maxLoadDeltaL;
    const errorMax = pMax - stage.maxLoad;
    const correctedError = errorMax - pZero;

    // Zero shift per 5 °C relative to ref stage (index 0)
    const refStage = nextStages[0];
    const refPZero = refStage.zeroIndication + 0.5 * e - refStage.zeroDeltaL;
    const deltaT = Math.abs(stage.actualTempC - refStage.actualTempC);
    const zeroShiftPer5C = deltaT > 0 ? (Math.abs(pZero - refPZero) / deltaT) * 5 : 0;

    // Clause A.5.3: Zero drift shall not exceed 1 e per 5 °C
    const isPass = zeroShiftPer5C <= e * 1.05 && Math.abs(correctedError) <= 1.5 * e;

    nextStages[index] = {
      ...stage,
      calculated_P_zero: Math.round(pZero * 10000) / 10000,
      calculated_P_max: Math.round(pMax * 10000) / 10000,
      correctedError: Math.round(correctedError * 10000) / 10000,
      zeroShiftPer5C: Math.round(zeroShiftPer5C * 10000) / 10000,
      isPass,
    };

    onChange({
      ...data,
      stages: nextStages,
    });
  };

  const allPassed = data.stages.every((s) => s.isPass);

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="font-semibold text-slate-900 block">
            OIML R 76-1 Clause A.5.3 Static Temperatures Thermal Sequence
          </span>
          <span className="text-[11px] text-slate-500">
            Tested across designated temperature range ({instrument.temperatureRange}). Zero shift shall not exceed 1 e ({e} {instrument.primaryUnit}) per 5 &deg;C difference.
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Max Permissible Zero Shift</span>
          <span className="font-mono font-bold text-blue-900">
            &le; {e.toFixed(4)} {instrument.primaryUnit} / 5 &deg;C
          </span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
            <tr>
              <th className="py-2.5 px-3">Thermal Stage</th>
              <th className="py-2.5 px-3">Target / Actual &deg;C</th>
              <th className="py-2.5 px-3">RH (%)</th>
              <th className="py-2.5 px-3">Zero Indication</th>
              <th className="py-2.5 px-3">Max Load Indication</th>
              <th className="py-2.5 px-3 font-semibold text-blue-900 bg-blue-50/40">Corrected Error (Ec)</th>
              <th className="py-2.5 px-3 font-semibold text-blue-900 bg-blue-50/40">Zero Shift / 5&deg;C</th>
              <th className="py-2.5 px-3 text-right">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {data.stages.map((stage, idx) => (
              <tr key={stage.id} className={`hover:bg-slate-50 ${!stage.isPass ? 'bg-red-50/60' : ''}`}>
                <td className="py-2 px-3 font-medium text-slate-900">{stage.stageName}</td>
                <td className="py-2 px-3">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="any"
                      value={stage.actualTempC}
                      onChange={(e) => handleInputChange(idx, 'actualTempC', e.target.value)}
                      className="w-16 px-1.5 py-1 text-xs border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                    <span className="text-[10px] text-slate-400">&deg;C</span>
                  </div>
                </td>
                <td className="py-2 px-3">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="any"
                      value={stage.chamberHumidityRh}
                      onChange={(e) => handleInputChange(idx, 'chamberHumidityRh', e.target.value)}
                      className="w-14 px-1.5 py-1 text-xs border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                    <span className="text-[10px] text-slate-400">%</span>
                  </div>
                </td>
                <td className="py-2 px-3">
                  <input
                    type="number"
                    step="any"
                    value={stage.zeroIndication}
                    onChange={(e) => handleInputChange(idx, 'zeroIndication', e.target.value)}
                    className="w-18 px-1.5 py-1 text-xs border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </td>
                <td className="py-2 px-3">
                  <input
                    type="number"
                    step="any"
                    value={stage.maxLoadIndication}
                    onChange={(e) => handleInputChange(idx, 'maxLoadIndication', e.target.value)}
                    className="w-20 px-1.5 py-1 text-xs border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </td>

                <td className="py-2 px-3 font-mono font-medium text-blue-950 bg-blue-50/20">
                  {(stage.correctedError ?? 0) >= 0 ? `+${(stage.correctedError ?? 0).toFixed(4)}` : (stage.correctedError ?? 0).toFixed(4)}
                </td>
                <td className="py-2 px-3 font-mono font-medium text-slate-900 bg-blue-50/20">
                  {idx === 0 ? '— (Ref)' : `${(stage.zeroShiftPer5C ?? 0).toFixed(4)} ${instrument.primaryUnit}`}
                </td>
                <td className="py-2 px-3 text-right">
                  {stage.isPass ? (
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
            Thermal Sequence Compliance Overview
          </span>
          <span className="text-[11px] text-slate-500 block">
            {allPassed
              ? 'Zero and span errors maintained within permissible limits across the complete climatic cycle.'
              : 'Zero shift exceeded 1 e per 5 °C or span error exceeded Table 6 MPE at temperature extreme.'}
          </span>
        </div>

        {allPassed ? (
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            PASS: All Thermal Stages Compliant
          </span>
        ) : (
          <span className="text-xs font-bold text-red-700 bg-red-100 border border-red-200 px-2.5 py-1 rounded flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            FAIL: Temperature Shift Out of Tolerance
          </span>
        )}
      </div>
    </div>
  );
};
