'use client';

import React, { useState } from 'react';
import {
  Search,
  ArrowRight,
  ArrowLeft,
  Filter,
  AlertTriangle,
  Play,
  FileText,
  CheckCircle2,
  Plus,
  History,
  Archive,
  Award,
} from 'lucide-react';
import { RegisteredInstrument } from '@/lib/synthetic-instruments';
import { InstrumentRepositoryService } from '@/services/repository/instrument-repository-service';
import { EvaluationRegisterService } from '@/services/operations/evaluation-register-service';
import { InstrumentModel, InstrumentSpecimen } from '@/services/repository/instrument-types';
import { InstrumentIntakeModal } from '@/components/repository/InstrumentIntakeModal';
import { InstrumentHistoryModal } from '@/components/repository/InstrumentHistoryModal';

export type { RegisteredInstrument };

interface InstrumentSelectorProps {
  onSelectInstrument: (
    instrument: RegisteredInstrument,
    targetStep?: 1 | 4 | 5 | 6,
    forcePrefillDemo?: boolean
  ) => void;
  onCancel: () => void;
}

export const InstrumentSelector: React.FC<InstrumentSelectorProps> = ({
  onSelectInstrument,
  onCancel,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [classFilter, setClassFilter] = useState<string>('ALL');

  // Dynamic Specimen Repository State
  const [instruments, setInstruments] = useState<RegisteredInstrument[]>(() =>
    InstrumentRepositoryService.getAllRegisteredInstruments()
  );

  // Modal Dialog States
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<{
    specimen: InstrumentSpecimen;
    model: InstrumentModel;
  } | null>(null);

  const refreshInstruments = () => {
    setInstruments(InstrumentRepositoryService.getAllRegisteredInstruments());
  };

  const getDynamicStatus = (inst: RegisteredInstrument): RegisteredInstrument['status'] => {
    try {
      const match = EvaluationRegisterService.getAllEvaluations().find((e) => e.serialNumber === inst.serialNumber);
      if (match) {
        if (match.status === 'FINALIZED') return 'REPORT_ISSUED';
        if (match.status === 'PENDING_REVIEW' || match.status === 'READY_FOR_FINALIZATION') return 'PENDING_REVIEW';
        if (match.status === 'IN_TESTING' || match.status === 'CORRECTION_REQUIRED') return 'IN_EVALUATION';
      }
    } catch {}
    return inst.status || 'AVAILABLE';
  };

  const handleOpenHistory = (instId: string) => {
    const specimen = InstrumentRepositoryService.getSpecimenById(instId);
    if (!specimen) return;
    const model = InstrumentRepositoryService.getModelById(specimen.modelId);
    if (!model) return;
    setHistoryTarget({ specimen, model });
  };

  const filtered = instruments.map((inst) => ({
    ...inst,
    status: getDynamicStatus(inst),
  })).filter((inst) => {
    const matchesSearch =
      inst.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.modelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.manufacturer.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || inst.status === statusFilter;
    const matchesClass = classFilter === 'ALL' || inst.accuracyClass === classFilter;

    return matchesSearch && matchesStatus && matchesClass;
  });

  const getStatusBadge = (status: RegisteredInstrument['status'], isFailDemo?: boolean) => {
    if (isFailDemo) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded font-medium">
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          Non-Compliant
        </span>
      );
    }
    switch (status) {
      case 'AVAILABLE':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Available
          </span>
        );
      case 'IN_EVALUATION':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            In Evaluation
          </span>
        );
      case 'PENDING_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded font-medium">
            Pending Review
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-medium">
            Completed
          </span>
        );
      case 'REPORT_ISSUED':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded font-medium">
            <Award className="w-3 h-3 text-indigo-600" />
            Report Issued
          </span>
        );
      case 'RETIRED':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-medium">
            <Archive className="w-3 h-3 text-slate-400" />
            Retired
          </span>
        );
      default:
        return (
          <span className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
            {status}
          </span>
        );
    }
  };

  const renderActionButton = (inst: RegisteredInstrument) => {
    if (inst.status === 'AVAILABLE') {
      return (
        <button
          type="button"
          onClick={() => onSelectInstrument(inst, 1, false)}
          className="w-36 h-8 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-md inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Play className="w-3 h-3 fill-current" />
          <span>Start Evaluation</span>
        </button>
      );
    }

    if (inst.status === 'IN_EVALUATION') {
      return (
        <button
          type="button"
          onClick={() => onSelectInstrument(inst, 4)}
          className="w-36 h-8 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-md inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Play className="w-3 h-3 fill-current" />
          <span>Continue</span>
        </button>
      );
    }

    if (inst.status === 'PENDING_REVIEW') {
      return (
        <button
          type="button"
          onClick={() => onSelectInstrument(inst, 5)}
          className="w-36 h-8 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-md inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Review</span>
        </button>
      );
    }

    if (inst.status === 'REPORT_ISSUED' || inst.status === 'COMPLETED') {
      return (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onSelectInstrument(inst, 6)}
            className="w-28 h-8 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-medium rounded-md inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Award className="w-3.5 h-3.5" />
            <span>View Report</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectInstrument(inst, 1, false)}
            title="Start a new evaluation run on this instrument"
            className="h-8 px-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-md transition-colors cursor-pointer"
          >
            New Run
          </button>
        </div>
      );
    }

    if (inst.status === 'RETIRED') {
      return (
        <button
          type="button"
          onClick={() => handleOpenHistory(inst.id)}
          className="w-36 h-8 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-medium rounded-md inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <History className="w-3.5 h-3.5 text-slate-400" />
          <span>View History</span>
        </button>
      );
    }

    return null;
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 mb-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Instrument Repository</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Select a registered machine to evaluate or register a new instrument into laboratory custody.
          </p>
        </div>

        {/* Primary Action: Register Instrument */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowIntakeModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Instrument</span>
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by serial number (e.g. SN-BS-26001), model, or manufacturer..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 shadow-2xs"
            autoFocus
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        {/* Accuracy Class Filter */}
        <div className="flex items-center gap-1.5">
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400 shadow-2xs"
          >
            <option value="ALL">All Accuracy Classes</option>
            <option value="CLASS_I">Class I (Special)</option>
            <option value="CLASS_II">Class II (High)</option>
            <option value="CLASS_III">Class III (Medium)</option>
            <option value="CLASS_IIII">Class IIII (Ordinary)</option>
          </select>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs shrink-0 border border-slate-200 overflow-x-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-0.5 shrink-0" />
          {(['ALL', 'AVAILABLE', 'IN_EVALUATION', 'PENDING_REVIEW', 'REPORT_ISSUED', 'RETIRED'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st === 'ALL' ? 'All' : st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Instruments List */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
        <div className="px-4 py-2.5 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {filtered.length} instruments in laboratory custody</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
              <tr>
                <th className="py-2.5 px-4">Serial Number</th>
                <th className="py-2.5 px-4">Model &amp; Trade Name</th>
                <th className="py-2.5 px-4">Manufacturer</th>
                <th className="py-2.5 px-4">Accuracy Class</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((inst) => (
                <tr key={inst.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    <div className="flex items-center gap-1.5">
                      <span>{inst.serialNumber}</span>
                      {inst.configurationRevision && (
                        <span className="text-[10px] font-normal font-sans text-slate-400 bg-slate-100 px-1 rounded">
                          Rev {inst.configurationRevision}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{inst.modelName}</div>
                    <div className="text-[11px] text-slate-500">{inst.tradeName}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{inst.manufacturer}</td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-slate-800">
                      {inst.accuracyClass.replace(/_/g, ' ')}
                    </span>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Max: {inst.maxCapacity} {inst.primaryUnit} &bull; e: {inst.verificationInterval_e} {inst.primaryUnit}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {getStatusBadge(inst.status, inst.hasFailedSample)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => handleOpenHistory(inst.id)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded text-xs transition-colors"
                        title="View Instrument History & Configuration Revisions"
                      >
                        <History className="w-3.5 h-3.5" />
                      </button>
                      {renderActionButton(inst)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Guided 5-Step Instrument Registration Modal */}
      {showIntakeModal && (
        <InstrumentIntakeModal
          isOpen={showIntakeModal}
          onClose={() => setShowIntakeModal(false)}
          onRegistered={(newInst) => {
            refreshInstruments();
            setShowIntakeModal(false);
            onSelectInstrument(newInst, 1);
          }}
        />
      )}

      {/* Instrument Specimen History Modal */}
      {historyTarget && (
        <InstrumentHistoryModal
          isOpen={!!historyTarget}
          onClose={() => setHistoryTarget(null)}
          specimen={historyTarget.specimen}
          model={historyTarget.model}
          onConfigurationUpdated={() => {
            refreshInstruments();
            const updated = InstrumentRepositoryService.getSpecimenById(historyTarget.specimen.specimenId);
            if (updated) {
              setHistoryTarget({ specimen: updated, model: historyTarget.model });
            }
          }}
        />
      )}
    </div>
  );
};
