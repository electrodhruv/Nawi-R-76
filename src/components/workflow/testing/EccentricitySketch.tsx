'use client';

import React from 'react';
import { Check, Target, Crosshair } from 'lucide-react';

export interface StandardPointDef {
  id: string;
  name: string;
  short: string;
  desc: string;
  gridArea?: string;
  aliases: string[];
}

export const STANDARD_PAN_POINTS: StandardPointDef[] = [
  {
    id: 'Q4',
    name: 'Quarter 4 (Back-Left)',
    short: 'Q4 (BL)',
    desc: 'Top Left',
    gridArea: 'col-start-1 row-start-1',
    aliases: ['quarter 4', 'q4', 'back-left', 'back left', 'top-left', 'top left', 'bl', 'position #5', 'position 5'],
  },
  {
    id: 'Q3',
    name: 'Quarter 3 (Back-Right)',
    short: 'Q3 (BR)',
    desc: 'Top Right',
    gridArea: 'col-start-2 row-start-1',
    aliases: ['quarter 3', 'q3', 'back-right', 'back right', 'top-right', 'top right', 'br', 'position #4', 'position 4'],
  },
  {
    id: 'Q1',
    name: 'Quarter 1 (Front-Left)',
    short: 'Q1 (FL)',
    desc: 'Bottom Left',
    gridArea: 'col-start-1 row-start-2',
    aliases: ['quarter 1', 'q1', 'front-left', 'front left', 'bottom-left', 'bottom left', 'fl', 'position #2', 'position 2'],
  },
  {
    id: 'Q2',
    name: 'Quarter 2 (Front-Right)',
    short: 'Q2 (FR)',
    desc: 'Bottom Right',
    gridArea: 'col-start-2 row-start-2',
    aliases: ['quarter 2', 'q2', 'front-right', 'front right', 'bottom-right', 'bottom right', 'fr', 'position #3', 'position 3'],
  },
];

export const CENTER_POINT_DEF: StandardPointDef = {
  id: 'CTR',
  name: 'Center position',
  short: 'CTR',
  desc: 'Center Datum',
  aliases: ['center', 'ctr', 'center position', 'datum', 'position #1', 'position 1'],
};

export const ALL_STANDARD_POINTS: StandardPointDef[] = [
  CENTER_POINT_DEF,
  STANDARD_PAN_POINTS[2], // Q1
  STANDARD_PAN_POINTS[3], // Q2
  STANDARD_PAN_POINTS[1], // Q3
  STANDARD_PAN_POINTS[0], // Q4
];

export const isPointMatched = (
  posNameOrIndex: string | number | undefined,
  point: StandardPointDef,
  rowIndex?: number
): boolean => {
  const str = String(posNameOrIndex ?? '').trim().toLowerCase();
  if (!str && rowIndex === undefined) return false;

  // Direct match on name, id, short, desc
  if (str === point.name.toLowerCase() || str === point.id.toLowerCase() || str === point.short.toLowerCase()) {
    return true;
  }

  // Alias match
  if (point.aliases.some((alias) => str.includes(alias) || alias.includes(str))) {
    return true;
  }

  // Fallback to row index mapping if row had generic Position #X or is at index:
  // Center is row 0, Q1 is row 1, Q2 is row 2, Q3 is row 3, Q4 is row 4
  if (point.id === 'CTR' && (rowIndex === 0 || str === 'position #1' || str === 'position 1')) return true;
  if (point.id === 'Q1' && (rowIndex === 1 || str === 'position #2' || str === 'position 2')) return true;
  if (point.id === 'Q2' && (rowIndex === 2 || str === 'position #3' || str === 'position 3')) return true;
  if (point.id === 'Q3' && (rowIndex === 3 || str === 'position #4' || str === 'position 4')) return true;
  if (point.id === 'Q4' && (rowIndex === 4 || str === 'position #5' || str === 'position 5')) return true;

  return false;
};

interface EccentricitySketchProps {
  receptorType?: string;
  testCode?: string;
  activePosition: string;
  onSelectPosition: (position: string) => void;
  positions: string[];
  activeRowIndex?: number | null;
}

export const EccentricitySketch: React.FC<EccentricitySketchProps> = ({
  testCode = 'R76_ECCENTRICITY',
  activePosition,
  onSelectPosition,
  positions = [],
  activeRowIndex,
}) => {
  const isRolling = testCode === 'R76_ECC_ROLLING';
  const isMobile = testCode === 'R76_ECC_MOBILE';

  if (isRolling) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs shadow-2xs">
        <div className="text-slate-800 font-semibold mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Crosshair className="w-4 h-4 text-blue-600" />
            Rolling Load Track Schematic (Clause A.4.7.4)
          </span>
          <span className="text-[11px] text-slate-500 font-normal">Select track position to inspect</span>
        </div>
        <div className="relative h-20 bg-white border border-slate-200 rounded-lg flex items-center justify-between px-6 py-2 shadow-inner">
          <div className="absolute inset-x-4 top-5 h-1 bg-slate-300 rounded" />
          <div className="absolute inset-x-4 bottom-5 h-1 bg-slate-300 rounded" />

          {positions.map((pos) => {
            const isSelected = pos === activePosition;
            return (
              <button
                type="button"
                key={pos}
                onClick={() => onSelectPosition(pos)}
                className={`relative z-10 px-3 py-1.5 rounded-md text-[11px] font-semibold border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-700 shadow-sm ring-2 ring-blue-300'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400'
                }`}
              >
                {pos}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs shadow-2xs">
        <div className="text-slate-800 font-semibold mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Target className="w-4 h-4 text-blue-600" />
            Mobile / Suspended Receptor Orientation (Clause A.4.7.5)
          </span>
          <span className="text-[11px] text-slate-500 font-normal">Select tilt angle / suspension point</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {positions.map((pos) => {
            const isSelected = pos === activePosition;
            return (
              <button
                type="button"
                key={pos}
                onClick={() => onSelectPosition(pos)}
                className={`p-2.5 rounded-lg text-center border text-[11px] transition-all font-medium cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-700 font-bold shadow-sm ring-2 ring-blue-300'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-slate-50'
                }`}
              >
                {pos}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Standard pan receptor with 4 quadrants + center
  const hasRecorded = (point: StandardPointDef) => {
    return positions.some((p, idx) => isPointMatched(p, point, idx));
  };

  const isPointSelected = (point: StandardPointDef) => {
    return isPointMatched(activePosition, point, activeRowIndex ?? undefined);
  };

  const isCenterSelected = isPointSelected(CENTER_POINT_DEF);
  const centerRecorded = hasRecorded(CENTER_POINT_DEF);

  // Active point info display
  const activeDef = ALL_STANDARD_POINTS.find((pt) => isPointSelected(pt)) || CENTER_POINT_DEF;
  const isActiveRecorded = hasRecorded(activeDef);

  return (
    <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 text-xs shadow-2xs">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left Informational text */}
        <div className="space-y-2 max-w-sm flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-xs tracking-tight uppercase flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5 text-blue-700" />
              Pan Loading Geometry
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
              Clause A.4.7.1
            </span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Click any quadrant or center point on the virtual load receptor to focus or record observations in the table below.
            Target load is approximately <strong>Max / 3</strong> distributed across each segment.
          </p>

          <div className="flex items-center gap-3 pt-0.5 text-[10px] text-slate-600 font-medium">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" /> Selected
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Recorded
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-200 border border-slate-300 inline-block" /> Pending
            </span>
          </div>

          {/* Active selection feedback */}
          <div className="pt-1.5 border-t border-slate-200/80 flex items-center justify-between gap-2 text-[11px]">
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-slate-400 text-[10px] uppercase font-semibold">Active:</span>
              <span className="font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-[11px] truncate">
                {activeDef.short} &bull; {activeDef.name} ({activeDef.desc})
              </span>
            </div>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded shrink-0 ${
              isActiveRecorded
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {isActiveRecorded ? '✓ In Table' : '○ Pending'}
            </span>
          </div>
        </div>

        {/* Right Pan CAD Graphic */}
        <div className="shrink-0 relative w-56 h-56 bg-gradient-to-br from-slate-100 to-slate-200/90 rounded-2xl border-2 border-slate-300/80 shadow-md p-2.5 flex flex-col justify-between select-none">
          {/* Subtle pan rim etching */}
          <div className="absolute inset-1.5 rounded-xl border border-dashed border-slate-300 pointer-events-none" />

          {/* 2x2 Quadrants Grid */}
          <div className="grid grid-cols-2 grid-rows-2 gap-2 w-full h-full relative z-10">
            {STANDARD_PAN_POINTS.map((q) => {
              const isSelected = isPointSelected(q);
              const recorded = hasRecorded(q);

              return (
                <button
                  type="button"
                  key={q.id}
                  onClick={() => onSelectPosition(q.name)}
                  className={`relative rounded-xl p-2 flex flex-col items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400 scale-[1.03] z-20'
                      : 'bg-white/90 hover:bg-white text-slate-700 border border-slate-200/80 hover:border-blue-300 shadow-2xs hover:shadow-xs'
                  }`}
                  title={`${q.name} (${q.desc}) - Click to focus in table`}
                >
                  <span className={`text-[11px] font-bold ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                    {q.short}
                  </span>
                  <span className={`text-[9px] ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                    {q.desc}
                  </span>
                  {recorded && (
                    <span
                      className={`absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center ${
                        isSelected ? 'bg-white text-blue-700' : 'bg-emerald-500 text-white'
                      }`}
                      title="Observation recorded"
                    >
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}
                </button>
              );
            })}

            {/* Central CTR Button Floating Exactly in Middle */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <button
                type="button"
                onClick={() => onSelectPosition(CENTER_POINT_DEF.name)}
                className={`pointer-events-auto w-14 h-14 rounded-full flex flex-col items-center justify-center transition-all shadow-md cursor-pointer ${
                  isCenterSelected
                    ? 'bg-blue-600 text-white border-2 border-white ring-4 ring-blue-300 scale-110 z-30'
                    : 'bg-slate-800 hover:bg-slate-900 text-white border-2 border-white hover:scale-105 z-20'
                }`}
                title="Center position datum point - Click to focus in table"
              >
                <span className="text-[11px] font-black tracking-tight leading-none">CTR</span>
                <span className="text-[8px] opacity-80 leading-none mt-0.5">Center</span>
                {centerRecorded && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center border border-white" title="Center recorded">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
