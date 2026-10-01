'use client';

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  AlertCircle,
} from 'lucide-react';

interface TestPlanItem {
  id: string;
  testCode: string;
  clause: string;
  title: string;
  category: 'METROLOGICAL' | 'ENVIRONMENTAL' | 'ELECTRICAL' | 'CONSTRUCTION';
  isMandatory: boolean;
  isApplicable: boolean;
  status: 'NOT_TESTED' | 'PASS' | 'FAIL' | 'NOT_APPLICABLE';
  justification: string | null;
}

export const TestPlanMatrix: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const [tests] = useState<TestPlanItem[]>([
    {
      id: 't-01',
      testCode: 'R76_ADMIN_EXAM',
      clause: '3.10, 4.1',
      title: 'Administrative & Descriptive Markings Examination',
      category: 'CONSTRUCTION',
      isMandatory: true,
      isApplicable: true,
      status: 'PASS',
      justification: null,
    },
    {
      id: 't-02',
      testCode: 'R76_CONST_CHECK',
      clause: '3.10, 4.1–18',
      title: 'Technical Construction, Security Sealing & Software Integrity',
      category: 'CONSTRUCTION',
      isMandatory: true,
      isApplicable: true,
      status: 'PASS',
      justification: null,
    },
    {
      id: 't-03',
      testCode: 'R76_WEIGH_INTRINSIC',
      clause: 'A.4.4',
      title: 'Weighing Performance: Initial Intrinsic Error Determination',
      category: 'METROLOGICAL',
      isMandatory: true,
      isApplicable: true,
      status: 'PASS',
      justification: null,
    },
    {
      id: 't-04',
      testCode: 'R76_ECC_WEIGHTS',
      clause: 'A.4.7.1–3',
      title: 'Eccentricity Loading Using Weights (Standard Receptors)',
      category: 'METROLOGICAL',
      isMandatory: true,
      isApplicable: true,
      status: 'PASS',
      justification: null,
    },
    {
      id: 't-05',
      testCode: 'R76_ECC_ROLLING',
      clause: 'A.4.7.4',
      title: 'Eccentricity with Rolling Load (Weighbridges & Rail Scales)',
      category: 'METROLOGICAL',
      isMandatory: false,
      isApplicable: false,
      status: 'NOT_APPLICABLE',
      justification:
        'Instrument does not feature a rolling track or rail mechanism; ordinary eccentricity (A.4.7.1–3) applies instead.',
    },
    {
      id: 't-06',
      testCode: 'R76_ECC_MOBILE',
      clause: 'A.4.7.5',
      title: 'Eccentricity on Mobile Instruments',
      category: 'METROLOGICAL',
      isMandatory: false,
      isApplicable: false,
      status: 'NOT_APPLICABLE',
      justification:
        'Instrument is installed on a permanent bench foundation; not a mobile pallet or vehicle scale.',
    },
    {
      id: 't-07',
      testCode: 'R76_DISCRIMINATION',
      clause: 'A.4.8',
      title: 'Discrimination Test (1.4d addition)',
      category: 'METROLOGICAL',
      isMandatory: true,
      isApplicable: true,
      status: 'PASS',
      justification: null,
    },
    {
      id: 't-08',
      testCode: 'R76_REPEATABILITY',
      clause: 'A.4.10',
      title: 'Type Examination Repeatability (2 Series at 50% & 100% Max)',
      category: 'METROLOGICAL',
      isMandatory: true,
      isApplicable: true,
      status: 'PASS',
      justification: null,
    },
    {
      id: 't-09',
      testCode: 'R76_CREEP',
      clause: 'A.4.11.1',
      title: 'Creep Test (Classes II, III, IIII)',
      category: 'METROLOGICAL',
      isMandatory: true,
      isApplicable: true,
      status: 'PASS',
      justification: null,
    },
    {
      id: 't-10',
      testCode: 'R76_ZERO_RETURN',
      clause: 'A.4.11.2',
      title: 'Zero Return Test (Immediate residual error)',
      category: 'METROLOGICAL',
      isMandatory: true,
      isApplicable: true,
      status: 'PASS',
      justification: null,
    },
    {
      id: 't-11',
      testCode: 'R76_STAB_EQUILIB',
      clause: '4.4.2, A.4.12',
      title: 'Stability of Equilibrium Test',
      category: 'METROLOGICAL',
      isMandatory: true,
      isApplicable: true,
      status: 'PASS',
      justification: null,
    },
    {
      id: 't-12',
      testCode: 'R76_TILTING',
      clause: 'A.5.1',
      title: 'Tilting Sensitivity Test (50/1000 tilt angle)',
      category: 'ENVIRONMENTAL',
      isMandatory: true,
      isApplicable: true,
      status: 'PASS',
      justification: null,
    },
    {
      id: 't-13',
      testCode: 'R76_WARM_UP',
      clause: 'A.5.2',
      title: 'Warm-up Time Test (after 8 h unpowered soak)',
      category: 'ENVIRONMENTAL',
      isMandatory: true,
      isApplicable: true,
      status: 'PASS',
      justification: null,
    },
    {
      id: 't-14',
      testCode: 'R76_TEMP_INFLUENCE',
      clause: 'A.5.3',
      title: 'Static Temperature Sequence (20 °C -> High -> Low -> 20 °C)',
      category: 'ENVIRONMENTAL',
      isMandatory: true,
      isApplicable: true,
      status: 'NOT_TESTED',
      justification: null,
    },
    {
      id: 't-15',
      testCode: 'R76_VOLT_AC_MAINS',
      clause: 'A.5.4.1',
      title: 'Voltage Variation: AC Mains Supply (Unom +10%, -15%)',
      category: 'ELECTRICAL',
      isMandatory: true,
      isApplicable: true,
      status: 'PASS',
      justification: null,
    },
    {
      id: 't-16',
      testCode: 'R76_VOLT_BATTERY',
      clause: 'A.5.4.3',
      title: 'Voltage Variation: Internal Battery Operation (down to cut-off)',
      category: 'ELECTRICAL',
      isMandatory: true,
      isApplicable: true,
      status: 'PASS',
      justification: null,
    },
    {
      id: 't-17',
      testCode: 'R76_VOLT_VEHICLE',
      clause: 'A.5.4.4',
      title: 'Voltage Variation: Road Vehicle Battery Supply',
      category: 'ELECTRICAL',
      isMandatory: false,
      isApplicable: false,
      status: 'NOT_APPLICABLE',
      justification: 'Instrument is not powered from a road-vehicle battery supply.',
    },
    {
      id: 't-18',
      testCode: 'R76_DAMP_HEAT',
      clause: 'B.2',
      title: 'Damp Heat Steady State Test (40 °C, 85% RH for 48 h)',
      category: 'ENVIRONMENTAL',
      isMandatory: true,
      isApplicable: true,
      status: 'NOT_TESTED',
      justification: null,
    },
    {
      id: 't-19',
      testCode: 'R76_DISTURB_BURST',
      clause: 'B.3.2',
      title: 'Electrical Fast Transients / Bursts (EFT)',
      category: 'ELECTRICAL',
      isMandatory: true,
      isApplicable: true,
      status: 'NOT_TESTED',
      justification: null,
    },
    {
      id: 't-20',
      testCode: 'R76_DISTURB_ESD',
      clause: 'B.3.3',
      title: 'Electrostatic Discharge (ESD, +-4 kV contact, +-8 kV air)',
      category: 'ELECTRICAL',
      isMandatory: true,
      isApplicable: true,
      status: 'NOT_TESTED',
      justification: null,
    },
    {
      id: 't-21',
      testCode: 'R76_SPAN_STABILITY',
      clause: 'B.4',
      title: 'Span Stability Test (Multi-Day Drift over 28 Days)',
      category: 'METROLOGICAL',
      isMandatory: true,
      isApplicable: true,
      status: 'NOT_TESTED',
      justification: null,
    },
  ]);

  const filteredTests = tests.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.clause.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.testCode.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'ALL' || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="glass-panel p-5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
            <h1 className="text-base font-bold text-white tracking-tight">
              Dynamic Test Plan Matrix (Evaluation Ref: RRSL-2026-TE-0104)
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Machine-evaluated applicability predicates per OIML R 76-1:2006. All exclusions require recorded metrological justifications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search clause or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-52"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs">
            <Filter className="w-3 h-3 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-800">All Categories</option>
              <option value="METROLOGICAL" className="bg-slate-800">Metrological</option>
              <option value="ENVIRONMENTAL" className="bg-slate-800">Environmental</option>
              <option value="ELECTRICAL" className="bg-slate-800">Electrical</option>
              <option value="CONSTRUCTION" className="bg-slate-800">Construction</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tests Table */}
      <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Clause</th>
                <th className="px-4 py-3">Test Code &amp; Title</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-center">Applicability</th>
                <th className="px-4 py-3 text-center">Execution Status</th>
                <th className="px-4 py-3">Recorded Justification / Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredTests.map((test) => (
                <tr key={test.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-white whitespace-nowrap">
                    {test.clause}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-100">{test.title}</div>
                    <div className="text-[11px] text-cyan-400/80 font-mono">{test.testCode}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                      {test.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    {test.isApplicable ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Applicable
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                        <XCircle className="w-3.5 h-3.5" />
                        Excluded
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    {test.status === 'PASS' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                        PASS
                      </span>
                    )}
                    {test.status === 'NOT_TESTED' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800">
                        SCHEDULED
                      </span>
                    )}
                    {test.status === 'NOT_APPLICABLE' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                        N / A
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-[11px]">
                    {test.justification ? (
                      <div className="flex items-start gap-1.5 text-amber-300/90 italic">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                        <span>{test.justification}</span>
                      </div>
                    ) : (
                      <span className="text-slate-600">Standard procedure applies</span>
                    )}
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
