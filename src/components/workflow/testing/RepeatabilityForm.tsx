'use client';

import React, { useState } from 'react';
import { RepeatabilityData } from '@/lib/test-suite-types';
import { RegisteredInstrument } from '@/lib/synthetic-instruments';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface RepeatabilityFormProps {
  data: RepeatabilityData;
  instrument: RegisteredInstrument;
  onChange: (updatedData: RepeatabilityData) => void;
}

export const RepeatabilityForm: React.FC<RepeatabilityFormProps> = ({
  data,
  instrument,
  onChange,
}) => {
  const [activeSeries, setActiveSeries] = useState<'series1' | 'series2'>('series1');
  const e = instrument.verificationInterval_e;

  const currentSeries = data[activeSeries];

  const handleInputChange = (
    seriesKey: 'series1' | 'series2',
    index: number,
    field: 'indication' | 'deltaL',
    val: string
  ) => {
    const num = parseFloat(val) || 0;
    const series = { ...data[seriesKey] };
    const nextWeighings = [...series.weighings];
    nextWeighings[index] = { ...nextWeighings[index], [field]: num };

    // Recompute turning point P and errors for this series
    let maxError = -Infinity;
    let minError = Infinity;

    const evaluatedWeighings = nextWeighings.map((w) => {
      const p = w.indication + 0.5 * e - w.deltaL;
      const error = p - w.load;
      if (error > maxError) maxError = error;
      if (error < minError) minError = error;

      return {
        ...w,
        calculated_P: Math.round(p * 10000) / 10000,
        error_E: Math.round(error * 10000) / 10000,
      };
    });

    const span = maxError - minError;
    // Repeatability rule under Clause A.4.10: Span <= |MPE(L)|
    const mpeMag = series.mpeMagnitude ?? e;
    const isCompliant = span <= mpeMag;

    const updatedSeries = {
      ...series,
      weighings: evaluatedWeighings,
      maxError: Math.round(maxError * 10000) / 10000,
      minError: Math.round(minError * 10000) / 10000,
      span: Math.round(span * 10000) / 10000,
      isCompliant,
    };

    onChange({
      ...data,
      [seriesKey]: updatedSeries,
    });
  };

  const overallPass = Boolean(data.series1.isCompliant && data.series2.isCompliant);

  return (
    <div className="space-y-4">
      {/* Series Selector Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveSeries('series1')}
          className={`py-2 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeSeries === 'series1'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <span>Series 1 (~50% Max: {data.series1.nominalLoad} {instrument.primaryUnit})</span>
          {data.series1.isCompliant ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSeries('series2')}
          className={`py-2 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeSeries === 'series2'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <span>Series 2 (~100% Max: {data.series2.nominalLoad} {instrument.primaryUnit})</span>
          {data.series2.isCompliant ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
          )}
        </button>
      </div>

      {/* Series Summary Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="font-semibold text-slate-900 block">
            {currentSeries.seriesName} &bull; {currentSeries.weighings.length} Consecutive Weighings
          </span>
          <span className="text-[11px] text-slate-500">
            Mandatory OIML requirement: {data.requiredObservationsPerSeries} weighings per series (Max {instrument.maxCapacity >= 1000 ? '&ge;' : '<'} 1000 kg).
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Emax</span>
            <span className="font-mono font-semibold text-slate-800">
              {(currentSeries.maxError ?? 0).toFixed(4)} {instrument.primaryUnit}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Emin</span>
            <span className="font-mono font-semibold text-slate-800">
              {(currentSeries.minError ?? 0).toFixed(4)} {instrument.primaryUnit}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Span (Emax - Emin)</span>
            <span className="font-mono font-bold text-blue-900">
              {(currentSeries.span ?? 0).toFixed(4)} {instrument.primaryUnit}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Max Allowed |MPE|</span>
            <span className="font-mono text-slate-600">
              {(currentSeries.mpeMagnitude ?? e).toFixed(4)} {instrument.primaryUnit}
            </span>
          </div>
        </div>
      </div>

      {/* Weighings Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
            <tr>
              <th className="py-2.5 px-3">Weighing #</th>
              <th className="py-2.5 px-3">Test Load</th>
              <th className="py-2.5 px-3">Indication (I)</th>
              <th className="py-2.5 px-3">&Delta;L</th>
              <th className="py-2.5 px-3 font-semibold text-blue-900 bg-blue-50/40">Calculated P</th>
              <th className="py-2.5 px-3 font-semibold text-blue-900 bg-blue-50/40">Error (E = P - L)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {currentSeries.weighings.map((w, idx) => (
              <tr key={w.id} className="hover:bg-slate-50">
                <td className="py-2 px-3 font-mono text-slate-500">{w.repetitionIndex}</td>
                <td className="py-2 px-3 font-mono">
                  {w.load} {instrument.primaryUnit}
                </td>
                <td className="py-2 px-3">
                  <input
                    type="number"
                    step="any"
                    value={w.indication}
                    onChange={(e) => handleInputChange(activeSeries, idx, 'indication', e.target.value)}
                    className="w-20 px-1.5 py-1 text-xs border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </td>
                <td className="py-2 px-3">
                  <input
                    type="number"
                    step="any"
                    value={w.deltaL}
                    onChange={(e) => handleInputChange(activeSeries, idx, 'deltaL', e.target.value)}
                    className="w-20 px-1.5 py-1 text-xs border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </td>
                <td className="py-2 px-3 font-mono font-medium text-blue-950 bg-blue-50/20">
                  {(w.calculated_P ?? 0).toFixed(4)}
                </td>
                <td className="py-2 px-3 font-mono bg-blue-50/20">
                  {(w.error_E ?? 0) >= 0 ? `+${(w.error_E ?? 0).toFixed(4)}` : (w.error_E ?? 0).toFixed(4)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Authoritative Overall Verdict */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs flex items-center justify-between">
        <div>
          <span className="font-semibold text-slate-800">
            Clause A.4.10 Overall Repeatability Verdict
          </span>
          <span className="text-[11px] text-slate-500 block">
            Repeatability span in each series must not exceed maximum permissible error at nominal load.
          </span>
        </div>

        {overallPass ? (
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded">
            PASS: Both Series 1 and Series 2 comply with OIML Table 6 MPE
          </span>
        ) : (
          <span className="text-xs font-bold text-red-700 bg-red-100 border border-red-200 px-2.5 py-1 rounded">
            FAIL: Repeatability span exceeds permissible tolerance
          </span>
        )}
      </div>
    </div>
  );
};
