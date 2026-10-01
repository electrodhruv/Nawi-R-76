'use client';

import React, { useState } from 'react';
import {
  Plus,
  ArrowRight,
  Play,
  CheckCircle2,
  Clock,
  AlertCircle,
  Scale,
  ShieldCheck,
  Layers,
  Search,
  Activity,
  FileText,
  UserCheck,
  AlertTriangle,
  QrCode,
  Lock,
  Building2,
  Award,
  Eye,
} from 'lucide-react';
import { RegisteredInstrument, SYNTHETIC_INSTRUMENTS } from '@/lib/synthetic-instruments';
import { InstrumentRepositoryService } from '@/services/repository/instrument-repository-service';
import { EvaluationRegisterService } from '@/services/operations/evaluation-register-service';
import { getProfileByRole, PRESET_USER_PROFILES } from '@/lib/rbac';
import { InstrumentIntakeModal } from '@/components/repository/InstrumentIntakeModal';

export interface RecentEvaluation {
  id: string;
  evaluationNumber: string;
  modelName: string;
  serialNumber: string;
  manufacturer: string;
  accuracyClass: string;
  status: 'IN_TESTING' | 'PENDING_REVIEW' | 'APPROVED';
  targetStep?: 1 | 4 | 5 | 6;
  updatedAt: string;
}

interface HomeScreenProps {
  onStartNewEvaluation: () => void;
  onContinueEvaluation: (evaluation: RecentEvaluation) => void;
  onSelectSpecimenDirect?: (
    instrument: RegisteredInstrument,
    targetStep?: 1 | 4 | 5 | 6,
    prefillDemo?: boolean
  ) => void;
  currentUser?: { fullName: string; role: string; email: string } | null;
  onNavigateView?: (view: any) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStartNewEvaluation,
  onContinueEvaluation,
  onSelectSpecimenDirect,
  currentUser,
  onNavigateView,
}) => {
  const activeProfile = currentUser ? getProfileByRole(currentUser.role) : PRESET_USER_PROFILES.LEAD_METROLOGIST;
  const isTestingOfficer = activeProfile.role === 'TESTING_OFFICER';
  const isReviewer = activeProfile.role === 'TECHNICAL_REVIEWER';
  const isLead = activeProfile.role === 'LEAD_METROLOGIST';
  const isDirector = activeProfile.role === 'LABORATORY_DIRECTOR';
  const isAuditor = activeProfile.role === 'AUDITOR_INSPECTOR';

  const [activeTab, setActiveTab] = useState<'SPECIMENS' | 'EVALUATIONS'>('SPECIMENS');
  const [specimenFilter, setSpecimenFilter] = useState<'ALL' | 'AVAILABLE' | 'IN_EVALUATION' | 'PENDING_REVIEW'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const handleInstrumentRegistered = () => {
    try {
      const fromRepo = InstrumentRepositoryService.getAllRegisteredInstruments();
      setRegisteredSpecimens(fromRepo.length > 0 ? [...fromRepo] : [...SYNTHETIC_INSTRUMENTS]);
    } catch (err) {
      console.warn('Failed to refresh registered instruments:', err);
    }
    setIsRegisterModalOpen(false);
  };

  // Fetch registered specimens from repository
  const [registeredSpecimens, setRegisteredSpecimens] = useState<RegisteredInstrument[]>(() => {
    try {
      const fromRepo = InstrumentRepositoryService.getAllRegisteredInstruments();
      return fromRepo.length > 0 ? fromRepo : SYNTHETIC_INSTRUMENTS;
    } catch {
      return SYNTHETIC_INSTRUMENTS;
    }
  });

  // Reactive evaluations list
  const [evaluationsList, setEvaluationsList] = useState<any[]>(() => {
    try {
      return EvaluationRegisterService.getAllEvaluations();
    } catch {
      return [];
    }
  });

  React.useEffect(() => {
    const handleSync = () => {
      try {
        setEvaluationsList(EvaluationRegisterService.getAllEvaluations());
        const fromRepo = InstrumentRepositoryService.getAllRegisteredInstruments();
        setRegisteredSpecimens(fromRepo.length > 0 ? [...fromRepo] : [...SYNTHETIC_INSTRUMENTS]);
      } catch (err) {
        console.warn('HomeScreen state sync error:', err);
      }
    };

    handleSync();
    const unsubscribe = EvaluationRegisterService.subscribe(handleSync);
    return unsubscribe;
  }, []);

  const recentEvaluations: RecentEvaluation[] = React.useMemo(() => {
    return evaluationsList.map((rec) => {
      let status: 'IN_TESTING' | 'PENDING_REVIEW' | 'APPROVED' = 'IN_TESTING';
      let targetStep: 1 | 4 | 5 | 6 = 4;
      if (rec.status === 'FINALIZED') {
        status = 'APPROVED';
        targetStep = 6;
      } else if (rec.status === 'PENDING_REVIEW' || rec.status === 'READY_FOR_FINALIZATION') {
        status = 'PENDING_REVIEW';
        targetStep = isLead ? 6 : 5;
      } else {
        status = 'IN_TESTING';
        targetStep = 4;
      }
      return {
        id: rec.id,
        evaluationNumber: rec.evaluationNumber,
        modelName: rec.modelName,
        serialNumber: rec.serialNumber,
        manufacturer: rec.manufacturer,
        accuracyClass: rec.accuracyClass,
        status,
        targetStep,
        updatedAt: new Date(rec.lastUpdated).toLocaleDateString([], {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
      };
    });
  }, [evaluationsList, isLead]);

  // Synchronized dynamic status based on live evaluation register state
  const getRoleAwareStatus = React.useCallback(
    (inst: RegisteredInstrument) => {
      const match = evaluationsList.find((e) => e.serialNumber === inst.serialNumber);
      if (match) {
        if (match.status === 'FINALIZED') {
          return 'REPORT_ISSUED';
        }
        if (match.status === 'PENDING_REVIEW' || match.status === 'READY_FOR_FINALIZATION') {
          return 'PENDING_REVIEW';
        }
        if (match.status === 'IN_TESTING' || match.status === 'CORRECTION_REQUIRED') {
          return 'IN_EVALUATION';
        }
      }
      return inst.status || 'AVAILABLE';
    },
    [evaluationsList]
  );

  // Metrics
  const availableSpecimens = registeredSpecimens.filter((s) => getRoleAwareStatus(s) === 'AVAILABLE');
  const testingSpecimens = registeredSpecimens.filter((s) => getRoleAwareStatus(s) === 'IN_EVALUATION');
  const pendingReviewSpecimens = registeredSpecimens.filter((s) => getRoleAwareStatus(s) === 'PENDING_REVIEW');
  const totalSpecimens = registeredSpecimens.length;

  // Filtered specimens
  const filteredSpecimens = registeredSpecimens.filter((inst) => {
    const matchesSearch =
      inst.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.modelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.manufacturer.toLowerCase().includes(searchTerm.toLowerCase());
    const instStatus = getRoleAwareStatus(inst);
    const matchesFilter =
      specimenFilter === 'ALL' ||
      (specimenFilter === 'AVAILABLE' && instStatus === 'AVAILABLE') ||
      (specimenFilter === 'IN_EVALUATION' && instStatus === 'IN_EVALUATION') ||
      (specimenFilter === 'PENDING_REVIEW' && instStatus === 'PENDING_REVIEW');
    return matchesSearch && matchesFilter;
  });

  const handleStartBlank = (inst: RegisteredInstrument) => {
    if (onSelectSpecimenDirect) {
      onSelectSpecimenDirect(inst, 1, false);
    } else {
      onStartNewEvaluation();
    }
  };

  const handleOpenDemo = (inst: RegisteredInstrument) => {
    if (onSelectSpecimenDirect) {
      onSelectSpecimenDirect(inst, 4, true);
    } else {
      onStartNewEvaluation();
    }
  };

  const handleOpenReview = (inst: RegisteredInstrument) => {
    if (onSelectSpecimenDirect) {
      onSelectSpecimenDirect(inst, isLead ? 6 : 5, true);
    } else {
      onStartNewEvaluation();
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Role-Specific Top Header & Authority Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`w-2 h-2 rounded-full ${
              isTestingOfficer
                ? 'bg-emerald-500'
                : isReviewer
                ? 'bg-indigo-500'
                : isLead
                ? 'bg-blue-600'
                : isDirector
                ? 'bg-purple-600'
                : 'bg-amber-500'
            }`} />
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              {activeProfile.roleTitle} &bull; {activeProfile.department}
            </span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.2 rounded border ${activeProfile.badgeColor.bg} ${activeProfile.badgeColor.text} ${activeProfile.badgeColor.border}`}>
              {activeProfile.statutoryClause}
            </span>
          </div>

          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {isTestingOfficer && 'Laboratory Testing & Data Acquisition Workbench'}
            {isReviewer && 'Technical Peer Review & Calculation Audit Station'}
            {isLead && 'Statutory Type Evaluation & Approval Command'}
            {isDirector && 'Executive Directorate & National Laboratory Governance'}
            {isAuditor && 'Statutory Audit & Forensic Inspection Station'}
          </h1>

          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            {isTestingOfficer &&
              'Execute standard OIML R 76 testing batteries, record turning point observations, trigger automated DAQ ingestion, and upload physical photographic evidence.'}
            {isReviewer &&
              'Conduct independent verification of turning point calculations (P = I + 0.5e - ΔL), check MPE conformity, inspect photo OCR match, and log discrepancies.'}
            {isLead &&
              'Statutory oversight of OIML R 76-1:2006 type evaluations, final quality gate approval, cryptographic PKI digital signing, and certificate issuance.'}
            {isDirector &&
              'High-level laboratory operations oversight across 5 regional RRSL testing stations, gazette allocation, turnaround KPIs, and accreditation compliance.'}
            {isAuditor &&
              'Independent third-party inspection, verification of cryptographic SHA-256 tamper logs, chain-of-custody verification, and field certificate QR validation.'}
          </p>
        </div>

        {/* Role-Specific Quick Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          {activeProfile.permissions.canIntakeInstruments ? (
            <button
              type="button"
              onClick={() => setIsRegisterModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Instrument</span>
            </button>
          ) : isReviewer ? (
            <button
              type="button"
              onClick={() => onNavigateView && onNavigateView('issues')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Review Discrepancies</span>
            </button>
          ) : isAuditor ? (
            <button
              type="button"
              onClick={() => onNavigateView && onNavigateView('audit')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Inspect Audit Ledger</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Role-Specific Statutory Scope Notice Banner */}
      <div className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-4 shadow-2xs ${
        isTestingOfficer
          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
          : isReviewer
          ? 'bg-indigo-50/60 border-indigo-200 text-indigo-950'
          : isLead
          ? 'bg-blue-50/60 border-blue-200 text-blue-950'
          : isDirector
          ? 'bg-purple-50/60 border-purple-200 text-purple-950'
          : 'bg-amber-50/60 border-amber-200 text-amber-950'
      }`}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white/80 border border-current shrink-0">
            {isTestingOfficer && <Scale className="w-4 h-4 text-emerald-700" />}
            {isReviewer && <ShieldCheck className="w-4 h-4 text-indigo-700" />}
            {isLead && <Award className="w-4 h-4 text-blue-700" />}
            {isDirector && <Building2 className="w-4 h-4 text-purple-700" />}
            {isAuditor && <Lock className="w-4 h-4 text-amber-700" />}
          </div>
          <div>
            <strong className="block font-bold">
              Active Officer: {activeProfile.fullName} ({activeProfile.roleTitle})
            </strong>
            <span className="text-[11px] opacity-90 block">
              {isTestingOfficer &&
                'Clearance: Data Entry & Testing. Note: In compliance with ISO 17025 §7.8, type approval finalization requires Lead Metrologist sign-off.'}
              {isReviewer &&
                'Clearance: Peer Review & Quality Audit. Note: Raw measurement inputs are locked in read-only mode to prevent retrospective data modification.'}
              {isLead &&
                'Clearance: Statutory Signatory. Authorized to review complete dossiers, approve type approvals, and apply digital PKI signatures.'}
              {isDirector &&
                'Clearance: Executive Directorate. Complete administrative governance, national gazette authorization, and compliance audit authority.'}
              {isAuditor &&
                'Clearance: Statutory Auditor. Operating in STRICTLY READ-ONLY forensic mode. Instrument creation and data mutation are disabled.'}
            </span>
          </div>
        </div>

        <div className="shrink-0 hidden md:block font-mono text-[11px] text-right opacity-80">
          <div>Emp ID: {activeProfile.accreditationId}</div>
          <div>Station: RRSL Ahmedabad</div>
        </div>
      </div>

      {/* Role-Customized KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {isTestingOfficer ? (
          <>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Assigned Test Batteries</span>
                <Activity className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">3 Specimens</span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Bench 02
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">13-test OIML procedural battery active</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Recorded Load Points</span>
                <Scale className="w-4 h-4 text-blue-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">24 Points</span>
                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  DAQ Telemetry
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">Turning point errors calculated live</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Working Mass Standards</span>
                <Award className="w-4 h-4 text-amber-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">Class E2 &amp; F1</span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Calibrated
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">Certificate valid till Dec 2026</p>
            </div>
          </>
        ) : isReviewer ? (
          <>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Awaiting Peer Review</span>
                <Clock className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">2 Evaluations</span>
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                  Submitted
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">Independent calculation checks pending</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Flagged Discrepancies</span>
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">1 Item</span>
                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Under Audit
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">Eccentricity corner 3 non-conformity</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Evidence Hash Integrity</span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">100% Match</span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  SHA-256 Valid
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">Display OCR cross-check consistent</p>
            </div>
          </>
        ) : isDirector ? (
          <>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>National Throughput (FY26)</span>
                <Building2 className="w-4 h-4 text-purple-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">18 Instruments</span>
                <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                  5 RRSL Labs
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">Across Ahmedabad, Bangalore, Faridabad</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Avg Evaluation Turnaround</span>
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">4.2 Days</span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Goal &lt; 7.0d
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">40% reduction vs legacy manual testing</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Statutory Fees Realized</span>
                <Award className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">&#8377; 2,45,000</span>
                <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                  Consolidated
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">Direct treasury deposit</p>
            </div>
          </>
        ) : isAuditor ? (
          <>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Cryptographic Chain Integrity</span>
                <Lock className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">0 Violations</span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Clean Chain
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">Immutable SHA-256 block ledger intact</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Evidence Checksums Verified</span>
                <ShieldCheck className="w-4 h-4 text-amber-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">24 of 24</span>
                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Audited
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">Zero unauthorized mutations detected</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Field QR Verifications</span>
                <QrCode className="w-4 h-4 text-blue-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">48 Scans</span>
                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  Active
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">On-site enforcement officer lookups</p>
            </div>
          </>
        ) : (
          /* Default Lead Metrologist Metrics */
          <>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Ready for Final Signature</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">1 Dossier</span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Reviewed
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">Precision-Bench-B6 awaiting legal PKI seal</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Issued Model Certificates</span>
                <Award className="w-4 h-4 text-blue-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">14 Active</span>
                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  OIML R 76-1
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">Digitally sealed and archived in repository</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Statutory Compliance Rate</span>
                <ShieldCheck className="w-4 h-4 text-purple-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">93.3%</span>
                <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                  MPE Compliant
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">Evaluated against OIML Table 3 limits</p>
            </div>
          </>
        )}
      </div>

      {/* Main Tab Navigation */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        {/* Navigation Tabs Header */}
        <div className="px-6 py-3.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('SPECIMENS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'SPECIMENS'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>
                {isTestingOfficer ? 'Assigned Specimen Bench' : 'Laboratory Instruments'} ({availableSpecimens.length})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('EVALUATIONS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'EVALUATIONS'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>
                {isReviewer
                  ? 'Audited Dossiers Queue'
                  : isAuditor
                  ? 'Archived Reports Queue'
                  : 'Evaluation Work Queue'} ({recentEvaluations.length})
              </span>
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search serial, model, brand..."
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 w-full sm:w-60"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        {/* TAB CONTENT 1: AVAILABLE PHYSICAL MACHINES */}
        {activeTab === 'SPECIMENS' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <div>
                <h2 className="font-bold text-slate-900">
                  {isTestingOfficer ? 'Assigned Instruments for Operational Testing' : 'Registered Laboratory Instruments'}
                </h2>
                <p className="text-slate-500 text-[11px]">
                  {isAuditor
                    ? 'Read-only inspection of physical weighing instruments currently registered in laboratory custody.'
                    : 'Select an instrument below to start new testing or review active evaluation records.'}
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                {(['ALL', 'AVAILABLE', 'IN_EVALUATION', 'PENDING_REVIEW'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setSpecimenFilter(filter)}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                      specimenFilter === filter
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {filter === 'ALL'
                      ? 'All'
                      : filter === 'AVAILABLE'
                      ? 'Available'
                      : filter === 'IN_EVALUATION'
                      ? 'In Testing'
                      : 'Pending Review'}
                  </button>
                ))}
              </div>
            </div>

            {/* Specimen Grid Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {filteredSpecimens.map((inst) => {
                const instStatus = getRoleAwareStatus(inst);
                const isAvailable = instStatus === 'AVAILABLE';
                const isPendingReview = instStatus === 'PENDING_REVIEW';

                return (
                  <div
                    key={inst.id}
                    className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between transition-all bg-white shadow-2xs hover:border-slate-300 hover:shadow-xs"
                  >
                    <div>
                      {/* Top Specimen Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {inst.serialNumber}
                          </span>
                          <h3 className="font-bold text-slate-900 text-sm mt-2">{inst.modelName}</h3>
                          <span className="text-[11px] text-slate-500 block">{inst.manufacturer}</span>
                        </div>

                        <div>
                          {instStatus === 'AVAILABLE' ? (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Available
                            </span>
                          ) : instStatus === 'IN_EVALUATION' ? (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              In Testing
                            </span>
                          ) : instStatus === 'PENDING_REVIEW' ? (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Pending Review
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200/80 px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                              Finalized
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Technical Metrological Specs */}
                      <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
                        <div className="bg-slate-50/70 p-2 rounded border border-slate-100">
                          <span className="text-[9px] uppercase text-slate-400 block font-semibold">Capacity</span>
                          <span className="font-semibold text-slate-800">
                            Max {inst.maxCapacity} {inst.primaryUnit}
                          </span>
                        </div>
                        <div className="bg-slate-50/70 p-2 rounded border border-slate-100">
                          <span className="text-[9px] uppercase text-slate-400 block font-semibold">Interval (e)</span>
                          <span className="font-semibold text-slate-800">
                            e = {inst.verificationInterval_e} {inst.primaryUnit}
                          </span>
                        </div>
                        <div className="bg-slate-50/70 p-2 rounded border border-slate-100">
                          <span className="text-[9px] uppercase text-slate-400 block font-semibold">Accuracy Class</span>
                          <span className="font-semibold text-slate-800">
                            {inst.accuracyClass.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="bg-slate-50/70 p-2 rounded border border-slate-100">
                          <span className="text-[9px] uppercase text-slate-400 block font-semibold">Scale Divisions</span>
                          <span className="font-semibold text-slate-800">
                            n = {inst.numberOfIntervals_n.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Footer Button tailored by role */}
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      {isAuditor ? (
                        <button
                          type="button"
                          onClick={() => handleOpenDemo(inst)}
                          className="w-full py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect Instrument Dossier (Read-Only)</span>
                        </button>
                      ) : isReviewer ? (
                        <button
                          type="button"
                          onClick={() => handleOpenReview(inst)}
                          className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-300 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Audit Metrological Calculations</span>
                        </button>
                      ) : isLead ? (
                        isPendingReview ? (
                          <button
                            type="button"
                            onClick={() => handleOpenReview(inst)}
                            className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Review & Sign Dossier</span>
                          </button>
                        ) : isAvailable ? (
                          <button
                            type="button"
                            onClick={() => handleStartBlank(inst)}
                            className="w-full py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>Start Evaluation</span>
                          </button>
                        ) : instStatus === 'REPORT_ISSUED' ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenReview(inst)}
                              className="flex-1 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                            >
                              <Award className="w-3.5 h-3.5" />
                              <span>View Issued Report</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStartBlank(inst)}
                              title="Start a new evaluation run on this machine"
                              className="px-2.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                            >
                              New Run
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenDemo(inst)}
                              className="flex-1 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                              <span>Continue Evaluation</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStartBlank(inst)}
                              title="Start a new evaluation run on this machine"
                              className="px-2.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                            >
                              New Run
                            </button>
                          </div>
                        )
                      ) : isTestingOfficer ? (
                        isAvailable ? (
                          <button
                            type="button"
                            onClick={() => handleStartBlank(inst)}
                            className="w-full py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>Start Load Test</span>
                          </button>
                        ) : instStatus === 'REPORT_ISSUED' ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenReview(inst)}
                              className="flex-1 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                            >
                              <Award className="w-3.5 h-3.5" />
                              <span>View Issued Report</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStartBlank(inst)}
                              title="Start a new load test run on this machine"
                              className="px-2.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                            >
                              New Run
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenDemo(inst)}
                              className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                              <span>Resume Testing</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStartBlank(inst)}
                              title="Start a new load test run on this machine"
                              className="px-2.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                            >
                              New Run
                            </button>
                          </div>
                        )
                      ) : isAvailable ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleStartBlank(inst)}
                            className="flex-1 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>Start Evaluation</span>
                          </button>
                        </div>
                      ) : instStatus === 'REPORT_ISSUED' ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenReview(inst)}
                            className="flex-1 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>View Issued Report</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStartBlank(inst)}
                            className="px-2.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                          >
                            New Run
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenDemo(inst)}
                          className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                          <span>Resume Testing</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB CONTENT 2: EVALUATIONS QUEUE TABLE */}
        {activeTab === 'EVALUATIONS' && (
          <div className="p-6 space-y-4">
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Evaluation Ref</th>
                    <th className="py-3 px-4">Instrument Model</th>
                    <th className="py-3 px-4">Serial Number</th>
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Last Activity</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {recentEvaluations.map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-900">
                        {ev.evaluationNumber}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">{ev.modelName}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{ev.serialNumber}</td>
                      <td className="py-3 px-4 font-medium text-slate-700">{ev.accuracyClass}</td>
                      <td className="py-3 px-4">
                        {ev.status === 'IN_TESTING' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200/80">
                            <Clock className="w-3 h-3" />
                            Testing in Progress
                          </span>
                        )}
                        {ev.status === 'PENDING_REVIEW' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200/80">
                            <AlertCircle className="w-3 h-3" />
                            Pending Review
                          </span>
                        )}
                        {ev.status === 'APPROVED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                            <CheckCircle2 className="w-3 h-3" />
                            Report Issued
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{ev.updatedAt}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onContinueEvaluation(ev)}
                          className="h-7 px-3 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <span>
                            {ev.status === 'APPROVED'
                              ? 'View Report'
                              : ev.status === 'PENDING_REVIEW'
                              ? isLead ? 'Review & Sign' : isReviewer ? 'Audit Calculations' : 'Review'
                              : isTestingOfficer ? 'Resume Load Test' : 'Open Test'}
                          </span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {isRegisterModalOpen && (
        <InstrumentIntakeModal
          isOpen={isRegisterModalOpen}
          onClose={() => setIsRegisterModalOpen(false)}
          onRegistered={handleInstrumentRegistered}
        />
      )}
    </div>
  );
};
