'use client';

import React, { useState } from 'react';
import {
  X,
  History,
  FileText,
  ChevronDown,
  ChevronRight,
  Plus,
  Tag,
  Wrench,
  Camera,
} from 'lucide-react';
import { InstrumentModel, InstrumentSpecimen } from '@/services/repository/instrument-types';
import { InstrumentRepositoryService } from '@/services/repository/instrument-repository-service';

interface InstrumentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  specimen: InstrumentSpecimen;
  model: InstrumentModel;
  onConfigurationUpdated?: () => void;
}

export const InstrumentHistoryModal: React.FC<InstrumentHistoryModalProps> = ({
  isOpen,
  onClose,
  specimen,
  model,
  onConfigurationUpdated,
}) => {
  const [showNewConfigForm, setShowNewConfigForm] = useState(false);
  const [newSoftwareVersion, setNewSoftwareVersion] = useState('');
  const [newFirmwareVersion, setNewFirmwareVersion] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [changeNotes, setChangeNotes] = useState('');
  const [showTechHashes, setShowTechHashes] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateNewRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSoftwareVersion.trim() || !changeReason.trim()) {
      setError('Software version and change reason are required.');
      return;
    }

    const res = InstrumentRepositoryService.updateSpecimenConfiguration(specimen.specimenId, {
      softwareVersion: newSoftwareVersion,
      firmwareVersion: newFirmwareVersion || undefined,
      notes: changeNotes || undefined,
      changeReason,
      actor: 'Dr. A. Sharma (Testing Officer)',
    });

    if (!res.success) {
      setError(res.error || 'Failed to update configuration.');
      return;
    }

    setShowNewConfigForm(false);
    setNewSoftwareVersion('');
    setNewFirmwareVersion('');
    setChangeReason('');
    setChangeNotes('');
    setError(null);

    if (onConfigurationUpdated) {
      onConfigurationUpdated();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-tight">Instrument Machine History</h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-blue-300 border border-slate-700">
                  {specimen.serialNumber}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {model.manufacturer} &bull; {model.modelName} &bull; Registered {specimen.intakeDate}
              </p>
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
          {/* Machine Profile Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Status</span>
              <p className="font-bold text-slate-900 mt-0.5">{specimen.status}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Active Config</span>
              <p className="font-bold text-slate-900 mt-0.5">Rev {specimen.activeConfigurationRevision}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Accuracy Class</span>
              <p className="font-bold text-slate-900 mt-0.5">{model.accuracyClass.replace('_', ' ')}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Max / e</span>
              <p className="font-bold text-slate-900 mt-0.5 font-mono">
                {model.maxCapacity} {model.primaryUnit} / {model.verificationInterval_e} {model.primaryUnit}
              </p>
            </div>
          </div>

          {/* Section 1: Configuration Revisions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <div className="flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-blue-700" />
                <h3 className="font-bold text-slate-900">Configuration Revisions</h3>
              </div>
              {!showNewConfigForm && (
                <button
                  type="button"
                  onClick={() => setShowNewConfigForm(true)}
                  className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-semibold hover:bg-blue-100 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Update Configuration</span>
                </button>
              )}
            </div>

            {/* New Configuration Form */}
            {showNewConfigForm && (
              <form onSubmit={handleCreateNewRevision} className="p-4 bg-blue-50/50 border border-blue-200 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-950 text-xs">Create New Configuration Revision (Rev {specimen.activeConfigurationRevision + 1})</span>
                  <button
                    type="button"
                    onClick={() => setShowNewConfigForm(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs"
                  >
                    Cancel
                  </button>
                </div>

                {error && <p className="text-red-700 text-xs">{error}</p>}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">New Software Version *</label>
                    <input
                      type="text"
                      required
                      value={newSoftwareVersion}
                      onChange={(e) => setNewSoftwareVersion(e.target.value)}
                      placeholder="e.g. v2.15.0"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">Firmware Version</label>
                    <input
                      type="text"
                      value={newFirmwareVersion}
                      onChange={(e) => setNewFirmwareVersion(e.target.value)}
                      placeholder="e.g. FW-RT-203"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">Reason for Configuration Change *</label>
                    <input
                      type="text"
                      required
                      value={changeReason}
                      onChange={(e) => setChangeReason(e.target.value)}
                      placeholder="e.g. Formal manufacturer firmware patch applied for display filter update"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowNewConfigForm(false)}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded text-slate-700 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded font-semibold shadow-xs"
                  >
                    Apply Revision
                  </button>
                </div>
              </form>
            )}

            {/* List of Revisions */}
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden bg-white">
              {specimen.configurationRevisions.map((rev) => (
                <div key={rev.revisionNumber} className="p-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">Revision {rev.revisionNumber}</span>
                      {rev.revisionNumber === specimen.activeConfigurationRevision && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Active
                        </span>
                      )}
                      <span className="font-mono text-slate-500 text-[11px]">SW: {rev.softwareVersion}</span>
                      {rev.firmwareVersion && <span className="font-mono text-slate-400 text-[10px]">({rev.firmwareVersion})</span>}
                    </div>
                    {rev.changeReason && (
                      <p className="text-slate-700 mt-1 text-[11px]">{rev.changeReason}</p>
                    )}
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Effective: {rev.effectiveDate.split('T')[0]} &bull; By {rev.updatedBy}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Evaluation History */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
              <FileText className="w-4 h-4 text-blue-700" />
              <h3 className="font-bold text-slate-900">Type Evaluation History</h3>
            </div>

            {specimen.evaluationHistory && specimen.evaluationHistory.length > 0 ? (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden bg-white">
                {specimen.evaluationHistory.map((ev) => (
                  <div key={ev.evaluationNumber} className="p-3 flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 font-mono">{ev.evaluationNumber}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            ev.finalVerdict === 'COMPLIANT'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {ev.finalVerdict || ev.status}
                        </span>
                        <span className="text-[10px] text-slate-400">Linked to Config Rev {ev.configurationRevisionUsed}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">
                        Dates: {ev.startDate} to {ev.completedDate ?? 'In Progress'} &bull; Lead: {ev.leadMetrologist}
                      </p>
                      {ev.reportNumber && (
                        <span className="text-[10px] font-mono text-blue-700 mt-0.5 block">
                          Issued Report: {ev.reportNumber} (Rev {ev.reportRevision ?? 0})
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 italic py-2">No completed evaluations recorded for this specimen yet.</p>
            )}
          </div>

          {/* Section 3: Service & Maintenance Logs */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
              <Wrench className="w-4 h-4 text-blue-700" />
              <h3 className="font-bold text-slate-900">Service &amp; Intake Log</h3>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden bg-white">
              {specimen.serviceHistory.map((log) => (
                <div key={log.id} className="p-2.5 flex items-start justify-between gap-2">
                  <div>
                    <span className="font-semibold text-slate-800">{log.description}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {log.date} &bull; Technician: {log.technician}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                    {log.type}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Identity Evidence Preview */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
              <Camera className="w-4 h-4 text-blue-700" />
              <h3 className="font-bold text-slate-900">Physical Specimen Identity Evidence</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="border border-slate-200 rounded p-2 text-center bg-slate-50">
                <span className="font-semibold text-slate-700 text-[11px] block mb-1">Complete Machine</span>
                {specimen.identityEvidence.completeInstrumentPhotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={specimen.identityEvidence.completeInstrumentPhotoUrl}
                    alt="Complete Machine"
                    className="w-full h-24 object-cover rounded border border-slate-200"
                  />
                ) : (
                  <div className="w-full h-24 bg-slate-200 rounded flex items-center justify-center text-slate-400">
                    <Camera className="w-6 h-6" />
                  </div>
                )}
              </div>

              <div className="border border-slate-200 rounded p-2 text-center bg-slate-50">
                <span className="font-semibold text-slate-700 text-[11px] block mb-1">Nameplate Specimen</span>
                {specimen.identityEvidence.nameplatePhotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={specimen.identityEvidence.nameplatePhotoUrl}
                    alt="Nameplate Specimen"
                    className="w-full h-24 object-cover rounded border border-slate-200"
                  />
                ) : (
                  <div className="w-full h-24 bg-slate-200 rounded flex items-center justify-center text-slate-400">
                    <Camera className="w-6 h-6" />
                  </div>
                )}
              </div>
            </div>

            {/* Expandable Technical Details */}
            <div>
              <button
                type="button"
                onClick={() => setShowTechHashes(!showTechHashes)}
                className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1"
              >
                <span>{showTechHashes ? 'Hide cryptographic provenance hashes' : 'View cryptographic provenance hashes'}</span>
                {showTechHashes ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
              {showTechHashes && (
                <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded font-mono text-[10px] text-slate-600 space-y-1">
                  <div>Complete Photo SHA-256: {specimen.identityEvidence.completeInstrumentPhotoHash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}</div>
                  <div>Nameplate Photo SHA-256: {specimen.identityEvidence.nameplatePhotoHash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}</div>
                  <div>Intake Timestamp: {specimen.identityEvidence.capturedAt}</div>
                  <div>Intake Officer: {specimen.identityEvidence.uploader}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
          >
            Close History
          </button>
        </div>
      </div>
    </div>
  );
};
