'use client';

import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Circle,
  Slash,
  ChevronRight,
  ListChecks,
} from 'lucide-react';
import { TestStatusCode } from '@/lib/test-suite-types';

export interface NavigableTestItem {
  id: string;
  testCode: string;
  name: string;
  clause: string;
  status: TestStatusCode;
  isApplicable: boolean;
  exclusionJustification?: string | null;
}

interface TestNavigatorProps {
  testSuite: NavigableTestItem[];
  activeTestCode: string;
  onSelectTest: (testCode: string) => void;
}

export const TestNavigator: React.FC<TestNavigatorProps> = ({
  testSuite,
  activeTestCode,
  onSelectTest,
}) => {
  const getStatusIndicator = (status: TestStatusCode, isApplicable: boolean, isActive: boolean) => {
    if (!isApplicable || status === 'NOT_APPLICABLE') {
      return (
        <span className="inline-flex items-center text-[10px] text-slate-400 font-medium shrink-0">
          <Slash className="w-3.5 h-3.5 text-slate-300 mr-1" />
          <span className="hidden xl:inline">N/A</span>
        </span>
      );
    }

    if (status === 'PASS') {
      return (
        <span className="inline-flex items-center text-[10px] text-emerald-700 font-semibold shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1" />
          <span className="hidden xl:inline">PASS</span>
        </span>
      );
    }

    if (status === 'FAIL') {
      return (
        <span className="inline-flex items-center text-[10px] text-red-700 font-bold shrink-0">
          <AlertCircle className="w-3.5 h-3.5 text-red-600 mr-1" />
          <span className="hidden xl:inline">FAIL</span>
        </span>
      );
    }

    if (status === 'RETEST_REQUIRED') {
      return (
        <span className="inline-flex items-center text-[10px] text-amber-700 font-bold shrink-0">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 mr-1" />
          <span className="hidden xl:inline">RETEST</span>
        </span>
      );
    }

    if (isActive || status === 'IN_PROGRESS' || status === 'INCOMPLETE') {
      return (
        <span className="inline-flex items-center text-[10px] text-blue-700 font-semibold shrink-0">
          <Clock className="w-3.5 h-3.5 text-blue-600 mr-1" />
          <span className="hidden xl:inline">ACTIVE</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center text-[10px] text-slate-400 shrink-0">
        <Circle className="w-3.5 h-3.5 text-slate-300 mr-1" />
        <span className="hidden xl:inline">TODO</span>
      </span>
    );
  };

  const applicableTests = testSuite.filter((t) => t.isApplicable && t.status !== 'NOT_APPLICABLE');
  const nonApplicableTests = testSuite.filter((t) => !t.isApplicable || t.status === 'NOT_APPLICABLE');
  const completedCount = applicableTests.filter((t) => t.status === 'PASS' || t.status === 'FAIL').length;
  const passCount = applicableTests.filter((t) => t.status === 'PASS').length;
  const failCount = applicableTests.filter((t) => t.status === 'FAIL').length;

  const [showExemptions, setShowExemptions] = React.useState(false);

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden flex flex-col h-full">
      {/* Navigator Header */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ListChecks className="w-4 h-4 text-slate-500" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Test Plan</h2>
        </div>
        <div className="text-[11px] font-semibold text-slate-600">
          {completedCount} / {applicableTests.length} Done
        </div>
      </div>

      {/* Tests Scrollable List - Applicable Tests Only */}
      <nav className="divide-y divide-slate-100 overflow-y-auto max-h-[calc(100vh-320px)]" aria-label="Tests list">
        {applicableTests.map((test) => {
          const isActive = test.testCode === activeTestCode;

          return (
            <button
              key={test.id || test.testCode}
              type="button"
              onClick={() => onSelectTest(test.testCode)}
              className={`w-full text-left px-3 py-2.5 transition-colors flex items-center justify-between gap-2 group ${
                isActive
                  ? 'bg-blue-50/90 border-l-3 border-l-blue-700 pl-2.5 font-medium'
                  : 'hover:bg-slate-50'
              }`}
            >
              <div className="min-w-0 pr-1 flex-1">
                {/* Test Name as Primary */}
                <div
                  className={`text-xs font-semibold truncate transition-colors ${
                    isActive
                      ? 'text-blue-900'
                      : 'text-slate-800 group-hover:text-blue-700'
                  }`}
                >
                  {test.name}
                </div>

                {/* Clause as Secondary */}
                <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                  <span>Clause {test.clause}</span>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="shrink-0 flex items-center gap-1.5">
                {getStatusIndicator(test.status, test.isApplicable, isActive)}
                <ChevronRight
                  className={`w-3.5 h-3.5 transition-transform ${
                    isActive
                      ? 'text-blue-700 translate-x-0.5'
                      : 'text-slate-300 group-hover:text-slate-500'
                  }`}
                />
              </div>
            </button>
          );
        })}
      </nav>

      {/* Non-Applicable Statutory Exemptions Heading */}
      {nonApplicableTests.length > 0 && (
        <div className="border-t border-slate-200 bg-slate-50/80">
          <button
            type="button"
            onClick={() => setShowExemptions((prev) => !prev)}
            className="w-full px-3.5 py-2 flex items-center justify-between text-left hover:bg-slate-100/80 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <Slash className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Not Applicable ({nonApplicableTests.length})
              </span>
            </div>
            <span className="text-[10px] text-slate-400 hover:text-slate-600 font-medium">
              {showExemptions ? 'Hide ▲' : 'Show ▼'}
            </span>
          </button>

          {showExemptions && (
            <div className="px-3 pb-3 space-y-1.5 max-h-48 overflow-y-auto">
              {nonApplicableTests.map((test) => (
                <div
                  key={test.id || test.testCode}
                  className="px-2.5 py-1.5 rounded bg-white border border-slate-200 text-xs shadow-2xs"
                >
                  <div className="flex items-baseline justify-between gap-1.5">
                    <span className="font-medium text-slate-700 truncate text-[11px]">
                      {test.name}
                    </span>
                    <span className="font-mono text-[9px] text-slate-400 shrink-0">
                      Clause {test.clause}
                    </span>
                  </div>
                  {test.exclusionJustification && (
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                      {test.exclusionJustification}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Compact Status Footer */}
      <div className="px-3.5 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 mt-auto">
        <span className="text-emerald-700 font-medium">✓ {passCount} Passed</span>
        {failCount > 0 && <span className="text-red-700 font-bold">✗ {failCount} Failed</span>}
        <span>⊘ {nonApplicableTests.length} Exempt</span>
      </div>
    </div>
  );
};
