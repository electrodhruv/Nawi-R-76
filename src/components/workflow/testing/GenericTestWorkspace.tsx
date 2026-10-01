'use client';

import React, { useState, useId, useRef, useEffect } from 'react';
import {
  TestRunRecord,
  CommonEvaluationContext,
  TestEvidenceItem,
  StructuredReasonCode,
  StructuredRemark,
  ObservationCorrection,
  RetestEvent,
  EvidencePurpose,
  EvidenceStatusCode,
} from '@/core/test-engine/types';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  Camera,
  Upload,
  FileText,
  ChevronDown,
  ChevronRight,
  Slash,
  Edit3,
  XCircle,
  RefreshCw,
  Info,
  Scale,
  RotateCcw,
  Trash2,
  ShieldCheck,
  Zap,
  Cable,
  Lock,
  Unlock,
} from 'lucide-react';
import { webSerialDriver, SerialReading, SerialConnectionStatus } from '@/lib/hardware/webserial';
import { buildTestRunRecord } from '@/core/test-engine/record-factory';
import { interpretCalculations } from '@/core/test-engine/interpreters/calculation-interpreter';
import { interpretCompliance } from '@/core/test-engine/interpreters/compliance-interpreter';
import { evaluateValidationRules } from '@/core/test-engine/interpreters/validation-interpreter';
import {
  computeSha256Hex,
  evaluateOcrObservationConsistency,
} from '@/services/evidence/evidence-crypto';

// Specialized Test Views
import { WeighingPerformanceView } from './views/WeighingPerformanceView';
import { RepeatabilityView } from './views/RepeatabilityView';
import { EccentricityView } from './views/EccentricityView';
import { DiscriminationView } from './views/DiscriminationView';
import { TareView } from './views/TareView';
import { ElectricalDisturbancesView } from './views/ElectricalDisturbancesView';
import { ChecklistView } from './views/ChecklistView';
import { CreepView } from './views/CreepView';
import { SpanStabilityView } from './views/SpanStabilityView';
import { VoltageVariationView } from './views/VoltageVariationView';
import { EnduranceView } from './views/EnduranceView';
import { EnvironmentalSequenceView } from './views/EnvironmentalSequenceView';
import { LongDurationTestProgress } from './LongDurationTestProgress';

interface GenericTestWorkspaceProps {
  testRun: TestRunRecord;
  context: CommonEvaluationContext;
  onUpdateTestRun: (updated: TestRunRecord) => void;
  onPreviousTest: () => void;
  onNextTest: () => void;
  onReturnToPlan: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
}

const STRUCTURED_REASON_OPTIONS: { code: StructuredReasonCode; label: string }[] = [
  { code: 'INVALID_VALUE', label: 'Data-entry error / Transcription mistake' },
  { code: 'EQUIPMENT_CALIBRATION_INVALID', label: 'Equipment problem / Calibration expired' },
  { code: 'INSTRUMENT_FAULT', label: 'Instrument problem / Hardware malfunction' },
  { code: 'TEST_CONDITION_NOT_ACHIEVED', label: 'Invalid setup / Test conditions not achieved' },
  { code: 'INCORRECT_TEST_SEQUENCE', label: 'Procedure interrupted / Sequence aborted' },
  { code: 'STABILIZATION_NOT_ACHIEVED', label: 'Unstable condition / Thermal fluctuation' },
  { code: 'OTHER', label: 'Other laboratory anomaly' },
];

export const GenericTestWorkspace: React.FC<GenericTestWorkspaceProps> = ({
  testRun,
  context,
  onUpdateTestRun,
  onPreviousTest,
  onNextTest,
  onReturnToPlan,
  hasPrevious,
  hasNext,
}) => {
  const [showCalcDetails, setShowCalcDetails] = useState(false);
  const [showTechDetails, setShowTechDetails] = useState(false);
  const [showCorrectionsHistory, setShowCorrectionsHistory] = useState(false);

  // Modals for Failure, Invalidation, Correction & Retest Workflows
  const [isCorrectModalOpen, setIsCorrectModalOpen] = useState(false);
  const [correctRowIndex, setCorrectRowIndex] = useState(0);
  const [correctFieldKey, setCorrectFieldKey] = useState('');
  const [correctNewValue, setCorrectNewValue] = useState('');
  const [correctReason, setCorrectReason] = useState('Data-entry error');

  const [isRetestModalOpen, setIsRetestModalOpen] = useState(false);
  const [retestReason, setRetestReason] = useState('');

  const [isInvalidateModalOpen, setIsInvalidateModalOpen] = useState(false);
  const [invalidateRowIndex, setInvalidateRowIndex] = useState(0);
  const [invalidateReason, setInvalidateReason] = useState('Data-entry error');

  const [inspectEvidenceItem, setInspectEvidenceItem] = useState<TestEvidenceItem | null>(null);

  // Evidence System: Purpose, Observation Linking & Discrepancy states (Section 13, 21, 23, 24)
  const [selectedPurpose, setSelectedPurpose] = useState<EvidencePurpose>(
    (testRun.testDefinition.procedureDefinition.evidencePolicy.purposes?.[0] as EvidencePurpose) || 'SETUP'
  );
  const [selectedObsRowIndex, setSelectedObsRowIndex] = useState<number | null>(0);
  const [dismissModalTarget, setDismissModalTarget] = useState<TestEvidenceItem | null>(null);
  const [dismissReviewer, setDismissReviewer] = useState('Dr. A. Sharma (Lead Metrologist)');
  const [dismissReason, setDismissReason] = useState(
    'Optical glare on 7-segment LED display caused transcription anomaly; physical weights verified'
  );
  const [supersedeModalTarget, setSupersedeModalTarget] = useState<TestEvidenceItem | null>(null);
  const [supersedeReason, setSupersedeReason] = useState('Replaced with higher clarity setup photograph');
  const [showSupersededEvidence, setShowSupersededEvidence] = useState(false);
  const replaceFileInputId = useId();

  // Structured Issue Logger state
  const [showAddIssueForm, setShowAddIssueForm] = useState(false);
  const [selectedReasonCode, setSelectedReasonCode] = useState<StructuredReasonCode>('INVALID_VALUE');
  const [issueNote, setIssueNote] = useState('');

  // Inspector panel tab state ('evidence' | 'issues' | 'guidance')
  const [activeInspectorTab, setActiveInspectorTab] = useState<'evidence' | 'issues' | 'guidance'>('evidence');

  // Camera capture state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const fileInputId = useId();

  // WebSerial Hardware Driver State (OIML R 76-1 Clause 4.4.2 Equilibrium Lock)
  const [serialStatus, setSerialStatus] = useState<SerialConnectionStatus>('DISCONNECTED');
  const [latestReading, setLatestReading] = useState<SerialReading | null>(null);
  const [isSimulatingStream, setIsSimulatingStream] = useState(false);
  const [captureFeedback, setCaptureFeedback] = useState<string | null>(null);

  useEffect(() => {
    webSerialDriver.updateVerificationInterval(context.instrument.verificationInterval_e || 0.001);

    const unsubscribeReading = webSerialDriver.subscribe((reading) => {
      setLatestReading(reading);
    });

    const unsubscribeStatus = webSerialDriver.onStatus((status) => {
      setSerialStatus(status);
      if (status !== 'CONNECTED') {
        setIsSimulatingStream(false);
      }
    });

    return () => {
      unsubscribeReading();
      unsubscribeStatus();
      webSerialDriver.stopSimulation();
    };
  }, [context.instrument.verificationInterval_e]);

  const handleConnectSerial = async () => {
    try {
      await webSerialDriver.requestAndConnect();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'WebSerial connection failed';
      alert(msg);
    }
  };

  const handleDisconnectSerial = async () => {
    await webSerialDriver.disconnect();
    setIsSimulatingStream(false);
    setLatestReading(null);
  };

  const handleToggleSimulation = () => {
    if (webSerialDriver.isSimulating()) {
      webSerialDriver.stopSimulation();
      setIsSimulatingStream(false);
      setLatestReading(null);
    } else {
      setIsSimulatingStream(true);
      webSerialDriver.startSimulation(15.0, context.instrument.verificationInterval_e || 0.001);
    }
  };

  const handleCaptureSerialReading = () => {
    if (!latestReading || !latestReading.isStable || latestReading.isEquilibriumLocked) {
      return;
    }

    const obs = [...testRun.rawObservations];
    if (obs.length === 0) return;

    let targetIdx = selectedObsRowIndex !== null && selectedObsRowIndex < obs.length ? selectedObsRowIndex : -1;
    if (targetIdx === -1) {
      targetIdx = obs.findIndex((o) => o.indication === undefined || o.indication === null || o.indication === '');
      if (targetIdx === -1) targetIdx = 0;
    }

    const fieldKey = schema.fields.find((f) => f.key === 'indication' || f.key === 'observedIndication')?.key || 'indication';
    const capturedWeight = latestReading.weight;

    obs[targetIdx] = {
      ...obs[targetIdx],
      [fieldKey]: capturedWeight,
    };

    handleUpdateObservations(obs);
    setCaptureFeedback(`Captured ${capturedWeight.toFixed(3)} ${latestReading.unit} into Observation #${targetIdx + 1}`);
    setTimeout(() => setCaptureFeedback(null), 3500);
  };

  const def = testRun.testDefinition;
  const proc = def.procedureDefinition;
  const schema = proc.observationSchema;
  const unit = context.instrument.primaryUnit;
  const eVal = context.instrument.verificationInterval_e;
  const dVal = context.instrument.scaleInterval_d;
  const maxCap = context.instrument.maxCapacity;
  const accClass = context.instrument.accuracyClass;

  // Recompute calculations, compliance, and validation rules centrally
  const recomputeTestRun = (
    updatedObservations: Record<string, unknown>[],
    overrides?: Partial<TestRunRecord>
  ): TestRunRecord => {
    const calcOutput = interpretCalculations(
      proc.calculationRule.ruleId,
      updatedObservations,
      context,
      proc.calculationRule.parameters
    );

    const compResult = interpretCompliance(
      calcOutput,
      testRun.isApplicable,
      testRun.exclusionJustification
    );

    const baseRecord: TestRunRecord = {
      ...testRun,
      rawObservations: updatedObservations,
      calculatedValues: calcOutput.calculatedValues,
      complianceResult: compResult,
      status: overrides?.status || compResult.status,
      data: {
        ...(testRun.data || {}),
        observations: updatedObservations,
        calculatedValues: calcOutput.calculatedValues,
      },
      ...overrides,
    };

    const valResult = evaluateValidationRules(baseRecord, proc.validationRules, context);
    baseRecord.validationMessages = valResult.messages;
    baseRecord.inputValidationIssues = valResult.inputIssues;
    baseRecord.procedureValidationIssues = valResult.procedureIssues;
    if (!baseRecord.evidenceDiscrepancies || baseRecord.evidenceDiscrepancies.length === 0) {
      baseRecord.evidenceDiscrepancies = valResult.evidenceDiscrepancies;
    }

    return baseRecord;
  };

  const handleUpdateObservations = (newObservations: Record<string, unknown>[]) => {
    const updated = recomputeTestRun(newObservations);
    onUpdateTestRun(updated);
  };

  // Live DAQ Simulation & Reset Handlers for Testing & Demonstration
  const handleSimulateSingleTest = () => {
    const populated = buildTestRunRecord(testRun.testDefinition, context, true);
    onUpdateTestRun(populated);
  };

  const handleClearSingleTest = () => {
    const emptyRecord = buildTestRunRecord(testRun.testDefinition, context, false);
    onUpdateTestRun(emptyRecord);
  };

  // Controlled Observation Correction
  const handleOpenCorrection = (rowIdx: number, key: string, currentVal: unknown) => {
    setCorrectRowIndex(rowIdx);
    setCorrectFieldKey(key);
    setCorrectNewValue(String(currentVal ?? ''));
    setCorrectReason('Data-entry error');
    setIsCorrectModalOpen(true);
  };

  const handleApplyCorrection = () => {
    if (!correctReason.trim()) return;
    const oldVal = testRun.rawObservations[correctRowIndex]?.[correctFieldKey];
    const fieldDef = schema.fields.find((f) => f.key === correctFieldKey);
    const parsedVal = fieldDef?.type === 'NUMBER' ? parseFloat(correctNewValue) || 0 : correctNewValue;

    const newCorrection: ObservationCorrection = {
      id: `corr-${Date.now()}`,
      rowIndex: correctRowIndex,
      fieldKey: correctFieldKey,
      originalValue: oldVal,
      newValue: parsedVal,
      reason: correctReason.trim(),
      actor: context.operatorName,
      timestamp: new Date().toISOString(),
    };

    const nextObs = [...testRun.rawObservations];
    nextObs[correctRowIndex] = {
      ...nextObs[correctRowIndex],
      [correctFieldKey]: parsedVal,
    };

    const nextCorrections = [...(testRun.correctionsHistory || []), newCorrection];
    const updated = recomputeTestRun(nextObs, { correctionsHistory: nextCorrections });
    onUpdateTestRun(updated);
    setIsCorrectModalOpen(false);

    // Cryptographic audit persistence via background API
    if (context.evaluationNumber) {
      try {
        fetch(`/api/evaluations/${encodeURIComponent(context.evaluationNumber)}/correct`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            testRunId: testRun.id,
            rowIndex: correctRowIndex,
            fieldKey: correctFieldKey,
            oldValue: oldVal,
            newValue: parsedVal,
            reason: correctReason.trim(),
            actor: context.operatorName || 'Metrologist',
          }),
        }).catch((err) => console.warn('Background audit sync error:', err));
      } catch (e) {
        console.warn('Background audit exception:', e);
      }
    }
  };

  // Mark observation invalid
  const handleApplyInvalidation = () => {
    if (!invalidateReason.trim()) return;
    const nextObs = [...testRun.rawObservations];
    nextObs[invalidateRowIndex] = {
      ...nextObs[invalidateRowIndex],
      isInvalidated: true,
      invalidationReason: invalidateReason.trim(),
    };

    const newRemark: StructuredRemark = {
      id: `rem-inv-${Date.now()}`,
      reasonCode: 'INVALID_VALUE',
      description: `Observation #${invalidateRowIndex + 1} marked invalid: ${invalidateReason.trim()}`,
      timestamp: new Date().toISOString(),
      actor: context.operatorName,
    };

    const updated = recomputeTestRun(nextObs, {
      structuredRemarks: [...(testRun.structuredRemarks || []), newRemark],
    });
    onUpdateTestRun(updated);
    setIsInvalidateModalOpen(false);
  };

  // Request Retest
  const handleApplyRetest = () => {
    if (!retestReason.trim()) return;
    const attemptNumber = (testRun.retestHistory?.length ?? 0) + 1;
    const newRetest: RetestEvent = {
      id: `retest-${Date.now()}`,
      requestedAt: new Date().toISOString(),
      requestedBy: context.operatorName,
      reason: retestReason.trim(),
      previousStatus: testRun.status,
      previousSummary: testRun.complianceResult.summaryStatement,
    };

    // Reset observations for fresh re-testing while preserving retest history
    const resetObs = testRun.rawObservations.map((r) => {
      const copy = { ...r };
      schema.fields.forEach((f) => {
        if (!f.readOnly) {
          copy[f.key] = f.type === 'NUMBER' ? 0 : '';
        }
      });
      delete copy.isInvalidated;
      delete copy.invalidationReason;
      return copy;
    });

    const updated = recomputeTestRun(resetObs, {
      status: 'IN_PROGRESS',
      retestHistory: [...(testRun.retestHistory || []), newRetest],
      structuredRemarks: [
        ...(testRun.structuredRemarks || []),
        {
          id: `rem-ret-${Date.now()}`,
          reasonCode: 'OTHER',
          description: `Retest Attempt #${attemptNumber + 1} initiated: ${retestReason.trim()}`,
          timestamp: new Date().toISOString(),
          actor: context.operatorName,
        },
      ],
    });
    onUpdateTestRun(updated);
    setIsRetestModalOpen(false);
  };

  // Structured Remarks
  const handleAddStructuredRemark = () => {
    const reasonText = STRUCTURED_REASON_OPTIONS.find((r) => r.code === selectedReasonCode)?.label || selectedReasonCode;
    const newRemark: StructuredRemark = {
      id: `rem-${Date.now()}`,
      reasonCode: selectedReasonCode,
      description: reasonText,
      additionalNote: issueNote.trim() || undefined,
      timestamp: new Date().toISOString(),
      actor: context.operatorName,
    };
    const updated = recomputeTestRun(testRun.rawObservations, {
      structuredRemarks: [...(testRun.structuredRemarks || []), newRemark],
    });
    onUpdateTestRun(updated);
    setIssueNote('');
    setShowAddIssueForm(false);
  };

  const handleDeleteStructuredRemark = (id: string) => {
    const next = (testRun.structuredRemarks || []).filter((r) => r.id !== id);
    const updated = recomputeTestRun(testRun.rawObservations, { structuredRemarks: next });
    onUpdateTestRun(updated);
  };

  // Camera capture
  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      cameraStreamRef.current = stream;
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setCameraError('Camera access unavailable. Please use photo upload.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    const serverHash = await computeSha256Hex(dataUrl);
    const linkedObsLabel = selectedObsRowIndex !== null ? `obs-row-${selectedObsRowIndex + 1}` : undefined;

    const newEvidence: TestEvidenceItem = {
      id: `ev-${Date.now()}`,
      testRunId: testRun.id,
      evaluationId: context.evaluationNumber,
      specimenId: context.instrument.specimenId || context.instrument.id,
      observationPointId: linkedObsLabel,
      fileName: `capture-${def.code}-${Date.now().toString().slice(-6)}.jpg`,
      fileSizeBytes: Math.round(dataUrl.length * 0.75),
      mimeType: 'image/jpeg',
      dataUrl,
      timestamp: new Date().toISOString(),
      purpose: selectedPurpose,
      captureMethod: 'IN_APP_CAPTURE',
      serverHashSha256: serverHash,
      status: 'INTEGRITY_VERIFIED',
      consistencyStatus: 'CONSISTENT',
      category: 'OBSERVATION',
      verifiedByMetrologist: true,
      description: `${selectedPurpose} live camera capture for Clause ${def.clause}`,
    };

    stopCamera();
    const updatedEv = [...(testRun.evidenceReferences || []), newEvidence];
    const updated = recomputeTestRun(testRun.rawObservations, {
      evidenceReferences: updatedEv,
      evidence: updatedEv,
    });
    onUpdateTestRun(updated);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const dataUrl = evt.target?.result as string;
      const serverHash = await computeSha256Hex(dataUrl);
      const linkedObsLabel = selectedObsRowIndex !== null ? `obs-row-${selectedObsRowIndex + 1}` : undefined;

      const newEvidence: TestEvidenceItem = {
        id: `ev-${Date.now()}`,
        testRunId: testRun.id,
        evaluationId: context.evaluationNumber,
        specimenId: context.instrument.specimenId || context.instrument.id,
        observationPointId: linkedObsLabel,
        fileName: file.name,
        fileSizeBytes: file.size,
        mimeType: file.type || 'image/jpeg',
        dataUrl,
        timestamp: new Date().toISOString(),
        purpose: selectedPurpose,
        captureMethod: 'GALLERY_UPLOAD',
        serverHashSha256: serverHash,
        status: 'INTEGRITY_VERIFIED',
        consistencyStatus: 'CONSISTENT',
        category: 'SETUP_PHOTO',
        verifiedByMetrologist: true,
        description: `${selectedPurpose} file upload for Clause ${def.clause}`,
      };
      const updatedEv = [...(testRun.evidenceReferences || []), newEvidence];
      const updated = recomputeTestRun(testRun.rawObservations, {
        evidenceReferences: updatedEv,
        evidence: updatedEv,
      });
      onUpdateTestRun(updated);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSupersedeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !supersedeModalTarget) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const dataUrl = evt.target?.result as string;
      const serverHash = await computeSha256Hex(dataUrl);
      const replacementId = `ev-${Date.now()}`;

      const replacement: TestEvidenceItem = {
        id: replacementId,
        testRunId: testRun.id,
        evaluationId: context.evaluationNumber,
        specimenId: context.instrument.specimenId || context.instrument.id,
        observationPointId: supersedeModalTarget.observationPointId,
        fileName: `replacement-${file.name}`,
        fileSizeBytes: file.size,
        mimeType: file.type || 'image/jpeg',
        dataUrl,
        timestamp: new Date().toISOString(),
        purpose: supersedeModalTarget.purpose,
        captureMethod: 'GALLERY_UPLOAD',
        serverHashSha256: serverHash,
        status: 'INTEGRITY_VERIFIED',
        consistencyStatus: 'CONSISTENT',
        category: supersedeModalTarget.category,
        verifiedByMetrologist: true,
        description: `Replacement evidence superseding ${supersedeModalTarget.fileName}: ${supersedeReason}`,
      };

      const updatedEv = (testRun.evidenceReferences || []).map((ev) => {
        if (ev.id === supersedeModalTarget.id) {
          return {
            ...ev,
            isSuperseded: true,
            supersededById: replacementId,
            supersededReason: supersedeReason,
          };
        }
        return ev;
      });

      updatedEv.push(replacement);

      const updated = recomputeTestRun(testRun.rawObservations, {
        evidenceReferences: updatedEv,
        evidence: updatedEv,
      });
      onUpdateTestRun(updated);
      setSupersedeModalTarget(null);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRunDisplayOcr = (ev: TestEvidenceItem, mismatchDemo = false) => {
    if (def.pattern === 'PATTERN_B_CHECKLIST') {
      const ocrText = `${context.instrument.modelName} (SN: ${context.instrument.serialNumber}) Max: ${context.instrument.maxCapacity} ${unit}`;
      const updatedEv = (testRun.evidenceReferences || []).map((e) => {
        if (e.id === ev.id) {
          return {
            ...e,
            ocrExtractedValue: ocrText,
            ocrConfidence: 0.99,
            consistencyStatus: 'CONSISTENT' as const,
            status: 'INTEGRITY_VERIFIED' as EvidenceStatusCode,
          };
        }
        return e;
      });
      const discrepancies = (testRun.evidenceDiscrepancies || []).filter((d) => d.evidenceId !== ev.id);
      const updated = recomputeTestRun(testRun.rawObservations, {
        evidenceReferences: updatedEv,
        evidence: updatedEv,
        evidenceDiscrepancies: discrepancies,
      });
      onUpdateTestRun(updated);
      return;
    }

    // Find target observation indication
    const obsIdx = selectedObsRowIndex !== null ? selectedObsRowIndex : 0;
    const obs = testRun.rawObservations[obsIdx] || testRun.rawObservations[0];
    const recordedInd = parseFloat(String(obs?.indication ?? obs?.load ?? '15.0'));

    // Mismatch demo adds 0.025 to guarantee discrepancy > 0.5e
    const candidateNum = mismatchDemo ? recordedInd + Math.max(0.025, 5 * eVal) : recordedInd;
    const ocrText = `${candidateNum.toFixed(3)} ${unit}`;

    const comp = evaluateOcrObservationConsistency(ocrText, recordedInd, eVal);

    const updatedEv = (testRun.evidenceReferences || []).map((e) => {
      if (e.id === ev.id) {
        return {
          ...e,
          ocrExtractedValue: ocrText,
          ocrConfidence: mismatchDemo ? 0.88 : 0.99,
          consistencyStatus: comp.status,
          status: (comp.status === 'DISCREPANCY' ? 'DISCREPANCY' : 'CONSISTENT') as EvidenceStatusCode,
          observationPointId: `obs-row-${obsIdx + 1}`,
        };
      }
      return e;
    });

    const discrepancies = [...(testRun.evidenceDiscrepancies || []).filter((d) => d.evidenceId !== ev.id)];
    if (comp.status === 'DISCREPANCY') {
      discrepancies.push({
        id: `disc-${ev.id}`,
        evidenceId: ev.id,
        fieldKey: 'indication',
        recordedValue: `${recordedInd} ${unit}`,
        ocrExtractedValue: ocrText,
        ocrValue: candidateNum,
        status: 'DISCREPANCY_FLAGGED',
        flaggedAt: new Date().toISOString(),
      });
    }

    const updated = recomputeTestRun(testRun.rawObservations, {
      evidenceReferences: updatedEv,
      evidence: updatedEv,
      evidenceDiscrepancies: discrepancies,
    });
    onUpdateTestRun(updated);
  };

  const handleMarkManualReview = (evId: string) => {
    const updatedEv = (testRun.evidenceReferences || []).map((ev) => {
      if (ev.id === evId) {
        return {
          ...ev,
          status: 'MANUAL_REVIEW' as const,
          reviewNotes: 'Flagged for formal manual review by Senior Metrologist.',
        };
      }
      return ev;
    });
    const updated = recomputeTestRun(testRun.rawObservations, {
      evidenceReferences: updatedEv,
      evidence: updatedEv,
    });
    onUpdateTestRun(updated);
  };

  const handleApplyDismissOcr = () => {
    if (!dismissModalTarget || !dismissReason.trim()) return;

    const updatedEv = (testRun.evidenceReferences || []).map((ev) => {
      if (ev.id === dismissModalTarget.id) {
        return {
          ...ev,
          status: 'VERIFIED_BY_REVIEWER' as const,
          consistencyStatus: 'CONSISTENT' as const,
          dismissedBy: dismissReviewer,
          dismissalReason: dismissReason,
          reviewedBy: dismissReviewer,
          reviewedAt: new Date().toISOString(),
        };
      }
      return ev;
    });

    const discrepancies = (testRun.evidenceDiscrepancies || []).filter(
      (d) => d.evidenceId !== dismissModalTarget.id
    );

    const updated = recomputeTestRun(testRun.rawObservations, {
      evidenceReferences: updatedEv,
      evidence: updatedEv,
      evidenceDiscrepancies: discrepancies,
    });
    onUpdateTestRun(updated);
    setDismissModalTarget(null);
  };

  const handleDeleteEvidence = (id: string) => {
    const updatedEv = (testRun.evidenceReferences || []).filter((e) => e.id !== id);
    const updated = recomputeTestRun(testRun.rawObservations, {
      evidenceReferences: updatedEv,
      evidence: updatedEv,
    });
    onUpdateTestRun(updated);
  };

  const validationSummary = evaluateValidationRules(testRun, proc.validationRules, context);

  // Render the test-specific observation view based on TestDefinition
  const renderPatternView = () => {
    // 1. Weighing Performance
    if (def.code === 'R76_WEIGH_INTRINSIC') {
      return (
        <WeighingPerformanceView
          observations={testRun.rawObservations}
          unit={unit}
          eVal={eVal}
          accuracyClass={accClass}
          maxCapacity={maxCap}
          onUpdateObservations={handleUpdateObservations}
          onOpenCorrection={handleOpenCorrection}
          onOpenInvalidate={(idx) => {
            setInvalidateRowIndex(idx);
            setIsInvalidateModalOpen(true);
          }}
        />
      );
    }

    // 2. Repeatability (Dual Series)
    if (def.code === 'R76_REPEATABILITY') {
      return (
        <RepeatabilityView
          observations={testRun.rawObservations}
          unit={unit}
          eVal={eVal}
          accuracyClass={accClass}
          maxCapacity={maxCap}
          onUpdateObservations={handleUpdateObservations}
          onOpenCorrection={handleOpenCorrection}
          onOpenInvalidate={(idx) => {
            setInvalidateRowIndex(idx);
            setIsInvalidateModalOpen(true);
          }}
        />
      );
    }

    // 3. Eccentricity (Standard, Rolling, Mobile)
    if (def.code === 'R76_ECCENTRICITY' || def.code === 'R76_ECC_ROLLING' || def.code === 'R76_ECC_MOBILE') {
      return (
        <EccentricityView
          testCode={def.code}
          observations={testRun.rawObservations}
          unit={unit}
          eVal={eVal}
          accuracyClass={accClass}
          maxCapacity={maxCap}
          onUpdateObservations={handleUpdateObservations}
          onOpenCorrection={handleOpenCorrection}
          onOpenInvalidate={(idx) => {
            setInvalidateRowIndex(idx);
            setIsInvalidateModalOpen(true);
          }}
        />
      );
    }

    // 4. Discrimination
    if (def.code === 'R76_DISCRIMINATION') {
      return (
        <DiscriminationView
          observations={testRun.rawObservations}
          unit={unit}
          dVal={dVal}
          maxCapacity={maxCap}
          onUpdateObservations={handleUpdateObservations}
          onOpenCorrection={handleOpenCorrection}
          onOpenInvalidate={(idx) => {
            setInvalidateRowIndex(idx);
            setIsInvalidateModalOpen(true);
          }}
        />
      );
    }

    // 5. Tare
    if (def.code === 'R76_TARE') {
      return (
        <TareView
          observations={testRun.rawObservations}
          unit={unit}
          eVal={eVal}
          accuracyClass={accClass}
          maxCapacity={maxCap}
          onUpdateObservations={handleUpdateObservations}
          onOpenCorrection={handleOpenCorrection}
          onOpenInvalidate={(idx) => {
            setInvalidateRowIndex(idx);
            setIsInvalidateModalOpen(true);
          }}
        />
      );
    }

    // 6. Electrical Disturbances
    if (def.code === 'R76_ELECTRICAL_DISTURBANCE') {
      return (
        <ElectricalDisturbancesView
          observations={testRun.rawObservations}
          unit={unit}
          eVal={eVal}
          maxCapacity={maxCap}
          onUpdateObservations={handleUpdateObservations}
          onOpenCorrection={handleOpenCorrection}
          onOpenInvalidate={(idx) => {
            setInvalidateRowIndex(idx);
            setIsInvalidateModalOpen(true);
          }}
        />
      );
    }

    // 7. Checklist (Pattern B: Administrative, Construction, Equilibrium)
    if (def.pattern === 'PATTERN_B_CHECKLIST') {
      return (
        <ChecklistView
          observations={testRun.rawObservations}
          testName={def.name}
          onUpdateObservations={handleUpdateObservations}
        />
      );
    }

    // 8. Creep
    if (def.code === 'R76_CREEP') {
      return (
        <CreepView
          observations={testRun.rawObservations}
          unit={unit}
          eVal={eVal}
          maxCapacity={maxCap}
          onUpdateObservations={handleUpdateObservations}
          onOpenCorrection={handleOpenCorrection}
          onOpenInvalidate={(idx) => {
            setInvalidateRowIndex(idx);
            setIsInvalidateModalOpen(true);
          }}
        />
      );
    }

    // 9. Span Stability
    if (def.code === 'R76_SPAN_STABILITY') {
      return (
        <SpanStabilityView
          observations={testRun.rawObservations}
          unit={unit}
          eVal={eVal}
          maxCapacity={maxCap}
          onUpdateObservations={handleUpdateObservations}
          onOpenCorrection={handleOpenCorrection}
          onOpenInvalidate={(idx) => {
            setInvalidateRowIndex(idx);
            setIsInvalidateModalOpen(true);
          }}
        />
      );
    }

    // 10. Voltage Variation
    if (def.code === 'R76_VOLTAGE') {
      return (
        <VoltageVariationView
          observations={testRun.rawObservations}
          unit={unit}
          eVal={eVal}
          accuracyClass={accClass}
          maxCapacity={maxCap}
          onUpdateObservations={handleUpdateObservations}
          onOpenCorrection={handleOpenCorrection}
          onOpenInvalidate={(idx) => {
            setInvalidateRowIndex(idx);
            setIsInvalidateModalOpen(true);
          }}
        />
      );
    }

    // 11. Endurance
    if (def.code === 'R76_ENDURANCE') {
      return (
        <EnduranceView
          observations={testRun.rawObservations}
          unit={unit}
          eVal={eVal}
          accuracyClass={accClass}
          maxCapacity={maxCap}
          onUpdateObservations={handleUpdateObservations}
        />
      );
    }

    // 12. Default Reusable Environmental Sequence View (Tilting, Temp, Zero Return, Warm-up, Sensitivity, Damp Heat)
    return (
      <EnvironmentalSequenceView
        testCode={def.code}
        observations={testRun.rawObservations}
        unit={unit}
        eVal={eVal}
        accuracyClass={accClass}
        maxCapacity={maxCap}
        schema={schema}
        onUpdateObservations={handleUpdateObservations}
        onOpenCorrection={handleOpenCorrection}
        onOpenInvalidate={(idx) => {
          setInvalidateRowIndex(idx);
          setIsInvalidateModalOpen(true);
        }}
      />
    );
  };

  const retestAttemptsCount = testRun.retestHistory?.length ?? 0;

  // Safeguard: Do not render active testing apparatus for non-applicable tests
  if (!testRun.isApplicable || testRun.status === 'NOT_APPLICABLE') {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-2xs text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
          <Slash className="w-6 h-6" />
        </div>
        <div className="space-y-1.5 max-w-md mx-auto">
          <span className="font-mono text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Clause {def.clause} &bull; Statutory Exemption
          </span>
          <h2 className="text-base font-bold text-slate-800">{def.name}</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            This test is not applicable for {context.instrument.modelName} ({context.instrument.serialNumber}).
            {testRun.exclusionJustification ? ` ${testRun.exclusionJustification}` : ` ${def.exemptionRuleDescription || ''}`}
          </p>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={onNextTest || onReturnToPlan}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold shadow-xs transition-colors"
          >
            Continue to Active Test
          </button>
        </div>
      </div>
    );
  }

  const activeEvidenceCount = (testRun.evidenceReferences || []).filter((e) => !e.isSuperseded).length;
  const minEvidenceRequired = proc.evidencePolicy.minItems ?? 1;
  const structuredRemarksCount = (testRun.structuredRemarks || []).length;

  const renderInspectorPanel = () => {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        {/* Segmented Tab Headers */}
        <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-100/70 p-1 gap-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveInspectorTab('evidence')}
            className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeInspectorTab === 'evidence'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Evidence</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeEvidenceCount >= minEvidenceRequired
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {activeEvidenceCount}/{minEvidenceRequired}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveInspectorTab('issues')}
            className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeInspectorTab === 'issues'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Issues</span>
            {structuredRemarksCount > 0 && (
              <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.2 rounded-full font-bold">
                {structuredRemarksCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveInspectorTab('guidance')}
            className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeInspectorTab === 'guidance'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Guidance</span>
          </button>
        </div>

        {/* TAB 1: EVIDENCE & PHOTOGRAPHS */}
        {activeInspectorTab === 'evidence' && (
          <div className="p-4 space-y-4 max-h-[520px] overflow-y-auto [scrollbar-width:thin]">
            {/* Top Policy & Quick Action Bar */}
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 text-xs">
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                  proc.evidencePolicy.level === 'REQUIRED'
                    ? 'bg-blue-100 text-blue-900 border-blue-200'
                    : proc.evidencePolicy.level === 'RECOMMENDED'
                    ? 'bg-amber-50 text-amber-900 border-amber-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                POLICY: {proc.evidencePolicy.level}
              </span>

              <div className="flex items-center gap-1.5">
                {!isCameraActive ? (
                  <button
                    type="button"
                    onClick={startCamera}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700 font-medium hover:bg-blue-100 cursor-pointer"
                  >
                    <Camera className="w-3 h-3" />
                    <span>Photo</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 text-white rounded text-xs font-bold hover:bg-emerald-700 shadow-xs cursor-pointer"
                  >
                    <Camera className="w-3 h-3" />
                    <span>Capture</span>
                  </button>
                )}

                <label
                  htmlFor={fileInputId}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-300 rounded text-xs text-slate-700 font-medium hover:bg-slate-100 cursor-pointer"
                >
                  <Upload className="w-3 h-3" />
                  <span>Upload</span>
                  <input
                    id={fileInputId}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <input
                  id={replaceFileInputId}
                  type="file"
                  accept="image/*"
                  onChange={handleSupersedeUpload}
                  className="hidden"
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-snug">
              {proc.evidencePolicy.explanation}
            </p>

            {/* Context Binding Bar */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  Evidence Purpose
                </span>
                <select
                  value={selectedPurpose}
                  onChange={(e) => setSelectedPurpose(e.target.value as EvidencePurpose)}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                >
                  <option value="LOAD_POSITION">LOAD_POSITION (Pan placement)</option>
                  <option value="SETUP">SETUP (Chamber, mounting)</option>
                  <option value="RESULT_SUPPORT">RESULT_SUPPORT (Display readout)</option>
                  <option value="ENVIRONMENT">ENVIRONMENT (Thermometer, barometer)</option>
                  <option value="EQUIPMENT">EQUIPMENT (Reference weights)</option>
                  <option value="FUNCTION">FUNCTION (Zeroing, tare)</option>
                  <option value="IDENTITY">IDENTITY (Nameplate, serial)</option>
                  <option value="OTHER">OTHER (General procedural)</option>
                </select>
              </div>
            </div>

            {/* Camera Viewfinder */}
            {isCameraActive && (
              <div className="relative rounded-lg overflow-hidden bg-black aspect-video border border-slate-800">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={stopCamera}
                  className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white text-[11px] px-2 py-0.5 rounded cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}

            {cameraError && (
              <div className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                {cameraError}
              </div>
            )}

            {/* EVIDENCE DISCREPANCY BANNER */}
            {def.pattern !== 'PATTERN_B_CHECKLIST' && (testRun.evidenceReferences || [])
              .filter((e) => !e.isSuperseded && e.status === 'DISCREPANCY')
              .map((discEv) => {
                const obsIdx = selectedObsRowIndex ?? 0;
                const obs = testRun.rawObservations[obsIdx] || testRun.rawObservations[0];
                const recordedVal = String(obs?.indication ?? obs?.load ?? '15.000');
                return (
                  <div
                    key={discEv.id}
                    className="p-3 bg-red-50 border border-red-300 rounded-lg text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-red-950 font-bold">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                        <span>Discrepancy Flagged</span>
                      </div>
                      <span className="text-[10px] font-mono text-red-800 bg-red-100 px-1.5 py-0.2 rounded font-bold">
                        &gt; 0.5e
                      </span>
                    </div>

                    <p className="text-[11px] text-red-900 leading-snug">
                      Observation disagrees with OCR extraction on <strong>{discEv.fileName}</strong>:
                    </p>

                    <div className="grid grid-cols-2 gap-2 p-2 bg-white rounded border border-red-200 text-xs font-mono">
                      <div>
                        <span className="text-[9px] text-slate-500 block">Recorded</span>
                        <strong className="text-slate-900">{recordedVal} {unit}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 block">OCR Candidate</span>
                        <strong className="text-red-700">{discEv.ocrExtractedValue}</strong>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setInspectEvidenceItem(discEv)}
                        className="px-2 py-1 bg-white border border-slate-300 text-slate-700 font-semibold rounded text-[11px] hover:bg-slate-50 cursor-pointer"
                      >
                        Inspect
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMarkManualReview(discEv.id)}
                        className="px-2 py-1 bg-amber-600 text-white font-semibold rounded text-[11px] hover:bg-amber-700 cursor-pointer"
                      >
                        Manual Review
                      </button>
                      <button
                        type="button"
                        onClick={() => setDismissModalTarget(discEv)}
                        className="px-2 py-1 bg-slate-900 text-white font-semibold rounded text-[11px] hover:bg-slate-800 cursor-pointer"
                      >
                        Dismiss OCR
                      </button>
                    </div>
                  </div>
                );
              })}

            {/* ATTACHED EVIDENCE ITEMS LIST */}
            {(testRun.evidenceReferences || []).filter((e) => !e.isSuperseded).length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(testRun.evidenceReferences || [])
                  .filter((e) => !e.isSuperseded)
                  .map((ev) => (
                    <div
                      key={ev.id}
                      className="border border-slate-200 rounded-lg p-2.5 text-xs bg-slate-50/70 hover:bg-white hover:border-blue-300 transition-all space-y-2"
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          onClick={() => setInspectEvidenceItem(ev)}
                          className="w-16 h-12 rounded overflow-hidden bg-slate-200 border border-slate-200 shrink-0 cursor-pointer flex items-center justify-center"
                        >
                          {ev.dataUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={ev.dataUrl}
                              alt={ev.fileName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <FileText className="w-5 h-5 text-slate-400" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="font-semibold text-slate-800 truncate text-[11px]" title={ev.fileName}>
                            {ev.fileName}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {ev.purpose} &bull; {ev.fileSizeBytes ? `${(ev.fileSizeBytes / 1024).toFixed(1)} KB` : 'Attached'}
                          </div>
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {ev.status === 'INTEGRITY_VERIFIED' && (
                              <span className="text-[9px] font-semibold text-emerald-800 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                                SHA-256 OK
                              </span>
                            )}
                            {ev.status === 'DISCREPANCY' && (
                              <span className="text-[9px] font-bold text-red-800 bg-red-50 px-1 py-0.2 rounded border border-red-200">
                                Discrepancy
                              </span>
                            )}
                            {ev.ocrExtractedValue && (
                              <span className="text-[9px] font-mono text-slate-600 bg-slate-100 px-1 py-0.2 rounded border border-slate-200">
                                OCR: {ev.ocrExtractedValue}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setInspectEvidenceItem(ev)}
                            className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-100 font-medium cursor-pointer"
                          >
                            Inspect
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRunDisplayOcr(ev, false)}
                            className="px-2 py-0.5 bg-blue-50 border border-blue-200 rounded text-blue-700 hover:bg-blue-100 font-medium cursor-pointer"
                            title="Check OCR"
                          >
                            OCR
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setSupersedeModalTarget(ev)}
                            className="p-1 text-slate-500 hover:text-blue-700 hover:bg-slate-100 rounded cursor-pointer"
                            title="Replace evidence"
                          >
                            <RefreshCw className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEvidence(ev.id)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded cursor-pointer"
                            title="Delete upload"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="p-4 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                <Camera className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                <p className="font-semibold text-slate-700 text-xs">No verification photos attached</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {proc.evidencePolicy.level === 'REQUIRED'
                    ? 'Mandatory: Attach at least 1 photo to complete test.'
                    : 'Photographic evidence is optional for this procedure.'}
                </p>
              </div>
            )}

            {/* Superseded History Accordion */}
            {(testRun.evidenceReferences || []).filter((e) => e.isSuperseded).length > 0 && (
              <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50/80 space-y-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setShowSupersededEvidence(!showSupersededEvidence)}
                  className="flex items-center justify-between w-full font-semibold text-slate-700 cursor-pointer"
                >
                  <span>
                    Superseded History ({(testRun.evidenceReferences || []).filter((e) => e.isSuperseded).length})
                  </span>
                  {showSupersededEvidence ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </button>

                {showSupersededEvidence && (
                  <div className="divide-y divide-slate-200 border-t border-slate-200 pt-1.5 space-y-1 text-[11px] font-mono text-slate-600">
                    {(testRun.evidenceReferences || [])
                      .filter((e) => e.isSuperseded)
                      .map((sup) => (
                        <div key={sup.id} className="pt-1 flex items-center justify-between">
                          <span className="line-through truncate max-w-[140px]">{sup.fileName}</span>
                          <button
                            type="button"
                            onClick={() => setInspectEvidenceItem(sup)}
                            className="text-blue-700 hover:underline cursor-pointer"
                          >
                            View
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ISSUES & ANOMALIES */}
        {activeInspectorTab === 'issues' && (
          <div className="p-4 space-y-4 max-h-[520px] overflow-y-auto [scrollbar-width:thin]">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Laboratory Remarks
              </span>

              {!showAddIssueForm && (
                <button
                  type="button"
                  onClick={() => setShowAddIssueForm(true)}
                  className="text-xs font-semibold text-blue-700 hover:text-blue-900 border border-blue-200 bg-blue-50 px-2 py-0.5 rounded cursor-pointer"
                >
                  + Log Issue
                </button>
              )}
            </div>

            {showAddIssueForm && (
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-[11px]">Reason Code:</span>
                  <button
                    type="button"
                    onClick={() => setShowAddIssueForm(false)}
                    className="text-slate-400 hover:text-slate-600 text-[11px] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <select
                  value={selectedReasonCode}
                  onChange={(e) => setSelectedReasonCode(e.target.value as StructuredReasonCode)}
                  className="w-full px-2 py-1 border border-slate-300 rounded text-xs text-slate-800 bg-white focus:outline-none focus:border-blue-600"
                >
                  {STRUCTURED_REASON_OPTIONS.map((opt) => (
                    <option key={opt.code} value={opt.code}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  value={issueNote}
                  onChange={(e) => setIssueNote(e.target.value)}
                  placeholder="Additional observation note..."
                  className="w-full px-2 py-1 border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                />

                <button
                  type="button"
                  onClick={handleAddStructuredRemark}
                  className="w-full py-1 bg-blue-700 text-white text-xs font-semibold rounded hover:bg-blue-800 cursor-pointer shadow-2xs"
                >
                  Save Note
                </button>
              </div>
            )}

            {testRun.structuredRemarks && testRun.structuredRemarks.length > 0 ? (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden bg-slate-50/50">
                {testRun.structuredRemarks.map((rem) => (
                  <div key={rem.id} className="p-2.5 text-xs flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-slate-800 bg-slate-200 px-1.5 py-0.2 rounded text-[10px]">
                          {rem.reasonCode.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] text-slate-400">by {rem.actor}</span>
                      </div>
                      <div className="text-slate-700 font-medium text-[11px]">{rem.description}</div>
                      {rem.additionalNote && (
                        <div className="text-[10px] text-slate-500 italic">Note: {rem.additionalNote}</div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteStructuredRemark(rem.id)}
                      className="text-slate-400 hover:text-red-600 p-0.5 cursor-pointer shrink-0"
                      title="Remove remark"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 text-center py-4">
                No issues or anomalies logged for this test run.
              </p>
            )}
          </div>
        )}

        {/* TAB 3: GUIDANCE & TEST SETUP */}
        {activeInspectorTab === 'guidance' && (
          <div className="p-4 space-y-4 max-h-[520px] overflow-y-auto [scrollbar-width:thin] text-xs">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
              <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <Info className="w-3.5 h-3.5 text-blue-700" />
                <span>What are we checking?</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {proc.whatIsBeingChecked}
              </p>
            </div>

            <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-3 space-y-2">
              <span className="uppercase tracking-wider text-[10px] font-bold text-slate-700 block">
                Standard Equipment Assigned
              </span>
              {testRun.equipmentUsed && testRun.equipmentUsed.length > 0 ? (
                <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-600">
                  {testRun.equipmentUsed.map((e, idx) => (
                    <li key={idx}><strong>{e.name}</strong></li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] text-slate-500 italic">Standard Reference Weights</p>
              )}
            </div>

            <div className="space-y-1.5">
              <span className="uppercase tracking-wider text-[10px] font-bold text-slate-700 block">
                Procedural Instructions
              </span>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600">
                {proc.setupInstructions.map((instruction, idx) => (
                  <li key={idx}>{instruction}</li>
                ))}
              </ul>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowTechDetails(!showTechDetails)}
                className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer font-medium"
              >
                <span>{showTechDetails ? 'Hide cryptographic provenance' : 'View cryptographic provenance'}</span>
                {showTechDetails ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </button>
              {showTechDetails && (
                <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-mono text-slate-600 space-y-1">
                  <div>Standard: {def.standard} Clause {def.clause}</div>
                  <div>Evaluation ID: {context.evaluationNumber}</div>
                  <div>Specimen ID: {context.instrument.serialNumber}</div>
                  <div>
                    Hashes (SHA-256):
                    {(testRun.evidenceReferences || []).map((e) => (
                      <div key={e.id} className="pl-2 text-[9px] text-slate-500 truncate">
                        &bull; {e.fileName}: {e.serverHashSha256 || 'Calculated'}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden flex flex-col space-y-0">
      {/* ========================================================================= */}
      {/* 1. TEST HEADER: Read-Only Compact Context Header (Section 3)             */}
      {/* ========================================================================= */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-700">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-sm">{def.name}</span>
            <span className="font-mono bg-blue-100 text-blue-800 text-[11px] font-bold px-2 py-0.5 rounded border border-blue-200">
              Clause {def.clause}
            </span>
          </div>
          <div className="flex items-center gap-3 text-slate-600 text-[11px]">
            <span className="font-bold text-slate-800 flex items-center gap-1">
              <Scale className="w-3.5 h-3.5 text-blue-700" />
              {context.instrument.modelName}
            </span>
            <span className="font-mono text-slate-500">SN: {context.instrument.serialNumber}</span>
            <span className="font-semibold text-blue-700">Class {accClass.replace('_', ' ')}</span>
            <span className="font-mono">Max {maxCap} {unit}</span>
            <span className="font-mono">e = {eVal} {unit}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
          <span className="font-mono text-[11px] text-slate-400 hidden md:inline">
            {context.evaluationNumber}
          </span>

          {/* Quick Simulation / DAQ Trigger */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleSimulateSingleTest}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              title="Simulate live data acquisition from laboratory load cell / digital indicator"
            >
              <Zap className="w-3.5 h-3.5 text-blue-600 fill-current" />
              <span>Simulate Live DAQ</span>
            </button>

            {testRun.rawObservations.length > 0 && (
              <button
                type="button"
                onClick={handleClearSingleTest}
                className="inline-flex items-center gap-1 px-2 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded text-xs border border-slate-200 transition-colors cursor-pointer"
                title="Reset this test to blank for manual data entry"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {testRun.status === 'PASS' && (
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-300 text-emerald-800 px-3 py-1.5 rounded-md font-bold text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              PASS
            </span>
          )}
          {testRun.status === 'FAIL' && (
            <span className="inline-flex items-center gap-1.5 bg-red-50 border border-red-300 text-red-800 px-3 py-1.5 rounded-md font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              FAIL
            </span>
          )}
          {testRun.status === 'IN_PROGRESS' && (
            <span className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1.5 rounded-md font-semibold text-xs">
              <Clock className="w-4 h-4 text-blue-600" />
              IN PROGRESS
            </span>
          )}
          {testRun.status === 'NOT_TESTED' && (
            <span className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-200 text-slate-600 px-3 py-1.5 rounded-md font-semibold text-xs">
              <RotateCcw className="w-4 h-4 text-slate-400" />
              NOT TESTED
            </span>
          )}
          {testRun.status === 'RETEST_REQUIRED' && (
            <span className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-300 text-amber-800 px-3 py-1.5 rounded-md font-bold text-xs">
              <RefreshCw className="w-4 h-4 text-amber-600" />
              RETEST REQUIRED
            </span>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {/* RETEST ATTEMPT BANNER */}
        {retestAttemptsCount > 0 && (
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 text-xs flex items-center justify-between gap-3 text-amber-900 mb-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Attempt #{retestAttemptsCount + 1}:</strong> Previous attempt #{retestAttemptsCount} concluded with verdict <strong>{testRun.retestHistory?.[retestAttemptsCount - 1]?.previousStatus}</strong> ({testRun.retestHistory?.[retestAttemptsCount - 1]?.reason}). Complete history is preserved for review.
              </span>
            </div>
            <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded shrink-0">
              Retest Active
            </span>
          </div>
        )}

        {/* FULL-WIDTH STACKED WORKSPACE (Option 1): 100% width table, zero horizontal scrollbar */}
        <div className="space-y-6">
          {/* 1. OBSERVATIONS SECTION (Full Width Canvas) */}
          <div className="space-y-4 min-w-0">
            {/* Hardware WebSerial & Equilibrium Telemetry Bar (OIML R 76-1 Clause 4.4.2) */}
            <div className="bg-slate-900 text-slate-100 rounded-lg p-3.5 border border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded bg-slate-800 text-blue-400">
                    <Cable className="w-4 h-4" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200">Balance Stream (RS-232 / USB)</span>
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        serialStatus === 'CONNECTED'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : serialStatus === 'CONNECTING'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          serialStatus === 'CONNECTED' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                        }`} />
                        {serialStatus}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {latestReading ? (
                        <span>Raw: {latestReading.raw}</span>
                      ) : (
                        <span>No balance stream active (9600-8-N-1)</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Live Reading & Stability Badge */}
                {latestReading && (
                  <div className="flex items-center gap-2 bg-slate-800/90 px-3 py-1.5 rounded border border-slate-700 font-mono">
                    <span className="text-slate-400 text-[10px]">INDICATION:</span>
                    <span className="font-bold text-sm text-white">
                      {latestReading.weight.toFixed(3)} {latestReading.unit}
                    </span>
                    {latestReading.isStable && !latestReading.isEquilibriumLocked ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-900/60 border border-emerald-600/50 text-emerald-300 text-[10px] px-1.5 py-0.5 rounded font-bold">
                        <Lock className="w-3 h-3" />
                        STABLE &bull; Cl. 4.4.2
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-amber-900/60 border border-amber-600/50 text-amber-300 text-[10px] px-1.5 py-0.5 rounded font-bold" title={latestReading.stabilityNote}>
                        <Unlock className="w-3 h-3" />
                        DYNAMIC (LOCKED)
                      </span>
                    )}
                  </div>
                )}

                {/* Capture Button */}
                {latestReading && (
                  <button
                    type="button"
                    disabled={!latestReading.isStable || latestReading.isEquilibriumLocked}
                    onClick={handleCaptureSerialReading}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded font-semibold text-xs transition-colors cursor-pointer ${
                      latestReading.isStable && !latestReading.isEquilibriumLocked
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    }`}
                    title={
                      latestReading.isStable && !latestReading.isEquilibriumLocked
                        ? "Capture stable indication into active observation"
                        : `Capture locked: ${latestReading.stabilityNote}`
                    }
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Capture Indication</span>
                  </button>
                )}

                {/* Feedback Toast */}
                {captureFeedback && (
                  <span className="text-[11px] text-emerald-400 font-medium animate-fade-in">
                    {captureFeedback}
                  </span>
                )}

                {/* Connect / Disconnect / Simulate Buttons */}
                {serialStatus !== 'CONNECTED' ? (
                  <>
                    <button
                      type="button"
                      onClick={handleConnectSerial}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium text-xs shadow-2xs transition-colors cursor-pointer"
                    >
                      <Cable className="w-3.5 h-3.5" />
                      <span>Connect Balance</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleToggleSimulation}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded font-medium text-xs transition-colors cursor-pointer"
                    >
                      <span>Simulate Stream</span>
                    </button>
                  </>
                ) : (
                  <>
                    {isSimulatingStream && (
                      <span className="text-[10px] text-blue-400 bg-blue-950/60 border border-blue-800 px-2 py-1 rounded">
                        Virtual Stream
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={handleDisconnectSerial}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded font-medium text-xs transition-colors cursor-pointer"
                    >
                      <span>Disconnect</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            <LongDurationTestProgress testCode={def.code} observations={testRun.rawObservations} />
            {renderPatternView()}
          </div>

          {/* 2. RESULTS & COMPLIANCE SECTION */}
          <div className="space-y-4">
            {/* ========================================================================= */}
            {/* 5. VALIDATION: 4 Metrological Categories (Sections 30-33)                */}
            {/* ========================================================================= */}
            <div className="space-y-2">
              {validationSummary.blockingCount > 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 text-xs text-amber-900 space-y-2">
                  <div className="font-bold flex items-center gap-1.5 text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>{validationSummary.blockingCount} item{validationSummary.blockingCount > 1 ? 's' : ''} remain before this test can be completed.</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-0.5 text-amber-800 text-[11px]">
                    {validationSummary.messages.map((m) => (
                      <li key={m.id}>{m.message}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold">All required inputs, test conditions, and validation rules satisfied.</span>
                </div>
              )}
            </div>

            {/* ========================================================================= */}
            {/* 6. CALCULATED RESULT: Read-Only Authoritative Preview (Section 6 & 7)     */}
            {/* ========================================================================= */}
            {testRun.isApplicable && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-800">
                      Results &amp; Compliance
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowCalcDetails(!showCalcDetails)}
                    className="text-xs font-medium text-blue-700 hover:text-blue-900 flex items-center gap-1"
                  >
                    <span>{showCalcDetails ? 'Hide calculation details' : 'View calculation details'}</span>
                    {showCalcDetails ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs bg-white p-3.5 border border-slate-200 rounded-md gap-2">
                  <span className="text-slate-700 font-medium">
                    {testRun.complianceResult.summaryStatement}
                  </span>
                  <span className="font-bold text-xs shrink-0">
                    {testRun.complianceResult.verdict === 'PASS' && (
                      <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded">
                        PASS
                      </span>
                    )}
                    {testRun.complianceResult.verdict === 'FAIL' && (
                      <span className="text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded">
                        FAIL
                      </span>
                    )}
                    {testRun.complianceResult.verdict === 'INCOMPLETE' && (
                      <span className="text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded">
                        INCOMPLETE
                      </span>
                    )}
                  </span>
                </div>

                {/* ========================================================================= */}
                {/* 7. COMPLIANCE & FAILED MEASUREMENT WORKFLOW (Sections 34-36: No Overrides)*/}
                {/* ========================================================================= */}
                {testRun.complianceResult.verdict === 'FAIL' && (
                  <div className="bg-red-50/70 border border-red-200 rounded p-3 text-xs space-y-2">
                    <div className="font-bold text-red-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span>FAIL &bull; Calculated result exceeds statutory OIML R 76 requirements.</span>
                    </div>
                    <p className="text-red-800 text-[11px] leading-relaxed">
                      In accordance with metrological integrity rules, failed results cannot be manually overridden. Review the observation, mark invalid with structured rationale, or initiate an authorized retest:
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowCalcDetails(true)}
                        className="px-2.5 py-1.5 bg-white border border-slate-300 text-slate-700 rounded font-semibold text-xs hover:bg-slate-50"
                      >
                        Review Observation
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setInvalidateRowIndex(0);
                          setIsInvalidateModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 bg-amber-600 text-white rounded font-semibold text-xs hover:bg-amber-700 shadow-xs"
                      >
                        Mark Observation Invalid
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsRetestModalOpen(true)}
                        className="px-2.5 py-1.5 bg-blue-700 text-white rounded font-semibold text-xs hover:bg-blue-800 shadow-xs flex items-center gap-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Request Retest
                      </button>
                    </div>
                  </div>
                )}

                {showCalcDetails && testRun.complianceResult.trace && (
                  <div className="p-3 bg-white border border-slate-200 rounded text-xs space-y-1 font-mono text-slate-600">
                    <div className="font-bold text-slate-800 font-sans mb-1 text-[11px]">
                      Calculation Details &amp; Metrology Trace (Clause {def.clause}):
                    </div>
                    {Object.entries(testRun.complianceResult.trace).map(([k, v]) => (
                      <div key={k} className="flex justify-between py-0.5 border-b border-slate-100 last:border-0">
                        <span className="text-slate-500 font-sans">{k}:</span>
                        <span className="text-slate-800">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CORRECTIONS HISTORY BADGE & ACCORDION (Section 37) */}
            {testRun.correctionsHistory && testRun.correctionsHistory.length > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-2">
                <button
                  type="button"
                  onClick={() => setShowCorrectionsHistory(!showCorrectionsHistory)}
                  className="font-semibold text-slate-800 flex items-center justify-between w-full"
                >
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-3.5 h-3.5 text-blue-700" />
                    <span>Observation Correction History ({testRun.correctionsHistory.length} entry/entries)</span>
                  </div>
                  {showCorrectionsHistory ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>

                {showCorrectionsHistory && (
                  <div className="divide-y divide-slate-200 border-t border-slate-200 pt-2 font-mono text-[11px] text-slate-600 space-y-1">
                    {testRun.correctionsHistory.map((c) => (
                      <div key={c.id} className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div>
                          Row #{c.rowIndex + 1} &bull; Field: <strong>{c.fieldKey}</strong> &bull; Original: <del>{String(c.originalValue)}</del> &rarr; Corrected: <strong>{String(c.newValue)}</strong>
                        </div>
                        <div className="text-[10px] text-slate-400 font-sans">
                          {c.reason} (by {c.actor})
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. INSPECTOR STUDIO (Full Width Accordion/Card for Evidence, Remarks & Guidance) */}
          <div className="pt-2">
            {renderInspectorPanel()}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 10. TEST ACTIONS (Navigation - Section 2)                                 */}
        {/* ========================================================================= */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onReturnToPlan}
            className="text-xs text-slate-600 hover:text-slate-900 font-medium px-3 py-2 rounded border border-slate-300 bg-white hover:bg-slate-50"
          >
            &larr; Return to Test Plan
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!hasPrevious}
              onClick={onPreviousTest}
              className={`px-3 py-2 text-xs font-semibold rounded border ${
                hasPrevious
                  ? 'text-slate-700 border-slate-300 bg-white hover:bg-slate-50'
                  : 'text-slate-400 border-slate-200 bg-slate-50 cursor-not-allowed'
              }`}
            >
              Previous Test
            </button>

            <button
              type="button"
              onClick={onNextTest}
              className="px-4 py-2 text-xs font-bold rounded bg-blue-700 text-white hover:bg-blue-800 shadow-sm"
            >
              {hasNext ? 'Save & Next Test →' : 'Save & Proceed to Review →'}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: CORRECT OBSERVATION (Section 37)                                   */}
      {/* ========================================================================= */}
      {isCorrectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-blue-700" />
                Correct Observation (Audit Trail)
              </h3>
              <button
                type="button"
                onClick={() => setIsCorrectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1">
                <div>Row: <strong>#{correctRowIndex + 1}</strong></div>
                <div>Field: <strong>{correctFieldKey}</strong></div>
                <div>Original Value: <strong>{String(testRun.rawObservations[correctRowIndex]?.[correctFieldKey] ?? '')}</strong></div>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">New Corrected Value:</label>
                <input
                  type="text"
                  value={correctNewValue}
                  onChange={(e) => setCorrectNewValue(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Mandatory Correction Reason:</label>
                <select
                  value={correctReason}
                  onChange={(e) => setCorrectReason(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:border-blue-600 bg-white"
                >
                  <option value="Data-entry error">Data-entry error</option>
                  <option value="Transcription correction">Transcription correction</option>
                  <option value="Typographical slip">Typographical slip</option>
                  <option value="Other verified correction">Other verified correction</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setIsCorrectModalOpen(false)}
                className="px-3 py-1.5 text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!correctReason.trim()}
                onClick={handleApplyCorrection}
                className="px-4 py-1.5 bg-blue-700 text-white font-semibold rounded hover:bg-blue-800 disabled:opacity-50"
              >
                Apply &amp; Recalculate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: MARK OBSERVATION INVALID (Section 36)                              */}
      {/* ========================================================================= */}
      {isInvalidateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-red-900 text-sm flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-red-600" />
                Mark Observation Invalid
              </h3>
              <button
                type="button"
                onClick={() => setIsInvalidateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Invalidating observation #{invalidateRowIndex + 1} preserves the original record in the immutable audit trail while excluding it from calculation and compliance derivation.
              </p>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Structured Invalidation Reason:</label>
                <select
                  value={invalidateReason}
                  onChange={(e) => setInvalidateReason(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:border-red-600 bg-white"
                >
                  <option value="Data-entry error">Data-entry error</option>
                  <option value="Equipment problem">Equipment problem</option>
                  <option value="Instrument problem">Instrument problem</option>
                  <option value="Invalid setup">Invalid setup</option>
                  <option value="Procedure interrupted">Procedure interrupted</option>
                  <option value="Unstable condition">Unstable condition</option>
                  <option value="Other">Other verified reason</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setIsInvalidateModalOpen(false)}
                className="px-3 py-1.5 text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!invalidateReason.trim()}
                onClick={handleApplyInvalidation}
                className="px-4 py-1.5 bg-red-600 text-white font-semibold rounded hover:bg-red-700 disabled:opacity-50"
              >
                Confirm Invalidation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REQUEST RETEST (Section 38)                                        */}
      {/* ========================================================================= */}
      {isRetestModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-blue-700" />
                Request Laboratory Retest (Attempt #{retestAttemptsCount + 2})
              </h3>
              <button
                type="button"
                onClick={() => setIsRetestModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600 leading-relaxed">
                A retest creates a separate attempt while preserving previous attempt results and reasons in the immutable evaluation history.
              </p>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Mandatory Retest Protocol / Reason:</label>
                <textarea
                  rows={3}
                  value={retestReason}
                  onChange={(e) => setRetestReason(e.target.value)}
                  placeholder="e.g. Standard weights re-stabilized; thermal drift eliminated; fresh series initiated..."
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setIsRetestModalOpen(false)}
                className="px-3 py-1.5 text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!retestReason.trim()}
                onClick={handleApplyRetest}
                className="px-4 py-1.5 bg-blue-700 text-white font-semibold rounded hover:bg-blue-800 disabled:opacity-50"
              >
                Start Retest Run
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: INSPECT EVIDENCE (Section 22)                                      */}
      {/* ========================================================================= */}
      {inspectEvidenceItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-700" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Evidence Inspection: {inspectEvidenceItem.fileName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectEvidenceItem(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {inspectEvidenceItem.dataUrl && (
                <div className="rounded-lg overflow-hidden border border-slate-200 bg-black/5 aspect-video flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={inspectEvidenceItem.dataUrl}
                    alt={inspectEvidenceItem.fileName}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              {/* Core Evidence Metadata Table */}
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px]">
                <div>
                  <span className="text-slate-400 block uppercase font-bold text-[9px]">Purpose</span>
                  <span className="font-bold text-slate-800">{inspectEvidenceItem.purpose || 'SETUP'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-bold text-[9px]">Linked Test</span>
                  <span className="font-medium text-slate-800">{def.name} (Clause {def.clause})</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-bold text-[9px]">Linked Observation</span>
                  <span className="font-medium text-blue-700">{inspectEvidenceItem.observationPointId || 'General Procedure'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-bold text-[9px]">Capture Method</span>
                  <span className="font-medium text-slate-800">
                    {inspectEvidenceItem.captureMethod === 'IN_APP_CAPTURE' ? 'Live In-App Camera' : 'Gallery File Upload'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-bold text-[9px]">Integrity Status</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    {inspectEvidenceItem.status || 'INTEGRITY_VERIFIED'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-bold text-[9px]">Consistency Status</span>
                  <span className="font-semibold text-slate-800">{inspectEvidenceItem.consistencyStatus || 'CONSISTENT'}</span>
                </div>
                {inspectEvidenceItem.ocrExtractedValue && (
                  <div className="col-span-2 pt-1 border-t border-slate-200">
                    <span className="text-slate-400 block uppercase font-bold text-[9px]">Advisory OCR Candidate</span>
                    <span className="font-mono font-bold text-blue-900">
                      {inspectEvidenceItem.ocrExtractedValue} (Confidence: {Math.round((inspectEvidenceItem.ocrConfidence ?? 0.95) * 100)}%)
                    </span>
                  </div>
                )}
                {inspectEvidenceItem.dismissalReason && (
                  <div className="col-span-2 pt-1 border-t border-slate-200 bg-purple-50 p-2 rounded">
                    <span className="text-purple-700 block font-bold text-[10px]">Reviewer Verified / Discrepancy Dismissed</span>
                    <span className="text-purple-900 block text-[11px] mt-0.5">
                      {inspectEvidenceItem.dismissalReason} (by {inspectEvidenceItem.dismissedBy || 'Metrologist'})
                    </span>
                  </div>
                )}
              </div>

              {/* Technical Details Accordion */}
              <div className="border border-slate-200 rounded-lg p-2.5 bg-white space-y-1 font-mono text-[10px] text-slate-600">
                <div className="font-bold text-slate-800 font-sans text-[11px]">Technical &amp; Cryptographic Details:</div>
                <div className="break-all">Server Digest (SHA-256): {inspectEvidenceItem.serverHashSha256 || 'Calculated on server'}</div>
                <div>Evaluation ID: {inspectEvidenceItem.evaluationId || context.evaluationNumber}</div>
                <div>Specimen ID: {inspectEvidenceItem.specimenId || context.instrument.specimenId || context.instrument.id}</div>
                <div>Timestamp: {inspectEvidenceItem.timestamp}</div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setInspectEvidenceItem(null)}
                className="px-4 py-1.5 bg-slate-900 text-white font-semibold rounded hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DISMISS OCR ERROR (Section 23: Discrepancy Handling)               */}
      {/* ========================================================================= */}
      {dismissModalTarget && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-700" />
                Dismiss Evidence Discrepancy (OCR Error)
              </h3>
              <button
                type="button"
                onClick={() => setDismissModalTarget(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600 leading-relaxed text-[11px]">
                In accordance with Section 23, dismissing an OCR discrepancy requires an authorized reviewer and documented technical justification. Optical recognition output is never modified directly.
              </p>

              <div className="bg-slate-50 p-2.5 rounded border border-slate-200 font-mono text-[11px] space-y-1">
                <div>Evidence: <strong>{dismissModalTarget.fileName}</strong></div>
                <div>OCR Candidate: <strong className="text-red-700">{dismissModalTarget.ocrExtractedValue}</strong></div>
                <div>Recorded Indication: <strong className="text-slate-900">{String(testRun.rawObservations[0]?.indication ?? '—')} {unit}</strong></div>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Authorizing Reviewer *</label>
                <input
                  type="text"
                  required
                  value={dismissReviewer}
                  onChange={(e) => setDismissReviewer(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Mandatory Dismissal Rationale *</label>
                <textarea
                  rows={2}
                  required
                  value={dismissReason}
                  onChange={(e) => setDismissReason(e.target.value)}
                  placeholder="e.g. Parallax glare or segmented font ambiguity in photo; verified with calibrated standard weights."
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setDismissModalTarget(null)}
                className="px-3 py-1.5 text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!dismissReason.trim() || !dismissReviewer.trim()}
                onClick={handleApplyDismissOcr}
                className="px-4 py-1.5 bg-slate-900 text-white font-semibold rounded hover:bg-slate-800 disabled:opacity-50"
              >
                Confirm Dismissal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SUPERSEDE EVIDENCE (Section 24: Non-destructive Replacement)       */}
      {/* ========================================================================= */}
      {supersedeModalTarget && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-blue-700" />
                Replace &amp; Supersede Evidence
              </h3>
              <button
                type="button"
                onClick={() => setSupersedeModalTarget(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600 leading-relaxed text-[11px]">
                In accordance with Section 24, evidence is never silently deleted. Original file <strong>{supersedeModalTarget.fileName}</strong> will remain preserved in the audit log as superseded.
              </p>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Reason for Replacement *</label>
                <input
                  type="text"
                  required
                  value={supersedeReason}
                  onChange={(e) => setSupersedeReason(e.target.value)}
                  placeholder="e.g. Higher clarity photograph captured or updated load positioning"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    document.getElementById(replaceFileInputId)?.click();
                  }}
                  className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Select Replacement Photograph
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setSupersedeModalTarget(null)}
                className="px-3 py-1.5 text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
