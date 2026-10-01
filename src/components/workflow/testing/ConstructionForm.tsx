'use client';

import React from 'react';
import { ChecklistItem } from '@/lib/test-suite-types';
import { CheckCircle2, AlertCircle, Slash } from 'lucide-react';

interface ConstructionFormProps {
  items: ChecklistItem[];
  onChange: (updatedItems: ChecklistItem[]) => void;
}

export const ConstructionForm: React.FC<ConstructionFormProps> = ({ items, onChange }) => {
  const handleStatusChange = (index: number, status: 'PASS' | 'FAIL' | 'NOT_APPLICABLE') => {
    const next = [...items];
    next[index] = { ...next[index], status };
    onChange(next);
  };

  const handleObservationChange = (index: number, observation: string) => {
    const next = [...items];
    next[index] = { ...next[index], observation };
    onChange(next);
  };

  const handleRemarksChange = (index: number, remarks: string) => {
    const next = [...items];
    next[index] = { ...next[index], remarks };
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
            <tr>
              <th className="py-2.5 px-3 w-16">Clause</th>
              <th className="py-2.5 px-3 w-1/3">Construction Requirement</th>
              <th className="py-2.5 px-3">Laboratory Observation</th>
              <th className="py-2.5 px-3 w-36 text-center">Status</th>
              <th className="py-2.5 px-3 w-40">Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {items.map((item, idx) => (
              <tr key={item.id} className="hover:bg-slate-50/70">
                <td className="py-2.5 px-3 font-mono font-medium text-slate-500">
                  {item.clause}
                </td>
                <td className="py-2.5 px-3 font-medium text-slate-900">
                  {item.requirement}
                </td>
                <td className="py-2.5 px-3">
                  <input
                    type="text"
                    value={item.observation}
                    onChange={(e) => handleObservationChange(idx, e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white focus:outline-none focus:border-blue-600"
                  />
                </td>
                <td className="py-2.5 px-3 text-center">
                  <div className="inline-flex rounded-md shadow-2xs p-0.5 bg-slate-100">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(idx, 'PASS')}
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded transition-colors ${
                        item.status === 'PASS'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      PASS
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(idx, 'FAIL')}
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded transition-colors ${
                        item.status === 'FAIL'
                          ? 'bg-red-600 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      FAIL
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(idx, 'NOT_APPLICABLE')}
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded transition-colors ${
                        item.status === 'NOT_APPLICABLE'
                          ? 'bg-slate-700 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      N/A
                    </button>
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  <input
                    type="text"
                    value={item.remarks || ''}
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
        <div className="flex items-center gap-2">
          {items.every((i) => i.status === 'PASS') ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold text-emerald-800">
                All technical construction, leveling, tare, and sealing provisions verified compliant.
              </span>
            </>
          ) : items.some((i) => i.status === 'FAIL') ? (
            <>
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span className="font-semibold text-red-800">
                Construction non-compliance observed. Review highlighted items.
              </span>
            </>
          ) : (
            <>
              <Slash className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="text-slate-600">
                Technical construction audit in progress ({items.filter((i) => i.status === 'PASS').length}/{items.length} passed).
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
