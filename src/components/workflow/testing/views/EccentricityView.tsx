'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Edit3, XCircle, Sparkles, Check } from 'lucide-react';
import { getTable6MpeValue } from '@/core/test-engine/interpreters/calculation-interpreter';
import { AccuracyClass } from '@/core/types/metrology';
import {
  EccentricitySketch,
  ALL_STANDARD_POINTS,
  isPointMatched,
  StandardPointDef,
} from '../EccentricitySketch';

interface EccentricityViewProps {
  testCode: 'R76_ECCENTRICITY' | 'R76_ECC_ROLLING' | 'R76_ECC_MOBILE' | string;
  observations: Record<string, unknown>[];
  unit: string;
  eVal: number;
  accuracyClass: AccuracyClass;
  maxCapacity: number;
  onUpdateObservations: (nextObs: Record<string, unknown>[]) => void;
  onOpenCorrection: (rowIndex: number, fieldKey: string, currentVal: unknown) => void;
  onOpenInvalidate: (rowIndex: number) => void;
}

const STANDARD_PAN_OPTIONS = [
  { value: 'Center position', label: 'Center position (CTR - Datum)', short: 'CTR', badge: 'bg-slate-800 text-white' },
  { value: 'Quarter 1 (Front-Left)', label: 'Quarter 1 (Front-Left / FL)', short: 'Q1', badge: 'bg-emerald-600 text-white' },
  { value: 'Quarter 2 (Front-Right)', label: 'Quarter 2 (Front-Right / FR)', short: 'Q2', badge: 'bg-blue-600 text-white' },
  { value: 'Quarter 3 (Back-Right)', label: 'Quarter 3 (Back-Right / BR)', short: 'Q3', badge: 'bg-amber-600 text-white' },
  { value: 'Quarter 4 (Back-Left)', label: 'Quarter 4 (Back-Left / BL)', short: 'Q4', badge: 'bg-indigo-600 text-white' },
];

export const EccentricityView: React.FC<EccentricityViewProps> = ({
  testCode,
  observations,
  unit,
  eVal,
  accuracyClass,
  maxCapacity,
  onUpdateObservations,
  onOpenCorrection,
  onOpenInvalidate,
}) => {
  const [activeSketchPos, setActiveSketchPos] = useState<string>('Center position');
  const [activeRowIdx, setActiveRowIdx] = useState<number | null>(0);
  const [customPosRows, setCustomPosRows] = useState<Record<number, boolean>>({});
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);

  const isStandard = testCode === 'R76_ECCENTRICITY';
  const isRolling = testCode === 'R76_ECC_ROLLING';
  const isMobile = testCode === 'R76_ECC_MOBILE';

  const defaultEccLoad = isStandard
    ? Math.round((maxCapacity / 3) * 1000) / 1000
    : isRolling
    ? Math.round(maxCapacity * 0.8 * 1000) / 1000
    : Math.round(maxCapacity * 0.5 * 1000) / 1000;

  // Resolve standard position name for index if generic or empty
  const getStandardDefaultPos = (idx: number): string => {
    if (idx === 0) return 'Center position';
    if (idx === 1) return 'Quarter 1 (Front-Left)';
    if (idx === 2) return 'Quarter 2 (Front-Right)';
    if (idx === 3) return 'Quarter 3 (Back-Right)';
    if (idx === 4) return 'Quarter 4 (Back-Left)';
    return `Position #${idx + 1}`;
  };

  const getEffectivePosition = (row: Record<string, unknown>, idx: number): string => {
    const raw = String(row.position ?? '').trim();
    if (!raw) return getStandardDefaultPos(idx);
    // Check if generic Position #X pattern
    const match = raw.match(/^Position\s*#?\s*(\d+)$/i);
    if (match && isStandard) {
      const pNum = parseInt(match[1], 10);
      if (pNum >= 1 && pNum <= 5) {
        return getStandardDefaultPos(pNum - 1);
      }
    }
    return raw;
  };

  // Check if any rows have legacy generic "Position #" names
  const hasGenericPositions = isStandard && observations.some((r, idx) => {
    const raw = String(r.position ?? '').trim();
    return !raw || /^Position\s*#?\s*\d+$/i.test(raw);
  });

  // Batch standardize all rows to official OIML positions
  const handleStandardizePositions = () => {
    const next = observations.map((r, idx) => ({
      ...r,
      position: getStandardDefaultPos(idx),
    }));
    onUpdateObservations(next);
  };

  const handleCellChange = (index: number, key: string, val: unknown) => {
    const next = [...observations];
    next[index] = { ...next[index], [key]: val };
    onUpdateObservations(next);
  };

  const handlePositionSelect = (index: number, val: string) => {
    if (val === 'CUSTOM') {
      setCustomPosRows((prev) => ({ ...prev, [index]: true }));
      return;
    }
    setCustomPosRows((prev) => ({ ...prev, [index]: false }));
    handleCellChange(index, 'position', val);
    setActiveSketchPos(val);
    setActiveRowIdx(index);
  };

  const handleAddRow = () => {
    let newRow: Record<string, unknown> = {};
    if (isStandard) {
      // Find first standard position not yet present
      const currentPositions = observations.map((r, i) => getEffectivePosition(r, i));
      const nextStandard = ALL_STANDARD_POINTS.find(
        (pt) => !currentPositions.some((cp) => isPointMatched(cp, pt))
      );
      const nextPos = nextStandard ? nextStandard.name : `Position #${observations.length + 1}`;

      newRow = {
        position: nextPos,
        load: defaultEccLoad,
        indication: '',
        deltaL: '',
      };
    } else if (isRolling) {
      newRow = {
        position: 'Beginning',
        direction: 'FORWARD',
        section: `Section #${observations.length + 1}`,
        load: defaultEccLoad,
        indication: '',
        deltaL: '',
      };
    } else {
      newRow = {
        orientation: `Orientation #${observations.length + 1}`,
        tiltAngleDeg: 0,
        load: defaultEccLoad,
        indication: '',
        deltaL: '',
      };
    }
    onUpdateObservations([...observations, newRow]);
  };

  const handleDeleteRow = (index: number) => {
    const next = observations.filter((_, i) => i !== index);
    onUpdateObservations(next);
    if (activeRowIdx === index) {
      setActiveRowIdx(null);
    }
  };

  // Sync active position click from CAD Sketch into table
  const handleSketchSelectPosition = (posName: string) => {
    setActiveSketchPos(posName);

    // Find corresponding row in observations
    if (isStandard) {
      const targetPoint = ALL_STANDARD_POINTS.find((pt) => isPointMatched(posName, pt));
      if (targetPoint) {
        const rowMatchIdx = observations.findIndex((r, idx) => {
          const effective = getEffectivePosition(r, idx);
          return isPointMatched(effective, targetPoint, idx);
        });

        if (rowMatchIdx >= 0) {
          setActiveRowIdx(rowMatchIdx);
          rowRefs.current[rowMatchIdx]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    }
  };

  // Sync row click/focus back into CAD sketch
  const handleRowClick = (idx: number, rowPos: string) => {
    setActiveRowIdx(idx);
    setActiveSketchPos(rowPos);
  };

  // Scroll active row into view when activeRowIdx changes
  useEffect(() => {
    if (activeRowIdx !== null && rowRefs.current[activeRowIdx]) {
      rowRefs.current[activeRowIdx]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeRowIdx]);

  // Zero error reference
  const zeroRow = observations.find((r) => Number(r.load) === 0 && !r.isInvalidated);
  const zeroP = zeroRow ? Number(zeroRow.indication || 0) + 0.5 * eVal - Number(zeroRow.deltaL || 0) : 0;
  const zeroE = zeroRow ? zeroP - Number(zeroRow.load || 0) : 0;

  return (
    <div className="space-y-4">
      {/* Top Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            {isStandard && 'Standard Eccentricity Loading (Clause A.4.7.1 – A.4.7.3)'}
            {isRolling && 'Rolling Load Eccentricity (Clause A.4.7.4)'}
            {isMobile && 'Mobile / Suspended Eccentricity (Clause A.4.7.5)'}
          </h2>
          <span className="text-[11px] text-slate-500">
            {isStandard && 'Load applied to 4 quarter segments and center position. Target load ≈ Max / 3.'}
            {isRolling && 'Load applied at Beginning, Middle, and End in forward and reverse directions.'}
            {isMobile && 'Load applied under specified inclinations and suspension angles.'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {hasGenericPositions && (
            <button
              type="button"
              onClick={handleStandardizePositions}
              className="inline-flex items-center gap-1.5 text-xs text-emerald-800 hover:text-emerald-900 font-semibold px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition-colors shadow-2xs cursor-pointer"
              title="Convert generic Position #1..#5 to standard OIML R76-1 Clause A.4.7.1 quadrant positions"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Standardize OIML Positions</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleAddRow}
            className="inline-flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900 font-semibold px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Position</span>
          </button>
        </div>
      </div>

      {/* Visual Sketch / Physical Location Selector */}
      <EccentricitySketch
        testCode={testCode}
        receptorType={isRolling ? 'ROLLING_TRACK' : isMobile ? 'MOBILE_SCALE' : 'STANDARD_PAN'}
        activePosition={activeSketchPos}
        onSelectPosition={handleSketchSelectPosition}
        positions={observations.map((r, i) => getEffectivePosition(r, i))}
        activeRowIndex={activeRowIdx}
      />

      {/* Test-Isolated Data Table (Fits 100% width, zero horizontal sliding bar on desktop) */}
      <div className="border border-slate-200 rounded-xl shadow-2xs bg-white overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse table-auto">
          <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-2 px-1.5 w-7 text-center whitespace-nowrap text-slate-500">#</th>

              {/* Standard columns */}
              {isStandard && (
                <>
                  <th className="py-2 px-2 text-slate-700 min-w-[145px]">Location / Position</th>
                  <th className="py-2 px-1 text-center font-semibold text-slate-700 min-w-[72px]">
                    Load
                    <span className="block text-[9px] text-slate-400 font-normal leading-none mt-0.5">({unit})</span>
                  </th>
                </>
              )}

              {/* Rolling load columns */}
              {isRolling && (
                <>
                  <th className="py-2 px-2 min-w-[100px]">Track Position</th>
                  <th className="py-2 px-1.5 min-w-[90px]">Direction</th>
                  <th className="py-2 px-2 min-w-[100px]">Track Section</th>
                  <th className="py-2 px-1 text-center font-semibold text-slate-700 min-w-[72px]">
                    Rolling Load
                    <span className="block text-[9px] text-slate-400 font-normal leading-none mt-0.5">({unit})</span>
                  </th>
                </>
              )}

              {/* Mobile scale columns */}
              {isMobile && (
                <>
                  <th className="py-2 px-2 min-w-[130px]">Suspension / Tilt Orientation</th>
                  <th className="py-2 px-1 text-center min-w-[70px]">Tilt Angle (°)</th>
                  <th className="py-2 px-1 text-center font-semibold text-slate-700 min-w-[72px]">
                    Load
                    <span className="block text-[9px] text-slate-400 font-normal leading-none mt-0.5">({unit})</span>
                  </th>
                </>
              )}

              <th className="py-2 px-1 text-center font-semibold text-slate-700 min-w-[72px]">
                Indication I
                <span className="block text-[9px] text-slate-400 font-normal leading-none mt-0.5">({unit})</span>
              </th>
              <th className="py-2 px-1 text-center font-semibold text-slate-700 min-w-[55px]">
                ΔL
                <span className="block text-[9px] text-slate-400 font-normal leading-none mt-0.5">({unit})</span>
              </th>
              <th className="py-2 px-1 text-center font-semibold bg-slate-100/70 text-slate-600 min-w-[65px]">
                P (Calc)
                <span className="block text-[9px] font-normal leading-none mt-0.5">({unit})</span>
              </th>
              <th className="py-2 px-1 text-center font-semibold bg-slate-100/70 text-slate-600 min-w-[65px]">
                Error E
                <span className="block text-[9px] font-normal leading-none mt-0.5">({unit})</span>
              </th>
              <th className="py-2 px-1 text-center font-semibold bg-slate-100/70 text-slate-600 min-w-[58px]">
                MPE
                <span className="block text-[9px] font-normal leading-none mt-0.5">({unit})</span>
              </th>
              <th className="py-2 px-1 text-center font-semibold bg-slate-100/70 text-slate-600 min-w-[55px]">
                Status
              </th>
              <th className="py-2 px-1 text-center font-semibold text-slate-700 w-16 min-w-[55px]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white font-mono">
            {observations.map((row, idx) => {
              const isInvalid = Boolean(row.isInvalidated);
              const loadNum = Number(row.load) || defaultEccLoad;
              const indNum = Number(row.indication) || 0;
              const dlNum = Number(row.deltaL) || 0;

              const P = indNum + 0.5 * eVal - dlNum;
              const E = P - loadNum - zeroE;
              const mpe = getTable6MpeValue(accuracyClass, loadNum, eVal);
              const isPointPass = Math.abs(E) <= mpe + 1e-9;

              const effectivePos = getEffectivePosition(row, idx);
              const isCustom = customPosRows[idx] || (
                isStandard && !STANDARD_PAN_OPTIONS.some((opt) => opt.value === String(row.position || '')) &&
                !hasGenericPositions && Boolean(row.position)
              );

              // Check if this row is selected / active
              const isRowActive = activeRowIdx === idx || (
                isStandard && ALL_STANDARD_POINTS.some((pt) => isPointMatched(activeSketchPos, pt) && isPointMatched(effectivePos, pt, idx))
              );

              const matchingOption = STANDARD_PAN_OPTIONS.find(
                (opt) => opt.value === effectivePos || isPointMatched(effectivePos, { id: opt.short, name: opt.value, short: opt.short, desc: '', aliases: [] }, idx)
              );

              return (
                <tr
                  key={idx}
                  ref={(el) => {
                    rowRefs.current[idx] = el;
                  }}
                  onClick={() => handleRowClick(idx, effectivePos)}
                  className={`transition-colors cursor-pointer ${
                    isInvalid
                      ? 'bg-rose-50/60 opacity-60'
                      : isRowActive
                      ? 'bg-blue-50/90 ring-1 ring-inset ring-blue-400 font-medium'
                      : 'hover:bg-slate-50/80'
                  }`}
                >
                  <td className="py-1.5 px-1.5 text-center text-slate-400 font-sans text-xs">
                    <span className="font-semibold">{idx + 1}</span>
                    {isInvalid && <span className="block text-[8px] text-red-600 font-bold uppercase">Invalid</span>}
                  </td>

                  {/* STANDARD FIELDS (Position selector with official OIML quadrants) */}
                  {isStandard && (
                    <>
                      <td className="py-1.5 px-2">
                        {isCustom ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={String(row.position || '')}
                              onChange={(e) => handleCellChange(idx, 'position', e.target.value)}
                              disabled={isInvalid}
                              placeholder="Custom location..."
                              className="w-full h-7.5 px-2 py-0.5 text-xs border border-slate-200 rounded font-sans text-slate-800 bg-white hover:border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setCustomPosRows((prev) => ({ ...prev, [idx]: false }));
                                handlePositionSelect(idx, getStandardDefaultPos(idx));
                              }}
                              className="text-[10px] text-blue-600 hover:text-blue-800 underline shrink-0 px-1"
                              title="Switch back to standard positions"
                            >
                              Standard
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            {matchingOption && (
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 shadow-2xs ${matchingOption.badge}`}
                                title={matchingOption.label}
                              >
                                {matchingOption.short}
                              </span>
                            )}
                            <select
                              value={matchingOption ? matchingOption.value : effectivePos}
                              onChange={(e) => handlePositionSelect(idx, e.target.value)}
                              disabled={isInvalid}
                              className="w-full h-7.5 px-2 py-0.5 text-xs border border-slate-200 rounded font-sans text-slate-800 bg-white hover:border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400 cursor-pointer"
                            >
                              {STANDARD_PAN_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                              <option value="CUSTOM">✎ Custom position...</option>
                            </select>
                          </div>
                        )}
                      </td>

                      <td className="py-1.5 px-1">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={row.load !== undefined && row.load !== null ? String(row.load) : ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
                              handleCellChange(idx, 'load', val);
                            }
                          }}
                          disabled={isInvalid}
                          placeholder={String(defaultEccLoad)}
                          className="w-full h-7.5 px-1 py-0.5 text-xs text-center border border-slate-200 rounded font-mono text-slate-900 bg-white hover:border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400"
                        />
                      </td>
                    </>
                  )}

                  {/* ROLLING LOAD FIELDS */}
                  {isRolling && (
                    <>
                      <td className="py-1.5 px-1.5">
                        <select
                          value={String(row.position || 'Beginning')}
                          onChange={(e) => handleCellChange(idx, 'position', e.target.value)}
                          disabled={isInvalid}
                          className="w-full h-7.5 px-2 py-0.5 text-xs border border-slate-200 rounded font-sans focus:outline-none focus:border-blue-600 bg-white"
                        >
                          <option value="Beginning">Beginning</option>
                          <option value="Middle">Middle</option>
                          <option value="End">End</option>
                        </select>
                      </td>
                      <td className="py-1.5 px-1.5">
                        <select
                          value={String(row.direction || 'FORWARD')}
                          onChange={(e) => handleCellChange(idx, 'direction', e.target.value)}
                          disabled={isInvalid}
                          className="w-full h-7.5 px-1.5 py-0.5 text-xs border border-slate-200 rounded font-sans focus:outline-none focus:border-blue-600 bg-white"
                        >
                          <option value="FORWARD">→ Forward</option>
                          <option value="REVERSE">← Reverse</option>
                        </select>
                      </td>
                      <td className="py-1.5 px-1.5">
                        <input
                          type="text"
                          value={String(row.section || `Section #${idx + 1}`)}
                          onChange={(e) => handleCellChange(idx, 'section', e.target.value)}
                          disabled={isInvalid}
                          className="w-full h-7.5 px-2 py-0.5 text-xs border border-slate-200 rounded font-sans text-slate-800 bg-white hover:border-slate-300 focus:border-blue-600 outline-none"
                        />
                      </td>
                      <td className="py-1.5 px-1">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={row.load !== undefined && row.load !== null ? String(row.load) : ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
                              handleCellChange(idx, 'load', val);
                            }
                          }}
                          disabled={isInvalid}
                          placeholder={String(defaultEccLoad)}
                          className="w-full h-7.5 px-1 py-0.5 text-xs text-center border border-slate-200 rounded font-mono text-slate-900 bg-white hover:border-slate-300 focus:border-blue-600 outline-none"
                        />
                      </td>
                    </>
                  )}

                  {/* MOBILE SCALE FIELDS */}
                  {isMobile && (
                    <>
                      <td className="py-1.5 px-1.5">
                        <input
                          type="text"
                          value={String(row.orientation || `Orientation #${idx + 1}`)}
                          onChange={(e) => handleCellChange(idx, 'orientation', e.target.value)}
                          disabled={isInvalid}
                          className="w-full h-7.5 px-2 py-0.5 text-xs border border-slate-200 rounded font-sans text-slate-800 bg-white hover:border-slate-300 focus:border-blue-600 outline-none"
                        />
                      </td>
                      <td className="py-1.5 px-1">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={row.tiltAngleDeg !== undefined ? String(row.tiltAngleDeg) : '0'}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
                              handleCellChange(idx, 'tiltAngleDeg', val);
                            }
                          }}
                          disabled={isInvalid}
                          className="w-full h-7.5 px-1 py-0.5 text-xs text-center border border-slate-200 rounded font-mono text-slate-900 bg-white hover:border-slate-300 focus:border-blue-600 outline-none"
                        />
                      </td>
                      <td className="py-1.5 px-1">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={row.load !== undefined && row.load !== null ? String(row.load) : ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
                              handleCellChange(idx, 'load', val);
                            }
                          }}
                          disabled={isInvalid}
                          placeholder={String(defaultEccLoad)}
                          className="w-full h-7.5 px-1 py-0.5 text-xs text-center border border-slate-200 rounded font-mono text-slate-900 bg-white hover:border-slate-300 focus:border-blue-600 outline-none"
                        />
                      </td>
                    </>
                  )}

                  {/* Indication */}
                  <td className="py-1.5 px-1">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={row.indication !== undefined && row.indication !== null ? String(row.indication) : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
                          handleCellChange(idx, 'indication', val);
                        }
                      }}
                      disabled={isInvalid}
                      placeholder="0.0"
                      className="w-full h-7.5 px-1 py-0.5 text-xs text-center border border-slate-200 rounded font-mono text-slate-900 bg-white hover:border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400"
                    />
                  </td>

                  {/* ΔL */}
                  <td className="py-1.5 px-1">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={row.deltaL !== undefined && row.deltaL !== null ? String(row.deltaL) : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
                          handleCellChange(idx, 'deltaL', val);
                        }
                      }}
                      disabled={isInvalid}
                      placeholder="0.0"
                      className="w-full h-7.5 px-1 py-0.5 text-xs text-center border border-slate-200 rounded font-mono text-slate-900 bg-white hover:border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400"
                    />
                  </td>

                  {/* Calculated P (Read-only) */}
                  <td className="py-1.5 px-1 text-center bg-slate-50/70 text-slate-700 text-xs font-mono">
                    {row.indication !== '' && row.indication !== undefined && row.indication !== null ? P.toFixed(eVal < 0.1 ? 3 : 2) : '—'}
                  </td>

                  {/* Calculated Error E (Read-only) */}
                  <td
                    className={`py-1.5 px-1 text-center bg-slate-50/70 text-xs font-mono font-semibold ${
                      row.indication === '' || row.indication === undefined || row.indication === null
                        ? 'text-slate-400'
                        : isPointPass
                        ? 'text-slate-800'
                        : 'text-red-700'
                    }`}
                  >
                    {row.indication !== '' && row.indication !== undefined && row.indication !== null
                      ? E > 0
                        ? `+${E.toFixed(eVal < 0.1 ? 3 : 2)}`
                        : E.toFixed(eVal < 0.1 ? 3 : 2)
                      : '—'}
                  </td>

                  {/* MPE (Read-only) */}
                  <td className="py-1.5 px-1 text-center bg-slate-50/70 text-slate-600 text-xs font-mono">
                    ±{mpe.toFixed(eVal < 0.1 ? 3 : 2)}
                  </td>

                  {/* Status (Read-only) */}
                  <td className="py-1.5 px-1 text-center bg-slate-50/70 font-sans font-bold text-[10px]">
                    {row.indication === '' || row.indication === undefined || row.indication === null ? (
                      <span className="text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full font-medium">
                        —
                      </span>
                    ) : isPointPass ? (
                      <span className="text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                        PASS
                      </span>
                    ) : (
                      <span className="text-red-700 bg-red-100/80 px-1.5 py-0.5 rounded-full">
                        FAIL
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-1 px-1 text-center flex items-center justify-center gap-0.5 font-sans">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenCorrection(idx, 'indication', row.indication);
                      }}
                      className="text-slate-500 hover:text-blue-700 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Correct observation"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenInvalidate(idx);
                      }}
                      className="text-slate-500 hover:text-amber-700 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Mark observation invalid"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRow(idx);
                      }}
                      className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Delete observation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
