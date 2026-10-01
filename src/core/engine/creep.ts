import Decimal from 'decimal.js';
import {
  CreepEvaluationParams,
  CreepEvaluationResult,
  InvalidInputError,
  normalizeAccuracyClass,
} from '../types/metrology';
import { calculateMPE } from './mpe';

/**
 * Evaluates Creep and Zero Return tests under OIML R 76-1:2006 Clauses A.4.11.1 and A.4.11.2.
 *
 * Rules:
 *   1. Scope: Classes II, III, and IIII only. (Class I instruments are exempt).
 *   2. Load: Close to Max.
 *   3. Initial reading P0 recorded as soon as indication stabilizes after loading.
 *   4. Standard duration is 4 hours (240 minutes).
 *   5. Early termination after 30 minutes is permissible if and only if:
 *        |P(30 min) - P0| <= 0.5 * e   AND
 *        |P(30 min) - P(15 min)| <= 0.2 * e
 *   6. Full duration compliance (if 4 hours):
 *        |P(4 h) - P0| <= |MPE(Max)|
 *   7. Zero return (Clause A.4.11.2):
 *        Residual zero error upon load removal <= 0.5 * e
 *
 * @param params Creep observation points and instrument specifications.
 * @returns Comprehensive creep drift results, early termination status, and zero return compliance.
 */
export function evaluateCreep(params: CreepEvaluationParams): CreepEvaluationResult {
  const {
    accuracyClass,
    maxCapacity,
    appliedLoad,
    e,
    initialObservation,
    observations,
    zeroReturnObservation,
    rulePackVersion = 'R76-2006-v1',
  } = params;

  const canonicalClass = normalizeAccuracyClass(accuracyClass);

  if (canonicalClass === 'CLASS_I') {
    throw new InvalidInputError(
      'Creep test under OIML R 76-1 Clause A.4.11.1 is not applicable to Class I instruments.'
    );
  }

  const decMax = new Decimal(maxCapacity);
  const decLoad = new Decimal(appliedLoad);
  const decE = new Decimal(e);

  if (decMax.lte(0) || decE.lte(0) || decLoad.lte(0)) {
    throw new InvalidInputError('Capacities, verification intervals, and applied loads must be strictly positive.');
  }

  // 1. Calculate P0 for initial observation
  // P = I + 0.5 * e - delta_L
  const initialI = new Decimal(initialObservation.indication);
  const initialDL = new Decimal(initialObservation.additionalLoad_dL);
  const initialReading_P0 = initialI.plus(decE.times(0.5)).minus(initialDL);

  // 2. Process all observation points
  const points = observations.map((obs) => {
    const decI = new Decimal(obs.indication);
    const decDL = new Decimal(obs.additionalLoad_dL);
    const P = decI.plus(decE.times(0.5)).minus(decDL);
    const driftFromInitial = P.minus(initialReading_P0);

    return {
      elapsedMinutes: obs.elapsedMinutes,
      P,
      driftFromInitial,
      absDrift: driftFromInitial.abs(),
    };
  });

  // Sort observations chronologically by elapsedMinutes
  points.sort((a, b) => a.elapsedMinutes - b.elapsedMinutes);

  if (points.length === 0) {
    throw new InvalidInputError('At least one creep observation point must be provided.');
  }

  const evaluatedDurationMinutes = points[points.length - 1].elapsedMinutes;

  // 3. Find 15-minute and 30-minute observation points if present
  const obs15 = points.find((p) => Math.abs(p.elapsedMinutes - 15) < 1.0);
  const obs30 = points.find((p) => Math.abs(p.elapsedMinutes - 30) < 1.0);

  let earlyTerminationQualified = false;
  let delta30MinToInitial: Decimal | undefined = undefined;
  let delta30MinTo15Min: Decimal | undefined = undefined;

  const limit30To0 = decE.times(0.5); // 0.5 e
  const limit30To15 = decE.times(0.2); // 0.2 e

  if (obs30 && obs15) {
    delta30MinToInitial = obs30.P.minus(initialReading_P0).abs();
    delta30MinTo15Min = obs30.P.minus(obs15.P).abs();

    if (delta30MinToInitial.lte(limit30To0) && delta30MinTo15Min.lte(limit30To15)) {
      earlyTerminationQualified = true;
    }
  }

  // Evaluate whether test concluded early (at ~30 minutes)
  const earlyTerminatedAt30Min = evaluatedDurationMinutes <= 35 && earlyTerminationQualified;

  // Maximum permissible error at Max
  const mpeAtMax = calculateMPE({
    accuracyClass: canonicalClass,
    load: decMax,
    e: decE,
    rulePackVersion,
    allowExceedingMaxRange: true,
  });

  // Find max drift across all observed points
  let maxDriftFromInitial = new Decimal(0);
  for (const p of points) {
    if (p.absDrift.gt(maxDriftFromInitial)) {
      maxDriftFromInitial = p.absDrift;
    }
  }

  // 4. Creep Compliance Verdict
  let isCreepCompliant = false;

  if (earlyTerminatedAt30Min) {
    // If terminated at 30 min, early termination criteria define compliance
    isCreepCompliant = earlyTerminationQualified;
  } else if (evaluatedDurationMinutes >= 230) {
    // If ran for full 4 hours (~240 min), final drift must not exceed MPE(Max)
    const finalObs = points[points.length - 1];
    isCreepCompliant = finalObs.absDrift.lte(mpeAtMax.magnitude);
  } else {
    // Test ended between 35 min and 230 min without qualifying for early termination
    isCreepCompliant = false;
  }

  // 5. Zero return evaluation (Clause A.4.11.2)
  let zeroReturnResult = undefined;
  if (zeroReturnObservation) {
    const zI = new Decimal(zeroReturnObservation.indication);
    const zDL = new Decimal(zeroReturnObservation.additionalLoad_dL);
    const zero_P = zI.plus(decE.times(0.5)).minus(zDL);
    const residualError = zero_P.abs();
    const zeroReturnLimit = decE.times(0.5); // <= 0.5 e
    const isZeroReturnCompliant = residualError.lte(zeroReturnLimit);

    zeroReturnResult = {
      indication_P: zero_P,
      residualError,
      isCompliant: isZeroReturnCompliant,
    };
  }

  const overallCompliant = isCreepCompliant && (zeroReturnResult ? zeroReturnResult.isCompliant : true);

  return {
    initialReading_P0,
    evaluatedDurationMinutes,
    earlyTerminatedAt30Min,
    earlyTerminationQualified,
    delta30MinToInitial,
    delta30MinTo15Min,
    maxDriftFromInitial,
    mpeAtMax,
    isCreepCompliant,
    zeroReturn: zeroReturnResult,
    overallCompliant,
    clauseReference: 'A.4.11',
    ruleId: 'RULE_R76_2006_A411_CREEP',
  };
}
