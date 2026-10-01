'use client';

import React, { useState } from 'react';
import {
  X,
  History,
  Scale,
  Calendar,
  Layers,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Plus,
  ArrowRight,
  User,
} from 'lucide-react';
import {
  InstrumentRepositoryService,
} from '@/services/repository/instrument-repository-service';
import {
  InstrumentModel,
  InstrumentSpecimen,
  SpecimenConfigurationRevision,
  SpecimenEvaluationSummary,
} from '@/services/repository/instrument-types';

interface InstrumentHistoryModalProps {
  serialNumber: string;
  onClose: () => void;
  onOpenEvaluation?: (evaluationNumber: string) => void;
}

export const InstrumentHistoryModal: React.FC<InstrumentHistoryModalProps> = ({
  serialNumber,
  onClose,
  onOpenEvaluation,
}) => {
  InstrumentRepositoryService.ensureInitialized();
  const specimenData = InstrumentRepositoryService.getSpecimenBySerial(serialNumber);

  const [activeTab, setActiveTab] = useState<'EVALUATIONS' | 'CONFIGURATIONS' | 'SERVICE'>('EVALUATIONS');

  // Form state for creating a new configuration revision (Prompt requirement 10)
  const [showAddConfig, setShowAddConfig] = useState(false);
  const [newSoftwareVersion, setNewSoftwareVersion] = useState('');
  const [newFirmwareVersion, setNewFirmwareVersion] = useState('');
  const [newChangeReason, setNewChangeReason] = useState('');
  const [newNotes, setNewNotes] = useState('');

  if (!specimenData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Specimen Not Found</h3>
          <p className="text-xs text-slate-600">No physical instrument found with serial number {serialNumber}.</p>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const { specimen, model } = specimenData;

  const handleCreateRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSoftwareVersion.trim() || !newChangeReason.trim()) return;

    InstrumentRepositoryService.updateSpecimenConfiguration(specimen.specimenId, {
      softwareVersion: newSoftwareVersion.trim(),
      firmwareVersion: newFirmwareVersion.trim() || undefined,
      changeReason: newChangeReason.trim(),
      notes: newNotes.trim() || undefined,
      actor: 'Dr. A. Sharma (Lead Metrologist)',
    });

    setShowAddConfig(false);
    setNewSoftwareVersion('');
    setNewFirmwareVersion('');
    setNewChangeReason('');
    setNewNotes('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-3xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                {specimen.serialNumber}
              </span>
              <span className="text-xs font-semibold text-slate-600">
                Physical Specimen History
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-1">
              {model.modelName} &bull; {model.manufacturer}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 8 & 9: Physical Instrument Metadata (Strict separation from model family) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded p-3 text-xs">
          <div>
            <span className="text-[11px] text-slate-400 block">Instrument Type</span>
            <span className="font-semibold text-slate-800 capitalize">
              {model.instrumentCategory.toLowerCase()} scale
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">OIML Class</span>
            <span className="font-semibold text-slate-800">
              {model.accuracyClass.replace('_', ' ')}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">Current Status</span>
            <span className="font-bold text-emerald-700">
              {specimen.status.replace('_', ' ')}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">Active Configuration</span>
            <span className="font-mono font-bold text-blue-700">
              CR-0{specimen.activeConfigurationRevision} ({specimen.configurationRevisions[specimen.configurationRevisions.length - 1]?.softwareVersion})
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('EVALUATIONS')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'EVALUATIONS'
                  ? 'bg-blue-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Evaluation History ({specimen.evaluationHistory.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('CONFIGURATIONS')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'CONFIGURATIONS'
                  ? 'bg-blue-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Configuration History ({specimen.configurationRevisions.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('SERVICE')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'SERVICE'
                  ? 'bg-blue-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Service &amp; Intake Log ({specimen.serviceHistory.length})
            </button>
          </div>

          {activeTab === 'CONFIGURATIONS' && !showAddConfig && (
            <button
              type="button"
              onClick={() => setShowAddConfig(true)}
              className="inline-flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900 font-semibold px-2.5 py-1 rounded bg-blue-50 border border-blue-200"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Revision</span>
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* TAB 1: EVALUATION HISTORY */}
          {activeTab === 'EVALUATIONS' && (
            <div className="space-y-3">
              {specimen.evaluationHistory.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No prior evaluations recorded for this physical serial number.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Evaluation No.</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Configuration</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Overall Result</th>
                        <th className="py-2.5 px-3">Report</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {specimen.evaluationHistory.map((ev) => (
                        <tr key={ev.evaluationNumber} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3">
                            <button
                              type="button"
                              onClick={() => {
                                if (onOpenEvaluation) onOpenEvaluation(ev.evaluationNumber);
                                onClose();
                              }}
                              className="font-mono font-bold text-blue-700 hover:underline"
                            >
                              {ev.evaluationNumber}
                            </button>
                          </td>
                          <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                            {ev.startDate} to {ev.completedDate || 'In Progress'}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              CR-0{ev.configurationRevisionUsed}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-[11px] font-medium text-slate-700">
                              {ev.status}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            {ev.finalVerdict === 'COMPLIANT' ? (
                              <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                PASS
                              </span>
                            ) : ev.finalVerdict === 'NON_COMPLIANT' ? (
                              <span className="text-red-700 font-bold flex items-center gap-1 text-[11px]">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                FAIL
                              </span>
                            ) : (
                              <span className="text-amber-700 font-medium text-[11px]">
                                PENDING
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                            {ev.reportNumber || 'Pending'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CONFIGURATION HISTORY (Prompt requirement 10) */}
          {activeTab === 'CONFIGURATIONS' && (
            <div className="space-y-4">
              {showAddConfig && (
                <form onSubmit={handleCreateRevision} className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h4 className="text-xs font-bold text-slate-900">
                      Record New Configuration Revision (CR-0{specimen.activeConfigurationRevision + 1})
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowAddConfig(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] text-slate-600 font-medium mb-1">
                        Software Version *
                      </label>
                      <input
                        type="text"
                        value={newSoftwareVersion}
                        onChange={(e) => setNewSoftwareVersion(e.target.value)}
                        placeholder="e.g. v2.15.0"
                        className="w-full p-2 border border-slate-200 rounded text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 font-medium mb-1">
                        Firmware Version (Optional)
                      </label>
                      <input
                        type="text"
                        value={newFirmwareVersion}
                        onChange={(e) => setNewFirmwareVersion(e.target.value)}
                        placeholder="e.g. FW-RT-204"
                        className="w-full p-2 border border-slate-200 rounded text-xs"
                      />
                    </div>
                  </div>
                  <div className="text-xs">
                    <label className="block text-[11px] text-slate-600 font-medium mb-1">
                      Reason for Modification *
                    </label>
                    <input
                      type="text"
                      value={newChangeReason}
                      onChange={(e) => setNewChangeReason(e.target.value)}
                      placeholder="e.g. Manufacturer firmware patch applied to address filter lag"
                      className="w-full p-2 border border-slate-200 rounded text-xs"
                      required
                    />
                  </div>
                  <div className="text-xs">
                    <label className="block text-[11px] text-slate-600 font-medium mb-1">
                      Applicable Configuration Notes
                    </label>
                    <textarea
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      placeholder="Notes on calibration parameters, dipswitch settings, or filter revisions..."
                      rows={2}
                      className="w-full p-2 border border-slate-200 rounded text-xs"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddConfig(false)}
                      className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold"
                    >
                      Save Configuration Revision
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {specimen.configurationRevisions.map((rev) => (
                  <div
                    key={rev.revisionNumber}
                    className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
                          CR-0{rev.revisionNumber}
                        </span>
                        <span className="font-semibold text-xs text-slate-900">
                          Software {rev.softwareVersion}
                        </span>
                        {rev.firmwareVersion && (
                          <span className="text-[11px] font-mono text-slate-500">
                            &bull; {rev.firmwareVersion}
                          </span>
                        )}
                        {rev.revisionNumber === specimen.activeConfigurationRevision && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Effective {rev.effectiveDate.split('T')[0]}
                      </span>
                    </div>

                    {rev.changeReason && (
                      <p className="text-xs text-slate-700">
                        <strong>Change Reason: </strong>{rev.changeReason}
                      </p>
                    )}

                    {rev.specialConfigurationNotes && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                        {rev.specialConfigurationNotes}
                      </p>
                    )}

                    <div className="text-[10px] text-slate-400 pt-1">
                      Recorded by: {rev.updatedBy}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SERVICE HISTORY */}
          {activeTab === 'SERVICE' && (
            <div className="space-y-2">
              {specimen.serviceHistory.map((srv) => (
                <div key={srv.id} className="p-3 bg-white border border-slate-200 rounded text-xs flex items-start gap-3">
                  <div className="p-1 rounded bg-slate-100 text-slate-600 mt-0.5">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{srv.type}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{srv.date}</span>
                    </div>
                    <p className="text-slate-600 mt-0.5">{srv.description}</p>
                    <span className="text-[10px] text-slate-400 block mt-1">Technician: {srv.technician}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 pt-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
