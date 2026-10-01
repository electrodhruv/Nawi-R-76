'use client';

import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Thermometer, Droplets, Gauge, Calendar, Clock, Building2 } from 'lucide-react';

interface Step2Props {
  onNext: (conditions: LabConditionsData) => void;
  onBack: () => void;
  initialData?: Partial<LabConditionsData>;
}

export interface LabConditionsData {
  temperatureCelsius: number;
  humidityPercent: number;
  pressureHpa: number;
  testDate: string;
  testTime: string;
  laboratoryName: string;
}

export const Step2LabConditions: React.FC<Step2Props> = ({ onNext, onBack, initialData }) => {
  const [temperature, setTemperature] = useState(initialData?.temperatureCelsius ?? 21.4);
  const [humidity, setHumidity] = useState(initialData?.humidityPercent ?? 52.0);
  const [pressure, setPressure] = useState(initialData?.pressureHpa ?? 1013.2);
  const [testDate, setTestDate] = useState(initialData?.testDate ?? '2026-09-27');
  const [testTime, setTestTime] = useState(initialData?.testTime ?? '10:00');
  const [laboratory, setLaboratory] = useState(
    initialData?.laboratoryName ?? 'Regional Reference Standard Laboratory, Ahmedabad'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({
      temperatureCelsius: temperature,
      humidityPercent: humidity,
      pressureHpa: pressure,
      testDate,
      testTime,
      laboratoryName: laboratory,
    });
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Instrument</span>
          </button>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Step 2: Laboratory Conditions</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Record environmental test room parameters per OIML R 76-1 Clause A.4.1
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Temperature */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5 text-blue-700" />
              <span>Ambient Temperature (&deg;C)</span>
            </label>
            <input
              type="number"
              step="0.1"
              required
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:border-blue-600"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">OIML reference: 20 &deg;C &plusmn; 5 &deg;C</span>
          </div>

          {/* Humidity */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-blue-700" />
              <span>Relative Humidity (% RH)</span>
            </label>
            <input
              type="number"
              step="0.5"
              required
              value={humidity}
              onChange={(e) => setHumidity(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:border-blue-600"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">Laboratory range: 30% to 70%</span>
          </div>

          {/* Atmospheric Pressure */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-blue-700" />
              <span>Atmospheric Pressure (hPa)</span>
            </label>
            <input
              type="number"
              step="0.1"
              required
              value={pressure}
              onChange={(e) => setPressure(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:border-blue-600"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">Barometric sensor: Vaisala PTU300</span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Test Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Test Execution Date</span>
            </label>
            <input
              type="date"
              required
              value={testDate}
              onChange={(e) => setTestDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>

          {/* Test Time */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Observation Time</span>
            </label>
            <input
              type="time"
              required
              value={testTime}
              onChange={(e) => setTestTime(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>

          {/* Testing Laboratory */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Testing Facility</span>
            </label>
            <input
              type="text"
              required
              value={laboratory}
              onChange={(e) => setLaboratory(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded text-xs font-medium transition-colors"
          >
            Back
          </button>

          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold shadow-xs transition-colors"
          >
            <span>Proceed to Test Equipment</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
