'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  FileCode2,
  RefreshCw,
  Globe2,
  SlidersHorizontal,
} from 'lucide-react';

export interface OimlEdition {
  id: string;
  name: string;
  code: string;
  status: 'ACTIVE' | 'DRAFT_PREVIEW' | 'NATIONAL_HARMONIZED';
  releaseYear: string;
  scope: string;
  governingBody: string;
  keyFeatures: string[];
  mpeRuleSummary: string;
  temperatureRange: string;
  softwareSecurityStandard: string;
  testCount: number;
}

export const OIML_EDITIONS: OimlEdition[] = [
  {
    id: 'oiml-r76-2006',
    name: 'OIML R 76-1:2006 (E)',
    code: 'R76-2006',
    status: 'ACTIVE',
    releaseYear: '2006',
    scope: 'Non-automatic weighing instruments - Part 1: Metrological and technical requirements - Tests',
    governingBody: 'International Organization of Legal Metrology (BIML, Paris)',
    keyFeatures: [
      'Statutory 4-tier accuracy classification (Classes I, II, III, IIII)',
      'Table 3 MPE thresholds: ±0.5e, ±1.0e, ±1.5e',
      'Turning point method with 0.1d resolution weights',
      'Subtractive and additive tare device verification rules',
      'Hardware calibration switch sealing & audit trail event counters',
    ],
    mpeRuleSummary: 'Table 3 (Initial verification) & Table 6 (In-service)',
    temperatureRange: '-10 °C to +40 °C (Standard designated range)',
    softwareSecurityStandard: 'OIML R 76-1:2006 Clause 5.5 (Basic software protection & versioning)',
    testCount: 22,
  },
  {
    id: 'oiml-r76-202x',
    name: 'Draft OIML R 76:202X (Future-Ready Revision)',
    code: 'R76-202X-DRAFT',
    status: 'DRAFT_PREVIEW',
    releaseYear: '2025/2026',
    scope: 'Next-Generation NAWI Type Approval incorporating digital interfaces & IoT sensors',
    governingBody: 'OIML Technical Committee TC 9/SC 1 Working Group',
    keyFeatures: [
      'Harmonized with OIML D 31:2019 (General requirements for software-controlled measuring instruments)',
      'Digital load cell encrypted bus validation & cryptographic heartbeat checks',
      'Remote telemetry & cloud-buffered legal metrology data storage validation',
      'Enhanced immunity testing against 5G NR and modern industrial electromagnetic fields',
      'Zero-drift predictive monitoring via embedded temperature and humidity sensors',
    ],
    mpeRuleSummary: 'Refined Table 3 with expanded micro-interval calibration bounds',
    temperatureRange: '-15 °C to +45 °C with dynamic slope compensation',
    softwareSecurityStandard: 'Full OIML D 31:2019 Level U (Universal software cryptographic isolation)',
    testCount: 24,
  },
  {
    id: 'lm-india-2011',
    name: 'Legal Metrology (General) Rules, 2011 (India)',
    code: 'LM-INDIA-2011',
    status: 'NATIONAL_HARMONIZED',
    releaseYear: '2011 (Amended 2023)',
    scope: 'Eighth Schedule - Non-Automatic Weighing Instruments statutory requirements for India',
    governingBody: 'Department of Consumer Affairs, Government of India',
    keyFeatures: [
      'Full statutory alignment with OIML R 76-1:2006 principles under Indian climatic zones',
      'Mandatory physical wire lead sealing & electronic tamper audit logging',
      'Tropical zone testing requirements: +10 °C to +50 °C for specific regional classes',
      'Bilingual stamping plate mandates (Hindi & English legal markings)',
      'Standardized Indian RRSL / NPLI verification test report formats',
    ],
    mpeRuleSummary: 'Schedule VIII Verification Limits & Pattern Approval Schedules',
    temperatureRange: '+10 °C to +50 °C (Tropical climatic adaptation)',
    softwareSecurityStandard: 'Legal Metrology Rules Schedule VIII Clause 4 (Electronic memory sealing)',
    testCount: 20,
  },
];

interface OimlRevisionsViewProps {
  activeEditionId?: string;
  onSelectEdition?: (editionId: string) => void;
}

export const OimlRevisionsView: React.FC<OimlRevisionsViewProps> = ({
  activeEditionId = 'oiml-r76-2006',
  onSelectEdition,
}) => {
  const [selectedId, setSelectedId] = useState<string>(activeEditionId);
  const [isUpdating, setIsUpdating] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const currentEdition = OIML_EDITIONS.find((e) => e.id === selectedId) || OIML_EDITIONS[0];

  const handleApplyEdition = (editionId: string) => {
    setIsUpdating(true);
    setSelectedId(editionId);
    if (onSelectEdition) {
      onSelectEdition(editionId);
    }
    setTimeout(() => {
      setIsUpdating(false);
      setFeedbackMsg(`Evaluation rule engine successfully reconfigured to: ${OIML_EDITIONS.find((e) => e.id === editionId)?.name}`);
      setTimeout(() => setFeedbackMsg(null), 4000);
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold">
              <BookOpen className="w-4 h-4" />
            </div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight">
              OIML Standards &amp; Revisions Manager
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
              SIH 26035 Compliant
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            Demonstrating statutory flexibility: Our declarative, schema-driven rule engine supports seamless
            switching between international OIML recommendation releases and national legal metrology rules
            without codebase refactoring.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Active Edition</span>
            <span className="font-bold text-blue-700 text-xs">{currentEdition.name.split(' ')[0]} {currentEdition.name.split(' ')[1]}</span>
          </div>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 shadow-2xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{feedbackMsg}</span>
        </div>
      )}

      {/* 3 Standard Edition Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {OIML_EDITIONS.map((ed) => {
          const isSelected = ed.id === selectedId;
          return (
            <div
              key={ed.id}
              onClick={() => handleApplyEdition(ed.id)}
              className={`rounded-xl border p-5 cursor-pointer transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-blue-50/40 border-blue-600 shadow-sm ring-1 ring-blue-600'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
                      ed.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : ed.status === 'DRAFT_PREVIEW'
                        ? 'bg-purple-100 text-purple-800 border border-purple-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {ed.status === 'ACTIVE' ? 'Statutory Active' : ed.status === 'DRAFT_PREVIEW' ? 'Future Revision' : 'National Rules'}
                  </span>
                  {isSelected && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Loaded</span>
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">{ed.name}</h3>
                  <span className="text-[11px] text-slate-500 font-mono">Edition Code: {ed.code}</span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{ed.scope}</p>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-mono text-[11px]">{ed.testCount} Test Procedures</span>
                <span className={`font-semibold text-xs ${isSelected ? 'text-blue-700' : 'text-slate-600'}`}>
                  {isSelected ? 'Active Profile' : 'Select Standard &rarr;'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deep-Dive Inspection Panel for the Selected Standard */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-blue-700" />
            <h2 className="text-sm font-bold text-slate-900">
              Metrological Engine Configuration Schema: {currentEdition.name}
            </h2>
          </div>
          <span className="text-xs text-slate-500">Governing Body: {currentEdition.governingBody}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Left Column: Key Features */}
          <div className="space-y-3">
            <span className="font-bold text-slate-900 uppercase text-[11px] tracking-wide block">
              Statutory Clauses &amp; Procedural Criteria
            </span>
            <ul className="space-y-2">
              {currentEdition.keyFeatures.map((feat, idx) => (
                <li key={idx} className="flex items-start gap-2 text-slate-700 leading-relaxed">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Column: Engine Parameters */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-3">
            <span className="font-bold text-slate-900 uppercase text-[11px] tracking-wide block">
              Configured Engine Tolerance Parameters
            </span>
            <div className="space-y-2.5 text-[11px]">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500">MPE Calculation Matrix</span>
                <span className="font-mono font-semibold text-slate-800">{currentEdition.mpeRuleSummary}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500">Designated Environmental Scope</span>
                <span className="font-mono font-semibold text-slate-800">{currentEdition.temperatureRange}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500">Software Protection Standard</span>
                <span className="font-mono font-semibold text-slate-800">{currentEdition.softwareSecurityStandard}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Included Test Battery Procedures</span>
                <span className="font-mono font-bold text-blue-700">{currentEdition.testCount} Procedures</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
