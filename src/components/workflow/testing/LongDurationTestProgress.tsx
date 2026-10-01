'use client';

import React from 'react';
import { Clock, CheckCircle2, Circle, AlertCircle } from 'lucide-react';

interface LongDurationTestProgressProps {
  testCode: string;
  observations: Record<string, unknown>[];
}

export const LongDurationTestProgress: React.FC<LongDurationTestProgressProps> = ({
  testCode,
  observations,
}) => {
  // Only display for tests that naturally involve long elapsed times
  const isCreep = testCode === 'R76_CREEP';
  const isDampHeat = testCode === 'R76_DAMP_HEAT' || testCode.includes('DAMP');
  const isSpanStability = testCode === 'R76_SPAN_STABILITY' || testCode.includes('SPAN');

  if (!isCreep && !isDampHeat && !isSpanStability) {
    return null;
  }

  // 1. CREEP TEST (Clause A.4.11.1) — 4 hours requirement
  if (isCreep) {
    const requiredMinutes = 240; // 4 hours
    // Get highest elapsed minutes from observations
    const maxElapsedMinutes = observations.reduce((max, obs) => {
      const m = Number(obs.elapsedMinutes) || 0;
      return m > max ? m : max;
    }, 0);

    // If early termination qualified (stabilized at 30 min per A.4.11.1)
    const isEarlyTerm = observations.some((o) => Number(o.elapsedMinutes) === 30 && !o.isInvalidated);

    const elapsedHours = Math.floor(maxElapsedMinutes / 60);
    const elapsedMins = maxElapsedMinutes % 60;
    const remainingMinutes = Math.max(0, requiredMinutes - maxElapsedMinutes);
    const remainingHours = Math.floor(remainingMinutes / 60);
    const remainingMins = remainingMinutes % 60;

    const percent = Math.min(100, Math.round((maxElapsedMinutes / requiredMinutes) * 100));

    return (
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-blue-700" />
            <span className="font-bold text-slate-800">
              Creep Test Elapsed Progress (Clause A.4.11.1)
            </span>
          </div>
          <span className="font-mono text-[11px] text-slate-500">
            Linked to observation record timestamps
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 bg-white p-2.5 rounded border border-slate-200 text-center font-mono">
          <div>
            <span className="text-[10px] text-slate-400 block font-sans">Required Duration</span>
            <span className="font-bold text-slate-800">4 hours</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-sans">Elapsed</span>
            <span className="font-bold text-blue-700">
              {elapsedHours}h {elapsedMins}m
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-sans">Remaining</span>
            <span className="font-bold text-slate-700">
              {remainingMinutes === 0 ? '0h 0m' : `${remainingHours}h ${remainingMins}m`}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-blue-600 h-full transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>

        {isEarlyTerm && maxElapsedMinutes < requiredMinutes && (
          <div className="text-[11px] text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 flex items-center gap-1.5 font-sans">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              OIML Clause A.4.11.1 early termination condition met at 30 min (Δ0-30 ≤ 0.5e and Δ15-30 ≤ 0.2e).
            </span>
          </div>
        )}
      </div>
    );
  }

  // 2. DAMP HEAT TEST (Clause A.5.2) — 48 hours requirement
  if (isDampHeat) {
    const requiredHours = 48;
    const maxElapsedHours = observations.reduce((max, obs) => {
      const h = Number(obs.elapsedHours) || 0;
      return h > max ? h : max;
    }, 0);

    const remainingHours = Math.max(0, requiredHours - maxElapsedHours);
    const percent = Math.min(100, Math.round((maxElapsedHours / requiredHours) * 100));

    return (
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-blue-700" />
            <span className="font-bold text-slate-800">
              Damp Heat Steady State Progress (Clause A.5.2)
            </span>
          </div>
          <span className="font-mono text-[11px] text-slate-500">
            Thermal chamber telemetry
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 bg-white p-2.5 rounded border border-slate-200 text-center font-mono">
          <div>
            <span className="text-[10px] text-slate-400 block font-sans">Required Duration</span>
            <span className="font-bold text-slate-800">48 hours</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-sans">Elapsed</span>
            <span className="font-bold text-blue-700">{maxElapsedHours} hours</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-sans">Remaining</span>
            <span className="font-bold text-slate-700">{remainingHours} hours</span>
          </div>
        </div>

        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-blue-600 h-full transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    );
  }

  // 3. SPAN STABILITY (Clause 3.9.5, Annex B.4) — 28 days milestones
  if (isSpanStability) {
    const milestones = [
      { day: 0, label: 'Day 0' },
      { day: 1, label: 'Day 1' },
      { day: 7, label: 'Day 7' },
      { day: 14, label: 'Day 14' },
      { day: 21, label: 'Day 21' },
      { day: 28, label: 'Day 28' },
    ];

    const recordedDays = observations
      .filter((o) => !o.isInvalidated && o.elapsedDays !== undefined)
      .map((o) => Number(o.elapsedDays));

    return (
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-blue-700" />
            <span className="font-bold text-slate-800">
              Span Stability Periodic Milestones (Clause 3.9.5 &bull; 28 Days)
            </span>
          </div>
          <span className="font-mono text-[11px] text-slate-500">
            {recordedDays.length} observations logged
          </span>
        </div>

        {/* Milestone Badges per Section 14 */}
        <div className="grid grid-cols-6 gap-2">
          {milestones.map((m) => {
            const isCompleted = recordedDays.some((d) => Math.abs(d - m.day) <= 1.5 || d >= m.day);
            return (
              <div
                key={m.day}
                className={`p-2 rounded border text-center font-mono ${
                  isCompleted
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-white border-slate-200 text-slate-400'
                }`}
              >
                <div className="text-[10px] font-sans font-semibold">{m.label}</div>
                <div className="mt-1 font-bold text-xs">
                  {isCompleted ? '✓' : '○'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
};
