'use client';

import React, { useState } from 'react';
import { ArrowRight, ChevronDown, ChevronRight, CheckCircle2, ShieldCheck, Scale } from 'lucide-react';
import { RegisteredInstrument } from '../InstrumentSelector';

interface Step1Props {
  instrument: RegisteredInstrument;
  onNext: () => void;
  onBack: () => void;
}

export const Step1Instrument: React.FC<Step1Props> = ({ instrument, onNext, onBack }) => {
  const [showMoreDetails, setShowMoreDetails] = useState(false);

  const unit = instrument.primaryUnit || 'kg';
  const multiplier = unit === 'kg' ? 1000 : 1;
  const smallUnit = unit === 'kg' ? 'g' : 'mg';

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              Step 1 of 6 &bull; Instrument
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 font-medium">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Stored Specimen Verified
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Instrument Specification
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Parameters retrieved from laboratory registry for Serial Number:{' '}
            <strong className="font-mono text-slate-900">{instrument.serialNumber}</strong>. No re-entry required.
          </p>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="text-xs text-slate-600 hover:text-slate-900 font-medium px-3 py-1.5 border border-slate-300 rounded hover:bg-slate-50 shrink-0 self-start sm:self-center"
        >
          Change Specimen
        </button>
      </div>

      {/* Primary Instrument Information Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Scale className="w-4 h-4 text-blue-700" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Primary Metrological Information
            </h2>
          </div>

          {/* Top row: Identification */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-5 border-b border-slate-100 text-xs">
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
              <span className="text-[11px] text-slate-500 uppercase tracking-wider font-medium block mb-1">
                Manufacturer
              </span>
              <span className="font-semibold text-slate-900 text-sm block">{instrument.manufacturer}</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
              <span className="text-[11px] text-slate-500 uppercase tracking-wider font-medium block mb-1">
                Model Name
              </span>
              <span className="font-semibold text-slate-900 text-sm block">{instrument.modelName}</span>
              {instrument.tradeName && (
                <span className="text-[11px] text-slate-500 block mt-0.5">{instrument.tradeName}</span>
              )}
            </div>

            <div className="bg-blue-50/60 p-3.5 rounded-lg border border-blue-100">
              <span className="text-[11px] text-blue-700 uppercase tracking-wider font-semibold block mb-1">
                Serial Number
              </span>
              <span className="font-mono font-bold text-blue-900 text-sm block">{instrument.serialNumber}</span>
              <span className="text-[10px] text-blue-600 block mt-0.5">Physical Sample ID</span>
            </div>
          </div>

          {/* Key Metrological Characteristics */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-5 text-xs">
            <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs">
              <span className="text-[11px] text-slate-500 block mb-1">Accuracy Class</span>
              <span className="font-bold text-blue-800 text-base">
                {instrument.accuracyClass.replace('_', ' ')}
              </span>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs">
              <span className="text-[11px] text-slate-500 block mb-1">Maximum Capacity (Max)</span>
              <span className="font-bold text-slate-900 text-base">
                {instrument.maxCapacity} <span className="text-xs font-normal text-slate-500">{unit}</span>
              </span>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs">
              <span className="text-[11px] text-slate-500 block mb-1">Minimum Capacity (Min)</span>
              <span className="font-bold text-slate-900 text-base">
                {instrument.minCapacity} <span className="text-xs font-normal text-slate-500">{unit}</span>
              </span>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs">
              <span className="text-[11px] text-slate-500 block mb-1">Verification Interval (e)</span>
              <span className="font-bold text-slate-900 text-base">
                {instrument.verificationInterval_e * multiplier}{' '}
                <span className="text-xs font-normal text-slate-500">{smallUnit}</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono block">
                ({instrument.verificationInterval_e} {unit})
              </span>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs">
              <span className="text-[11px] text-slate-500 block mb-1">Scale Interval (d)</span>
              <span className="font-bold text-slate-900 text-base">
                {instrument.scaleInterval_d * multiplier}{' '}
                <span className="text-xs font-normal text-slate-500">{smallUnit}</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono block">
                ({instrument.scaleInterval_d} {unit})
              </span>
            </div>
          </div>
        </div>

        {/* Collapsible: More Instrument Details */}
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setShowMoreDetails(!showMoreDetails)}
            className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/80 flex items-center justify-between text-xs font-semibold text-slate-700 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-500" />
              More instrument details
              <span className="text-[11px] font-normal text-slate-500">
                (Range type, tare mechanism, power supply, software version, receptor)
              </span>
            </span>
            {showMoreDetails ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
          </button>

          {showMoreDetails && (
            <div className="p-4 bg-white border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px] mb-0.5">Verification Interval Count (n)</span>
                <span className="font-mono font-semibold text-slate-900">
                  n = {instrument.numberOfIntervals_n} divisions
                </span>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px] mb-0.5">Weighing Range Type</span>
                <span className="font-semibold text-slate-900">
                  {instrument.rangeType === 'SINGLE' ? 'Single Interval' : 'Multi-Interval / Range'}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px] mb-0.5">Tare Device</span>
                <span className="font-semibold text-slate-900">{instrument.tareType} Tare</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px] mb-0.5">Load Receptor Mechanism</span>
                <span className="font-semibold text-slate-900">
                  {instrument.receptorType.replace(/_/g, ' ')}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px] mb-0.5">Power Supply Arrangement</span>
                <span className="font-semibold text-slate-900">{instrument.powerSupply}</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px] mb-0.5">Operating Temperature Limits</span>
                <span className="font-semibold text-slate-900">{instrument.temperatureRange}</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px] mb-0.5">Firmware / Software Identification</span>
                <span className="font-mono font-semibold text-slate-900">{instrument.softwareVersion}</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px] mb-0.5">Primary Measurement Unit</span>
                <span className="font-semibold text-slate-900 uppercase">{unit}</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px] mb-0.5">Leveling &amp; Zero Facilities</span>
                <span className="font-semibold text-slate-900">Spirit bubble + Semi-automatic zero-setting</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded text-xs font-medium transition-colors"
        >
          &larr; Back to Selection
        </button>

        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium shadow-xs transition-colors cursor-pointer"
        >
          <span>Confirm &amp; Proceed to Test Setup</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
