import Decimal from 'decimal.js';
import {
  AccuracyClass,
  InstrumentGeometrySpec,
  InvalidInputError,
  normalizeAccuracyClass,
  PlannedLoadPoint,
  TestLoadPlan,
} from '../types/metrology';
import { RULE_PACK_REGISTRY } from '../rules/oiml-r76-2006';

/**
 * Generates an authoritative TestLoadPlan for the Initial Intrinsic Error
 * Weighing Performance test under OIML R 76-1:2006 Clause A.4.4.
 *
 * Rules:
 *   - At least 10 different test loads between Min and Max.
 *   - Must systematically include Min, Max, and points immediately below
 *     and at/above each Table 6 MPE transition boundary for the class.
 *   - Generated in both INCREASING and DECREASING directions.
 */
export function generateIntrinsicErrorLoadPlan(params: {
  accuracyClass: AccuracyClass | string;
  minCapacity: Decimal | number | string;
  maxCapacity: Decimal | number | string;
  e: Decimal | number | string;
  rulePackVersion?: string;
}): TestLoadPlan {
  const { accuracyClass, minCapacity, maxCapacity, e, rulePackVersion = 'R76-2006-v1' } = params;

  const canonicalClass = normalizeAccuracyClass(accuracyClass);
  const rulePack = RULE_PACK_REGISTRY[rulePackVersion];
  if (!rulePack) {
    throw new InvalidInputError(`Unsupported rule pack version: "${rulePackVersion}"`);
  }

  const decMin = new Decimal(minCapacity);
  const decMax = new Decimal(maxCapacity);
  const decE = new Decimal(e);

  if (decMin.lte(0) || decMax.lte(decMin) || decE.lte(0)) {
    throw new InvalidInputError('Invalid capacities or verification interval for load plan generation.');
  }

  const classSpec = rulePack.table6Rules[canonicalClass];
  const candidateLoadsInE = new Set<string>();

  // 1. Minimum capacity in e
  const minInE = decMin.dividedBy(decE);
  candidateLoadsInE.add(minInE.toFixed(1));

  // 2. Maximum capacity in e
  const maxInE = decMax.dividedBy(decE);
  candidateLoadsInE.add(maxInE.toFixed(1));

  // 3. Class transition boundary loads
  const deltaE = new Decimal('0.1'); // Boundary testing offset
  for (const tier of classSpec.tiers) {
    if (tier.maxMInE !== null) {
      const trans = tier.maxMInE;
      if (trans.gt(minInE) && trans.lt(maxInE)) {
        // Point below transition
        const below = trans.minus(deltaE);
        if (below.gt(minInE)) candidateLoadsInE.add(below.toFixed(1));

        // Exact transition point
        candidateLoadsInE.add(trans.toFixed(1));

        // Point above transition
        const above = trans.plus(deltaE);
        if (above.lt(maxInE)) candidateLoadsInE.add(above.toFixed(1));
      }
    }
  }

  // 4. Ensure at least 10 different load points by adding intermediate steps
  const sortedLoads = Array.from(candidateLoadsInE)
    .map((v) => new Decimal(v))
    .sort((a, b) => a.comparedTo(b));

  while (sortedLoads.length < 10) {
    // Find largest interval and bisect it
    let largestGap = new Decimal(0);
    let insertIndex = 1;

    for (let i = 0; i < sortedLoads.length - 1; i++) {
      const gap = sortedLoads[i + 1].minus(sortedLoads[i]);
      if (gap.gt(largestGap)) {
        largestGap = gap;
        insertIndex = i + 1;
      }
    }

    const midpoint = sortedLoads[insertIndex - 1].plus(sortedLoads[insertIndex]).dividedBy(2).round();
    sortedLoads.splice(insertIndex, 0, midpoint);
  }

  // 5. Construct increasing and decreasing planned points
  const points: PlannedLoadPoint[] = [];
  let stepIndex = 1;

  // Increasing direction
  for (const loadInE of sortedLoads) {
    const load = loadInE.times(decE);
    points.push({
      stepIndex: stepIndex++,
      load,
      loadInE,
      direction: 'INCREASING',
      targetMpeFactor: new Decimal(1.0),
      description: `Increasing load ${load.toString()} (${loadInE.toString()} e)`,
    });
  }

  // Decreasing direction (reverse of sorted loads)
  const reversedLoads = [...sortedLoads].reverse();
  for (const loadInE of reversedLoads) {
    const load = loadInE.times(decE);
    points.push({
      stepIndex: stepIndex++,
      load,
      loadInE,
      direction: 'DECREASING',
      targetMpeFactor: new Decimal(1.0),
      description: `Decreasing load ${load.toString()} (${loadInE.toString()} e)`,
    });
  }

  return {
    testCode: 'R76_WEIGH_INTRINSIC',
    clauseReference: 'A.4.4',
    points,
    totalObservations: points.length,
    metadata: {
      distinctLoadsCount: sortedLoads.length,
      accuracyClass: canonicalClass,
      minCapacity: decMin.toString(),
      maxCapacity: decMax.toString(),
      e: decE.toString(),
    },
  };
}

/**
 * Generates an authoritative TestLoadPlan for Eccentricity testing under
 * OIML R 76-1:2006 Clauses A.4.7.1 to A.4.7.5.
 *
 * Rules:
 *   - <= 4 points of support: 1/3 Max on each quarter segment (A.4.7.1)
 *   - > 4 points of support: 1/(N-1) Max over each support (A.4.7.2)
 *   - Special load receptors (tank/hopper): 1/10 Max at each support (A.4.7.3)
 *   - Rolling loads: Beginning, middle, end bidirectional per section (A.4.7.4)
 *   - Mobile scales: Designated positions under inclination (A.4.7.5)
 */
export function generateEccentricityLoadPlan(params: {
  maxCapacity: Decimal | number | string;
  e: Decimal | number | string;
  geometry: InstrumentGeometrySpec;
}): TestLoadPlan {
  const { maxCapacity, e, geometry } = params;

  const decMax = new Decimal(maxCapacity);
  const decE = new Decimal(e);
  const points: PlannedLoadPoint[] = [];
  let stepIndex = 1;

  if (geometry.receptorType === 'ROLLING_TRACK') {
    // Clause A.4.7.4 — Rolling loads
    const rollingLoad = decMax.times(0.5); // Standard rolling load fraction
    const sections = geometry.numberOfReceptorSections ?? 1;
    const isBidir = geometry.isBidirectionalTraffic ?? false;

    for (let s = 1; s <= sections; s++) {
      const sectionPrefix = sections > 1 ? `Section ${s}: ` : '';

      // Forward direction: Beginning -> Middle -> End
      const positions = ['Beginning of receptor', 'Middle of receptor', 'End of receptor'];
      for (const pos of positions) {
        points.push({
          stepIndex: stepIndex++,
          load: rollingLoad,
          loadInE: rollingLoad.dividedBy(decE),
          direction: 'FORWARD',
          location: `${sectionPrefix}${pos}`,
          targetMpeFactor: new Decimal(1.0),
          description: `${sectionPrefix}${pos} in normal driving direction`,
        });
      }

      // Reverse direction if bidirectional
      if (isBidir) {
        const reversePositions = ['End of receptor (reverse)', 'Middle of receptor (reverse)', 'Beginning of receptor (reverse)'];
        for (const pos of reversePositions) {
          points.push({
            stepIndex: stepIndex++,
            load: rollingLoad,
            loadInE: rollingLoad.dividedBy(decE),
            direction: 'REVERSE',
            location: `${sectionPrefix}${pos}`,
            targetMpeFactor: new Decimal(1.0),
            description: `${sectionPrefix}${pos} in reverse driving direction`,
          });
        }
      }
    }

    return {
      testCode: 'R76_ECC_ROLLING',
      clauseReference: 'A.4.7.4',
      points,
      totalObservations: points.length,
      metadata: { receptorType: geometry.receptorType, sections, isBidir },
    };
  }

  if (geometry.receptorType === 'SPECIAL_TANK_HOPPER') {
    // Clause A.4.7.3 — Special load receptors: 1/10 Max at each support
    const testLoad = decMax.times(0.1);
    const n = Math.max(geometry.numberOfSupportPoints, 3);

    for (let i = 1; i <= n; i++) {
      points.push({
        stepIndex: stepIndex++,
        load: testLoad,
        loadInE: testLoad.dividedBy(decE),
        direction: 'STATIC',
        location: `Support Point ${i}`,
        targetMpeFactor: new Decimal(1.0),
        description: `Special receptor 1/10 Max load over Support Point ${i}`,
      });
    }

    return {
      testCode: 'R76_ECC_WEIGHTS',
      clauseReference: 'A.4.7.3',
      points,
      totalObservations: points.length,
      metadata: { receptorType: geometry.receptorType, supportPoints: n },
    };
  }

  if (geometry.numberOfSupportPoints > 4) {
    // Clause A.4.7.2 — More than 4 points of support: 1/(N-1) Max
    const n = geometry.numberOfSupportPoints;
    const testLoad = decMax.dividedBy(n - 1);

    for (let i = 1; i <= n; i++) {
      points.push({
        stepIndex: stepIndex++,
        load: testLoad,
        loadInE: testLoad.dividedBy(decE),
        direction: 'STATIC',
        location: `Support Point ${i}`,
        targetMpeFactor: new Decimal(1.0),
        description: `1/(N-1) Max load over Support Point ${i} of ${n}`,
      });
    }

    return {
      testCode: 'R76_ECC_WEIGHTS',
      clauseReference: 'A.4.7.2',
      points,
      totalObservations: points.length,
      metadata: { numberOfSupportPoints: n },
    };
  }

  // Clause A.4.7.1 — Standard load receptor with <= 4 points of support: 1/3 Max
  const testLoad = decMax.dividedBy(3);
  const quadrants = [
    'Center position',
    'Quarter 1: Front-Left',
    'Quarter 2: Front-Right',
    'Quarter 3: Back-Right',
    'Quarter 4: Back-Left',
  ];

  for (const quad of quadrants) {
    points.push({
      stepIndex: stepIndex++,
      load: testLoad,
      loadInE: testLoad.dividedBy(decE),
      direction: 'STATIC',
      location: quad,
      targetMpeFactor: new Decimal(1.0),
      description: `1/3 Max load applied at ${quad}`,
    });
  }

  return {
    testCode: 'R76_ECC_WEIGHTS',
    clauseReference: 'A.4.7.1',
    points,
    totalObservations: points.length,
    metadata: { numberOfSupportPoints: geometry.numberOfSupportPoints, receptorType: geometry.receptorType },
  };
}

/**
 * Generates the temperature sequence under OIML R 76-1:2006 Clause A.5.3.
 *
 * Sequence:
 *   1. Reference temperature T_ref (20 °C or mean of limits for Class I)
 *   2. Specified High temperature T_high
 *   3. Specified Low temperature T_low
 *   4. Intermediate +5 °C point if T_low <= 0 °C (Clause A.5.3.1)
 *   5. Return to Reference temperature T_ref
 */
export function generateTemperatureTestSequence(params: {
  accuracyClass: AccuracyClass | string;
  specifiedTempMin?: Decimal | number | string;
  specifiedTempMax?: Decimal | number | string;
}): Array<{ stepNumber: number; targetTemperature: Decimal; description: string }> {
  const { accuracyClass, specifiedTempMin = -10, specifiedTempMax = 40 } = params;
  const canonicalClass = normalizeAccuracyClass(accuracyClass);

  const decTmin = new Decimal(specifiedTempMin);
  const decTmax = new Decimal(specifiedTempMax);

  // Derive reference temperature
  let refTemp = new Decimal(20);
  if (canonicalClass === 'CLASS_I') {
    // For Class I, mean of specified limits
    refTemp = decTmin.plus(decTmax).dividedBy(2);
  }

  const sequence: Array<{ stepNumber: number; targetTemperature: Decimal; description: string }> = [];
  let step = 1;

  // 1. Initial Reference Temperature
  sequence.push({
    stepNumber: step++,
    targetTemperature: refTemp,
    description: `Initial Reference Temperature (${refTemp.toString()} °C)`,
  });

  // 2. High Temperature
  sequence.push({
    stepNumber: step++,
    targetTemperature: decTmax,
    description: `Specified High Temperature (${decTmax.toString()} °C)`,
  });

  // 3. Low Temperature
  sequence.push({
    stepNumber: step++,
    targetTemperature: decTmin,
    description: `Specified Low Temperature (${decTmin.toString()} °C)`,
  });

  // 4. Intermediate +5 °C point if Low <= 0 °C (Clause A.5.3.1)
  if (decTmin.lte(0)) {
    sequence.push({
      stepNumber: step++,
      targetTemperature: new Decimal(5),
      description: `Intermediate Temperature (+5 °C per Clause A.5.3.1)`,
    });
  }

  // 5. Return to Reference Temperature
  sequence.push({
    stepNumber: step++,
    targetTemperature: refTemp,
    description: `Return to Reference Temperature (${refTemp.toString()} °C)`,
  });

  return sequence;
}
