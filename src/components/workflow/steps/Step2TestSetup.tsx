'use client';

import React, { useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Thermometer,
  Droplets,
  Gauge,
  Building2,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { RegisteredInstrument } from '@/lib/synthetic-instruments';
import { EquipmentAssigned, EnvironmentalSnapshot } from '@/core/test-engine/types';
import { ReferenceStandardsService } from '@/services/repository/reference-standards-service';

export interface TestSetupData {
  environmentalSnapshot: EnvironmentalSnapshot;
  equipmentAssigned: EquipmentAssigned[];
  laboratoryName: string;
  testDate: string;
  testTime: string;
}

interface Step2TestSetupProps {
  instrument: RegisteredInstrument;
  initialData?: Partial<TestSetupData>;
  onNext: (data: TestSetupData) => void;
  onBack: () => void;
}

export const Step2TestSetup: React.FC<Step2TestSetupProps> = ({
  instrument,
  initialData,
  onNext,
  onBack,
}) => {
  const currentDate = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  // General Environmental Conditions (Laboratory ambient room)
  const [temperature, setTemperature] = useState<string>(
    initialData?.environmentalSnapshot?.temperatureC !== undefined && initialData?.environmentalSnapshot?.temperatureC !== null
      ? String(initialData.environmentalSnapshot.temperatureC)
      : ''
  );
  const [humidity, setHumidity] = useState<string>(
    initialData?.environmentalSnapshot?.humidityPercent !== undefined && initialData?.environmentalSnapshot?.humidityPercent !== null
      ? String(initialData.environmentalSnapshot.humidityPercent)
      : ''
  );
  const [pressure, setPressure] = useState<string>(
    initialData?.environmentalSnapshot?.pressureHpa !== undefined && initialData?.environmentalSnapshot?.pressureHpa !== null
      ? String(initialData.environmentalSnapshot.pressureHpa)
      : ''
  );
  const [testDate] = useState<string>(initialData?.testDate ?? currentDate);
  const [testTime] = useState<string>(initialData?.testTime ?? currentTime);
  const [laboratory] = useState<string>(
    initialData?.laboratoryName ?? 'Regional Reference Standard Laboratory, Ahmedabad'
  );

  // Dynamically select ONLY equipment required for this specific instrument & evaluation
  const isClassI = instrument.accuracyClass === 'CLASS_I';
  const isClassII = instrument.accuracyClass === 'CLASS_II';
  const isRolling = instrument.receptorType === 'ROLLING_TRACK';
  const isMobile = instrument.receptorType === 'MOBILE_SCALE';
  const max = instrument.maxCapacity;
  const unit = instrument.primaryUnit;

  // Filtered Required Equipment List
  // Reference Standard selection from Register (Section 4)
  const allStandards = ReferenceStandardsService.getAllStandards();
  const defaultStandardId = isClassI ? 'STD-WT-002' : isClassII ? 'STD-WT-002' : 'STD-WT-001';
  const [selectedStandardId, setSelectedStandardId] = useState<string>(defaultStandardId);
  const selectedStandard = ReferenceStandardsService.getStandardById(selectedStandardId);
  const isSelectedStandardExpired = selectedStandard?.status === 'EXPIRED';
  const requiredEquipment: (EquipmentAssigned & {
    weightClass: string;
    calibratedBy: string;
    traceabilityInfo: string;
    purpose: string;
    isAvailable: boolean;
  })[] = [
    {
      id: isClassI ? 'eq-e1-set' : isClassII ? 'eq-e2-set' : 'eq-f1-set',
      name: isClassI
        ? 'Class E1 High-Precision Standard Mass Set (1 mg to 500 g)'
        : isClassII
        ? `Class E2 Working Standard Mass Set (1 mg to ${max} ${unit})`
        : `Class F1 Stainless Steel Weight Set (1 g to ${max} ${unit})`,
      serialNumber: isClassI ? 'STD-E1-2024-002' : isClassII ? 'STD-E2-2025-019' : 'STD-F1-2024-015',
      certificateNumber: isClassI ? 'NPLI/E1/2025/1102' : isClassII ? 'NPLI/E2/2026/0411' : 'RRSL/F1/2025/084',
      calibrationDate: '2025-04-01',
      calibrationExpiry: '2027-03-31',
      isCalibrated: true,
      isAvailable: true,
      weightClass: isClassI ? 'Class E1' : isClassII ? 'Class E2' : 'Class F1',
      calibratedBy: 'National Physical Laboratory of India (NPLI)',
      traceabilityInfo: 'U ≤ 1/3 MPE per OIML R 76-1 Clause 3.7.1',
      purpose: 'Weighing, Repeatability, and Eccentricity standard loads',
    },
    {
      id: 'eq-ptu',
      name: 'Vaisala PTU300 Barometric, Temperature & Humidity Transmitter',
      serialNumber: 'HYGRO-PTU300-09',
      certificateNumber: 'NPLI/ENV/2025/8812',
      calibrationDate: '2025-06-15',
      calibrationExpiry: '2027-06-14',
      isCalibrated: true,
      isAvailable: true,
      weightClass: 'Reference Environmental Sensor',
      calibratedBy: 'Vaisala Metrology Center (Accredited)',
      traceabilityInfo: 'U = 0.15 °C, 1.0% RH, 0.10 hPa',
      purpose: 'Laboratory ambient condition monitoring per Clause A.4.1',
    },
  ];

  // If rolling track, add rolling load standard axle
  if (isRolling) {
    requiredEquipment.push({
      id: 'eq-rolling-axle',
      name: 'Standard Calibrated Rolling Axle Load Fixture (10 t to 20 t)',
      serialNumber: 'ROLL-AXLE-2023-01',
      certificateNumber: 'RRSL/AXLE/2024/091',
      calibrationDate: '2024-08-10',
      calibrationExpiry: '2026-10-31',
      isCalibrated: true,
      isAvailable: true,
      weightClass: 'Axle Load Standard',
      calibratedBy: 'Central Metrology Testing Center',
      traceabilityInfo: 'U = 0.05% of applied axle load',
      purpose: 'Clause A.4.7.4 Rolling-load eccentricity test',
    });
  }

  // If mobile scale, add tilting table & orientation rig
  if (isMobile) {
    requiredEquipment.push({
      id: 'eq-tilt-table',
      name: 'Precision Inclination & Tilting Table with Inclinometer',
      serialNumber: 'TILT-TAB-2024-04',
      certificateNumber: 'RRSL/TILT/2025/012',
      calibrationDate: '2025-02-15',
      calibrationExpiry: '2027-02-14',
      isCalibrated: true,
      isAvailable: true,
      weightClass: 'Angular Inclination Rig',
      calibratedBy: 'National Metrology Institute',
      traceabilityInfo: 'Angular uncertainty U = 0.02°',
      purpose: 'Clause A.4.7.5 & A.5.1 Tilting and orientation evaluation',
    });
  }

  // If electronic, add precision programmable voltage source
  requiredEquipment.push({
    id: 'eq-voltage-source',
    name: 'Chroma 61602 Programmable AC/DC Power Source & Multimeter',
    serialNumber: 'PWR-CHROMA-4011',
    certificateNumber: 'RRSL/ELEC/2025/044',
    calibrationDate: '2025-05-20',
    calibrationExpiry: '2027-05-19',
    isCalibrated: true,
    isAvailable: true,
    weightClass: 'Calibrated Voltage Standard',
    calibratedBy: 'ERTL Western Region (NABL Accredited)',
    traceabilityInfo: 'Voltage accuracy ±0.1 V (Clause A.5.4)',
    purpose: 'Clause A.5.4 Voltage variations & battery cut-off testing',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({
      environmentalSnapshot: {
        temperatureC: temperature !== '' ? parseFloat(temperature) : 20.0,
        humidityPercent: humidity !== '' ? parseFloat(humidity) : 50.0,
        pressureHpa: pressure !== '' ? parseFloat(pressure) : 1013.0,
        recordedAt: new Date().toISOString(),
      },
      equipmentAssigned: requiredEquipment,
      laboratoryName: laboratory,
      testDate,
      testTime,
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
            Step 2 of 6 &bull; Test Setup
          </span>
          <span className="text-xs text-slate-500 font-medium">
            Combined Environmental Conditions &amp; Required Equipment
          </span>
        </div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Test Setup &amp; Calibration Traceability
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          General laboratory environment and equipment specifically required for{' '}
          <strong className="text-slate-800">{instrument.modelName}</strong> ({instrument.accuracyClass.replace('_', ' ')}).
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ========================================================================= */}
        {/* SECTION 1: GENERAL LABORATORY CONDITIONS */}
        {/* ========================================================================= */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-blue-700" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                General Laboratory Conditions
              </h2>
            </div>
            <span className="text-[11px] text-slate-500">
              OIML R 76-1 Clause A.4.1 Ambient Conditions
            </span>
          </div>

          {/* Auto-populated metadata bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Laboratory</span>
                <span className="font-semibold text-slate-800 truncate block">{laboratory}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Evaluation Date</span>
                <span className="font-mono font-medium text-slate-800">{testDate}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Session Time</span>
                <span className="font-mono font-medium text-slate-800">{testTime} IST</span>
              </div>
            </div>
          </div>

          {/* Ambient Condition Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-blue-700" />
                <span>Ambient Temperature (&deg;C)</span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                required
                placeholder="e.g. 20.0"
                value={temperature}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^-?\d*\.?\d*$/.test(val)) setTemperature(val);
                }}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Standard range: 20 &deg;C &plusmn; 5 &deg;C (Clause A.4.1)
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-blue-700" />
                <span>Relative Humidity (% RH)</span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                required
                placeholder="e.g. 50.0"
                value={humidity}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^-?\d*\.?\d*$/.test(val)) setHumidity(val);
                }}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Permissible ambient: 30% to 70% RH
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-blue-700" />
                <span>Atmospheric Pressure (hPa)</span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                required
                placeholder="e.g. 1013.2"
                value={pressure}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^-?\d*\.?\d*$/.test(val)) setPressure(val);
                }}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Nominal station barometric pressure
              </span>
            </div>
          </div>

          {/* Informational Guidance Note */}
          <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-lg text-xs text-blue-800 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Notice on test-specific environmental changes:</strong> Environmental conditions that change for specific tests (such as static temperature extremes at +40&deg;C or -10&deg;C, or damp heat at 85% RH) are recorded directly inside those respective test workspaces.
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: REQUIRED REFERENCE STANDARDS & EQUIPMENT */}
        {/* ========================================================================= */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Reference Equipment &amp; Calibrated Standards
                </h2>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Select from laboratory reference standards register per OIML R 76-1 Clause 3.7.1. Avoids manual transcription.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {!isSelectedStandardExpired ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Standard Calibrated &amp; Valid
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-800 bg-red-50 px-2.5 py-1 rounded border border-red-200 animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                  Standard Expired
                </span>
              )}
            </div>
          </div>

          {/* Reference Standard Selector (Section 4 requirement) */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-800">
                Primary Reference Mass Standard:
              </label>
              <select
                value={selectedStandardId}
                onChange={(e) => setSelectedStandardId(e.target.value)}
                className="text-xs p-2 bg-white border border-slate-200 rounded-md font-medium text-slate-800 focus:ring-1 focus:ring-blue-600 focus:border-blue-600 min-w-[280px]"
              >
                {allStandards.map((std) => (
                  <option key={std.standardId} value={std.standardId}>
                    {std.standardId} — {std.description} [{std.status}]
                  </option>
                ))}
              </select>
            </div>

            {selectedStandard && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/80 text-[11px] font-sans">
                <div>
                  <span className="text-slate-400 block text-[10px]">Certificate No:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedStandard.certificateNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Calibrated By:</span>
                  <span className="text-slate-700 truncate block">{selectedStandard.calibrationProvider}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Valid Until:</span>
                  <span className={`font-mono font-bold ${selectedStandard.status === 'EXPIRED' ? 'text-red-700' : 'text-slate-800'}`}>
                    {selectedStandard.validUntil}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Uncertainty:</span>
                  <span className="font-mono text-slate-700">{selectedStandard.uncertainty}</span>
                </div>
              </div>
            )}
          </div>

          {/* Validity Warning Banner (Section 4 requirement) */}
          {isSelectedStandardExpired && (
            <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-r-md text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-red-800">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="tracking-wide uppercase">REFERENCE STANDARD EXPIRED</span>
              </div>
              <p className="text-red-900 leading-snug">
                Reference standard <strong>{selectedStandard?.standardId}</strong> ({selectedStandard?.description}) has expired calibration ({selectedStandard?.validUntil}).
              </p>
              <p className="text-[11px] text-red-700 font-medium">
                Where policy requires a valid reference standard, laboratory evaluations cannot proceed with an expired standard. Please select a calibrated reference standard from the dropdown above.
              </p>
            </div>
          )}

          {/* Additional Required Equipment Cards */}
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
            {requiredEquipment.map((eq) => (
              <div key={eq.id} className="p-4 bg-white hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs">
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900">{eq.name}</span>
                    <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                      SN: {eq.serialNumber}
                    </span>
                    <span className="text-[10px] bg-blue-50 text-blue-800 font-semibold px-1.5 py-0.5 rounded border border-blue-100">
                      {eq.weightClass}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                    <span>
                      Certificate: <strong className="font-mono text-slate-800">{eq.certificateNumber}</strong>
                    </span>
                    <span>Calibrated by: <strong>{eq.calibratedBy}</strong></span>
                    <span>Traceability: <strong className="text-slate-800">{eq.traceabilityInfo}</strong></span>
                  </div>

                  <div className="text-[11px] text-slate-500 italic">
                    Purpose: {eq.purpose}
                  </div>
                </div>

                <div className="shrink-0 flex sm:flex-col items-end justify-between sm:justify-start gap-1">
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Valid until {eq.calibrationExpiry}
                  </span>
                  <span className="text-[10px] text-slate-400 font-sans">
                    Available in Lab
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded text-xs font-medium transition-colors"
          >
            &larr; Back to Instrument
          </button>

          <button
            type="submit"
            disabled={isSelectedStandardExpired}
            className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded text-xs font-semibold shadow-xs transition-colors ${
              isSelectedStandardExpired
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-blue-700 hover:bg-blue-800 text-white'
            }`}
          >
            <span>Confirm Setup &amp; View Test Plan</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
