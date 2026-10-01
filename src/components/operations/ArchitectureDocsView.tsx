'use client';

import React, { useState } from 'react';
import {
  Layers,
  Cpu,
  Calculator,
  Server,
  Code2,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Terminal,
  ExternalLink,
} from 'lucide-react';

export const ArchitectureDocsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ARCHITECTURE' | 'METHODOLOGY' | 'DEPLOYMENT'>('ARCHITECTURE');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold">
              <Cpu className="w-4 h-4" />
            </div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight">
              Technical Documentation &amp; Architecture Framework
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
              SIH 26035 Deliverable
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            Official technical deliverable detailing the software architecture, metrological calculation
            methodology per OIML R 76-1:2006, and enterprise deployment framework.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('ARCHITECTURE')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
              activeTab === 'ARCHITECTURE' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Architecture
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('METHODOLOGY')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
              activeTab === 'METHODOLOGY' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Calculation Math
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('DEPLOYMENT')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
              activeTab === 'DEPLOYMENT' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Deployment
          </button>
        </div>
      </div>

      {/* TAB 1: SOFTWARE ARCHITECTURE */}
      {activeTab === 'ARCHITECTURE' && (
        <div className="space-y-6">
          {/* Architecture Block Diagram */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-700" />
              <span>Layered Software Architecture Diagram</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-center text-xs">
              {/* Layer 1 */}
              <div className="border border-blue-200 bg-blue-50/50 rounded-lg p-4 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                  Layer 1: Presentation
                </span>
                <div className="font-bold text-slate-800 text-xs">Modern Reactive UI</div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Next.js App Router, Tailwind CSS, 6-Step Workflow Stepper, and interactive data entry forms.
                </p>
              </div>

              {/* Layer 2 */}
              <div className="border border-emerald-200 bg-emerald-50/50 rounded-lg p-4 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  Layer 2: Engine
                </span>
                <div className="font-bold text-slate-800 text-xs">Declarative Rule Engine</div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Schema-driven test definition registry, calculation interpreter, and compliance validator.
                </p>
              </div>

              {/* Layer 3 */}
              <div className="border border-indigo-200 bg-indigo-50/50 rounded-lg p-4 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded">
                  Layer 3: Security &amp; Ledger
                </span>
                <div className="font-bold text-slate-800 text-xs">Cryptographic Integrity</div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Client-side SHA-256 evidence hashing, RSA-2048 PKI digital signature, and OCR verification.
                </p>
              </div>

              {/* Layer 4 */}
              <div className="border border-purple-200 bg-purple-50/50 rounded-lg p-4 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 bg-purple-100 px-2 py-0.5 rounded">
                  Layer 4: Output
                </span>
                <div className="font-bold text-slate-800 text-xs">Report &amp; Verification</div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  OIML R 76-2 compliant PDF &amp; Word generator, field verification QR, and audit log.
                </p>
              </div>
            </div>
          </div>

          {/* Core Modules Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
              <span className="font-bold text-slate-900 uppercase text-[11px] tracking-wide block">
                Rule-Engine Decoupling (Clause Isolation)
              </span>
              <p className="text-slate-600 leading-relaxed">
                The test calculations and tolerance evaluations are completely decoupled from UI components.
                Each test clause (e.g., Clause 3.5.1 Weighing Performance, Clause 3.6.2 Repeatability) is defined
                as an isolated declarative schema in <code className="text-blue-700 bg-slate-100 px-1 py-0.5 rounded">registry.ts</code>.
                This ensures high maintainability and 100% test coverage.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
              <span className="font-bold text-slate-900 uppercase text-[11px] tracking-wide block">
                Statutory Data Immutability
              </span>
              <p className="text-slate-600 leading-relaxed">
                Whenever test observations are modified, the system records an immutable audit diff in the audit ledger
                with mandatory justification notes, operator attribution, and timestamp. Once finalized, the evaluation
                is cryptographically locked and cannot be edited without generating a formal superseding revision.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CALCULATION METHODOLOGY */}
      {activeTab === 'METHODOLOGY' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-blue-700" />
              <span>OIML R 76-1:2006 Statutory Mathematical Formulations</span>
            </h2>

            <div className="space-y-4 text-xs">
              {/* Formula 1: Turning Point */}
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">1. Indication Prior to Rounding (Turning Point Method)</span>
                  <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    Clause A.4.4.3
                  </span>
                </div>
                <div className="font-mono text-sm text-blue-800 bg-white p-3 rounded border border-slate-200 text-center font-bold">
                  P = I + 0.5e - ΔL
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Where <strong>I</strong> is the displayed indication, <strong>e</strong> is the verification scale interval,
                  and <strong>ΔL</strong> is the sum of additional small weights deposited until the display decisively switches to next interval (I + d).
                </p>
              </div>

              {/* Formula 2: Error and Corrected Error */}
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">2. Error and Zero-Corrected Error</span>
                  <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    Clause A.4.4.3
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center font-mono text-xs">
                  <div className="bg-white p-2.5 rounded border border-slate-200 font-bold text-blue-800">
                    E = P - L
                  </div>
                  <div className="bg-white p-2.5 rounded border border-slate-200 font-bold text-blue-800">
                    E_c = E - E_0
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Where <strong>L</strong> is the applied test load, <strong>E</strong> is raw error, and <strong>E_c</strong> is
                  the true error corrected for zero load indication error <strong>E_0</strong>.
                </p>
              </div>

              {/* Formula 3: MPE Tiers */}
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">3. Maximum Permissible Error (MPE) Step Limits</span>
                  <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    Table 3 &amp; Table 6
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center font-mono text-[11px]">
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <span className="text-slate-400 block text-[9px]">0 to 500e (Class III)</span>
                    <span className="font-bold text-slate-900">MPE = ±0.5 e</span>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <span className="text-slate-400 block text-[9px]">500e to 2000e</span>
                    <span className="font-bold text-slate-900">MPE = ±1.0 e</span>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <span className="text-slate-400 block text-[9px]">2000e to 10000e</span>
                    <span className="font-bold text-slate-900">MPE = ±1.5 e</span>
                  </div>
                </div>
              </div>

              {/* Formula 4: GUM Measurement Uncertainty */}
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">4. Expanded Measurement Uncertainty (GUM / OIML G 1-100)</span>
                  <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    ISO/IEC Guide 98-3
                  </span>
                </div>
                <div className="font-mono text-xs text-blue-800 bg-white p-2.5 rounded border border-slate-200 text-center font-bold">
                  U = k · u_c = 2 · √(u_std² + u_res² + u_rep² + u_ecc²)
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Evaluated at a 95% confidence level with coverage factor <strong>k = 2</strong>, incorporating standard weight uncertainty, resolution, repeatability variance, and eccentricity.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DEPLOYMENT FRAMEWORK */}
      {activeTab === 'DEPLOYMENT' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-700" />
              <span>Laboratory &amp; National Deployment Architecture</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Option A: On-Premise Air-Gapped RRSL */}
              <div className="border border-slate-200 rounded-lg p-4 space-y-3 bg-slate-50">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">Option A: On-Premises Laboratory Server</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">Air-Gapped</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Designed for high-security Regional Reference Standard Laboratories (RRSLs) with local LAN deployment:
                </p>
                <ul className="space-y-1.5 text-[11px] text-slate-700">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                    <span>Single Docker Compose container deployment</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                    <span>Local PostgreSQL database with daily encrypted backup</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                    <span>Direct RS-232 / USB laboratory balance DAQ integration</span>
                  </li>
                </ul>
              </div>

              {/* Option B: Central National Cloud */}
              <div className="border border-slate-200 rounded-lg p-4 space-y-3 bg-slate-50">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">Option B: Central National Metrology Cloud</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Ministry Level</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Centralized portal for the Department of Consumer Affairs and State Legal Metrology Directorates:
                </p>
                <ul className="space-y-1.5 text-[11px] text-slate-700">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>Multi-tenant laboratory synchronization across all Indian RRSLs</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>Public verification API for on-site scanning of QR codes</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>National model approval registry with instant search</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Docker CLI deployment snippet */}
            <div className="bg-slate-900 text-slate-200 rounded-lg p-4 font-mono text-[11px] space-y-2 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 text-[10px] pb-1 border-b border-slate-800">
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-blue-400" />
                  <span>One-Command Production Deployment Script</span>
                </span>
                <span>Bash / Docker</span>
              </div>
              <p className="text-slate-400"># Clone repository and launch enterprise laboratory suite</p>
              <p className="text-emerald-400">git clone https://github.com/legal-metrology/nawi-r76.git</p>
              <p className="text-emerald-400">cd nawi-r76 &amp;&amp; docker compose up -d --build</p>
              <p className="text-slate-400"># System initialized on port 3000 with pre-configured OIML R 76 rules</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
