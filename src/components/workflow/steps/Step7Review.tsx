'use client';

import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ShieldCheck,
  Scale,
  Slash,
  ArrowRight,
  ArrowLeft,
  Clock,
  FileCheck,
  Lock,
  ExternalLink,
  RotateCcw,
  Camera,
  Layers,
  FileText,
} from 'lucide-react';
import { TestSuiteItem } from '@/lib/test-suite-types';
import { CommonEvaluationContext, TestRunRecord } from '@/core/test-engine/types';
import {
  OverallResultEngine,
  OverallEvaluationResult,
  OverallEvaluationResultSummary,
} from '@/core/test-engine/overall-result-engine';
import { DigitalSignatureModal, SignatureMetadata } from '../DigitalSignatureModal';
import { getProfileByRole, PRESET_USER_PROFILES, UserProfile } from '@/lib/rbac';

interface Step7ReviewProps {
  onNext: () => void;
  onBack: () => void;
  onSelectTest?: (testCode: string) => void;
  onFinalize?: (finalizedData: {
    finalizedAt: string;
    finalizedBy: string;
    overallResult: OverallEvaluationResult;
    signatureMetadata?: SignatureMetadata;
  }) => void;
  isFinalized?: boolean;
  finalizedAt?: string;
  finalizedBy?: string;
  currentUser?: { fullName: string; role: string; email: string } | null;
  testSuite?: TestSuiteItem[];
  testRuns?: TestRunRecord[];
  context?: CommonEvaluationContext;
  evaluationNumber?: string;
  instrument?: {
    modelName: string;
    serialNumber: string;
    manufacturer: string;
    accuracyClass: string;
    maxCapacity: string | number;
    minCapacity?: string | number;
    verificationInterval_e: string | number;
    scaleInterval_d: string | number;
    primaryUnit?: string;
    hasFailedSample?: boolean;
    tradeName?: string;
    softwareVersion?: string;
    powerSupply?: string;
    temperatureRange?: string;
  };
}

export const Step7Review: React.FC<Step7ReviewProps> = ({
  onNext,
  onBack,
  onSelectTest,
  onFinalize,
  isFinalized = false,
  finalizedAt,
  finalizedBy,
  currentUser,
  testRuns = [],
  context,
  evaluationNumber = 'RRSL-2026-TE-0104',
  instrument = {
    modelName: 'XA-220 Precision Terminal',
    serialNumber: 'SN-2026-9042',
    manufacturer: 'Avery Weigh-Tronix India',
    accuracyClass: 'Class II',
    maxCapacity: '30.000 kg',
    verificationInterval_e: '0.005 kg',
    scaleInterval_d: '0.001 kg',
    primaryUnit: 'kg',
    hasFailedSample: false,
  },
}) => {
  const [reviewerNote, setReviewerNote] = useState('');
  const [reviewerName] = useState(
    finalizedBy || (currentUser ? currentUser.fullName : 'Dr. A. Sharma')
  );
  const [reviewerAccreditation] = useState('RRSL-MET-2024-88');
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);

  const activeProfile = currentUser ? getProfileByRole(currentUser.role) : PRESET_USER_PROFILES.LEAD_METROLOGIST;
  const canUserFinalize = activeProfile.permissions.canFinalizeEvaluation;

  const unit = instrument.primaryUnit || 'kg';
  const formatVal = (val: string | number) => {
    const s = String(val);
    return s.includes(unit) ? s : `${s} ${unit}`;
  };

  // Authoritative Calculation via OverallResultEngine (Section 11 & Section 12)
  const resultSummary: OverallEvaluationResultSummary = useMemo(() => {
    return OverallResultEngine.calculateOverallResult(testRuns, context, isFinalized);
  }, [testRuns, context, isFinalized]);

  const { overallResult, canFinalize, finalizationBlockers, counts, matrixSummary } = resultSummary;

  // Handle Server-Grade Authoritative Finalization (Opens Digital Signature Modal)
  const handleFinalize = () => {
    if ((!canFinalize || !canUserFinalize) && !isFinalized) return;
    setIsSignModalOpen(true);
  };

  const handleSignComplete = (meta: SignatureMetadata) => {
    setIsSignModalOpen(false);
    if (onFinalize) {
      onFinalize({
        finalizedAt: meta.signedAt,
        finalizedBy: `${meta.signatoryName} (${meta.signatoryRole})`,
        overallResult,
        signatureMetadata: meta,
      });
    } else {
      onNext();
    }
  };

  // Structured Review Findings (Section 14)
  const structuredFindings = useMemo(() => {
    const findings: Array<{
      id: string;
      type: 'INCOMPLETE_TEST' | 'MANDATORY_EVIDENCE_MISSING' | 'OCR_DISCREPANCY' | 'RETEST_PENDING' | 'METROLOGICAL_FAILURE';
      title: string;
      testCode: string;
      clause: string;
      description: string;
      status: 'BLOCKING' | 'WARNING';
    }> = [];

    matrixSummary.forEach((m) => {
      if (m.isApplicable && m.testResult === 'FAIL') {
        findings.push({
          id: `FND-FAIL-${m.testCode}`,
          type: 'METROLOGICAL_FAILURE',
          title: `Metrological Non-Compliance: ${m.title}`,
          testCode: m.testCode,
          clause: m.clause,
          description: `Test observation or calculation exceeds statutory Table 6 MPE limits. ${m.remarks}`,
          status: 'WARNING', // Non-compliance does not block finalization of a failed report, but is noted
        });
      }

      if (m.isApplicable && (m.runStatus === 'NOT_STARTED' || m.runStatus === 'IN_PROGRESS')) {
        findings.push({
          id: `FND-INC-${m.testCode}`,
          type: 'INCOMPLETE_TEST',
          title: `Incomplete Testing Procedure: ${m.title}`,
          testCode: m.testCode,
          clause: m.clause,
          description: `Required test has not been executed or finalized to a valid completion state.`,
          status: 'BLOCKING',
        });
      }

      if (m.hasMissingEvidence) {
        findings.push({
          id: `FND-EVD-${m.testCode}`,
          type: 'MANDATORY_EVIDENCE_MISSING',
          title: `Missing Photographic Evidence: ${m.title}`,
          testCode: m.testCode,
          clause: m.clause,
          description: `Mandatory photographic record is missing or insufficient under OIML R 76 evidence policy.`,
          status: 'BLOCKING',
        });
      }

      if (m.hasUnresolvedDiscrepancy) {
        findings.push({
          id: `FND-DISC-${m.testCode}`,
          type: 'OCR_DISCREPANCY',
          title: `Optical OCR Value Discrepancy: ${m.title}`,
          testCode: m.testCode,
          clause: m.clause,
          description: `Discrepancy detected between raw load reading and terminal photo OCR reading. Requires inspector review.`,
          status: 'BLOCKING',
        });
      }

      if (m.retestPending) {
        findings.push({
          id: `FND-RET-${m.testCode}`,
          type: 'RETEST_PENDING',
          title: `Retest Pending: ${m.title}`,
          testCode: m.testCode,
          clause: m.clause,
          description: `Test has been marked for re-execution; subsequent valid TestRun is required before finalization.`,
          status: 'BLOCKING',
        });
      }
    });

    return findings;
  }, [matrixSummary]);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* 1. Header & Identity Grid (Section 13) */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                Evaluation Review &amp; Finalization Gate
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                OIML R 76-1:2006 (E) &bull; R 76-2:2007 (E)
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Evaluation Review: {evaluationNumber}
            </h1>
          </div>

          {isFinalized && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-slate-900 text-white text-xs font-semibold">
              <Lock className="w-3.5 h-3.5" />
              <span>FINALIZED &bull; FROZEN</span>
            </div>
          )}
        </div>

        {/* Identity Matrix Table */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Instrument Specimen</span>
            <span className="font-semibold text-slate-900">{instrument.modelName}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Serial Number</span>
            <span className="font-mono font-bold text-blue-900">{instrument.serialNumber}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Manufacturer</span>
            <span className="text-slate-800">{instrument.manufacturer}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Accuracy Class</span>
            <span className="font-bold text-blue-800">{instrument.accuracyClass.replace('_', ' ')}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Max / Min Capacity</span>
            <span className="font-mono text-slate-800">{formatVal(instrument.maxCapacity)} / {formatVal(instrument.minCapacity ?? 0)}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Verification Interval (e)</span>
            <span className="font-mono text-slate-800">{formatVal(instrument.verificationInterval_e)}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Testing Laboratory</span>
            <span className="text-slate-800 truncate block">Regional Reference Standard Lab</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Lead Metrologist</span>
            <span className="text-slate-800">Dr. A. Sharma (RRSL-MET)</span>
          </div>
        </div>
      </div>

      {/* 2. Prominent OVERALL EVALUATION RESULT (Section 11 & Section 13) */}
      <div
        className={`border-2 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          overallResult === 'COMPLIANT'
            ? 'bg-emerald-50/80 border-emerald-500 text-emerald-950'
            : overallResult === 'NON_COMPLIANT'
            ? 'bg-red-50/80 border-red-500 text-red-950'
            : 'bg-amber-50/80 border-amber-500 text-amber-950'
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white shrink-0 shadow-xs ${
              overallResult === 'COMPLIANT'
                ? 'bg-emerald-600'
                : overallResult === 'NON_COMPLIANT'
                ? 'bg-red-600'
                : 'bg-amber-600'
            }`}
          >
            {overallResult === 'COMPLIANT' && <CheckCircle2 className="w-7 h-7" />}
            {overallResult === 'NON_COMPLIANT' && <AlertCircle className="w-7 h-7" />}
            {overallResult === 'NOT_DETERMINED' && <Clock className="w-7 h-7" />}
          </div>

          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Authoritative Metrological Status
            </div>
            <div className="text-2xl font-black tracking-tight flex items-center gap-2">
              <span>OVERALL RESULT: {overallResult}</span>
            </div>
            <p className="text-xs mt-0.5 opacity-90 max-w-xl">
              {overallResult === 'COMPLIANT' &&
                'All required applicable tests completed within statutory Table 6 Maximum Permissible Error (MPE) limits and mandatory evidence verified.'}
              {overallResult === 'NON_COMPLIANT' &&
                'One or more applicable tests exceeded maximum permissible limits or failed statutory technical examinations.'}
              {overallResult === 'NOT_DETERMINED' &&
                'Evaluation cannot be concluded: required tests remain incomplete, retests are pending, or mandatory evidence items are missing.'}
            </p>
          </div>
        </div>

        {isFinalized && finalizedAt && (
          <div className="text-right sm:border-l sm:pl-4 border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Finalized Record</span>
            <span className="text-xs font-mono font-semibold text-slate-800">{new Date(finalizedAt).toLocaleDateString()}</span>
            <span className="text-[10px] text-slate-500 block truncate">{finalizedBy}</span>
          </div>
        )}
      </div>

      {/* 3. Executive TEST SUMMARY Counters (Section 7 & Section 13) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg p-3 text-center shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Required</span>
          <span className="text-xl font-bold text-slate-900">{counts.totalApplicable}</span>
          <span className="text-[10px] text-slate-400 block">tests</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3 text-center shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Completed</span>
          <span className="text-xl font-bold text-slate-900">{counts.completed}</span>
          <span className="text-[10px] text-slate-400 block">of {counts.totalApplicable}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3 text-center shadow-xs">
          <span className="text-[10px] font-bold uppercase text-emerald-600 block">PASS</span>
          <span className="text-xl font-bold text-emerald-700">{counts.passed}</span>
          <span className="text-[10px] text-emerald-600 block">compliant</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3 text-center shadow-xs">
          <span className="text-[10px] font-bold uppercase text-red-600 block">FAIL</span>
          <span className={`text-xl font-bold ${counts.failed > 0 ? 'text-red-700' : 'text-slate-800'}`}>
            {counts.failed}
          </span>
          <span className="text-[10px] text-slate-400 block">{counts.failed > 0 ? 'exceeded' : 'zero'}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3 text-center shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">N/A</span>
          <span className="text-xl font-bold text-slate-700">{counts.notApplicable}</span>
          <span className="text-[10px] text-slate-400 block">excluded</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3 text-center shadow-xs">
          <span className="text-[10px] font-bold uppercase text-amber-600 block">Pending</span>
          <span className={`text-xl font-bold ${counts.pending > 0 ? 'text-amber-700' : 'text-slate-800'}`}>
            {counts.pending}
          </span>
          <span className="text-[10px] text-slate-400 block">remaining</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3 text-center shadow-xs">
          <span className="text-[10px] font-bold uppercase text-indigo-600 block">Retest Req.</span>
          <span className={`text-xl font-bold ${counts.retestRequired > 0 ? 'text-indigo-700' : 'text-slate-800'}`}>
            {counts.retestRequired}
          </span>
          <span className="text-[10px] text-slate-400 block">active</span>
        </div>
      </div>

      {/* 4. Structured Review Findings & Blockers (Section 14 & Section 16) */}
      {structuredFindings.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Structured Review Findings ({structuredFindings.length})
              </h3>
            </div>
            <span className="text-[11px] text-slate-500">
              {structuredFindings.filter((f) => f.status === 'BLOCKING').length} blocking finalization
            </span>
          </div>

          <div className="space-y-2">
            {structuredFindings.map((finding) => (
              <div
                key={finding.id}
                className={`p-3 rounded-lg border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  finding.status === 'BLOCKING'
                    ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                    : 'bg-red-50/70 border-red-200 text-red-950'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-semibold">
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        finding.status === 'BLOCKING'
                          ? 'bg-amber-200 text-amber-900'
                          : 'bg-red-200 text-red-900'
                      }`}
                    >
                      {finding.type.replace('_', ' ')}
                    </span>
                    <span className="font-mono text-[10px] text-slate-600">Clause {finding.clause}</span>
                    <span>{finding.title}</span>
                  </div>
                  <p className="text-[11px] opacity-80">{finding.description}</p>
                </div>

                {onSelectTest && (
                  <button
                    type="button"
                    onClick={() => onSelectTest(finding.testCode)}
                    className="shrink-0 text-[11px] font-medium text-blue-700 hover:text-blue-900 bg-white border border-slate-200 px-2.5 py-1 rounded inline-flex items-center gap-1 shadow-2xs"
                  >
                    <span>Inspect Test</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Detailed Test Execution Table (Section 13) */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-blue-800" />
            <h3 className="font-bold text-slate-900 uppercase tracking-wide">
              Test Matrix &amp; Procedure Results ({matrixSummary.length} Total)
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            {counts.completed} of {counts.totalApplicable} applicable completed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4 w-12 text-center">#</th>
                <th className="py-2.5 px-4 w-28">Clause</th>
                <th className="py-2.5 px-4">Test Title</th>
                <th className="py-2.5 px-4 w-28">Result</th>
                <th className="py-2.5 px-4 w-28">Run Status</th>
                <th className="py-2.5 px-4 w-28">Evidence</th>
                <th className="py-2.5 px-4 w-24 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {matrixSummary.map((item) => (
                <tr key={item.itemNumber} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-4 text-center font-mono text-slate-400">{item.itemNumber}</td>
                  <td className="py-2.5 px-4 font-mono font-medium text-slate-700">{item.clause}</td>
                  <td className="py-2.5 px-4">
                    <div className="font-semibold text-slate-900">{item.title}</div>
                    <div className="text-[10px] text-slate-500 truncate max-w-md">{item.remarks}</div>
                  </td>
                  <td className="py-2.5 px-4">
                    {item.testResult === 'PASS' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        PASS
                      </span>
                    )}
                    {item.testResult === 'FAIL' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-800 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                        <AlertCircle className="w-3 h-3 text-red-600" />
                        FAIL
                      </span>
                    )}
                    {item.testResult === 'N/A' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        <Slash className="w-3 h-3 text-slate-400" />
                        N/A
                      </span>
                    )}
                    {item.testResult === 'NOT_DETERMINED' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        <Clock className="w-3 h-3 text-amber-600" />
                        PENDING
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="text-[11px] text-slate-600 font-medium">{item.runStatus}</span>
                  </td>
                  <td className="py-2.5 px-4">
                    {item.hasMissingEvidence ? (
                      <span className="text-[10px] font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                        MISSING
                      </span>
                    ) : item.hasUnresolvedDiscrepancy ? (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        DISCREPANCY
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500">Verified</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    {onSelectTest && (
                      <button
                        type="button"
                        onClick={() => onSelectTest(item.testCode)}
                        className="text-[11px] text-blue-700 hover:text-blue-900 font-semibold"
                      >
                        Inspect &rarr;
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Reviewer Attestation & Note Box */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div>
            <label className="font-bold uppercase tracking-wider text-slate-800 block">
              Technical Peer Reviewer Attestation
            </label>
            <span className="text-[11px] text-slate-500">
              Reviewer: <strong>{reviewerName}</strong> &bull; Accreditation: <strong>{reviewerAccreditation}</strong>
            </span>
          </div>
          <span className="text-[11px] text-slate-400">Formal Audit Trail Record</span>
        </div>

        <input
          type="text"
          disabled={isFinalized}
          value={reviewerNote}
          onChange={(e) => setReviewerNote(e.target.value)}
          placeholder="Enter formal technical reviewer remarks or statutory endorsement notes..."
          className="w-full px-3 py-2 text-xs border border-slate-300 rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:bg-slate-50 disabled:text-slate-400"
        />
      </div>

      {/* 7. Finalization Gate & Action (Section 16 & Section 17) */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-800" />
            <h3 className="text-sm font-bold text-slate-900">
              Finalization Quality &amp; Completeness Gate
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {canFinalize ? 'Gate Passed: Ready to Finalize' : 'Gate Blocked: Actions Required'}
          </span>
        </div>

        {/* Gate Conditions Checklist */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-slate-700">Instrument specimen identity complete &amp; verified</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-slate-700">Evaluation environmental snapshot recorded</span>
          </div>
          <div className="flex items-center gap-2">
            {counts.pending === 0 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span className={counts.pending === 0 ? 'text-slate-700' : 'text-amber-800 font-semibold'}>
              All applicable tests completed ({counts.completed}/{counts.totalApplicable})
            </span>
          </div>
          <div className="flex items-center gap-2">
            {counts.retestRequired === 0 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span className={counts.retestRequired === 0 ? 'text-slate-700' : 'text-amber-800 font-semibold'}>
              All retest requirements resolved ({counts.retestRequired} pending)
            </span>
          </div>
          <div className="flex items-center gap-2">
            {structuredFindings.filter((f) => f.type === 'MANDATORY_EVIDENCE_MISSING').length === 0 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span className={structuredFindings.filter((f) => f.type === 'MANDATORY_EVIDENCE_MISSING').length === 0 ? 'text-slate-700' : 'text-amber-800 font-semibold'}>
              Mandatory photographic evidence verified
            </span>
          </div>
          <div className="flex items-center gap-2">
            {overallResult !== 'NOT_DETERMINED' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span className={overallResult !== 'NOT_DETERMINED' ? 'text-slate-700 font-semibold' : 'text-amber-800'}>
              Authoritative overall result determined ({overallResult})
            </span>
          </div>
        </div>

        {/* If Blocked: Show Exact Reason List (Section 16) */}
        {!canFinalize && !isFinalized && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs text-amber-950 space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-700" />
              <span>FINALIZATION BLOCKED — The following criteria must be satisfied:</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-amber-900 text-[11px]">
              {finalizationBlockers.map((blocker, i) => (
                <li key={i}>{blocker}</li>
              ))}
            </ul>
          </div>
        )}

        {/* If Ready / Finalized */}
        {canFinalize && !isFinalized && canUserFinalize && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Ready to Finalize:</strong> All required tests are completed, evidence is verified, calculations are compliant with OIML R 76-1, and authoritative result is determined. Click below to apply cryptographic digital signature.
            </span>
          </div>
        )}

        {/* Role Permission Guard Alert */}
        {!canUserFinalize && !isFinalized && activeProfile.role === 'TESTING_OFFICER' && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-950 flex items-center gap-2.5 shadow-2xs">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold block">Testing Officer Submission Gate</span>
              <span className="text-[11px] text-emerald-800">
                Logged in as <strong>{activeProfile.fullName} ({activeProfile.roleTitle})</strong>. All raw load measurements and physical checklists are validated. Under ISO/IEC 17025 §7.8, click below to <strong>Submit Dossier for Independent Technical Review</strong>. Final legal sealing will be performed by the Lead Metrologist.
              </span>
            </div>
          </div>
        )}

        {!canUserFinalize && !isFinalized && activeProfile.role === 'TECHNICAL_REVIEWER' && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-xs text-indigo-950 flex items-center gap-2.5 shadow-2xs">
            <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
            <div>
              <span className="font-bold block">Technical Peer Review Gate</span>
              <span className="text-[11px] text-indigo-800">
                Logged in as <strong>{activeProfile.fullName} ({activeProfile.roleTitle})</strong>. Review calculations, MPE conformity, and uncertainty budgets. Click below to record statutory peer attestation and forward to the Lead Signatory.
              </span>
            </div>
          </div>
        )}

        {!canUserFinalize && !isFinalized && activeProfile.role === 'AUDITOR_INSPECTOR' && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-950 flex items-center gap-2.5 shadow-2xs">
            <Lock className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold block">Statutory Auditor (Read-Only Mode)</span>
              <span className="text-[11px] text-amber-800">
                Logged in as <strong>{activeProfile.fullName} ({activeProfile.roleTitle})</strong>. As an independent inspector, you have read-only audit access to verify cryptographic SHA-256 ledger records and test evidence integrity.
              </span>
            </div>
          </div>
        )}

        {isFinalized && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-800 flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-700 shrink-0" />
            <span>
              <strong>Evaluation Finalized &amp; Frozen:</strong> Locked by {finalizedBy || reviewerName} on {new Date(finalizedAt || Date.now()).toLocaleString()}. Direct test edits disabled.
            </span>
          </div>
        )}

        {/* Bottom Navigation Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded text-xs font-medium transition-colors"
          >
            &larr; Back to Testing
          </button>

          {isFinalized ? (
            <button
              type="button"
              onClick={onNext}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded text-xs font-semibold bg-blue-700 hover:bg-blue-800 text-white shadow-xs transition-colors"
            >
              <span>View Issued Report</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : activeProfile.role === 'TESTING_OFFICER' ? (
            <button
              type="button"
              disabled={!canFinalize}
              onClick={() => {
                alert(`Dossier submitted for Technical Peer Review.\n\nAssigned to: Senior Metrologist (M. Verma)\nStatus updated to: PENDING_REVIEW`);
                onNext();
              }}
              className={`inline-flex items-center gap-1.5 px-6 py-2.5 rounded text-xs font-bold shadow-xs transition-colors ${
                canFinalize
                  ? 'bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Submit Dossier for Technical Peer Review &rarr;</span>
            </button>
          ) : activeProfile.role === 'TECHNICAL_REVIEWER' ? (
            <button
              type="button"
              disabled={!canFinalize}
              onClick={() => {
                alert(`Technical Verification & Calculation Audit Attested.\n\nOfficer: M. Verma (RRSL-REV-2022-09)\nForwarded to: Lead Metrologist (Dr. A. Sharma) for PKI Digital Signature.`);
                onNext();
              }}
              className={`inline-flex items-center gap-1.5 px-6 py-2.5 rounded text-xs font-bold shadow-xs transition-colors ${
                canFinalize
                  ? 'bg-indigo-700 hover:bg-indigo-800 text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Attest Technical Verification &amp; Pass to Lead Signatory &rarr;</span>
            </button>
          ) : activeProfile.role === 'AUDITOR_INSPECTOR' ? (
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded text-xs font-bold bg-slate-100 text-slate-400 border border-slate-300 cursor-not-allowed"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Auditor Clearance (Read-Only Mode)</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={!canFinalize || !canUserFinalize}
              onClick={handleFinalize}
              className={`inline-flex items-center gap-1.5 px-6 py-2.5 rounded text-xs font-semibold shadow-xs transition-colors ${
                canFinalize && canUserFinalize
                  ? 'bg-blue-800 hover:bg-blue-900 text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
              }`}
              title={!canUserFinalize ? 'Requires Lead Metrologist or Laboratory Director authorization' : undefined}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Finalize Evaluation &amp; Apply Digital Signature</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Digital Signature Modal */}
      <DigitalSignatureModal
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        currentUser={activeProfile}
        evaluationNumber={evaluationNumber}
        specimenModel={instrument.modelName}
        specimenSerial={instrument.serialNumber}
        onSignComplete={handleSignComplete}
      />
    </div>
  );
};
