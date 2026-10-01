'use client';

import React, { useState } from 'react';
import {
  X,
  Scale,
  Camera,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  FileText,
  ShieldCheck,
  Plus,
  Trash2,
  HelpCircle,
} from 'lucide-react';
import {
  AccuracyClassType,
  InstrumentCategory,
  ModelSupportingDocument,
  RangeType,
  ReceptorType,
  RegisterSpecimenInput,
  TareType,
} from '@/services/repository/instrument-types';
import { InstrumentRepositoryService } from '@/services/repository/instrument-repository-service';
import { RegisteredInstrument } from '@/lib/synthetic-instruments';
import { computeSha256Hex } from '@/services/evidence/evidence-crypto';

interface InstrumentIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegistered: (newInstrument: RegisteredInstrument) => void;
}

interface NameplateOcrCandidate {
  scannedSerial: string;
  scannedManufacturer: string;
  scannedModel: string;
  scannedMax: string;
  scannedMin: string;
  scannedE: string;
  confidence: number;
}

export const InstrumentIntakeModal: React.FC<InstrumentIntakeModalProps> = ({
  isOpen,
  onClose,
  onRegistered,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [error, setError] = useState<string | null>(null);
  const [duplicateExisting, setDuplicateExisting] = useState<RegisteredInstrument | null>(null);
  const [serialCheckWarning, setSerialCheckWarning] = useState<string | null>(null);

  // Form State - Identity
  const [serialNumber, setSerialNumber] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [modelName, setModelName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [category, setCategory] = useState<InstrumentCategory>('BENCH');

  // Metrological
  const [accuracyClass, setAccuracyClass] = useState<AccuracyClassType>('CLASS_III');
  const [maxCapacity, setMaxCapacity] = useState('15.0');
  const [minCapacity, setMinCapacity] = useState('0.1');
  const [interval_e, setInterval_e] = useState('0.005');
  const [interval_d, setInterval_d] = useState('0.005');
  const [primaryUnit, setPrimaryUnit] = useState('kg');
  const [rangeType, setRangeType] = useState<RangeType>('SINGLE');
  const [tareType, setTareType] = useState<TareType>('SUBTRACTIVE');

  // Configuration
  const [powerSupply, setPowerSupply] = useState('230 V AC Mains + 6V Internal Battery');
  const [temperatureRange, setTemperatureRange] = useState('-10 °C to +40 °C');
  const [receptorType, setReceptorType] = useState<ReceptorType>('STANDARD_PAN');
  const [softwareVersion, setSoftwareVersion] = useState('v1.0.0');
  const [firmwareVersion, setFirmwareVersion] = useState('FW-2026-01');
  const [hasAutoLeveling, setHasAutoLeveling] = useState(false);
  const [specialNotes, setSpecialNotes] = useState('');

  // Documents
  const [supportingDocs, setSupportingDocs] = useState<ModelSupportingDocument[]>([
    {
      id: 'doc-initial-01',
      title: 'Operating & Technical Service Manual',
      fileName: 'Apex_B6_Manual_v1.0.pdf',
      documentType: 'MANUAL',
      version: 'v1.0',
      source: 'MANUFACTURER',
      uploadDate: new Date().toISOString().split('T')[0],
      approvalStatus: 'APPROVED',
      isApprovedForGuidance: true,
    },
  ]);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocType, setNewDocType] = useState<ModelSupportingDocument['documentType']>('DRAWING');
  const [newDocVersion, setNewDocVersion] = useState('');
  const [showAddDocForm, setShowAddDocForm] = useState(false);

  // Evidence - Identity Purpose
  const [completePhotoUrl, setCompletePhotoUrl] = useState<string | null>(null);
  const [nameplatePhotoUrl, setNameplatePhotoUrl] = useState<string | null>(null);
  const [completePhotoHash, setCompletePhotoHash] = useState<string | null>(null);
  const [nameplatePhotoHash, setNameplatePhotoHash] = useState<string | null>(null);

  // Advisory Nameplate OCR
  const [ocrCandidate, setOcrCandidate] = useState<NameplateOcrCandidate | null>(null);
  const [showOcrComparison, setShowOcrComparison] = useState(false);

  // Immediate serial uniqueness check
  const handleSerialChange = (value: string) => {
    setSerialNumber(value);
    const clean = value.trim();
    if (clean.length > 2) {
      const check = InstrumentRepositoryService.checkSerialExists(clean);
      if (check.exists && check.specimen && check.model) {
        const existing = InstrumentRepositoryService.toRegisteredInstrument(check.specimen, check.model);
        setDuplicateExisting(existing);
        setSerialCheckWarning(`Specimen with Serial "${clean}" already exists in repository.`);
      } else {
        setDuplicateExisting(null);
        setSerialCheckWarning(null);
      }
    } else {
      setDuplicateExisting(null);
      setSerialCheckWarning(null);
    }
  };

  const calculated_n =
    parseFloat(maxCapacity) > 0 && parseFloat(interval_e) > 0
      ? Math.round(parseFloat(maxCapacity) / parseFloat(interval_e))
      : 0;

  // Advisory Nameplate Scan (Section 6)
  const handleSimulateScanNameplate = async (mismatchDemo = false) => {
    const candidate: NameplateOcrCandidate = mismatchDemo
      ? {
          scannedSerial: 'SN-DEMO-MISMATCH-999',
          scannedManufacturer: 'Precision Metrology Systems Inc.',
          scannedModel: 'LabWeigh-Pro-500-X',
          scannedMax: '30.0',
          scannedMin: '0.2',
          scannedE: '0.010',
          confidence: 0.94,
        }
      : {
          scannedSerial: serialNumber.trim() || 'SN-LAB-2026-08',
          scannedManufacturer: manufacturer.trim() || 'Precision Metrology Systems',
          scannedModel: modelName.trim() || 'LabWeigh-Pro-500',
          scannedMax: maxCapacity || '15.0',
          scannedMin: minCapacity || '0.1',
          scannedE: interval_e || '0.005',
          confidence: 0.98,
        };

    setOcrCandidate(candidate);
    setShowOcrComparison(true);
    setNameplatePhotoUrl('/demo-evidence/bench_scale_nameplate.jpg');
    const hash = await computeSha256Hex('/demo-evidence/bench_scale_nameplate.jpg');
    setNameplatePhotoHash(hash);
  };

  const handleApplyOcrToForm = () => {
    if (!ocrCandidate) return;
    setSerialNumber(ocrCandidate.scannedSerial);
    setManufacturer(ocrCandidate.scannedManufacturer);
    setModelName(ocrCandidate.scannedModel);
    setMaxCapacity(ocrCandidate.scannedMax);
    setMinCapacity(ocrCandidate.scannedMin);
    setInterval_e(ocrCandidate.scannedE);
    setInterval_d(ocrCandidate.scannedE);
    handleSerialChange(ocrCandidate.scannedSerial);
    setShowOcrComparison(false);
  };

  const handleAttachCompletePhoto = async () => {
    const url = '/demo-evidence/bench_scale_full.jpg';
    setCompletePhotoUrl(url);
    const hash = await computeSha256Hex(url);
    setCompletePhotoHash(hash);
  };

  const handleAddSupportingDocument = () => {
    if (!newDocTitle.trim()) return;
    const sanitizedTitle = newDocTitle.trim();
    const newDoc: ModelSupportingDocument = {
      id: `doc-${Date.now()}`,
      title: sanitizedTitle,
      fileName: `${sanitizedTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}.pdf`,
      documentType: newDocType,
      version: newDocVersion.trim() || undefined,
      source: 'APPLICANT',
      uploadDate: new Date().toISOString().split('T')[0],
      approvalStatus: 'PENDING',
      isApprovedForGuidance: false,
    };
    setSupportingDocs([...supportingDocs, newDoc]);
    setNewDocTitle('');
    setNewDocVersion('');
    setShowAddDocForm(false);
  };

  const handleRemoveSupportingDoc = (id: string) => {
    setSupportingDocs(supportingDocs.filter((d) => d.id !== id));
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDuplicateExisting(null);

    // Final serial check
    const check = InstrumentRepositoryService.checkSerialExists(serialNumber.trim());
    if (check.exists && check.specimen && check.model) {
      setError(`Cannot register specimen: Serial "${serialNumber.trim()}" already exists in laboratory database.`);
      setDuplicateExisting(InstrumentRepositoryService.toRegisteredInstrument(check.specimen, check.model));
      return;
    }

    const input: RegisterSpecimenInput = {
      serialNumber: serialNumber.trim(),
      manufacturer: manufacturer.trim(),
      modelName: modelName.trim(),
      tradeName: tradeName.trim() || undefined,
      instrumentCategory: category,
      accuracyClass,
      maxCapacity: parseFloat(maxCapacity),
      minCapacity: parseFloat(minCapacity),
      verificationInterval_e: parseFloat(interval_e),
      scaleInterval_d: parseFloat(interval_d),
      primaryUnit,
      rangeType,
      tareType,
      powerSupply,
      temperatureRange,
      receptorType,
      softwareVersion,
      firmwareVersion,
      hasAutomaticLeveling: hasAutoLeveling,
      specialConfigurationNotes: specialNotes,
      supportingDocuments: supportingDocs,
      completeInstrumentPhotoUrl: completePhotoUrl || undefined,
      nameplatePhotoUrl: nameplatePhotoUrl || undefined,
      scannedOcrSerial: ocrCandidate?.scannedSerial,
      scannedOcrModel: ocrCandidate?.scannedModel,
      scannedOcrManufacturer: ocrCandidate?.scannedManufacturer,
      scannedOcrMax: ocrCandidate?.scannedMax,
      scannedOcrMin: ocrCandidate?.scannedMin,
      scannedOcrE: ocrCandidate?.scannedE,
      intakeOfficer: 'Dr. A. Sharma (Testing Officer)',
    };

    const res = InstrumentRepositoryService.registerNewSpecimen(input);

    if (!res.success) {
      setError(res.error || 'Registration failed.');
      if (res.duplicateFound && res.specimen && res.model) {
        setDuplicateExisting(
          InstrumentRepositoryService.toRegisteredInstrument(res.specimen, res.model)
        );
      }
      return;
    }

    if (res.specimen && res.model) {
      const regInst = InstrumentRepositoryService.toRegisteredInstrument(res.specimen, res.model);
      onRegistered(regInst);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">Register Instrument</h2>
              <p className="text-[11px] text-slate-400">Instrument Registration &amp; Metrological Configuration</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex items-center justify-between text-xs font-medium text-slate-600 shrink-0">
          <span className={step === 1 ? 'font-bold text-blue-700' : ''}>1. Identity</span>
          <span>&rarr;</span>
          <span className={step === 2 ? 'font-bold text-blue-700' : ''}>2. Metrology</span>
          <span>&rarr;</span>
          <span className={step === 3 ? 'font-bold text-blue-700' : ''}>3. Configuration</span>
          <span>&rarr;</span>
          <span className={step === 4 ? 'font-bold text-blue-700' : ''}>4. Documents</span>
          <span>&rarr;</span>
          <span className={step === 5 ? 'font-bold text-blue-700' : ''}>5. Identity Evidence</span>
        </div>

        {/* Duplicate Serial Alert (Immediate Check - Section 5) */}
        {serialCheckWarning && duplicateExisting && (
          <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 flex items-start justify-between gap-3 shrink-0">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Duplicate Instrument Detected</p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Serial number <strong className="font-mono">{duplicateExisting.serialNumber}</strong> is already registered ({duplicateExisting.modelName} &bull; {duplicateExisting.manufacturer}). Duplicate creation is prohibited.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onRegistered(duplicateExisting);
                    onClose();
                  }}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded text-xs font-semibold shadow-xs"
                >
                  <span>Open Existing Instrument</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-start justify-between gap-2 shrink-0">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{error}</p>
              </div>
            </div>
            <button type="button" onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step Contents */}
        <div className="p-6 overflow-y-auto flex-1 text-xs space-y-4">
          {/* STEP 1: IDENTITY */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-800 text-sm">Step 1: Instrument Identity &amp; Model Information</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Physical Serial Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={serialNumber}
                    onChange={(e) => handleSerialChange(e.target.value)}
                    placeholder="e.g. SN-LAB-2026-99"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded font-mono text-xs focus:outline-none focus:border-blue-600"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Must be unique per physical instrument.
                  </span>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Manufacturer *
                  </label>
                  <input
                    type="text"
                    required
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                    placeholder="e.g. Mettler Benchmark Instruments"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Model Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    placeholder="e.g. Precision-Bench-B6"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Trade Designation
                  </label>
                  <input
                    type="text"
                    value={tradeName}
                    onChange={(e) => setTradeName(e.target.value)}
                    placeholder="e.g. High-Resolution Bench Scale"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-medium text-slate-700 mb-1">
                    Instrument Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as InstrumentCategory)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:border-blue-600"
                  >
                    <option value="BENCH">Bench Scale (Countertop)</option>
                    <option value="PLATFORM">Platform Scale</option>
                    <option value="WEIGHBRIDGE">Vehicle Weighbridge (Rolling Track)</option>
                    <option value="RETAIL">Retail Price-Computing Scale</option>
                    <option value="LABORATORY">High-Precision Laboratory Balance</option>
                    <option value="CRANE">Crane / Mobile Suspended Scale</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: METROLOGICAL */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-800 text-sm">Step 2: Metrological Characteristics</span>
                <p className="text-[11px] text-slate-500">
                  OIML R 76-1 Clause 3 classification and capacity limits
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Accuracy Class</label>
                  <select
                    value={accuracyClass}
                    onChange={(e) => setAccuracyClass(e.target.value as AccuracyClassType)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:border-blue-600"
                  >
                    <option value="CLASS_I">Class I (Special Accuracy)</option>
                    <option value="CLASS_II">Class II (High Accuracy)</option>
                    <option value="CLASS_III">Class III (Medium Accuracy)</option>
                    <option value="CLASS_IIII">Class IIII (Ordinary Accuracy)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Primary Unit</label>
                  <input
                    type="text"
                    value={primaryUnit}
                    onChange={(e) => setPrimaryUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Range Type</label>
                  <select
                    value={rangeType}
                    onChange={(e) => setRangeType(e.target.value as RangeType)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs"
                  >
                    <option value="SINGLE">Single Interval</option>
                    <option value="MULTI_INTERVAL">Multi-Interval</option>
                    <option value="MULTI_RANGE">Multiple Range</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Max Capacity (Max)</label>
                  <input
                    type="number"
                    step="any"
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Min Capacity (Min)</label>
                  <input
                    type="number"
                    step="any"
                    value={minCapacity}
                    onChange={(e) => setMinCapacity(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Verification Interval (e)</label>
                  <input
                    type="number"
                    step="any"
                    value={interval_e}
                    onChange={(e) => setInterval_e(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Actual Interval (d)</label>
                  <input
                    type="number"
                    step="any"
                    value={interval_d}
                    onChange={(e) => setInterval_d(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Tare Type</label>
                  <select
                    value={tareType}
                    onChange={(e) => setTareType(e.target.value as TareType)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs"
                  >
                    <option value="SUBTRACTIVE">Subtractive Tare</option>
                    <option value="ADDITIVE">Additive Tare</option>
                  </select>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded p-2.5 flex flex-col justify-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Calculated Intervals (n)</span>
                  <span className="text-base font-bold text-slate-900 font-mono">
                    {calculated_n > 0 ? calculated_n.toLocaleString() : '—'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: CONFIGURATION */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-800 text-sm">Step 3: Hardware &amp; Environmental Configuration</span>
                <p className="text-[11px] text-slate-500">
                  Feeds dynamic test plan applicability (e.g. rolling eccentricity, tilting, battery voltage)
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Load Receptor Type *</label>
                  <select
                    value={receptorType}
                    onChange={(e) => setReceptorType(e.target.value as ReceptorType)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs"
                  >
                    <option value="STANDARD_PAN">Standard Stationary Pan / Platform</option>
                    <option value="ROLLING_TRACK">Rolling Track / Rail Weighbridge (Axle Test)</option>
                    <option value="MOBILE_SCALE">Mobile / Suspended / Crane Scale</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Power Supply Specification *</label>
                  <input
                    type="text"
                    value={powerSupply}
                    onChange={(e) => setPowerSupply(e.target.value)}
                    placeholder="e.g. 230 V AC Mains + 6V Battery"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Operating Temperature Range *</label>
                  <input
                    type="text"
                    value={temperatureRange}
                    onChange={(e) => setTemperatureRange(e.target.value)}
                    placeholder="e.g. -10 °C to +40 °C"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Software / Firmware Identification</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={softwareVersion}
                      onChange={(e) => setSoftwareVersion(e.target.value)}
                      placeholder="SW e.g. v2.1.0"
                      className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                    />
                    <input
                      type="text"
                      value={firmwareVersion}
                      onChange={(e) => setFirmwareVersion(e.target.value)}
                      placeholder="FW e.g. FW-042"
                      className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2 flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded">
                  <input
                    type="checkbox"
                    id="autoLevel"
                    checked={hasAutoLeveling}
                    onChange={(e) => setHasAutoLeveling(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <label htmlFor="autoLevel" className="text-xs text-slate-700 cursor-pointer">
                    <strong>Instrument possesses automatic self-leveling mechanism</strong> (Exempts instrument from manual tilt test per Clause A.5.1)
                  </label>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-medium text-slate-700 mb-1">Special Configuration Notes</label>
                  <textarea
                    rows={2}
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                    placeholder="Special registration notes, auxiliary interface ports, dual display setup..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: SUPPORTING DOCUMENTS (Section 9) */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <span className="font-bold text-slate-800 text-sm">Step 4: Supporting Technical Documentation</span>
                  <p className="text-[11px] text-slate-500">
                    Attach manual, technical specifications, drawings, and prior calibration certificates
                  </p>
                </div>
                {!showAddDocForm && (
                  <button
                    type="button"
                    onClick={() => setShowAddDocForm(true)}
                    className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-semibold hover:bg-blue-100 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Document</span>
                  </button>
                )}
              </div>

              {/* Add Document Sub-form */}
              {showAddDocForm && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs">Add Supporting Document</span>
                    <button
                      type="button"
                      onClick={() => setShowAddDocForm(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-medium text-slate-700 mb-0.5">Document Title *</label>
                      <input
                        type="text"
                        value={newDocTitle}
                        onChange={(e) => setNewDocTitle(e.target.value)}
                        placeholder="e.g. Schematic Drawing & Sealing Diagram"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-0.5">Type</label>
                      <select
                        value={newDocType}
                        onChange={(e) => setNewDocType(e.target.value as ModelSupportingDocument['documentType'])}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                      >
                        <option value="MANUAL">Operating Manual</option>
                        <option value="DRAWING">Technical Drawing</option>
                        <option value="CERTIFICATE">Previous Certificate</option>
                        <option value="TECHNICAL_SPEC">Technical Specification</option>
                        <option value="OTHER">Other Approved Document</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddDocForm(false)}
                      className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddSupportingDocument}
                      className="px-3 py-1 bg-blue-700 text-white rounded text-xs font-semibold hover:bg-blue-800"
                    >
                      Attach Document
                    </button>
                  </div>
                </div>
              )}

              {/* Documents List */}
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden bg-white">
                {supportingDocs.length > 0 ? (
                  supportingDocs.map((doc) => (
                    <div key={doc.id} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                        <div>
                          <div className="font-semibold text-slate-900 text-xs">{doc.title}</div>
                          <div className="text-[10px] text-slate-400">
                            Type: {doc.documentType} &bull; Source: {doc.source || 'MANUFACTURER'} &bull; Uploaded: {doc.uploadDate} &bull; Status: {doc.approvalStatus}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSupportingDoc(doc.id)}
                        className="text-slate-400 hover:text-red-600 p-1"
                        title="Remove document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-slate-400 italic text-xs">
                    No supporting documents attached. Documents are optional during registration.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: INSTRUMENT IDENTITY EVIDENCE (Sections 10, 25) */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 text-sm">Step 5: Instrument Identity Evidence</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    PURPOSE: IDENTITY
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Identity evidence establishes physical instrument custody. It does not certify measurement performance.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50 flex flex-col items-center justify-center text-center">
                  <span className="font-semibold text-slate-700 text-xs mb-2">Complete Instrument Photograph *</span>
                  {completePhotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={completePhotoUrl}
                      alt="Instrument"
                      className="w-full h-32 object-cover rounded border border-slate-200 mb-2"
                    />
                  ) : (
                    <div className="w-full h-32 bg-slate-200 rounded flex items-center justify-center text-slate-400 mb-2">
                      <Camera className="w-8 h-8" />
                    </div>
                  )}
                  {completePhotoHash && (
                    <span className="text-[10px] font-mono text-slate-400 truncate max-w-xs mb-2">
                      SHA-256: {completePhotoHash.slice(0, 16)}...
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleAttachCompletePhoto}
                    className="px-2.5 py-1 bg-white border border-slate-300 rounded text-xs font-medium hover:bg-slate-100 flex items-center gap-1"
                  >
                    <Camera className="w-3 h-3 text-blue-700" />
                    {completePhotoUrl ? 'Re-capture Instrument Photo' : 'Capture Instrument Photo'}
                  </button>
                </div>

                <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50 flex flex-col items-center justify-center text-center">
                  <span className="font-semibold text-slate-700 text-xs mb-2">Manufacturer Nameplate Photograph *</span>
                  {nameplatePhotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={nameplatePhotoUrl}
                      alt="Nameplate"
                      className="w-full h-32 object-cover rounded border border-slate-200 mb-2"
                    />
                  ) : (
                    <div className="w-full h-32 bg-slate-200 rounded flex items-center justify-center text-slate-400 mb-2">
                      <Camera className="w-8 h-8" />
                    </div>
                  )}
                  {nameplatePhotoHash && (
                    <span className="text-[10px] font-mono text-slate-400 truncate max-w-xs mb-2">
                      SHA-256: {nameplatePhotoHash.slice(0, 16)}...
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSimulateScanNameplate(false)}
                    className="px-2.5 py-1 bg-white border border-slate-300 rounded text-xs font-medium hover:bg-slate-100 flex items-center gap-1"
                  >
                    <Camera className="w-3 h-3 text-blue-700" />
                    {nameplatePhotoUrl ? 'Re-capture Nameplate' : 'Capture Nameplate'}
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] text-slate-600 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Traceability Notice:</strong> Registration photographs are authoritatively hashed with SHA-256 and bound to Registered Instrument record <strong className="font-mono text-slate-900">{serialNumber || '[Serial]'}</strong> in Revision 1.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-between shrink-0">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((step - 1) as 1 | 2 | 3 | 4 | 5)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-white"
            >
              <ArrowLeft className="w-3.5 h-3.5 inline mr-1" />
              Back
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-white"
            >
              Cancel
            </button>
          )}

          {step < 5 ? (
            <button
              type="button"
              disabled={step === 1 && !!duplicateExisting}
              onClick={() => {
                if (step === 1) {
                  if (!serialNumber.trim() || !manufacturer.trim() || !modelName.trim()) {
                    setError('Serial number, manufacturer, and model name are required.');
                    return;
                  }
                  if (duplicateExisting) {
                    setError('Cannot proceed: Serial number already exists.');
                    return;
                  }
                }
                setError(null);
                setStep((step + 1) as 1 | 2 | 3 | 4 | 5);
              }}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              Next Step
              <ArrowRight className="w-3.5 h-3.5 inline ml-1" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalSubmit}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Complete Instrument Registration</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
