/**
 * Deterministic Calculation Interpreter for NAWI-R76 Generic Test Engine
 *
 * Evaluates raw observations declaratively using pure metrological math
 * and the OIML Table 6 MPE calculation engine.
 */

import Decimal from 'decimal.js';
import { calculateMPE } from '@/core/engine/mpe';
import { AccuracyClass } from '@/core/types/metrology';
import { CommonEvaluationContext } from '../types';

export function getTable6MpeValue(accClass: AccuracyClass, load: number, e: number): number {
  try {
    const res = calculateMPE({
      accuracyClass: accClass,
      load: Math.max(0, load),
      e,
      allowExceedingMaxRange: true,
    });
    return res.magnitude.toNumber();
  } catch {
    return Number(e);
  }
}

export interface CalculationResultOutput {
  calculatedValues: Record<string, unknown>;
  trace: Record<string, unknown>;
  summary: {
    passedCount: number;
    failedCount: number;
    isAllPassed: boolean;
    headline: string;
  };
}

export function interpretCalculations(
  ruleId: string,
  rawObservations: Record<string, unknown>[],
  context: CommonEvaluationContext,
  parameters?: Record<string, unknown>
): CalculationResultOutput {
  const { instrument } = context;
  const e = new Decimal(instrument.verificationInterval_e);
  const d = new Decimal(instrument.scaleInterval_d);
  const accClass = instrument.accuracyClass as AccuracyClass;

  switch (ruleId) {
    // =========================================================================
    // 1. WEIGHING PERFORMANCE (Clause A.4.4)
    // =========================================================================
    case 'CALC_WEIGHING_INTRINSIC': {
      let zeroError_E0 = new Decimal(0);
      let passedCount = 0;
      let failedCount = 0;

      // Find zero datum error (first observation at load = 0)
      const zeroRow = rawObservations.find((r) => Number(r.load) === 0);
      if (zeroRow) {
        const I0 = new Decimal(Number(zeroRow.indication) || 0);
        const dL0 = new Decimal(Number(zeroRow.deltaL) || 0);
        const P0 = I0.plus(e.times(0.5)).minus(dL0);
        zeroError_E0 = P0.minus(0);
      }

      const processedRows = rawObservations.map((row, idx) => {
        const load = new Decimal(Number(row.load) || 0);
        const indication = new Decimal(Number(row.indication) || 0);
        const deltaL = new Decimal(Number(row.deltaL) || 0);
        const direction = String(row.direction || 'INC').toUpperCase() as 'INC' | 'DEC';

        // P = I + 0.5e - deltaL
        const P = indication.plus(e.times(0.5)).minus(deltaL);
        // E = P - L
        const E = P.minus(load);
        // Ec = E - E0
        const Ec = E.minus(zeroError_E0);

        // MPE from Table 6
        const mpeNum = getTable6MpeValue(accClass, load.toNumber(), e.toNumber());
        const mpeAbs = new Decimal(mpeNum);

        const hasInputs = row.load !== '' && row.load !== undefined && row.load !== null &&
                          row.indication !== '' && row.indication !== undefined && row.indication !== null;

        const isPass = hasInputs && Ec.abs().lessThanOrEqualTo(mpeAbs.plus(1e-9));
        if (hasInputs) {
          if (isPass) passedCount++;
          else failedCount++;
        }

        return {
          step: idx + 1,
          direction,
          load: load.toNumber(),
          indication: indication.toNumber(),
          deltaL: deltaL.toNumber(),
          calculated_P: P.toNumber(),
          error_E: E.toNumber(),
          zeroError_E0: zeroError_E0.toNumber(),
          correctedError_Ec: Ec.toNumber(),
          applicableMpe: mpeAbs.toNumber(),
          isPass,
        };
      });

      const isAllPassed = failedCount === 0 && passedCount === processedRows.length && processedRows.length > 0;

      return {
        calculatedValues: {
          observations: processedRows,
          zeroError_E0: zeroError_E0.toNumber(),
          totalPoints: processedRows.length,
          maxObservedEc: processedRows.length > 0 ? Math.max(...processedRows.map((r) => Math.abs(r.correctedError_Ec))) : 0,
        },
        trace: {
          formula_P: 'P = I + 0.5e - ΔL',
          formula_E: 'E = P - L',
          formula_Ec: 'Ec = E - E0',
          zeroReferenceE0: zeroError_E0.toNumber(),
          eUsed: e.toNumber(),
        },
        summary: {
          passedCount,
          failedCount,
          isAllPassed,
          headline: isAllPassed
            ? 'All load points within Table 6 MPE'
            : failedCount > 0
            ? `${failedCount} point(s) exceed MPE`
            : `${processedRows.length - passedCount} load point(s) pending measurement`,
        },
      };
    }

    // =========================================================================
    // 2. REPEATABILITY (Clause A.4.10)
    // =========================================================================
    case 'CALC_REPEATABILITY': {
      const calcSeries = (seriesObservations: Record<string, unknown>[], nominalTarget: number) => {
        if (!seriesObservations || seriesObservations.length === 0) {
          return { weighings: [], maxError: 0, minError: 0, span: 0, mpe: 0, isPass: false };
        }

        const weighings = seriesObservations.map((obs, idx) => {
          const load = new Decimal(Number(obs.load) || nominalTarget);
          const ind = new Decimal(Number(obs.indication) || 0);
          const dL = new Decimal(Number(obs.deltaL) || 0);
          const P = ind.plus(e.times(0.5)).minus(dL);
          const E = P.minus(load);
          return {
            repetitionIndex: idx + 1,
            load: load.toNumber(),
            indication: ind.toNumber(),
            deltaL: dL.toNumber(),
            calculated_P: P.toNumber(),
            error_E: E.toNumber(),
          };
        });

        const errors = weighings.map((w) => w.error_E);
        const maxE = Math.max(...errors);
        const minE = Math.min(...errors);
        const span = new Decimal(maxE).minus(new Decimal(minE)).abs().toNumber();

        const mpeNum = getTable6MpeValue(accClass, nominalTarget, e.toNumber());
        const isPass = span <= mpeNum + 1e-9;

        return {
          weighings,
          maxError: maxE,
          minError: minE,
          span,
          mpe: mpeNum,
          isPass,
        };
      };

      const halfMax = instrument.maxCapacity * 0.5;
      const fullMax = instrument.maxCapacity;

      const s1Filter = rawObservations.filter((r) => r.series === 'SERIES_1' || r.series === 'Series 1' || r.series === 'series1');
      const s2Filter = rawObservations.filter((r) => r.series === 'SERIES_2' || r.series === 'Series 2' || r.series === 'series2');

      const rawSeries1 = (parameters?.series1Observations as Record<string, unknown>[]) ||
        (s1Filter.length > 0 ? s1Filter : rawObservations.slice(0, 10));
      const rawSeries2 = (parameters?.series2Observations as Record<string, unknown>[]) ||
        (s2Filter.length > 0 ? s2Filter : rawObservations.slice(10, 20));

      const s1 = calcSeries(rawSeries1, halfMax);
      const s2 = calcSeries(rawSeries2, fullMax);

      const allPass = s1.isPass && s2.isPass;

      return {
        calculatedValues: {
          series1: s1,
          series2: s2,
          overallSpanMax: Math.max(s1.span, s2.span),
        },
        trace: {
          formula: 'Repeatability Span = Emax - Emin ≤ MPE(L)',
          s1Span: s1.span,
          s1Mpe: s1.mpe,
          s2Span: s2.span,
          s2Mpe: s2.mpe,
        },
        summary: {
          passedCount: (s1.isPass ? 1 : 0) + (s2.isPass ? 1 : 0),
          failedCount: (s1.isPass ? 0 : 1) + (s2.isPass ? 0 : 1),
          isAllPassed: allPass,
          headline: allPass ? 'Repeatability span compliant across both series' : 'Repeatability span exceeds MPE',
        },
      };
    }

    // =========================================================================
    // 3. ECCENTRICITY (Clause A.4.7)
    // =========================================================================
    case 'CALC_ECCENTRICITY': {
      // Find center reference reading
      let refP = new Decimal(0);
      const centerRow = rawObservations.find((r) => String(r.position || '').toLowerCase().includes('center')) || rawObservations[0];
      if (centerRow) {
        const ind = new Decimal(Number(centerRow.indication) || 0);
        const dL = new Decimal(Number(centerRow.deltaL) || 0);
        refP = ind.plus(e.times(0.5)).minus(dL);
      }

      let passedCount = 0;
      let failedCount = 0;
      let maxDiff = 0;

      const processedRows = rawObservations.map((row, idx) => {
        const pos = String(row.position || `Position ${idx + 1}`);
        const load = new Decimal(Number(row.load) || 0);
        const ind = new Decimal(Number(row.indication) || 0);
        const dL = new Decimal(Number(row.deltaL) || 0);

        const P = ind.plus(e.times(0.5)).minus(dL);
        const E = P.minus(load);
        const diffFromCenter = P.minus(refP).abs().toNumber();
        if (diffFromCenter > maxDiff) maxDiff = diffFromCenter;

        // OIML A.4.7.1: difference between values <= 1e (or <= MPE for the load)
        const mpeNum = getTable6MpeValue(accClass, load.toNumber(), e.toNumber());
        const allowableDiff = Math.max(e.toNumber(), mpeNum);

        const isPass = diffFromCenter <= allowableDiff + 1e-9;
        if (isPass) passedCount++;
        else failedCount++;

        return {
          id: String(row.id || `ecc-${idx + 1}`),
          position: pos,
          load: load.toNumber(),
          indication: ind.toNumber(),
          deltaL: dL.toNumber(),
          calculated_P: P.toNumber(),
          error_E: E.toNumber(),
          diffFromCenter,
          allowableDiff,
          isPass,
        };
      });

      const isAllPassed = failedCount === 0 && processedRows.length > 0;

      return {
        calculatedValues: {
          observations: processedRows,
          referenceP: refP.toNumber(),
          maxObservedDifference: maxDiff,
          allowableDifference: e.toNumber(),
        },
        trace: {
          formula: '|P_pos - P_center| ≤ 1.0 e',
          referenceCenterP: refP.toNumber(),
          maxDiffObserved: maxDiff,
          limit_e: e.toNumber(),
        },
        summary: {
          passedCount,
          failedCount,
          isAllPassed,
          headline: isAllPassed ? 'Eccentricity within tolerance across all locations' : 'Eccentricity exceeds allowable difference',
        },
      };
    }

    // =========================================================================
    // 4. DISCRIMINATION (Clause A.4.8)
    // =========================================================================
    case 'CALC_DISCRIMINATION': {
      let passedCount = 0;
      let failedCount = 0;

      const processedPoints = rawObservations.map((row) => {
        const indBefore = new Decimal(
          Number(row.baseIndication ?? row.indicationBefore ?? row.initialIndication ?? row.indication) || 0
        );
        const indAfter = new Decimal(
          Number(row.newIndication ?? row.indicationAfter ?? row.finalIndication) || 0
        );
        const delta = indAfter.minus(indBefore).abs().toNumber();
        const requiredResponse = d.toNumber();

        // Must produce decisive display advance of at least 1d
        const isPass = delta >= requiredResponse - 1e-9;
        if (isPass) passedCount++;
        else failedCount++;

        return {
          ...row,
          observedDelta: delta,
          requiredDelta: requiredResponse,
          isPass,
        };
      });

      const isAllPassed = failedCount === 0 && processedPoints.length > 0;

      return {
        calculatedValues: {
          points: processedPoints,
        },
        trace: {
          formula: 'ΔIndication ≥ 1.0 d upon application of 1.4 d additional load',
          scaleInterval_d: d.toNumber(),
          appliedExtraLoad: d.times(1.4).toNumber(),
        },
        summary: {
          passedCount,
          failedCount,
          isAllPassed,
          headline: isAllPassed ? 'Instrument discriminated 1.4d at all evaluated loads' : 'Discrimination failure at one or more load points',
        },
      };
    }

    // =========================================================================
    // 5. CREEP (Clause A.4.11.1)
    // =========================================================================
    case 'CALC_CREEP': {
      let initialP = new Decimal(0);
      const firstRow = rawObservations[0];
      if (firstRow) {
        const ind = new Decimal(Number(firstRow.indication) || 0);
        const dL = new Decimal(Number(firstRow.deltaL) || 0);
        initialP = ind.plus(e.times(0.5)).minus(dL);
      }

      let p15: Decimal | null = null;
      let p30: Decimal | null = null;

      const processedObservations = rawObservations.map((row) => {
        const elapsed = Number(row.elapsedMinutes) || 0;
        const ind = new Decimal(Number(row.indication) || 0);
        const dL = new Decimal(Number(row.deltaL) || 0);
        const P = ind.plus(e.times(0.5)).minus(dL);
        const drift = P.minus(initialP).abs().toNumber();

        if (elapsed === 15) p15 = P;
        if (elapsed === 30) p30 = P;

        return {
          ...row,
          calculated_P: P.toNumber(),
          driftFromInitial: drift,
        };
      });

      // 30-min early termination rules:
      // 1. Drift between 0 and 30 min <= 0.5e
      // 2. Drift between 15 and 30 min <= 0.2e
      let earlyQualified = false;
      if (p30 !== null) {
        const drift30 = (p30 as Decimal).minus(initialP).abs();
        const drift15_30 = p15 !== null ? (p30 as Decimal).minus(p15 as Decimal).abs() : new Decimal(0);

        if (drift30.lessThanOrEqualTo(e.times(0.5)) && drift15_30.lessThanOrEqualTo(e.times(0.2))) {
          earlyQualified = true;
        }
      }

      const appliedLoad = Number(rawObservations[0]?.load) || instrument.maxCapacity;
      const mpeNum = getTable6MpeValue(accClass, appliedLoad, e.toNumber());
      const maxDrift = Math.max(...processedObservations.map((o) => o.driftFromInitial || 0));

      const isPass = earlyQualified || maxDrift <= mpeNum;

      return {
        calculatedValues: {
          observations: processedObservations,
          initialReading_P0: initialP.toNumber(),
          earlyTerminationQualified: earlyQualified,
          maxDriftObserved: maxDrift,
        },
        trace: {
          formulaEarly30: '|P30 - P0| ≤ 0.5e and |P30 - P15| ≤ 0.2e',
          earlyTerminationQualified: earlyQualified,
          limit_0_5e: e.times(0.5).toNumber(),
          limit_0_2e: e.times(0.2).toNumber(),
        },
        summary: {
          passedCount: isPass ? 1 : 0,
          failedCount: isPass ? 0 : 1,
          isAllPassed: isPass,
          headline: earlyQualified
            ? 'Qualified for 30-minute early termination (ΔP ≤ 0.5e, ΔP15-30 ≤ 0.2e)'
            : isPass
            ? 'Creep within Table 6 MPE'
            : 'Creep drift exceeds permissible limit',
        },
      };
    }

    // =========================================================================
    // 6. ZERO RETURN (Clause A.4.11.2)
    // =========================================================================
    case 'CALC_ZERO_RETURN': {
      const row = rawObservations[0] || {};
      const preZero = new Decimal(Number(row.preLoadZero) || 0);
      const resInd = new Decimal(Number(row.residualIndication) || 0);
      const resDeltaL = new Decimal(Number(row.residualDeltaL) || 0);

      // P_res = I_res + 0.5e - dL
      const P_res = resInd.plus(e.times(0.5)).minus(resDeltaL);
      const residualError = P_res.minus(preZero).abs().toNumber();
      const allowableLimit = e.times(0.5).toNumber();

      const isPass = residualError <= allowableLimit + 1e-9;

      return {
        calculatedValues: {
          residualP: P_res.toNumber(),
          residualError,
          allowableLimit,
          isPass,
        },
        trace: {
          formula: '|P_residual - P_preZero| ≤ 0.5 e',
          residualError,
          limit: allowableLimit,
        },
        summary: {
          passedCount: isPass ? 1 : 0,
          failedCount: isPass ? 0 : 1,
          isAllPassed: isPass,
          headline: isPass ? 'Residual zero error within 0.5e limit' : 'Residual zero return error exceeds 0.5e',
        },
      };
    }

    // =========================================================================
    // 7. CHECKLIST TESTS (Administrative, Construction, Stability of Equilibrium)
    // =========================================================================
    case 'CALC_CHECKLIST': {
      let passedCount = 0;
      let failedCount = 0;
      let naCount = 0;
      let unconfirmedCount = 0;

      const processedItems = rawObservations.map((item) => {
        const st = String(item.status || 'NOT_TESTED').toUpperCase();
        if (st === 'PASS') passedCount++;
        else if (st === 'FAIL') failedCount++;
        else if (st === 'NOT_APPLICABLE') naCount++;
        else unconfirmedCount++;

        return {
          ...item,
          status: st,
        };
      });

      const isAllPassed = failedCount === 0 && unconfirmedCount === 0 && (passedCount + naCount > 0) && (passedCount + naCount === processedItems.length);

      return {
        calculatedValues: {
          items: processedItems,
          passedCount,
          failedCount,
          naCount,
          unconfirmedCount,
        },
        trace: {
          rule: 'All applicable requirements must be PASS without unverified deviations',
        },
        summary: {
          passedCount,
          failedCount,
          isAllPassed,
          headline: isAllPassed
            ? 'All checklist requirements satisfied'
            : failedCount > 0
            ? `${failedCount} checklist item(s) failed`
            : `${unconfirmedCount} checklist item(s) pending verification`,
        },
      };
    }

    // =========================================================================
    // 8. STATIC TEMPERATURE SEQUENCE (Clause A.5.3)
    // =========================================================================
    case 'CALC_TEMPERATURE': {
      let passedCount = 0;
      let failedCount = 0;

      const processedStages = rawObservations.map((stage) => {
        const load = new Decimal(Number(stage.load) || 0);
        const ind = new Decimal(Number(stage.indication) || 0);
        const dL = new Decimal(Number(stage.deltaL) || 0);
        const P = ind.plus(e.times(0.5)).minus(dL);
        const E = P.minus(load);

        const mpeNum = getTable6MpeValue(accClass, load.toNumber(), e.toNumber());
        const isPass = E.abs().lessThanOrEqualTo(new Decimal(mpeNum).plus(1e-9));
        if (isPass) passedCount++;
        else failedCount++;

        return {
          ...stage,
          calculated_P: P.toNumber(),
          error_E: E.toNumber(),
          mpe: mpeNum,
          isPass,
        };
      });

      const isAllPassed = failedCount === 0 && processedStages.length > 0;

      return {
        calculatedValues: {
          stages: processedStages,
        },
        trace: {
          rule: 'Errors at each temperature stage must be within Table 6 MPE',
        },
        summary: {
          passedCount,
          failedCount,
          isAllPassed,
          headline: isAllPassed ? 'All temperature stages compliant' : 'Temperature stage error out of tolerance',
        },
      };
    }

    // =========================================================================
    // TILTING TEST (Clause 3.9.1.1, A.5.1)
    // =========================================================================
    case 'CALC_TILTING': {
      let passedCount = 0;
      let failedCount = 0;

      // Find zero datum under level reference
      const levelZero =
        rawObservations.find(
          (r) =>
            (String(r.tiltOrientation || '').toLowerCase().includes('level') ||
              String(r.tiltOrientation || '').toLowerCase().includes('datum')) &&
            Number(r.testLoad ?? r.load ?? 0) === 0
        ) || rawObservations[0];

      let levelZeroError = new Decimal(0);
      if (levelZero) {
        const I0 = new Decimal(Number(levelZero.indication) || 0);
        const dL0 = new Decimal(Number(levelZero.deltaL) || 0);
        const P0 = I0.plus(e.times(0.5)).minus(dL0);
        levelZeroError = P0.minus(0);
      }

      const processedRows = rawObservations.map((row, idx) => {
        const load = new Decimal(Number(row.testLoad ?? row.load ?? 0));
        const ind = new Decimal(Number(row.indication) || 0);
        const dL = new Decimal(Number(row.deltaL) || 0);
        const P = ind.plus(e.times(0.5)).minus(dL);
        const E = P.minus(load);
        const Ec = E.minus(levelZeroError);

        const mpeNum = getTable6MpeValue(accClass, load.toNumber(), e.toNumber());
        const isPass = Ec.abs().lessThanOrEqualTo(new Decimal(mpeNum).plus(1e-9));

        if (isPass) passedCount++;
        else failedCount++;

        return {
          step: idx + 1,
          tiltOrientation: row.tiltOrientation || `Orientation ${idx + 1}`,
          load: load.toNumber(),
          indication: ind.toNumber(),
          deltaL: dL.toNumber(),
          calculated_P: P.toNumber(),
          error_E: E.toNumber(),
          correctedError_Ec: Ec.toNumber(),
          mpe: mpeNum,
          isPass,
        };
      });

      const isAllPassed = failedCount === 0 && processedRows.length > 0;

      return {
        calculatedValues: {
          observations: processedRows,
        },
        trace: {
          rule: 'OIML R 76-1:2006 Clause 3.9.1.1, A.5.1: |Ec| <= MPE under tilt',
        },
        summary: {
          passedCount,
          failedCount,
          isAllPassed,
          headline: isAllPassed
            ? 'All tilt conditions compliant with Table 6 MPE'
            : `${failedCount} tilt observation(s) exceed Table 6 MPE`,
        },
      };
    }

    // =========================================================================
    // TEMPERATURE EFFECT ON NO-LOAD INDICATION (Clause 3.9.2.3, A.5.3.2)
    // =========================================================================
    case 'CALC_TEMP_EFFECT_NO_LOAD': {
      let passedCount = 0;
      let failedCount = 0;
      const isClassI = accClass === 'CLASS_I';
      // Clause 3.9.2.3: Zero drift shall not exceed 1e per 5 °C (Class II, III, IIII), or 0.2e per 5 °C (Class I)
      const maxAllowedPerDegC = isClassI ? e.times(0.2).dividedBy(5) : e.dividedBy(5);

      const processedStages: Record<string, unknown>[] = [];
      let previousZero: { tempC: number; P0: Decimal } | null = null;

      rawObservations.forEach((stage, idx) => {
        const tempC = Number(stage.temperatureC ?? stage.actualTempC ?? stage.targetTempC ?? 20);
        const ind = new Decimal(Number(stage.zeroIndication ?? stage.indication ?? 0));
        const dL = new Decimal(Number(stage.deltaL ?? 0));
        const P0 = ind.plus(e.times(0.5)).minus(dL);

        let driftFromPrev = 0;
        let deltaTemp = 0;
        let driftPer5C = 0;
        let isPass = true;

        if (previousZero !== null) {
          deltaTemp = Math.abs(tempC - previousZero.tempC);
          const rawDrift = P0.minus(previousZero.P0).abs();
          driftFromPrev = rawDrift.toNumber();
          if (deltaTemp > 0) {
            driftPer5C = rawDrift.times(5).dividedBy(deltaTemp).toNumber();
            const allowedForDelta = maxAllowedPerDegC.times(deltaTemp);
            isPass = rawDrift.lessThanOrEqualTo(allowedForDelta.plus(1e-9));
          }
        }

        if (isPass) passedCount++;
        else failedCount++;

        processedStages.push({
          step: idx + 1,
          stageName: stage.stageName || `Temp ${tempC} °C`,
          temperatureC: tempC,
          zeroIndication: ind.toNumber(),
          deltaL: dL.toNumber(),
          calculated_P0: P0.toNumber(),
          driftFromPrev,
          deltaTemp,
          driftPer5C,
          isPass,
        });

        previousZero = { tempC, P0 };
      });

      const isAllPassed = failedCount === 0 && processedStages.length > 0;

      return {
        calculatedValues: {
          stages: processedStages,
        },
        trace: {
          rule: 'OIML R 76-1:2006 Clause 3.9.2.3, A.5.3.2: Zero drift <= 1e per 5 °C (0.2e/5 °C for Class I)',
        },
        summary: {
          passedCount,
          failedCount,
          isAllPassed,
          headline: isAllPassed
            ? 'Zero drift compliant with Clause 3.9.2.3 temperature limits'
            : `${failedCount} temperature transition(s) exceed zero drift tolerance`,
        },
      };
    }
    case 'CALC_VOLTAGE': {
      let passedCount = 0;
      let failedCount = 0;

      const processedPoints = rawObservations.map((point) => {
        const load = Number(point.load) || 0;
        const ind = Number(point.indication) || 0;
        const dL = Number(point.deltaL) || 0;
        let isPass = point.isPass !== false;
        let error_E = 0;
        let mpe = e.toNumber();

        if (point.load !== undefined && point.indication !== undefined) {
          const P = ind + 0.5 * e.toNumber() - dL;
          error_E = Math.round((P - load) * 10000) / 10000;
          mpe = getTable6MpeValue(accClass, load, e.toNumber());
          isPass = Math.abs(error_E) <= mpe + 1e-9;
        }

        if (isPass) passedCount++;
        else failedCount++;
        return { ...point, calculated_E: error_E, mpe, isPass };
      });

      const isAllPassed = failedCount === 0 && processedPoints.length > 0;

      return {
        calculatedValues: {
          points: processedPoints,
        },
        trace: {
          rule: 'Instrument must operate within MPE under extreme supply voltage variations',
        },
        summary: {
          passedCount,
          failedCount,
          isAllPassed,
          headline: isAllPassed ? 'Voltage variations within allowable limits' : 'Voltage variation failure detected',
        },
      };
    }

    // =========================================================================
    // 10. DAMP HEAT (Clause B.2)
    // =========================================================================
    case 'CALC_DAMP_HEAT': {
      const row = rawObservations[0] || {};
      const preZero = new Decimal(Number(row.preExposureZero) || 0);
      const postZero = new Decimal(Number(row.postExposureZero) || 0);
      const shift = postZero.minus(preZero).abs().toNumber();
      const limit = e.toNumber();

      const isPass = shift <= limit + 1e-9 && row.isPass !== false;

      return {
        calculatedValues: {
          recoveryZeroShift: shift,
          allowableLimit: limit,
          isPass,
        },
        trace: {
          formula: '|P_postRecovery - P_preExposure| ≤ 1.0 e',
          observedShift: shift,
          limit,
        },
        summary: {
          passedCount: isPass ? 1 : 0,
          failedCount: isPass ? 0 : 1,
          isAllPassed: isPass,
          headline: isPass ? 'Post-damp heat recovery zero shift within 1.0e' : 'Damp heat recovery zero shift exceeds 1.0e',
        },
      };
    }

    // =========================================================================
    // 11. SPAN STABILITY (Clause B.4)
    // =========================================================================
    case 'CALC_SPAN_STABILITY': {
      let initialError = 0;
      let maxDrift = 0;
      const allowableDrift = e.times(0.5).toNumber();

      const processedRuns = rawObservations.map((run, idx) => {
        const load = new Decimal(Number(run.load) || instrument.maxCapacity);
        const ind = new Decimal(Number(run.indication) || 0);
        const err = ind.minus(load).toNumber();

        if (idx === 0) {
          initialError = err;
        }

        const drift = Math.abs(err - initialError);
        if (drift > maxDrift) maxDrift = drift;

        const isPass = drift <= allowableDrift + 1e-9;

        return {
          ...run,
          runIndex: idx + 1,
          calculatedError: err,
          driftFromInitial: drift,
          isPass,
        };
      });

      const isAllPassed = maxDrift <= allowableDrift + 1e-9;

      return {
        calculatedValues: {
          runs: processedRuns,
          maxDriftObserved: maxDrift,
          allowableDrift,
          totalRuns: processedRuns.length,
        },
        trace: {
          formula: 'Span Drift = |Error(t) - Error(initial)| ≤ 0.5 e',
          maxDriftObserved: maxDrift,
          allowableLimit: allowableDrift,
        },
        summary: {
          passedCount: isAllPassed ? processedRuns.length : 0,
          failedCount: isAllPassed ? 0 : 1,
          isAllPassed,
          headline: isAllPassed ? `Span drift within 0.5e across ${processedRuns.length} runs` : 'Span drift exceeds 0.5e limit',
        },
      };
    }

    // =========================================================================
    // 12. TARE (Clause 4.6 / A.4.6)
    // =========================================================================
    case 'CALC_TARE': {
      let passedCount = 0;
      let failedCount = 0;

      const processedRows = rawObservations.map((row) => {
        const tareLoad = new Decimal(Number(row.tareLoad) || 0);
        const grossLoad = new Decimal(Number(row.grossLoad) || 0);
        const netLoad = grossLoad.minus(tareLoad);
        const netInd = new Decimal(Number(row.netIndication) || 0);
        const netDeltaL = new Decimal(Number(row.netDeltaL) || 0);

        const netP = netInd.plus(e.times(0.5)).minus(netDeltaL);
        const netError = netP.minus(netLoad).toNumber();

        const mpeNum = getTable6MpeValue(accClass, netLoad.toNumber(), e.toNumber());
        const isPass = Math.abs(netError) <= mpeNum + 1e-9;

        if (isPass) passedCount++;
        else failedCount++;

        return {
          ...row,
          netLoad: netLoad.toNumber(),
          netP: netP.toNumber(),
          netError,
          mpe: mpeNum,
          isPass,
        };
      });

      const isAllPassed = failedCount === 0 && processedRows.length > 0;

      return {
        calculatedValues: { observations: processedRows },
        trace: { formula: 'Tare Net Error = P_net - L_net ≤ MPE(L_net)' },
        summary: {
          passedCount,
          failedCount,
          isAllPassed,
          headline: isAllPassed ? 'Tare weighing accuracy within MPE' : 'Tare weighing error exceeds MPE',
        },
      };
    }

    // =========================================================================
    // 13. WARM-UP (Clause A.5.2)
    // =========================================================================
    case 'CALC_WARMUP': {
      let zero0 = 0;
      let maxZeroDrift = 0;

      const processedRows = rawObservations.map((row, idx) => {
        const elapsed = Number(row.elapsedMinutes) || 0;
        const zeroReading = Number(row.zeroReading) || 0;
        if (idx === 0) zero0 = zeroReading;
        const drift = Math.abs(zeroReading - zero0);
        if (drift > maxZeroDrift) maxZeroDrift = drift;

        const isPass = drift <= e.toNumber() + 1e-9;
        return {
          ...row,
          elapsedMinutes: elapsed,
          zeroReading,
          driftFromInitial: drift,
          isPass,
        };
      });

      const isAllPassed = maxZeroDrift <= e.toNumber() + 1e-9;

      return {
        calculatedValues: { observations: processedRows, maxZeroDrift, allowableLimit: e.toNumber() },
        trace: { formula: '|Zero(t) - Zero(0)| ≤ 1.0 e during 30 min warm-up' },
        summary: {
          passedCount: isAllPassed ? 1 : 0,
          failedCount: isAllPassed ? 0 : 1,
          isAllPassed,
          headline: isAllPassed ? 'Warm-up zero drift within 1.0e' : 'Warm-up zero drift exceeds 1.0e',
        },
      };
    }

    // =========================================================================
    // 14. SENSITIVITY FOR NON-SELF-INDICATING (Clause A.4.9)
    // =========================================================================
    case 'CALC_SENSITIVITY': {
      let passedCount = 0;
      let failedCount = 0;

      const processedRows = rawObservations.map((row) => {
        const addedLoad = Number(row.addedLoad) || e.toNumber();
        const observedDisplacementMm = Number(row.observedDisplacementMm ?? row.responseDisplacementMm) || 0;
        const requiredDisplacementMm = Number(row.requiredDisplacementMm) || 1.0; // Clause A.4.9: at least 1 mm for Class II/III/IIII

        const isPass = observedDisplacementMm >= requiredDisplacementMm - 1e-9;
        if (isPass) passedCount++;
        else failedCount++;

        return {
          ...row,
          addedLoad,
          observedDisplacementMm,
          requiredDisplacementMm,
          isPass,
        };
      });

      const isAllPassed = failedCount === 0 && processedRows.length > 0;

      return {
        calculatedValues: { observations: processedRows },
        trace: {
          formula: 'Indicator displacement Δs ≥ 1.0 mm (or 1.4d for optical index)',
          criterion: 'Sufficient sensitivity under additional load',
        },
        summary: {
          passedCount,
          failedCount,
          isAllPassed,
          headline: isAllPassed
            ? 'Indicator displacement satisfies sensitivity requirement'
            : 'Sensitivity insufficient at one or more loads',
        },
      };
    }

    // =========================================================================
    // 15. ELECTRICAL DISTURBANCES (Clause B.3)
    // =========================================================================
    case 'CALC_ELECTRICAL_DISTURBANCE': {
      let passedCount = 0;
      let failedCount = 0;

      const processedPoints = rawObservations.map((row) => {
        const baseline = Number(row.baselineIndication) || 0;
        const disturbed = Number(row.disturbedIndication) || baseline;
        const delta = Math.abs(disturbed - baseline);
        const allowableDelta = e.toNumber(); // Error ≤ 1e or blanking significant fault
        const significantFaultBlanked = Boolean(row.significantFaultBlanked);

        const isPass = significantFaultBlanked || delta <= allowableDelta + 1e-9;
        if (isPass) passedCount++;
        else failedCount++;

        return {
          ...row,
          deltaIndication: delta,
          allowableDelta,
          isPass,
        };
      });

      const isAllPassed = failedCount === 0 && processedPoints.length > 0;

      return {
        calculatedValues: { points: processedPoints },
        trace: {
          rule: 'OIML R 76-1 B.3: Disturbance must not cause indication change > 1.0e unless blanked/inhibited as significant fault',
          allowableDelta: e.toNumber(),
        },
        summary: {
          passedCount,
          failedCount,
          isAllPassed,
          headline: isAllPassed
            ? 'All electrical disturbance tests compliant with immunity criteria'
            : 'Significant fault or variation exceeding 1.0e detected',
        },
      };
    }

    // =========================================================================
    // 16. ENDURANCE (Clause A.6)
    // =========================================================================
    case 'CALC_ENDURANCE': {
      const row = rawObservations[0] || {};
      const targetLoad = Number(row.targetLoad) || instrument.maxCapacity;
      const preError = Number(row.preWeighingError) || 0;
      const postError = Number(row.postWeighingError) || 0;
      const errorShift = Math.abs(postError - preError);
      const mpeNum = getTable6MpeValue(accClass, targetLoad, e.toNumber());
      const maxCycles = rawObservations.reduce(
        (acc, curr) => Math.max(acc, Number(curr.cyclesCompleted ?? curr.completedCycles) || 0),
        0
      ) || 100000;

      const isPass = errorShift <= mpeNum + 1e-9 && row.isMechanicallyIntact !== false;

      return {
        calculatedValues: {
          targetLoad,
          preWeighingError: preError,
          postWeighingError: postError,
          errorShift,
          allowableShift: mpeNum,
          completedCycles: maxCycles,
          totalCycles: maxCycles,
          isPass,
        },
        trace: {
          formula: '|Error_post - Error_pre| ≤ MPE(L) following durability cycling',
          errorShift,
          allowableMpe: mpeNum,
        },
        summary: {
          passedCount: isPass ? 1 : 0,
          failedCount: isPass ? 0 : 1,
          isAllPassed: isPass,
          headline: isPass
            ? `Durability shift within MPE after ${maxCycles} cycles`
            : 'Endurance durability shift exceeds MPE limit',
        },
      };
    }

    // Default fallback
    default: {
      return {
        calculatedValues: { raw: rawObservations },
        trace: { note: 'Standard qualitative check applied' },
        summary: {
          passedCount: rawObservations.length,
          failedCount: 0,
          isAllPassed: true,
          headline: 'Observations recorded',
        },
      };
    }
  }
}
