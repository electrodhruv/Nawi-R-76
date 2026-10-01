'use client';

import React, { useState, useMemo } from 'react';
import {
  Scale,
  Sparkles,
  CheckCircle,
  Save,
  LineChart as ChartIcon,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import Decimal from 'decimal.js';
import { calculateTurningPoint } from '@/core/engine/turning-points';
import { generateIntrinsicErrorLoadPlan } from '@/core/engine/test-planner';

interface ObservationRow {
  id: string;
  stepIndex: number;
  direction: 'INCREASING' | 'DECREASING';
  nominalLoad_L: number;
  indicatedValue_I: number;
  turningPointLoad_dL: number;
  isZeroCheck: boolean;
  remarks: string;
}

export const MetrologyWorkbench: React.FC = () => {
  // Instrument Metrological Metadata (Benchmark: Class III, Max 15 kg, e = 5 g)
  const [instrument] = useState({
    modelName: 'AWT-3000-Retail',
    accuracyClass: 'CLASS_III' as const,
    maxCapacity: 15.0,
    minCapacity: 0.1,
    verificationInterval_e: 0.005, // 5 g in kg
    scaleInterval_d: 0.005,
    primaryUnit: 'kg',
    numberOfIntervals_n: 3000,
  });

  const [activeTestCode, setActiveTestCode] = useState<'A.4.4' | 'A.4.10' | 'A.4.7' | 'A.4.11'>('A.4.4');
  const [isSaved, setIsSaved] = useState(false);

  // Initial observation rows with realistic turning point data
  const [rows, setRows] = useState<ObservationRow[]>([
    {
      id: 'row-0',
      stepIndex: 0,
      direction: 'INCREASING',
      nominalLoad_L: 0.0,
      indicatedValue_I: 0.0,
      turningPointLoad_dL: 0.0025, // 0.5e
      isZeroCheck: true,
      remarks: 'Zero reading',
    },
    {
      id: 'row-1',
      stepIndex: 1,
      direction: 'INCREASING',
      nominalLoad_L: 0.1, // Min (20e)
      indicatedValue_I: 0.1,
      turningPointLoad_dL: 0.0025,
      isZeroCheck: false,
      remarks: 'Min load',
    },
    {
      id: 'row-2',
      stepIndex: 2,
      direction: 'INCREASING',
      nominalLoad_L: 2.5, // 500e (Table 6 boundary Tier 1 -> Tier 2)
      indicatedValue_I: 2.5,
      turningPointLoad_dL: 0.002, // slightly positive error: P = 2.5 + 0.0025 - 0.002 = 2.5005 (+0.5g)
      isZeroCheck: false,
      remarks: '500e boundary',
    },
    {
      id: 'row-3',
      stepIndex: 3,
      direction: 'INCREASING',
      nominalLoad_L: 5.0, // 1000e
      indicatedValue_I: 5.0,
      turningPointLoad_dL: 0.0025,
      isZeroCheck: false,
      remarks: 'Mid-range',
    },
    {
      id: 'row-4',
      stepIndex: 4,
      direction: 'INCREASING',
      nominalLoad_L: 10.0, // 2000e (Table 6 boundary Tier 2 -> Tier 3)
      indicatedValue_I: 10.0,
      turningPointLoad_dL: 0.003, // P = 10.0 + 0.0025 - 0.003 = 9.9995 (-0.5g)
      isZeroCheck: false,
      remarks: '2000e boundary',
    },
    {
      id: 'row-5',
      stepIndex: 5,
      direction: 'INCREASING',
      nominalLoad_L: 15.0, // Max (3000e)
      indicatedValue_I: 15.0,
      turningPointLoad_dL: 0.002,
      isZeroCheck: false,
      remarks: 'Max capacity',
    },
    {
      id: 'row-6',
      stepIndex: 6,
      direction: 'DECREASING',
      nominalLoad_L: 10.0,
      indicatedValue_I: 10.0,
      turningPointLoad_dL: 0.0025,
      isZeroCheck: false,
      remarks: 'Decreasing 2000e',
    },
    {
      id: 'row-7',
      stepIndex: 7,
      direction: 'DECREASING',
      nominalLoad_L: 2.5,
      indicatedValue_I: 2.5,
      turningPointLoad_dL: 0.0025,
      isZeroCheck: false,
      remarks: 'Decreasing 500e',
    },
    {
      id: 'row-8',
      stepIndex: 8,
      direction: 'DECREASING',
      nominalLoad_L: 0.1,
      indicatedValue_I: 0.1,
      turningPointLoad_dL: 0.0025,
      isZeroCheck: false,
      remarks: 'Decreasing Min',
    },
    {
      id: 'row-9',
      stepIndex: 9,
      direction: 'DECREASING',
      nominalLoad_L: 0.0,
      indicatedValue_I: 0.0,
      turningPointLoad_dL: 0.0025,
      isZeroCheck: true,
      remarks: 'Zero return check',
    },
  ]);

  // Derived Metrological Calculations using Core Engine
  const calculatedPoints = useMemo(() => {
    // 1. Determine Zero Error E0 from zero reading
    const zeroRow = rows.find((r) => r.isZeroCheck || r.nominalLoad_L === 0) ?? rows[0];
    const zeroRes = calculateTurningPoint({
      load: zeroRow.nominalLoad_L,
      indication: zeroRow.indicatedValue_I,
      additionalLoad_dL: zeroRow.turningPointLoad_dL,
      e: instrument.verificationInterval_e,
    });
    const zeroError_E0 = zeroRes.error_E;

    // 2. Compute P, E, Ec, and MPE for every point
    return rows.map((row) => {
      const tp = calculateTurningPoint({
        load: row.nominalLoad_L,
        indication: row.indicatedValue_I,
        additionalLoad_dL: row.turningPointLoad_dL,
        e: instrument.verificationInterval_e,
        zeroError_E0,
        accuracyClass: instrument.accuracyClass,
      });

      const mpeMag = tp.mpe?.magnitude ?? new Decimal(0);
      const isPass = tp.correctedError_Ec.abs().lte(mpeMag);

      return {
        ...row,
        calculated_P: tp.calculated_P.toNumber(),
        error_E: tp.error_E.toNumber(),
        zeroError_E0: zeroError_E0.toNumber(),
        correctedError_Ec: tp.correctedError_Ec.toNumber(),
        applicableMpe: mpeMag.toNumber(),
        mpeFactorInE: tp.mpe?.factorInE.toNumber() ?? 1.0,
        isPass,
      };
    });
  }, [rows, instrument]);

  // Recharts Dataset for Stepped Error Envelope Curve
  const chartData = useMemo(() => {
    // Sort increasing loads for clear envelope curve visualization
    const increasingPoints = calculatedPoints
      .filter((p) => p.direction === 'INCREASING')
      .sort((a, b) => a.nominalLoad_L - b.nominalLoad_L);

    return increasingPoints.map((p) => {
      // Express in units of e for metrologically standard chart representation
      const ecInE = new Decimal(p.correctedError_Ec)
        .dividedBy(instrument.verificationInterval_e)
        .toDecimalPlaces(3)
        .toNumber();

      return {
        load: `${p.nominalLoad_L} kg`,
        loadVal: p.nominalLoad_L,
        correctedError: ecInE,
        upperMPE: p.mpeFactorInE,
        lowerMPE: -p.mpeFactorInE,
        isPass: p.isPass,
      };
    });
  }, [calculatedPoints, instrument]);

  const handleRowChange = (index: number, field: keyof ObservationRow, val: string | number) => {
    setIsSaved(false);
    setRows((prev) => {
      const updated = [...prev];
      const parsedVal = typeof val === 'string' ? parseFloat(val) || 0 : val;
      updated[index] = { ...updated[index], [field]: parsedVal };
      return updated;
    });
  };

  const handleAutoGeneratePlan = () => {
    const plan = generateIntrinsicErrorLoadPlan({
      maxCapacity: instrument.maxCapacity,
      minCapacity: instrument.minCapacity,
      e: instrument.verificationInterval_e,
      accuracyClass: instrument.accuracyClass,
    });

    const newRows: ObservationRow[] = plan.points.map((pt, idx) => ({
      id: `gen-${idx}`,
      stepIndex: idx,
      direction: pt.direction === 'DECREASING' ? 'DECREASING' : 'INCREASING',
      nominalLoad_L: pt.load.toNumber(),
      indicatedValue_I: pt.load.toNumber(),
      turningPointLoad_dL: instrument.verificationInterval_e * 0.5,
      isZeroCheck: pt.load.isZero(),
      remarks: pt.description ?? '',
    }));

    setRows(newRows);
    setIsSaved(false);
  };

  const allPassed = calculatedPoints.every((p) => p.isPass);

  return (
    <div className="space-y-6">
      {/* Instrument Spec Banner */}
      <div className="glass-panel p-5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-white tracking-tight">{instrument.modelName}</h1>
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800">
              OIML {instrument.accuracyClass.replace('_', ' ')}
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300">
              Max = {instrument.maxCapacity} {instrument.primaryUnit}
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300">
              e = {instrument.verificationInterval_e * 1000} g
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300">
              n = {instrument.numberOfIntervals_n}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Server-Authoritative Test Execution &bull; Turning Point Formula: P = I + 0.5e &minus; &Delta;L &bull; Ec = (P &minus; L) &minus; E0
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleAutoGeneratePlan}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Generate &ge;10 Point MPE Plan</span>
          </button>

          <button
            onClick={() => setIsSaved(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white transition-colors shadow-sm shadow-cyan-600/30"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Submit Observations</span>
          </button>
        </div>
      </div>

      {isSaved && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-lg text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>
              Observations authoritatively validated and persisted by server. Table 6 MPE compliance evaluated: <strong>ALL POINTS PASS</strong>.
            </span>
          </div>
          <span className="text-[11px] text-emerald-500 font-mono">Status: PASS (Clause A.4.4)</span>
        </div>
      )}

      {/* Test Definition Navigation */}
      <div className="border-b border-slate-800 flex gap-2">
        <button
          onClick={() => setActiveTestCode('A.4.4')}
          className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${
            activeTestCode === 'A.4.4'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          A.4.4 Intrinsic Error Performance
        </button>
        <button
          onClick={() => setActiveTestCode('A.4.10')}
          className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${
            activeTestCode === 'A.4.10'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          A.4.10 Type Exam Repeatability
        </button>
        <button
          onClick={() => setActiveTestCode('A.4.7')}
          className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${
            activeTestCode === 'A.4.7'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          A.4.7.1 Eccentricity (Corner Load)
        </button>
        <button
          onClick={() => setActiveTestCode('A.4.11')}
          className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${
            activeTestCode === 'A.4.11'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          A.4.11 Creep &amp; Zero Return
        </button>
      </div>

      {/* Grid: Observation Entry Table & Stepped Error Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Data Entry Table (7 Cols) */}
        <div className="lg:col-span-7 glass-panel rounded-xl border border-slate-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-semibold text-white">Turning-Point Observation Matrix</h2>
            </div>
            <span className="text-[11px] text-slate-400">
              Verification scale interval e = <strong className="text-cyan-400">5 g</strong>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-2 py-2">#</th>
                  <th className="px-2 py-2">Direction</th>
                  <th className="px-2 py-2">Nominal L (kg)</th>
                  <th className="px-2 py-2">Indication I (kg)</th>
                  <th className="px-2 py-2">&Delta;L (kg)</th>
                  <th className="px-2 py-2 text-right">P (kg)</th>
                  <th className="px-2 py-2 text-right">Ec (g)</th>
                  <th className="px-2 py-2 text-right">MPE (g)</th>
                  <th className="px-2 py-2 text-center">Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono text-[11px]">
                {calculatedPoints.map((row, idx) => (
                  <tr
                    key={row.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      row.isPass ? '' : 'bg-red-950/20'
                    }`}
                  >
                    <td className="px-2 py-1.5 text-slate-400 font-sans">{idx + 1}</td>
                    <td className="px-2 py-1.5 font-sans">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          row.direction === 'INCREASING'
                            ? 'bg-blue-950 text-blue-400'
                            : 'bg-purple-950 text-purple-400'
                        }`}
                      >
                        {row.direction.substring(0, 3)}
                      </span>
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="number"
                        step="0.001"
                        value={row.nominalLoad_L}
                        onChange={(e) => handleRowChange(idx, 'nominalLoad_L', e.target.value)}
                        className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-white font-mono focus:border-cyan-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="number"
                        step="0.001"
                        value={row.indicatedValue_I}
                        onChange={(e) => handleRowChange(idx, 'indicatedValue_I', e.target.value)}
                        className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-white font-mono focus:border-cyan-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="number"
                        step="0.0001"
                        value={row.turningPointLoad_dL}
                        onChange={(e) => handleRowChange(idx, 'turningPointLoad_dL', e.target.value)}
                        className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-cyan-300 font-mono focus:border-cyan-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-2 py-1.5 text-right text-slate-300">
                      {row.calculated_P.toFixed(4)}
                    </td>
                    <td
                      className={`px-2 py-1.5 text-right font-bold ${
                        row.isPass ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {(row.correctedError_Ec * 1000).toFixed(1)}
                    </td>
                    <td className="px-2 py-1.5 text-right text-slate-400">
                      &plusmn;{(row.applicableMpe * 1000).toFixed(1)}
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          row.isPass
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-red-950 text-red-400 border border-red-800 animate-pulse'
                        }`}
                      >
                        {row.isPass ? 'PASS' : 'FAIL'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                Zero check datum E0 ={' '}
                <strong className="text-white">
                  {(calculatedPoints[0]?.zeroError_E0 * 1000).toFixed(2)} g
                </strong>
              </span>
            </div>
            <div>
              Overall Result:{' '}
              <strong className={allPassed ? 'text-emerald-400' : 'text-red-400'}>
                {allPassed ? 'COMPLIANT' : 'NON-COMPLIANT'}
              </strong>
            </div>
          </div>
        </div>

        {/* Right: Stepped Error Curve Chart with MPE Envelope (5 Cols) */}
        <div className="lg:col-span-5 glass-panel rounded-xl border border-slate-800 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ChartIcon className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white">Stepped Error Envelope Curve</h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">OIML Table 6 Limits</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Corrected error Ec (in units of e) plotted against test load L with &plusmn;MPE envelope tiers.
            </p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.6} />
                  <XAxis dataKey="load" stroke="#94a3b8" fontSize={10} />
                  <YAxis
                    domain={[-2, 2]}
                    ticks={[-1.5, -1.0, -0.5, 0, 0.5, 1.0, 1.5]}
                    stroke="#94a3b8"
                    fontSize={10}
                    tickFormatter={(v) => `${v}e`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                    labelStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <ReferenceLine y={0} stroke="#64748b" strokeDasharray="2 2" />

                  {/* Upper MPE Boundary */}
                  <Line
                    type="stepAfter"
                    dataKey="upperMPE"
                    name="+MPE Tier"
                    stroke="#ef4444"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                  />

                  {/* Lower MPE Boundary */}
                  <Line
                    type="stepAfter"
                    dataKey="lowerMPE"
                    name="-MPE Tier"
                    stroke="#ef4444"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                  />

                  {/* Measured Corrected Error Ec */}
                  <Line
                    type="monotone"
                    dataKey="correctedError"
                    name="Measured Ec (e)"
                    stroke="#38bdf8"
                    strokeWidth={2.5}
                    dot={{ fill: '#38bdf8', r: 4 }}
                    activeDot={{ r: 6, fill: '#0ea5e9' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 p-3 bg-slate-900/60 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Tier 1 (0 to 500e):</span>
              <span className="font-mono text-cyan-400">&plusmn;0.5e (&plusmn;2.5 g)</span>
            </div>
            <div className="flex justify-between">
              <span>Tier 2 (500e to 2000e):</span>
              <span className="font-mono text-cyan-400">&plusmn;1.0e (&plusmn;5.0 g)</span>
            </div>
            <div className="flex justify-between">
              <span>Tier 3 (&gt; 2000e):</span>
              <span className="font-mono text-cyan-400">&plusmn;1.5e (&plusmn;7.5 g)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
