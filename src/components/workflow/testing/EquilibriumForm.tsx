'use client';

import React from 'react';
import { EquilibriumData } from '@/lib/test-suite-types';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface EquilibriumFormProps {
  data: EquilibriumData;
  onChange: (updatedData: EquilibriumData) => void;
}

export const EquilibriumForm: React.FC<EquilibriumFormProps> = ({ data, onChange }) => {
  const handleToggleStatus = (index: number, isPass: boolean) => {
    const nextChecks = [...data.checks];
    nextChecks[index] = { ...nextChecks[index], isPass };
    onChange({
      ...data,
      checks: nextChecks,
    });
  };

  const handleObservedChange = (index: number, val: string) => {
    const nextChecks = [...data.checks];
    nextChecks[index] = { ...nextChecks[index], observedBehavior: val };
    onChange({
      ...data,
      checks: nextChecks,
    });
  };

  const handleRemarksChange = (index: number, val: string) => {
    const nextChecks = [...data.checks];
    nextChecks[index] = { ...nextChecks[index], remarks: val };
    onChange({
      ...data,
      checks: nextChecks,
    });
  };

  const allPassed = data.checks.every((c) => c.isPass);

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700">
        <span className="font-semibold block text-slate-900">
          OIML R 76-1 Clause A.4.12 Stability of Equilibrium Check
        </span>
        <span className="text-[11px] text-slate-500">
          Printing, data storage, zero-setting, and tare facilities must be inhibited or delayed while the load receptor is subject to disturbance or display oscillation.
        </span>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
            <tr>
              <th className="py-2.5 px-3 w-1/4">Instability Condition</th>
              <th className="py-2.5 px-3 w-36">Operation Attempted</th>
              <th className="py-2.5 px-3">Observed Instrument Behavior</th>
              <th className="py-2.5 px-3 w-32 text-center">Verdict</th>
              <th className="py-2.5 px-3 w-40">Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {data.checks.map((check, idx) => (
              <tr key={check.id} className="hover:bg-slate-50">
                <td className="py-2.5 px-3 font-medium text-slate-900">{check.condition}</td>
                <td className="py-2.5 px-3 font-semibold text-blue-900">{check.operationAttempted}</td>
                <td className="py-2.5 px-3">
                  <input
                    type="text"
                    value={check.observedBehavior}
                    onChange={(e) => handleObservedChange(idx, e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white focus:outline-none focus:border-blue-600"
                  />
                </td>
                <td className="py-2.5 px-3 text-center">
                  <div className="inline-flex rounded-md shadow-2xs p-0.5 bg-slate-100">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(idx, true)}
                      className={`px-2.5 py-0.5 text-[10px] font-semibold rounded transition-colors ${
                        check.isPass ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      PASS
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(idx, false)}
                      className={`px-2.5 py-0.5 text-[10px] font-semibold rounded transition-colors ${
                        !check.isPass ? 'bg-red-600 text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      FAIL
                    </button>
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  <input
                    type="text"
                    value={check.remarks || ''}
                    placeholder="Notes..."
                    onChange={(e) => handleRemarksChange(idx, e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white focus:outline-none focus:border-blue-600"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs flex items-center justify-between">
        <div>
          <span className="font-semibold text-slate-800">
            Clause A.4.12 Equilibrium Verification
          </span>
          <span className="text-[11px] text-slate-500 block">
            {allPassed
              ? 'All printing, zeroing, and tare commands verified inhibited during non-equilibrium conditions.'
              : 'One or more commands were executed during motion; non-compliant.'}
          </span>
        </div>

        {allPassed ? (
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            PASS: Compliant
          </span>
        ) : (
          <span className="text-xs font-bold text-red-700 bg-red-100 border border-red-200 px-2.5 py-1 rounded flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            FAIL: Action executed during motion
          </span>
        )}
      </div>
    </div>
  );
};
