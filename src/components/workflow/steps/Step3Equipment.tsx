'use client';

import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface Step3Props {
  onNext: () => void;
  onBack: () => void;
}

export const Step3Equipment: React.FC<Step3Props> = ({ onNext, onBack }) => {
  const [standards] = useState([
    {
      id: 'eq-01',
      name: 'Class F1 Stainless Steel Weight Set (1 g to 20 kg)',
      serialNumber: 'STD-F1-2024-015',
      weightClass: 'Class F1',
      calibratedBy: 'RRSL Ahmedabad (Accredited)',
      validUntil: '31 Mar 2027',
      uncertainty: 'U = 0.25 mg (k=2)',
      isExpired: false,
      status: 'Valid & Traceable',
    },
    {
      id: 'eq-02',
      name: 'Vaisala PTU300 Barometer & Digital Hygrometer',
      serialNumber: 'HYGRO-PTU300-09',
      weightClass: 'Instrument Sensor',
      calibratedBy: 'Vaisala Metrology Center',
      validUntil: '15 Dec 2026',
      uncertainty: 'U = 0.15 hPa',
      isExpired: false,
      status: 'Valid & Traceable',
    },
    {
      id: 'eq-03',
      name: 'Weiss Technik Environmental Chamber WK11-180',
      serialNumber: 'CHAMBER-WT-2022-04',
      weightClass: 'Climatic Chamber',
      calibratedBy: 'TUV SUD South Asia',
      validUntil: '30 Jun 2027',
      uncertainty: 'U = 0.2 °C, 1.5% RH',
      isExpired: false,
      status: 'Valid & Traceable',
    },
  ]);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Step 3: Reference Test Standards</h1>
        <p className="text-xs text-slate-500 mt-1">
          Traceability verification per OIML R 76-1 Clause 3.7.1 (Standard error &le; 1/3 MPE)
        </p>
      </div>

      {/* Equipment Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-semibold text-slate-900">
              Assigned Calibrated Reference Standards
            </span>
          </div>
          <span className="text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            All Standards Within Validity
          </span>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/60 border-b border-slate-200 text-slate-600 text-[11px] font-semibold">
            <tr>
              <th className="py-2.5 px-4">Equipment &amp; Weight Class</th>
              <th className="py-2.5 px-4">Serial Number</th>
              <th className="py-2.5 px-4">Calibration Valid Until</th>
              <th className="py-2.5 px-4">Traceability / Uncertainty</th>
              <th className="py-2.5 px-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {standards.map((std) => (
              <tr key={std.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-4">
                  <div className="font-semibold text-slate-900">{std.name}</div>
                  <div className="text-[11px] text-slate-500">Calibrated by: {std.calibratedBy}</div>
                </td>
                <td className="py-3 px-4 font-mono font-medium text-slate-800">
                  {std.serialNumber}
                </td>
                <td className="py-3 px-4 font-medium text-slate-800">{std.validUntil}</td>
                <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                  {std.uncertainty}
                </td>
                <td className="py-3 px-4 text-right">
                  {std.isExpired ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                      <AlertTriangle className="w-3 h-3" />
                      Expired
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" />
                      {std.status}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded text-xs font-medium transition-colors"
        >
          Back
        </button>

        <button
          onClick={onNext}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold shadow-xs transition-colors"
        >
          <span>Confirm Standards &amp; Proceed to Test Plan</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
