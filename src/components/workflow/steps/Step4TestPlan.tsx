'use client';

import React from 'react';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Slash,
  ChevronRight,
  Play,
  ListChecks,
} from 'lucide-react';
import { RegisteredInstrument } from '@/lib/synthetic-instruments';
import { TestSuiteItem } from '@/lib/test-suite-types';

interface Step3Props {
  instrument: RegisteredInstrument;
  testSuite?: TestSuiteItem[];
  onSelectTest?: (testCode: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step4TestPlan: React.FC<Step3Props> = ({
  instrument,
  testSuite = [],
  onSelectTest,
  onNext,
  onBack,
}) => {
  const applicableTests = testSuite.filter((t) => t.isApplicable && t.status !== 'NOT_APPLICABLE');
  const notApplicableTests = testSuite.filter((t) => !t.isApplicable || t.status === 'NOT_APPLICABLE');
  const completedCount = applicableTests.filter(
    (t) => t.status === 'PASS' || t.status === 'FAIL'
  ).length;
  const passedCount = applicableTests.filter((t) => t.status === 'PASS').length;
  const failedCount = applicableTests.filter((t) => t.status === 'FAIL').length;
  const inProgressCount = applicableTests.filter(
    (t) => t.status === 'IN_PROGRESS' || t.status === 'INCOMPLETE'
  ).length;
  const scheduledCount = applicableTests.filter(
    (t) => t.status === 'NOT_TESTED'
  ).length;
  const notApplicableCount = notApplicableTests.length;

  const handleTestClick = (testCode: string) => {
    if (onSelectTest) {
      onSelectTest(testCode);
    }
    onNext();
  };

  const handleBeginTesting = () => {
    // Find the first unfinished or in-progress applicable test
    const firstActive = testSuite.find(
      (t) => t.isApplicable && (t.status === 'NOT_TESTED' || t.status === 'IN_PROGRESS' || t.status === 'INCOMPLETE' || t.status === 'RETEST_REQUIRED')
    );
    if (firstActive && onSelectTest) {
      onSelectTest(firstActive.testCode);
    }
    onNext();
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              Step 3 of 6 &bull; Test Plan
            </span>
            <span className="text-xs text-slate-500 font-medium">
              OIML R 76-2 Test Program
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Evaluation Test Plan
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Applicable test battery dynamically mapped to OIML R 76-2 for{' '}
            <strong className="text-slate-800">{instrument.modelName}</strong> ({instrument.accuracyClass.replace('_', ' ')}).
          </p>
        </div>

        <button
          type="button"
          onClick={handleBeginTesting}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold shadow-xs transition-colors shrink-0 self-start sm:self-center"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{completedCount > 0 ? 'Resume Testing' : 'Begin Testing'}</span>
        </button>
      </div>

      {/* Summary Metrics Bar (One Unified Model) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs text-xs">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Tests</span>
          <span className="text-base font-bold text-slate-900">{testSuite.length}</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Applicable</span>
          <span className="text-base font-bold text-blue-700">{applicableTests.length}</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Completed</span>
          <span className="text-base font-bold text-slate-800">
            {completedCount} <span className="text-xs font-normal text-slate-400">/ {applicableTests.length}</span>
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Passed / Failed</span>
          <span className="text-base font-bold text-emerald-700">
            {passedCount}{' '}
            {failedCount > 0 && <span className="text-red-700 font-bold">/ {failedCount}</span>}
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Not Applicable</span>
          <span className="text-base font-bold text-slate-500">{notApplicableCount}</span>
        </div>
      </div>

      {/* Structured OIML R 76-2 Test Plan List */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-slate-500" />
            <span className="font-bold text-slate-800 uppercase tracking-wide">
              Test Program (OIML R 76-2 Structure)
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            Click any test to open its specialized laboratory workspace
          </span>
        </div>

        <ul className="divide-y divide-slate-100">
          {applicableTests.map((t) => {
            const isCompleted = t.status === 'PASS' || t.status === 'FAIL';
            const isCurrent = t.status === 'IN_PROGRESS' || t.status === 'INCOMPLETE';
            const isFail = t.status === 'FAIL';
            const isPass = t.status === 'PASS';

            return (
              <li
                key={t.id || t.testCode}
                onClick={() => handleTestClick(t.testCode)}
                className={`px-5 py-3.5 flex items-center justify-between transition-colors text-xs cursor-pointer group ${
                  isCurrent
                    ? 'bg-blue-50/50 hover:bg-blue-50'
                    : isFail
                    ? 'bg-red-50/30 hover:bg-red-50/60'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0 pr-4">
                  {/* Status Indicator Icon */}
                  <div className="shrink-0">
                    {isPass && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    {isFail && <AlertCircle className="w-4 h-4 text-red-600" />}
                    {isCurrent && <Clock className="w-4 h-4 text-blue-700" />}
                    {!isCompleted && !isCurrent && (
                      <Circle className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                    )}
                  </div>

                  {/* Test Name (Primary) & Clause (Secondary) */}
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                        {t.name}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 font-normal flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-slate-600 font-medium">Clause {t.clause}</span>
                    </div>
                  </div>
                </div>

                {/* Right side status badge and chevron */}
                <div className="shrink-0 flex items-center gap-2.5">
                  {isPass && (
                    <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Passed
                    </span>
                  )}
                  {isFail && (
                    <span className="text-[11px] font-bold text-red-800 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                      Failed
                    </span>
                  )}
                  {isCurrent && (
                    <span className="text-[11px] font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      In Progress
                    </span>
                  )}
                  {!isCompleted && !isCurrent && (
                    <span className="text-[11px] font-normal text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                      Scheduled
                    </span>
                  )}

                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-700 group-hover:translate-x-0.5 transition-all" />
                </div>
              </li>
            );
          })}
        </ul>

        {/* Statutory Exemptions / Not Applicable Heading Section */}
        {notApplicableTests.length > 0 && (
          <div className="border-t border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Slash className="w-4 h-4 text-slate-400" />
                <span className="font-bold text-slate-700 text-xs uppercase tracking-wide">
                  Statutory Exemptions / Not Applicable ({notApplicableTests.length})
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                Excluded based on instrument characteristics
              </span>
            </div>

            <div className="space-y-2">
              {notApplicableTests.map((t) => (
                <div
                  key={t.id || t.testCode}
                  className="p-3 bg-white border border-slate-200 rounded-lg flex items-start justify-between gap-4 text-xs shadow-2xs"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800">{t.name}</span>
                      <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                        Clause {t.clause}
                      </span>
                    </div>
                    {t.exclusionJustification && (
                      <p className="text-[11px] text-slate-500 leading-relaxed italic">
                        {t.exclusionJustification}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    Not Applicable
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded text-xs font-medium transition-colors"
        >
          &larr; Back to Test Setup
        </button>

        <button
          type="button"
          onClick={handleBeginTesting}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold shadow-xs transition-colors"
        >
          <span>Proceed to Testing</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
