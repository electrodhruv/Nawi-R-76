'use client';

import React, { useState, useMemo } from 'react';
import { ArrowRight, ArrowLeft, AlertCircle, CheckCircle2, Zap } from 'lucide-react';
import { RegisteredInstrument } from '@/lib/synthetic-instruments';
import { TestSuiteItem } from '@/lib/test-suite-types';
import { TestRunRecord, CommonEvaluationContext } from '@/core/test-engine/types';
import { buildCompleteEvaluationSuite, buildTestRunRecord } from '@/core/test-engine/record-factory';
import { TestNavigator } from '../testing/TestNavigator';
import { GenericTestWorkspace } from '../testing/GenericTestWorkspace';

interface Step4TestingProps {
  instrument: RegisteredInstrument;
  testSuite?: TestSuiteItem[];
  activeTestCode: string;
  onSelectTest: (testCode: string) => void;
  onUpdateTestSuite?: (suite: TestSuiteItem[]) => void;
  onNext: () => void;
  onBack: () => void;
  testRuns?: TestRunRecord[];
  context?: CommonEvaluationContext;
  onUpdateTestRuns?: (runs: TestRunRecord[]) => void;
}

export const Step5Testing: React.FC<Step4TestingProps> = ({
  instrument,
  activeTestCode,
  onSelectTest,
  onUpdateTestSuite,
  onNext,
  onBack,
  testRuns,
  context,
  onUpdateTestRuns,
}) => {
  const [completionWarning, setCompletionWarning] = useState<string | null>(null);

  const activeContext: CommonEvaluationContext = useMemo(() => {
    if (context) return context;
    return {
      evaluationNumber: 'RRSL-2026-TE-0104',
      laboratoryName: 'Regional Reference Standard Laboratory, Ahmedabad',
      operatorName: 'Dr. A. Sharma',
      operatorRole: 'LEAD_METROLOGIST',
      standardVersion: 'OIML R 76-1:2006 (E)',
      instrument: {
        modelName: instrument.modelName,
        serialNumber: instrument.serialNumber,
        manufacturer: instrument.manufacturer,
        accuracyClass: instrument.accuracyClass,
        maxCapacity: instrument.maxCapacity,
        minCapacity: instrument.minCapacity,
        verificationInterval_e: instrument.verificationInterval_e,
        scaleInterval_d: instrument.scaleInterval_d,
        numberOfIntervals_n: instrument.numberOfIntervals_n,
        rangeType: instrument.rangeType,
        tareType: instrument.tareType,
        powerSupply: instrument.powerSupply,
        temperatureRange: instrument.temperatureRange,
        receptorType: instrument.receptorType,
        softwareVersion: instrument.softwareVersion,
        primaryUnit: instrument.primaryUnit,
        hasFailedSample: instrument.hasFailedSample,
      },
    };
  }, [context, instrument]);

  const [internalRuns, setInternalRuns] = useState<TestRunRecord[]>(() =>
    buildCompleteEvaluationSuite(activeContext)
  );

  const activeRuns: TestRunRecord[] = testRuns ?? internalRuns;

  const applicableRuns = useMemo(
    () => activeRuns.filter((t) => t.isApplicable && t.status !== 'NOT_APPLICABLE'),
    [activeRuns]
  );

  const currentApplicableIndex = applicableRuns.findIndex((t) => t.testCode === activeTestCode);
  const activeRun = currentApplicableIndex >= 0 ? applicableRuns[currentApplicableIndex] : applicableRuns[0];

  // Auto-correct activeTestCode if it currently points to a non-applicable test
  React.useEffect(() => {
    if (activeRun && activeRun.testCode !== activeTestCode) {
      onSelectTest(activeRun.testCode);
    }
  }, [activeRun, activeTestCode, onSelectTest]);

  const handleSelectTest = (testCode: string) => {
    const target = activeRuns.find((r) => r.testCode === testCode);
    if (target && (!target.isApplicable || target.status === 'NOT_APPLICABLE')) {
      return;
    }
    onSelectTest(testCode);
  };

  const handleUpdateActiveRun = (updatedRun: TestRunRecord) => {
    const nextRuns = activeRuns.map((r) => (r.id === updatedRun.id ? updatedRun : r));
    if (onUpdateTestRuns) {
      onUpdateTestRuns(nextRuns);
    } else {
      setInternalRuns(nextRuns);
    }

    if (onUpdateTestSuite) {
      onUpdateTestSuite(nextRuns as unknown as TestSuiteItem[]);
    }
  };

  const handlePrevTest = () => {
    if (currentApplicableIndex > 0) {
      onSelectTest(applicableRuns[currentApplicableIndex - 1].testCode);
    }
  };

  const handleNextTest = () => {
    if (currentApplicableIndex < applicableRuns.length - 1) {
      onSelectTest(applicableRuns[currentApplicableIndex + 1].testCode);
    } else {
      handleProceedToReview();
    }
  };

  // Completion Gate Check (Sections 14 & 19)
  const handleProceedToReview = () => {
    const uncompletedApplicable = activeRuns.filter(
      (t) => t.isApplicable && (t.status === 'NOT_TESTED' || t.status === 'INCOMPLETE' || t.status === 'IN_PROGRESS' || t.status === 'RETEST_REQUIRED')
    );

    if (uncompletedApplicable.length > 0) {
      setCompletionWarning(
        `${uncompletedApplicable.length} applicable test(s) remain unresolved, incomplete, or require retest (${uncompletedApplicable.map((t) => t.name).join(', ')}). All applicable tests must have an authoritative final status (PASS, FAIL, or NOT_APPLICABLE) before evaluation review.`
      );
      return;
    }

    setCompletionWarning(null);
    onNext();
  };

  const handleSimulateRemainingTests = () => {
    const updatedRuns = activeRuns.map((r) => {
      const hasBlocking = r.validationMessages?.some((m) => m.severity === 'BLOCKING');
      if (!r.isApplicable || (r.status === 'PASS' && !hasBlocking)) {
        return r;
      }
      return buildTestRunRecord(r.testDefinition, activeContext, true);
    });
    if (onUpdateTestRuns) {
      onUpdateTestRuns(updatedRuns);
    } else {
      setInternalRuns(updatedRuns);
    }
    setCompletionWarning(null);
  };

  const completedApplicableCount = activeRuns.filter(
    (t) => t.isApplicable && (t.status === 'PASS' || t.status === 'FAIL')
  ).length;
  const totalApplicableCount = activeRuns.filter((t) => t.isApplicable).length;

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Top Banner: Instrument and Progress Status */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Specimen</span>
            <span className="font-bold text-slate-900">{instrument.modelName}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Serial Number</span>
            <span className="font-mono font-semibold text-blue-700">{instrument.serialNumber}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Capacity / e</span>
            <span className="font-mono text-slate-700">
              {instrument.maxCapacity} {instrument.primaryUnit} &bull; e = {instrument.verificationInterval_e} {instrument.primaryUnit}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Accuracy Class</span>
            <span className="font-semibold text-blue-800">{instrument.accuracyClass.replace('_', ' ')}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Plan Progress</span>
            <span className="font-bold text-slate-900">
              {completedApplicableCount} of {totalApplicableCount} Completed
            </span>
          </div>

          {completedApplicableCount < totalApplicableCount && (
            <button
              type="button"
              onClick={handleSimulateRemainingTests}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              title="Simulates automated connected laboratory DAQ for all remaining scheduled test procedures"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-600 fill-current" />
              <span>Simulate Remaining Tests</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleProceedToReview}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold shadow-xs transition-colors"
          >
            <span>Proceed to Review</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Completion Warning Banner (Section 14) */}
      {completionWarning && (
        <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 shadow-2xs">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold block mb-0.5">Evaluation Completion Required</span>
            <p className="text-amber-800 leading-relaxed">{completionWarning}</p>
          </div>
          <button
            type="button"
            onClick={() => setCompletionWarning(null)}
            className="text-amber-600 hover:text-amber-900 text-xs font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {/* Main Two-Column Layout: Left Navigator (3 cols) + Right Generic Test Workspace (9 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Test Navigator */}
        <div className="lg:col-span-3 xl:col-span-3 sticky top-6">
          <TestNavigator
            testSuite={activeRuns as unknown as TestSuiteItem[]}
            activeTestCode={activeRun ? activeRun.testCode : activeTestCode}
            onSelectTest={handleSelectTest}
          />
        </div>

        {/* Right Column: Reusable Generic Test Workspace */}
        <div className="lg:col-span-9 xl:col-span-9 min-w-0">
          {activeRun ? (
            <GenericTestWorkspace
              testRun={activeRun}
              context={activeContext}
              onUpdateTestRun={handleUpdateActiveRun}
              onPreviousTest={handlePrevTest}
              onNextTest={handleNextTest}
              onReturnToPlan={onBack}
              hasPrevious={currentApplicableIndex > 0}
              hasNext={currentApplicableIndex < applicableRuns.length - 1}
            />
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-xs text-slate-500">
              No test selected or applicable.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
