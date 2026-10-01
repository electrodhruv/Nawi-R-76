'use client';

import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Upload,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  X,
  FileText,
  Info,
} from 'lucide-react';
import { TestSuiteItem, TestEvidenceItem } from '@/lib/test-suite-types';
import { RegisteredInstrument } from '@/lib/synthetic-instruments';

interface TestWorkspaceShellProps {
  test: TestSuiteItem;
  instrument: RegisteredInstrument;
  onUpdateTest: (updatedTest: TestSuiteItem) => void;
  onPrevTest?: () => void;
  onNextTest?: () => void;
  onBackToTestPlan: () => void;
  children: React.ReactNode;
  calculatedResultsNode?: React.ReactNode;
}

export const TestWorkspaceShell: React.FC<TestWorkspaceShellProps> = ({
  test,
  instrument,
  onUpdateTest,
  onPrevTest,
  onNextTest,
  onBackToTestPlan,
  children,
  calculatedResultsNode,
}) => {
  const [remarks, setRemarks] = useState(test.remarks || '');
  const [evidenceList, setEvidenceList] = useState<TestEvidenceItem[]>(test.evidence || []);

  // Camera capture modal state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const docInputRef = useRef<HTMLInputElement | null>(null);

  const handleRemarksChange = (val: string) => {
    setRemarks(val);
    onUpdateTest({
      ...test,
      remarks: val,
    });
  };

  // Upload Photo Handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const newEv: TestEvidenceItem = {
        id: `ev-${Date.now()}`,
        fileName: file.name,
        dataUrl,
        mimeType: file.type,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
        description: `Photo attached for Clause ${test.clause}`,
      };
      const updatedList = [newEv, ...evidenceList];
      setEvidenceList(updatedList);
      onUpdateTest({
        ...test,
        evidence: updatedList,
      });
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Document Attachment Handler
  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const newEv: TestEvidenceItem = {
      id: `doc-${Date.now()}`,
      fileName: file.name,
      mimeType: file.type || 'application/pdf',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      description: `Calibration document / log for Clause ${test.clause}`,
    };
    const updatedList = [newEv, ...evidenceList];
    setEvidenceList(updatedList);
    onUpdateTest({
      ...test,
      evidence: updatedList,
    });
    if (docInputRef.current) docInputRef.current.value = '';
  };

  // Camera Open
  const handleStartCamera = async () => {
    setIsCameraActive(true);
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      setCameraError('Camera access not supported or permission denied. Please use the Upload button.');
    }
  };

  const handleStopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      const newEv: TestEvidenceItem = {
        id: `cam-${Date.now()}`,
        fileName: `camera_snapshot_${test.clause.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`,
        dataUrl,
        mimeType: 'image/jpeg',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
        description: `Camera snapshot for Clause ${test.clause}`,
      };
      const updatedList = [newEv, ...evidenceList];
      setEvidenceList(updatedList);
      onUpdateTest({
        ...test,
        evidence: updatedList,
      });
    }
    handleStopCamera();
  };

  const handleRemoveEvidence = (id: string) => {
    const updated = evidenceList.filter((e) => e.id !== id);
    setEvidenceList(updated);
    onUpdateTest({
      ...test,
      evidence: updated,
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden flex flex-col space-y-6 p-5 sm:p-6">
      {/* 1. Test Header */}
      <div className="border-b border-slate-200 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">{test.name}</h1>
            <span className="text-xs px-2 py-0.5 rounded font-mono font-medium bg-blue-50 text-blue-800 border border-blue-200">
              Clause {test.clause}
            </span>
            {instrument.hasFailedSample && test.status === 'FAIL' && (
              <span className="text-xs px-2 py-0.5 rounded font-semibold bg-red-100 text-red-800 border border-red-200">
                Non-Compliant Specimen
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs">
            {test.status === 'PASS' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                PASS
              </span>
            )}
            {test.status === 'FAIL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold bg-red-50 text-red-700 border border-red-200">
                <AlertCircle className="w-3.5 h-3.5" />
                FAIL
              </span>
            )}
            {test.status === 'IN_PROGRESS' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-medium bg-blue-50 text-blue-700 border border-blue-200">
                <Clock className="w-3.5 h-3.5" />
                IN PROGRESS
              </span>
            )}
            {test.status === 'NOT_APPLICABLE' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-medium bg-slate-100 text-slate-500 border border-slate-200">
                NOT APPLICABLE
              </span>
            )}
          </div>
        </div>

        {/* Short Execution Instruction & Purpose */}
        <div className="mt-3 bg-slate-50 rounded-lg p-3 border border-slate-200/80 text-xs text-slate-600 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-medium text-slate-800">
              <strong>Purpose:</strong> {test.purpose}
            </p>
            <p className="text-slate-500">
              <strong>Execution Instruction:</strong> {test.instruction}
            </p>
          </div>
        </div>

        {test.exclusionJustification && !test.isApplicable && (
          <div className="mt-2.5 p-2.5 rounded bg-amber-50/80 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>
              <strong>Exclusion Justification:</strong> {test.exclusionJustification}
            </span>
          </div>
        )}
      </div>

      {/* 2. Main Test Form (RAW OBSERVATIONS) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Raw Test Observations
          </h2>
          <span className="text-[11px] text-slate-400">
            Enter test measurements; results are calculated server-authoritatively.
          </span>
        </div>

        {children}
      </div>

      {/* 3. Calculated Results Section (Strictly Separated from Raw Data) */}
      {calculatedResultsNode && (
        <div className="pt-2">
          <div className="mb-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Calculated Results
            </h2>
            <span className="text-[11px] text-slate-500">
              Calculations evaluated per OIML R 76 Table 6 requirements.
            </span>
          </div>
          {calculatedResultsNode}
        </div>
      )}

      {/* 4. Evidence Attachment Section */}
      <div className="border-t border-slate-100 pt-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Test Evidence &amp; Traceability
            </h2>
            <p className="text-[11px] text-slate-400">
              Attach photographic or documentary proof for Clause {test.clause}.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
            <input
              type="file"
              ref={docInputRef}
              accept=".pdf,.doc,.docx,.txt"
              className="hidden"
              onChange={handleDocUpload}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Upload Photo</span>
            </button>

            <button
              type="button"
              onClick={handleStartCamera}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Camera className="w-3.5 h-3.5 text-blue-700" />
              <span>Camera</span>
            </button>

            <button
              type="button"
              onClick={() => docInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Paperclip className="w-3.5 h-3.5 text-slate-500" />
              <span>Attach Doc</span>
            </button>
          </div>
        </div>

        {/* Camera Modal */}
        {isCameraActive && (
          <div className="p-3.5 bg-slate-900 rounded-lg text-white space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span>Live Camera Stream — Clause {test.clause}</span>
              <button
                type="button"
                onClick={handleStopCamera}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {cameraError ? (
              <p className="text-xs text-red-300">{cameraError}</p>
            ) : (
              <div className="relative rounded overflow-hidden bg-black aspect-video max-h-56 mx-auto flex items-center justify-center">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleStopCamera}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCaptureSnapshot}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-xs font-semibold rounded flex items-center gap-1"
              >
                <Camera className="w-3.5 h-3.5" />
                Snap Photo
              </button>
            </div>
          </div>
        )}

        {/* Evidence List */}
        {evidenceList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {evidenceList.map((item) => (
              <div
                key={item.id}
                className="p-2 border border-slate-200 rounded-md bg-slate-50 flex items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {item.dataUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={item.dataUrl}
                      alt={item.fileName}
                      className="w-10 h-10 object-cover rounded border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-slate-200 rounded flex items-center justify-center text-slate-500 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                  )}
                  <div className="truncate">
                    <div className="font-medium text-slate-800 truncate text-[11px]">{item.fileName}</div>
                    <div className="text-[10px] text-slate-400">{item.timestamp}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveEvidence(item.id)}
                  className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                  title="Remove evidence"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[11px] text-slate-400 italic">
            No evidence records attached for this test run yet.
          </div>
        )}
      </div>

      {/* 5. Remarks Section */}
      <div className="border-t border-slate-100 pt-3 space-y-1.5">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          Testing Officer Remarks &amp; Observations
        </label>
        <textarea
          value={remarks}
          onChange={(e) => handleRemarksChange(e.target.value)}
          placeholder={`Enter technical observations, ambient conditions, or justification for Clause ${test.clause}...`}
          rows={2}
          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 focus:outline-none placeholder:text-slate-400"
        />
      </div>

      {/* 6. Test Actions Toolbar */}
      <div className="border-t border-slate-200 pt-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBackToTestPlan}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 rounded text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Test Plan</span>
        </button>

        <div className="flex items-center gap-2">
          {onPrevTest && (
            <button
              type="button"
              onClick={onPrevTest}
              className="inline-flex items-center gap-1 px-3.5 py-2 border border-slate-300 rounded text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous Test</span>
            </button>
          )}

          {onNextTest && (
            <button
              type="button"
              onClick={onNextTest}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold shadow-2xs transition-colors"
            >
              <span>Save &amp; Next Test</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
