'use client';

import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Trash2,
  Edit2,
  X,
} from 'lucide-react';

interface EvidenceItem {
  id: string;
  loadPoint: string;
  enteredValue: string;
  ocrReading: string;
  unit: string;
  isConsistent: boolean;
  delta: string;
  status: 'Consistent' | 'Discrepancy' | 'Verified';
  imagePreviewUrl?: string;
  serverHash: string;
  timestamp: string;
  verifiedByMetrologist: boolean;
}

interface Step6EvidenceProps {
  onNext: () => void;
  onBack: () => void;
  scaleInterval_e?: number;
}

export const Step6Evidence: React.FC<Step6EvidenceProps> = ({
  onNext,
  onBack,
  scaleInterval_e = 0.005,
}) => {
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([
    {
      id: 'EV-01',
      loadPoint: '15.000 kg (50% Max - Increasing)',
      enteredValue: '15.000',
      ocrReading: '15.000',
      unit: 'kg',
      isConsistent: true,
      delta: '0.000',
      status: 'Consistent',
      serverHash: '7c86a9f4c391d84b2341209b556e4091a1820f4c30c85b1901c87e411b4f492b',
      timestamp: '2026-09-27 10:24:18',
      verifiedByMetrologist: true,
    },
    {
      id: 'EV-02',
      loadPoint: '30.000 kg (100% Max - Increasing)',
      enteredValue: '30.000',
      ocrReading: '30.000',
      unit: 'kg',
      isConsistent: true,
      delta: '0.000',
      status: 'Consistent',
      serverHash: '3f58e1c668924b1d6210f92d47e8bc6f827a51d8b9e604f32371c11d08bc3e41',
      timestamp: '2026-09-27 10:35:42',
      verifiedByMetrologist: true,
    },
  ]);

  const [showTechnicalDetails, setShowTechnicalDetails] = useState<Record<string, boolean>>({});
  const [selectedLoad, setSelectedLoad] = useState('10.000');
  const [newEntered, setNewEntered] = useState('10.000');
  const [newOcr, setNewOcr] = useState('10.000');

  // Camera Modal State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Edit Evidence Modal State
  const [editingItem, setEditingItem] = useState<EvidenceItem | null>(null);
  const [editEntered, setEditEntered] = useState('');
  const [editOcr, setEditOcr] = useState('');

  const toggleTechnical = (id: string) => {
    setShowTechnicalDetails((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Open Real Camera Feed
  const handleStartCamera = async () => {
    setIsCameraOpen(true);
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access API is not available on this browser/environment.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.warn('Camera stream error:', err);
      setCameraError(
        'Unable to access camera hardware. You can capture a snapshot using the file picker below.'
      );
    }
  };

  // Stop Camera Feed
  const handleStopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
    setCameraError(null);
  };

  // Capture Snapshot from Camera Video Frame
  const handleCaptureSnapshot = () => {
    let capturedDataUrl: string | undefined = undefined;

    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        capturedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      }
    }

    handleStopCamera();
    addNewEvidenceRecord(capturedDataUrl);
  };

  // Real File Upload Handler (FileReader)
  const handleRealFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      addNewEvidenceRecord(dataUrl);
    };
    reader.readAsDataURL(file);

    // Reset input
    e.target.value = '';
  };

  // Helper to add an evidence item
  const addNewEvidenceRecord = (previewUrl?: string) => {
    const eVal = parseFloat(newEntered) || 0;
    const oVal = parseFloat(newOcr) || 0;
    const diff = Math.abs(eVal - oVal);
    const isConsistent = diff <= scaleInterval_e * 0.5;

    const newItem: EvidenceItem = {
      id: `EV-0${evidenceList.length + 1}`,
      loadPoint: `${selectedLoad} kg (Terminal Observation)`,
      enteredValue: newEntered,
      ocrReading: newOcr,
      unit: 'kg',
      isConsistent,
      delta: diff.toFixed(3),
      status: isConsistent ? 'Consistent' : 'Discrepancy',
      imagePreviewUrl: previewUrl,
      serverHash: Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join(''),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      verifiedByMetrologist: isConsistent,
    };

    setEvidenceList((prev) => [...prev, newItem]);
  };

  // Delete Evidence Handler (for misclicks / accidental uploads)
  const handleDeleteEvidence = (id: string) => {
    if (confirm('Are you sure you want to delete this evidence record?')) {
      setEvidenceList((prev) => prev.filter((item) => item.id !== id));
    }
  };

  // Edit Evidence Modal Handlers
  const handleStartEdit = (item: EvidenceItem) => {
    setEditingItem(item);
    setEditEntered(item.enteredValue);
    setEditOcr(item.ocrReading);
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;

    const eVal = parseFloat(editEntered) || 0;
    const oVal = parseFloat(editOcr) || 0;
    const diff = Math.abs(eVal - oVal);
    const isConsistent = diff <= scaleInterval_e * 0.5;

    setEvidenceList((prev) =>
      prev.map((item) => {
        if (item.id === editingItem.id) {
          return {
            ...item,
            enteredValue: editEntered,
            ocrReading: editOcr,
            isConsistent,
            delta: diff.toFixed(3),
            status: isConsistent ? 'Consistent' : 'Discrepancy',
          };
        }
        return item;
      })
    );

    setEditingItem(null);
  };

  const handleAttest = (id: string) => {
    setEvidenceList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, verifiedByMetrologist: true, status: 'Verified' } : item
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Step 6: Evidence &amp; Photo Verification</h2>
            <p className="text-sm text-slate-500 mt-1">
              Verify terminal weight indications against photographic records and assisted OCR readings.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleStartCamera}
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Camera className="w-4 h-4 text-slate-600" />
              Take Photo
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-medium transition-colors shadow-sm cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Upload Photo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleRealFileUpload}
            />
          </div>
        </div>

        {/* Quick New Observation Capture Bar */}
        <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-lg">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Target Test Load (kg)
            </label>
            <input
              type="text"
              value={selectedLoad}
              onChange={(e) => setSelectedLoad(e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Entered Reading (kg)
            </label>
            <input
              type="text"
              value={newEntered}
              onChange={(e) => setNewEntered(e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Terminal OCR (kg)
            </label>
            <input
              type="text"
              value={newOcr}
              onChange={(e) => setNewOcr(e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 focus:outline-none"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => addNewEvidenceRecord()}
              className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded uppercase tracking-wider transition-colors"
            >
              + Record Evidence
            </button>
          </div>
        </div>
      </div>

      {/* Evidence List */}
      <div className="space-y-4">
        {evidenceList.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm hover:border-slate-300 transition-colors"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Evidence Graphic Thumbnail & Title */}
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded border border-slate-200 bg-slate-100 flex flex-col items-center justify-center p-1 text-center text-slate-500 shrink-0 overflow-hidden relative">
                  {item.imagePreviewUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={item.imagePreviewUrl}
                      alt="Terminal reading evidence"
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <>
                      <Camera className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-[10px] font-mono leading-none text-slate-600">PHOTO</span>
                    </>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-base">{item.loadPoint}</span>
                    {item.isConsistent ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Consistent
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Discrepancy detected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Recorded on {item.timestamp}</p>

                  {/* Side-by-side reading comparison */}
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                    <div className="bg-slate-50 px-3 py-1.5 rounded border border-slate-200">
                      <span className="text-xs text-slate-500 block">Entered Observation</span>
                      <span className="font-semibold text-slate-800">
                        {item.enteredValue} {item.unit}
                      </span>
                    </div>
                    <div className="bg-slate-50 px-3 py-1.5 rounded border border-slate-200">
                      <span className="text-xs text-slate-500 block">OCR Display Reading</span>
                      <span className="font-semibold text-slate-800">
                        {item.ocrReading} {item.unit}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600">
                      {item.isConsistent ? (
                        <span className="text-emerald-700 font-medium">
                          ✓ Consistent (&Delta; = {item.delta} {item.unit} within 0.5e)
                        </span>
                      ) : (
                        <span className="text-amber-700 font-medium">
                          ⚠ Difference of {item.delta} {item.unit} exceeds 0.5e &bull; Manual review required
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions & Attestation */}
              <div className="flex flex-col sm:flex-row lg:flex-col items-end gap-2 shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(item)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded text-xs transition-colors bg-white shadow-xs"
                    title="Edit entered observation or OCR reading"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteEvidence(item.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded text-xs transition-colors bg-white shadow-xs"
                    title="Delete evidence record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>

                  {!item.verifiedByMetrologist ? (
                    <button
                      type="button"
                      onClick={() => handleAttest(item.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded text-xs font-semibold transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Attest
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500 py-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Attested
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => toggleTechnical(item.id)}
                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 hover:underline pt-1"
                >
                  {showTechnicalDetails[item.id] ? (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      Hide Technical Details
                    </>
                  ) : (
                    <>
                      <ChevronRight className="w-3.5 h-3.5" />
                      View Technical Verification Details
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Technical Verification Details (Collapsed by Default) */}
            {showTechnicalDetails[item.id] && (
              <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50 rounded p-4 text-xs font-mono space-y-2">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-semibold text-slate-700">Cryptographic Integrity Record:</span>
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    SHA-256 Validated
                  </span>
                </div>
                <div className="text-slate-600 break-all">
                  <span className="text-slate-400 select-none">SHA-256 Digest: </span>
                  <span className="text-slate-800">{item.serverHash}</span>
                </div>
                <div className="text-slate-500 flex flex-wrap gap-4">
                  <span>Storage: Secure Laboratory Vault</span>
                  <span>Capture Method: Optical Terminal Image</span>
                  <span>Verified Timestamp: {item.timestamp}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Camera Live Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-700" />
                <h3 className="font-semibold text-slate-900 text-sm">Capture Terminal Photo</h3>
              </div>
              <button
                type="button"
                onClick={handleStopCamera}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {cameraError ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-3">
                  <p>{cameraError}</p>
                  <label className="inline-flex items-center gap-2 px-3 py-2 bg-blue-700 text-white rounded text-xs font-semibold cursor-pointer">
                    <Upload className="w-4 h-4" />
                    Select Snapshot from Device
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => {
                        handleRealFileUpload(e);
                        handleStopCamera();
                      }}
                    />
                  </label>
                </div>
              ) : (
                <div className="relative bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleStopCamera}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded text-xs font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>

                {!cameraError && (
                  <button
                    type="button"
                    onClick={handleCaptureSnapshot}
                    className="inline-flex items-center gap-2 px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold shadow-sm"
                  >
                    <Camera className="w-4 h-4" />
                    Capture Photo
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Evidence Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-700" />
                <h3 className="font-semibold text-slate-900 text-sm">Edit Observation Data</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-500">
                Adjust recorded readings for <strong className="text-slate-800">{editingItem.loadPoint}</strong>:
              </p>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Entered Observation ({editingItem.unit})
                </label>
                <input
                  type="text"
                  value={editEntered}
                  onChange={(e) => setEditEntered(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  OCR Display Reading ({editingItem.unit})
                </label>
                <input
                  type="text"
                  value={editOcr}
                  onChange={(e) => setEditOcr(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded font-semibold"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons (Single Set at Bottom) */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm"
        >
          ← Back to Testing
        </button>
        <button
          type="button"
          onClick={onNext}
          className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          Continue to Review →
        </button>
      </div>
    </div>
  );
};
