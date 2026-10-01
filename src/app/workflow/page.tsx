'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LaboratoryShell } from '@/components/layout/LaboratoryShell';
import { RegisteredInstrument, SYNTHETIC_INSTRUMENTS } from '@/lib/synthetic-instruments';
import { TestSuiteItem } from '@/lib/test-suite-types';
import { buildCompleteEvaluationSuite } from '@/core/test-engine/record-factory';
import { CommonEvaluationContext, TestRunRecord } from '@/core/test-engine/types';
import { OverallEvaluationResult, OverallResultEngine } from '@/core/test-engine/overall-result-engine';
import { EvaluationStepper, StepNumber } from '@/components/workflow/EvaluationStepper';
import { Step1Instrument } from '@/components/workflow/steps/Step1Instrument';
import { Step2TestSetup, TestSetupData } from '@/components/workflow/steps/Step2TestSetup';
import { Step4TestPlan } from '@/components/workflow/steps/Step4TestPlan';
import { Step5Testing } from '@/components/workflow/steps/Step5Testing';
import { Step7Review } from '@/components/workflow/steps/Step7Review';
import { Step8Report } from '@/components/workflow/steps/Step8Report';
import { EvaluationOverviewCard } from '@/components/workflow/EvaluationOverviewCard';
import {
  EvaluationRecord,
  EvaluationRegisterService,
  EvaluationWorkflowStatus,
} from '@/services/operations/evaluation-register-service';
import { EvidenceRegisterService } from '@/services/evidence/evidence-register-service';
import { AuditTrailService } from '@/services/operations/audit-trail-service';
import { PRESET_USER_PROFILES } from '@/lib/rbac';

function WorkflowContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL Query Parameters
  const paramEval = searchParams.get('eval') || 'RRSL-2026-TE-0104';
  const paramStep = searchParams.get('step') ? (parseInt(searchParams.get('step')!, 10) as StepNumber) : 4;
  const paramSerial = searchParams.get('serial') || 'SN-BS-26001';
  const paramPrefill = searchParams.get('prefill') === '1' || searchParams.get('prefill') === 'true' || paramStep > 1;

  // Selected Instrument
  const matchedInstrument = useMemo(() => {
    return SYNTHETIC_INSTRUMENTS.find((i) => i.serialNumber === paramSerial) || SYNTHETIC_INSTRUMENTS[0];
  }, [paramSerial]);

  const [selectedInstrument, setSelectedInstrument] = useState<RegisteredInstrument>(matchedInstrument);
  const [evaluationNumber, setEvaluationNumber] = useState<string>(paramEval);
  const [currentStep, setCurrentStep] = useState<StepNumber>(paramStep);
  const [maxStepUnlocked, setMaxStepUnlocked] = useState<StepNumber>(paramStep > 1 ? 6 : 1);
  const [activeTestCode, setActiveTestCode] = useState<string>('R76_WEIGH_INTRINSIC');
  const [evaluationOverallResult, setEvaluationOverallResult] = useState<OverallEvaluationResult>('NOT_DETERMINED');
  const [hasInitialized, setHasInitialized] = useState(false);

  // Common Evaluation Context
  const [evaluationContext, setEvaluationContext] = useState<CommonEvaluationContext>(() => ({
    evaluationNumber: paramEval,
    laboratoryName: 'Regional Reference Standard Laboratory, Ahmedabad',
    operatorName: 'Dr. A. Sharma',
    operatorRole: 'LEAD_METROLOGIST',
    standardVersion: 'OIML R 76-1:2006 (E)',
    instrument: {
      modelName: matchedInstrument.modelName,
      serialNumber: matchedInstrument.serialNumber,
      manufacturer: matchedInstrument.manufacturer,
      accuracyClass: matchedInstrument.accuracyClass,
      maxCapacity: matchedInstrument.maxCapacity,
      minCapacity: matchedInstrument.minCapacity,
      verificationInterval_e: matchedInstrument.verificationInterval_e,
      scaleInterval_d: matchedInstrument.scaleInterval_d,
      numberOfIntervals_n: matchedInstrument.numberOfIntervals_n,
      rangeType: matchedInstrument.rangeType,
      tareType: matchedInstrument.tareType,
      powerSupply: matchedInstrument.powerSupply,
      temperatureRange: matchedInstrument.temperatureRange,
      receptorType: matchedInstrument.receptorType,
      softwareVersion: matchedInstrument.softwareVersion,
      primaryUnit: matchedInstrument.primaryUnit,
      hasFailedSample: matchedInstrument.hasFailedSample,
    },
    environmentalSnapshot: {
      temperatureC: 20.5,
      humidityPercent: 50.0,
      pressureHpa: 1013.2,
      recordedAt: new Date().toISOString(),
    },
    equipmentUsed: [],
  }));

  // Test Runs
  const [testRuns, setTestRuns] = useState<TestRunRecord[]>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem('nawi_r76_runs_' + paramEval);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (err) {
        console.warn('Failed to load saved runs from localStorage:', err);
      }
    }
    return buildCompleteEvaluationSuite({
      evaluationNumber: paramEval,
      laboratoryName: 'Regional Reference Standard Laboratory, Ahmedabad',
      operatorName: 'Dr. A. Sharma',
      operatorRole: 'LEAD_METROLOGIST',
      standardVersion: 'OIML R 76-1:2006 (E)',
      instrument: matchedInstrument,
      environmentalSnapshot: {
        temperatureC: 20.5,
        humidityPercent: 50.0,
        pressureHpa: 1013.2,
        recordedAt: new Date().toISOString(),
      },
      equipmentUsed: [],
    }, paramPrefill);
  });

  useEffect(() => {
    setHasInitialized(true);
  }, []);

  // Overall Result
  const calculatedResultSummary = useMemo(() => {
    return OverallResultEngine.calculateOverallResult(testRuns, evaluationContext);
  }, [testRuns, evaluationContext]);

  const effectiveOverallResult: OverallEvaluationResult = useMemo(() => {
    if (evaluationOverallResult !== 'NOT_DETERMINED') return evaluationOverallResult;
    return calculatedResultSummary.overallResult;
  }, [evaluationOverallResult, calculatedResultSummary]);

  // Derive Active Evaluation Record
  const activeEvaluationRecord = useMemo((): EvaluationRecord => {
    const existing = EvaluationRegisterService.getEvaluationByNumber(evaluationNumber);
    const applicableTestsCount = testRuns.filter((t) => t.isApplicable).length;
    const completedTestsCount = testRuns.filter((t) => t.isApplicable && (t.status === 'PASS' || t.status === 'FAIL')).length;
    const overallVerdict: 'PASS' | 'FAIL' | 'PENDING' =
      effectiveOverallResult === 'COMPLIANT' ? 'PASS' : effectiveOverallResult === 'NON_COMPLIANT' ? 'FAIL' : 'PENDING';
    const computedStatus: EvaluationWorkflowStatus =
      currentStep === 6
        ? 'FINALIZED'
        : currentStep === 5
        ? 'PENDING_REVIEW'
        : 'IN_TESTING';

    if (existing) {
      return {
        ...existing,
        status: existing.status === 'FINALIZED' && currentStep !== 6 ? 'FINALIZED' : computedStatus,
        completedTestsCount,
        applicableTestsCount,
        overallResult: overallVerdict,
        lastUpdated: new Date().toISOString(),
      };
    }
    return {
      id: `eval-${evaluationNumber}`,
      evaluationNumber,
      specimenId: selectedInstrument.specimenId || selectedInstrument.id,
      modelName: selectedInstrument.modelName,
      tradeName: selectedInstrument.tradeName,
      manufacturer: selectedInstrument.manufacturer,
      serialNumber: selectedInstrument.serialNumber,
      accuracyClass: selectedInstrument.accuracyClass.replace(/_/g, ' '),
      maxCapacity: selectedInstrument.maxCapacity,
      verificationInterval_e: selectedInstrument.verificationInterval_e,
      primaryUnit: selectedInstrument.primaryUnit,
      status: computedStatus,
      assignedOperator: evaluationContext.operatorName,
      createdDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      overallResult: overallVerdict,
      configurationRevision: selectedInstrument.configurationRevision || 1,
      applicableTestsCount,
      completedTestsCount,
      assignedStandardIds: ['STD-WT-001', 'STD-ENV-001'],
      timeline: [
        {
          id: 'tl-init',
          eventName: 'Evaluation Initialized',
          timestamp: new Date().toISOString(),
          actor: evaluationContext.operatorName,
          details: `Evaluation initialized for specimen ${selectedInstrument.serialNumber}`,
          category: 'CREATION',
        },
      ],
    };
  }, [evaluationNumber, selectedInstrument, evaluationContext, testRuns, currentStep, effectiveOverallResult]);

  // Real-time synchronization
  useEffect(() => {
    if (!hasInitialized) return;
    try {
      localStorage.setItem('nawi_r76_runs_' + evaluationNumber, JSON.stringify(testRuns));
      EvaluationRegisterService.upsertEvaluation(activeEvaluationRecord);
      EvidenceRegisterService.syncFromTestRuns(
        evaluationNumber,
        testRuns,
        evaluationContext.operatorName
      );
    } catch (e) {
      console.warn('Error syncing active evaluation state in workflow:', e);
    }
  }, [hasInitialized, testRuns, evaluationNumber, activeEvaluationRecord, evaluationContext.operatorName]);

  const advanceToStep = (step: StepNumber) => {
    setCurrentStep(step);
    if (step > maxStepUnlocked) {
      setMaxStepUnlocked(step);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const instrumentSummary = {
    modelName: selectedInstrument.modelName,
    serialNumber: selectedInstrument.serialNumber,
    manufacturer: selectedInstrument.manufacturer,
    accuracyClass: selectedInstrument.accuracyClass.replace('_', ' '),
    maxCapacity: selectedInstrument.maxCapacity,
    minCapacity: selectedInstrument.minCapacity,
    verificationInterval_e: selectedInstrument.verificationInterval_e,
    scaleInterval_d: selectedInstrument.scaleInterval_d,
    numberOfIntervals_n: selectedInstrument.numberOfIntervals_n,
    rangeType: selectedInstrument.rangeType === 'SINGLE' ? 'Single Interval' : 'Multi Interval',
    tareType: selectedInstrument.tareType === 'SUBTRACTIVE' ? 'Subtractive' : 'Additive',
    powerSupply: selectedInstrument.powerSupply,
    temperatureRange: selectedInstrument.temperatureRange,
    receptorType: selectedInstrument.receptorType.replace('_', ' ').toLowerCase(),
    softwareVersion: selectedInstrument.softwareVersion,
    hasFailedSample: selectedInstrument.hasFailedSample,
    primaryUnit: selectedInstrument.primaryUnit,
  };

  return (
    <LaboratoryShell
      activeNav="workflow"
      evaluationNumber={evaluationNumber}
      subHeader={
        <EvaluationStepper
          currentStep={currentStep}
          onStepClick={(step) => advanceToStep(step)}
          maxStepUnlocked={maxStepUnlocked}
        />
      }
      chatContext={{
        evaluationNumber,
        instrumentModel: selectedInstrument?.modelName,
        instrumentManufacturer: selectedInstrument?.manufacturer,
        instrumentSerial: selectedInstrument?.serialNumber,
        stepNumber: currentStep,
        stepName: `Step ${currentStep}`,
        testCode: activeTestCode,
        testName: testRuns.find((t) => t.testCode === activeTestCode)?.name,
        clauseReference: testRuns.find((t) => t.testCode === activeTestCode)?.clause,
        testStatus: testRuns.find((t) => t.testCode === activeTestCode)?.status,
      }}
    >
      <div className="space-y-4">

        {/* Evaluation Overview & Readiness Summary */}
        <EvaluationOverviewCard
          evaluationRecord={activeEvaluationRecord}
          onNavigateToStep={(step) => advanceToStep(step)}
          onSelectTest={(testCode) => {
            setActiveTestCode(testCode);
            advanceToStep(4);
          }}
          isCompact={currentStep === 4}
        />

        {/* Step 1: Instrument */}
        {currentStep === 1 && (
          <Step1Instrument
            instrument={selectedInstrument}
            onNext={() => advanceToStep(2)}
            onBack={() => router.push('/select-instrument')}
          />
        )}

        {/* Step 2: Test Setup */}
        {currentStep === 2 && (
          <Step2TestSetup
            instrument={selectedInstrument}
            initialData={{
              environmentalSnapshot: evaluationContext.environmentalSnapshot,
              laboratoryName: evaluationContext.laboratoryName,
            }}
            onNext={(setupData: TestSetupData) => {
              setEvaluationContext((prev) => ({
                ...prev,
                laboratoryName: setupData.laboratoryName,
                environmentalSnapshot: setupData.environmentalSnapshot,
                equipmentUsed: setupData.equipmentAssigned,
              }));
              advanceToStep(3);
            }}
            onBack={() => advanceToStep(1)}
          />
        )}

        {/* Step 3: Test Plan */}
        {currentStep === 3 && (
          <Step4TestPlan
            instrument={selectedInstrument}
            testSuite={testRuns as unknown as TestSuiteItem[]}
            onSelectTest={(testCode) => {
              setActiveTestCode(testCode);
              advanceToStep(4);
            }}
            onNext={() => advanceToStep(4)}
            onBack={() => advanceToStep(2)}
          />
        )}

        {/* Step 4: Testing */}
        {currentStep === 4 && (
          <Step5Testing
            instrument={selectedInstrument}
            testRuns={testRuns}
            context={evaluationContext}
            activeTestCode={activeTestCode}
            onSelectTest={(testCode) => setActiveTestCode(testCode)}
            onUpdateTestRuns={(runs) => setTestRuns(runs)}
            onNext={() => {
              EvaluationRegisterService.updateEvaluationStatus(
                evaluationNumber,
                'PENDING_REVIEW',
                effectiveOverallResult === 'COMPLIANT' ? 'PASS' : 'FAIL'
              );
              AuditTrailService.logEvent({
                actor: evaluationContext.operatorName,
                role: evaluationContext.operatorRole,
                entityType: 'TypeEvaluation',
                entityId: evaluationNumber,
                action: 'STATE_TRANSITION',
                changeReason: 'Operational testing phase completed. Dossier submitted for technical review and peer attestation.',
                previousState: '{ "status": "IN_TESTING" }',
                newState: '{ "status": "PENDING_REVIEW" }',
              });
              advanceToStep(5);
            }}
            onBack={() => advanceToStep(3)}
          />
        )}

        {/* Step 5: Review */}
        {currentStep === 5 && (
          <Step7Review
            instrument={instrumentSummary}
            testSuite={testRuns as unknown as TestSuiteItem[]}
            testRuns={testRuns}
            currentUser={PRESET_USER_PROFILES.LEAD_METROLOGIST}
            onNext={() => {
              setEvaluationOverallResult(effectiveOverallResult);
              EvaluationRegisterService.updateEvaluationStatus(
                evaluationNumber,
                'FINALIZED',
                effectiveOverallResult === 'COMPLIANT' ? 'PASS' : 'FAIL'
              );
              AuditTrailService.logEvent({
                actor: evaluationContext.operatorName,
                role: evaluationContext.operatorRole,
                entityType: 'TypeEvaluation',
                entityId: evaluationNumber,
                action: 'STATE_TRANSITION',
                changeReason: 'Technical peer review gate completed. Evaluation dossier advanced for certificate issuance.',
                previousState: '{ "status": "PENDING_REVIEW" }',
                newState: '{ "status": "FINALIZED" }',
              });
              advanceToStep(6);
            }}
            onFinalize={(data) => {
              const finalVerdict = data.overallResult;
              setEvaluationOverallResult(finalVerdict);
              EvaluationRegisterService.updateEvaluationStatus(
                evaluationNumber,
                'FINALIZED',
                finalVerdict === 'COMPLIANT' ? 'PASS' : 'FAIL'
              );
              AuditTrailService.logEvent({
                actor: evaluationContext.operatorName,
                role: evaluationContext.operatorRole,
                entityType: 'TypeEvaluation',
                entityId: evaluationNumber,
                action: 'SIGN_DOCUMENT',
                changeReason: `Applied statutory RSA-2048 PKI digital signature. Evaluation finalized as ${finalVerdict}.`,
                previousState: '{ "status": "PENDING_REVIEW" }',
                newState: JSON.stringify({ status: 'FINALIZED', overallResult: finalVerdict }),
              });
              advanceToStep(6);
            }}
            onBack={() => advanceToStep(4)}
          />
        )}

        {/* Step 6: Report */}
        {currentStep === 6 && (
          <Step8Report
            instrument={instrumentSummary}
            evaluationNumber={evaluationNumber}
            testSuite={testRuns as unknown as TestSuiteItem[]}
            testRuns={testRuns}
            overallResult={effectiveOverallResult}
            onBack={() => advanceToStep(5)}
            onRestart={() => {
              router.push('/evaluations');
            }}
          />
        )}
      </div>
    </LaboratoryShell>
  );
}

export default function WorkflowPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-blue-700 border-t-transparent animate-spin" />
            <span className="text-xs font-semibold text-slate-500">Loading Evaluation Workspace...</span>
          </div>
        </div>
      }
    >
      <WorkflowContent />
    </Suspense>
  );
}
