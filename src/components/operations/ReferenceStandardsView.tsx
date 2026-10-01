'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Award,
  AlertTriangle,
  CheckCircle2,
  Clock,
  HelpCircle,
  ShieldCheck,
  Calendar,
  Building2,
  Info,
  Layers,
  Plus,
} from 'lucide-react';
import {
  ReferenceStandardRecord,
  ReferenceStandardsService,
  StandardClassType,
  StandardStatusType,
} from '@/services/repository/reference-standards-service';

interface ReferenceStandardsViewProps {
  onSelectStandard?: (standardId: string) => void;
}

export const ReferenceStandardsView: React.FC<ReferenceStandardsViewProps> = ({
  onSelectStandard,
}) => {
  const [standards] = useState(() => ReferenceStandardsService.getAllStandards());
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState<string>('ALL');

  // Filtered standards
  const filteredStandards = useMemo(() => {
    return standards.filter((std) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        std.standardId.toLowerCase().includes(term) ||
        std.description.toLowerCase().includes(term) ||
        std.serialNumber.toLowerCase().includes(term) ||
        std.certificateNumber.toLowerCase().includes(term) ||
        std.calibrationProvider.toLowerCase().includes(term);

      if (!matchesSearch) return false;
      if (classFilter !== 'ALL' && std.standardClass !== classFilter) return false;
      return true;
    });
  }, [standards, searchTerm, classFilter]);

  // Identify any expired standards across the laboratory repository
  const expiredStandards = useMemo(() => {
    return standards.filter((s) => s.status === 'EXPIRED');
  }, [standards]);

  const getStatusBadge = (status: StandardStatusType) => {
    switch (status) {
      case 'VALID':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            VALID
          </span>
        );
      case 'EXPIRING_SOON':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            EXPIRING SOON
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200 animate-pulse">
            <AlertTriangle className="w-3 h-3 text-red-600" />
            EXPIRED
          </span>
        );
      case 'NOT_VERIFIED':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            <HelpCircle className="w-3 h-3 text-slate-400" />
            NOT VERIFIED
          </span>
        );
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              Reference Standards Register
            </h1>
            <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {filteredStandards.length} Standards
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Calibrated working and reference standards per OIML R 76-1 Clause 3.7.1. Traceability to National Physical Laboratory (NPLI).
          </p>
        </div>
      </div>

      {/* Prominent Expired Standards Alert Banner (Section 4 requirement) */}
      {expiredStandards.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-r-md">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-red-900 uppercase tracking-wide">
                REFERENCE STANDARD EXPIRED &bull; ACTION MANDATORY
              </h3>
              <p className="text-xs text-red-800">
                The following standards have passed their calibration validity period and <strong>cannot be used for accredited OIML R 76-1 testing or final report certification</strong>:
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {expiredStandards.map((std) => (
                  <span
                    key={std.standardId}
                    className="inline-flex items-center gap-1.5 text-xs bg-white text-red-900 font-mono font-semibold px-2 py-1 rounded border border-red-200 shadow-2xs"
                  >
                    <span>{std.standardId} ({std.description})</span>
                    <span className="text-[10px] text-red-600 font-normal">Expired: {std.validUntil}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 font-medium">Class:</span>
          {(['ALL', 'E1', 'E2', 'F1', 'F2', 'M1', 'SENSOR', 'CHAMBER'] as const).map((cls) => (
            <button
              key={cls}
              type="button"
              onClick={() => setClassFilter(cls)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                classFilter === cls
                  ? 'bg-blue-700 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cls}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search standards, serials, certificates..."
            className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-md text-xs placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>
      </div>

      {/* Main Reference Standards Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">Standard ID</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3">Serial Number</th>
                <th className="py-2.5 px-3">Class</th>
                <th className="py-2.5 px-3">Certificate Number</th>
                <th className="py-2.5 px-3">Calibration Provider</th>
                <th className="py-2.5 px-3">Calibration Date</th>
                <th className="py-2.5 px-3">Valid Until</th>
                <th className="py-2.5 px-3">Uncertainty (k=2)</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredStandards.map((std) => (
                <tr
                  key={std.standardId}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    std.status === 'EXPIRED' ? 'bg-red-50/20' : ''
                  }`}
                >
                  {/* Standard ID */}
                  <td className="py-3 px-3">
                    <span className="font-mono font-bold text-blue-700">
                      {std.standardId}
                    </span>
                  </td>

                  {/* Description */}
                  <td className="py-3 px-3 max-w-[220px]">
                    <div className="font-medium text-slate-800 leading-snug">
                      {std.description}
                    </div>
                    {std.location && (
                      <div className="text-[11px] text-slate-400 mt-0.5">{std.location}</div>
                    )}
                  </td>

                  {/* Serial */}
                  <td className="py-3 px-3 font-mono text-slate-600">
                    {std.serialNumber}
                  </td>

                  {/* Class */}
                  <td className="py-3 px-3">
                    <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {std.standardClass}
                    </span>
                  </td>

                  {/* Certificate Number */}
                  <td className="py-3 px-3 font-mono text-slate-700">
                    {std.certificateNumber}
                  </td>

                  {/* Calibration Provider */}
                  <td className="py-3 px-3 text-slate-600 max-w-[160px] truncate" title={std.calibrationProvider}>
                    {std.calibrationProvider}
                  </td>

                  {/* Calibration Date */}
                  <td className="py-3 px-3 font-mono text-slate-500">
                    {std.calibrationDate}
                  </td>

                  {/* Valid Until */}
                  <td className="py-3 px-3 font-mono font-semibold">
                    <span className={std.status === 'EXPIRED' ? 'text-red-700 font-bold' : 'text-slate-700'}>
                      {std.validUntil}
                    </span>
                  </td>

                  {/* Uncertainty */}
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                    {std.uncertainty}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-3 text-right">
                    {getStatusBadge(std.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
