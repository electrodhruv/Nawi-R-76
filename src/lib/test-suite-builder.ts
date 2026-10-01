/**
 * Test Suite Generator for NAWI-R76
 *
 * Constructs the complete suite of applicable OIML R 76-1 tests for any
 * registered instrument, populating realistic observations and calculating
 * authoritative results via the frozen metrology engine.
 */

import Decimal from 'decimal.js';
import { RegisteredInstrument } from './synthetic-instruments';
import {
  TestSuiteItem,
  WeighingObsPoint,
  EccentricityObsPoint,
  DiscriminationPoint,
  RepeatabilityWeighing,
  CreepTimePoint,
  ChecklistItem,
  EquilibriumCheckItem,
  TemperatureStage,
  VoltageConditionPoint,
  SpanStabilityRun,
} from './test-suite-types';
import { calculateTurningPoint } from '@/core/engine/turning-points';
import { getRequiredRepeatabilityCount } from '@/core/engine/repeatability';

export function buildInitialTestSuite(instrument: RegisteredInstrument): TestSuiteItem[] {
  const e = instrument.verificationInterval_e;
  const d = instrument.scaleInterval_d;
  const max = instrument.maxCapacity;
  const min = instrument.minCapacity;
  const halfMax = max / 2;
  const isFailed = Boolean(instrument.hasFailedSample);
  const isClassI = instrument.accuracyClass === 'CLASS_I';

  const powerStr = instrument.powerSupply.toLowerCase();
  const hasAcMains = powerStr.includes('ac') || powerStr.includes('230') || powerStr.includes('mains');
  const hasBattery = powerStr.includes('battery');

  // ==========================================================================
  // 1. Administrative & Markings Examination (Clause 3.10, 4.1)
  // ==========================================================================
  const adminItems: ChecklistItem[] = [
    {
      id: 'adm-1',
      clause: '3.10.1',
      requirement: 'Manufacturer identification & model designation indelibly marked',
      observation: `Verified: "${instrument.manufacturer}", Model: "${instrument.modelName}"`,
      status: 'PASS',
      remarks: 'Complies with mandatory descriptive markings.',
    },
    {
      id: 'adm-2',
      clause: '3.10.1',
      requirement: 'Serial number and year of manufacture clearly stamped on rating plate',
      observation: `Verified: "${instrument.serialNumber}" etched on stainless plate`,
      status: 'PASS',
      remarks: 'Serial number is unique and tamper-evident.',
    },
    {
      id: 'adm-3',
      clause: '3.10.1',
      requirement: 'Accuracy class inscribed in prescribed oval symbol',
      observation: `Marked: [ ${instrument.accuracyClass.replace('CLASS_', '')} ]`,
      status: 'PASS',
    },
    {
      id: 'adm-4',
      clause: '3.10.1',
      requirement: 'Max, Min, and verification interval e marked near display',
      observation: `Max = ${max} ${instrument.primaryUnit}, Min = ${min} ${instrument.primaryUnit}, e = ${e} ${instrument.primaryUnit}`,
      status: 'PASS',
    },
    {
      id: 'adm-5',
      clause: '3.10.2',
      requirement: 'Verification seal and stamping area securely provisioned',
      observation: 'Lead wire sealing lug and destructible sticker position verified intact',
      status: 'PASS',
    },
  ];

  // ==========================================================================
  // 2. Technical Construction & Sealing (Clause 4.1–18)
  // ==========================================================================
  const constItems: ChecklistItem[] = [
    {
      id: 'con-1',
      clause: '4.1.2.2',
      requirement: 'Level indicator and adjustable leveling feet provided',
      observation: 'Spirit bubble level indicator visible through bezel with 4 screw-threaded feet',
      status: 'PASS',
    },
    {
      id: 'con-2',
      clause: '4.5',
      requirement: 'Zero-setting device range and zero-tracking within limits (±2% Max)',
      observation: 'Semi-automatic zero operates within 4% of Max range; zero tracking ≤ 0.5 e/s',
      status: 'PASS',
    },
    {
      id: 'con-3',
      clause: '4.6',
      requirement: 'Tare device subtraction accuracy and tare balance indication',
      observation: `Subtractive tare operates over 0 to ${Math.round(max * 0.4)} ${instrument.primaryUnit} with NET annunciator`,
      status: 'PASS',
    },
    {
      id: 'con-4',
      clause: '4.17',
      requirement: 'Security sealing and calibration audit counter integrity',
      observation: `Hardware calibration switch secured by wire seal; audit counter increments on configuration entry (SW: ${instrument.softwareVersion})`,
      status: 'PASS',
    },
    {
      id: 'con-5',
      clause: '4.18',
      requirement: 'Software identification, checksum, and legally relevant module isolation',
      observation: `Firmware checksum verified against type approval documentation: v${instrument.softwareVersion}`,
      status: 'PASS',
    },
  ];

  // ==========================================================================
  // 3. Weighing Performance / Intrinsic Error (Clause A.4.4)
  // ==========================================================================
  let rawWeighingRows: WeighingObsPoint[] = [];
  if (isFailed) {
    // Failing specimen demo: error at Max exceeds Table 6 MPE
    rawWeighingRows = [
      { id: 'wp-1', step: 1, direction: 'INC', load: 0.0, indication: 0.0, deltaL: e * 0.5 },
      { id: 'wp-2', step: 2, direction: 'INC', load: min, indication: min, deltaL: e * 0.48 },
      { id: 'wp-3', step: 3, direction: 'INC', load: halfMax * 0.5, indication: halfMax * 0.5, deltaL: e * 0.52 },
      { id: 'wp-4', step: 4, direction: 'INC', load: halfMax, indication: halfMax, deltaL: e * 0.5 },
      { id: 'wp-5', step: 5, direction: 'INC', load: max * 0.75, indication: max * 0.75, deltaL: e * 0.4 },
      { id: 'wp-6', step: 6, direction: 'INC', load: max, indication: max + e * 3.0, deltaL: e * 0.2 }, // FAIL
      { id: 'wp-7', step: 7, direction: 'DEC', load: halfMax, indication: halfMax, deltaL: e * 0.5 },
      { id: 'wp-8', step: 8, direction: 'DEC', load: min, indication: min, deltaL: e * 0.5 },
      { id: 'wp-9', step: 9, direction: 'DEC', load: 0.0, indication: 0.0, deltaL: e * 0.5 },
    ];
  } else {
    // Realistic compliant demonstration
    rawWeighingRows = [
      { id: 'wp-1', step: 1, direction: 'INC', load: 0.0, indication: 0.0, deltaL: e * 0.5 },
      { id: 'wp-2', step: 2, direction: 'INC', load: min, indication: min, deltaL: e * 0.52 },
      { id: 'wp-3', step: 3, direction: 'INC', load: Math.round(halfMax * 0.5 * 1000) / 1000, indication: Math.round(halfMax * 0.5 * 1000) / 1000, deltaL: e * 0.46 },
      { id: 'wp-4', step: 4, direction: 'INC', load: Math.round(halfMax * 1000) / 1000, indication: Math.round(halfMax * 1000) / 1000, deltaL: e * 0.5 },
      { id: 'wp-5', step: 5, direction: 'INC', load: Math.round(max * 0.75 * 1000) / 1000, indication: Math.round(max * 0.75 * 1000) / 1000, deltaL: e * 0.48 },
      { id: 'wp-6', step: 6, direction: 'INC', load: max, indication: max, deltaL: e * 0.45 },
      { id: 'wp-7', step: 7, direction: 'DEC', load: Math.round(halfMax * 1000) / 1000, indication: Math.round(halfMax * 1000) / 1000, deltaL: e * 0.52 },
      { id: 'wp-8', step: 8, direction: 'DEC', load: Math.round(halfMax * 0.5 * 1000) / 1000, indication: Math.round(halfMax * 0.5 * 1000) / 1000, deltaL: e * 0.5 },
      { id: 'wp-9', step: 9, direction: 'DEC', load: min, indication: min, deltaL: e * 0.51 },
      { id: 'wp-10', step: 10, direction: 'DEC', load: 0.0, indication: 0.0, deltaL: e * 0.5 },
    ];
  }

  // Calculate points using the deterministic turning point engine
  const zeroPt = rawWeighingRows[0];
  const zeroCalc = calculateTurningPoint({
    load: zeroPt.load,
    indication: zeroPt.indication,
    additionalLoad_dL: zeroPt.deltaL,
    e,
  });
  const zeroError_E0 = zeroCalc.error_E;

  const evaluatedWeighingRows = rawWeighingRows.map((obs) => {
    const tp = calculateTurningPoint({
      load: obs.load,
      indication: obs.indication,
      additionalLoad_dL: obs.deltaL,
      e,
      zeroError_E0,
      accuracyClass: instrument.accuracyClass,
    });
    const mpeMag = tp.mpe?.magnitude ?? new Decimal(0);
    const isPass = tp.correctedError_Ec.abs().lte(mpeMag);
    return {
      ...obs,
      calculated_P: tp.calculated_P.toNumber(),
      error_E: tp.error_E.toNumber(),
      zeroError_E0: zeroError_E0.toNumber(),
      correctedError_Ec: tp.correctedError_Ec.toNumber(),
      applicableMpe: mpeMag.toNumber(),
      isPass,
    };
  });
  const weighingHasFailure = evaluatedWeighingRows.some((r) => !r.isPass);

  // ==========================================================================
  // 4. Eccentricity Test (Clause A.4.7)
  // ==========================================================================
  let eccObsPoints: EccentricityObsPoint[] = [];
  const eccLoad = Math.round((max / 3) * 1000) / 1000;

  if (instrument.receptorType === 'ROLLING_TRACK') {
    eccObsPoints = [
      { id: 'ecc-1', position: 'Beginning of rail', load: eccLoad, indication: eccLoad, deltaL: e * 0.5, calculated_P: eccLoad, error_E: 0, diffFromCenter: 0, isPass: true },
      { id: 'ecc-2', position: 'Middle of track', load: eccLoad, indication: eccLoad, deltaL: e * 0.48, calculated_P: eccLoad + 0.02 * e, error_E: 0.02 * e, diffFromCenter: 0.02 * e, isPass: true },
      { id: 'ecc-3', position: 'End of rail', load: eccLoad, indication: eccLoad, deltaL: e * 0.51, calculated_P: eccLoad - 0.01 * e, error_E: -0.01 * e, diffFromCenter: 0.01 * e, isPass: true },
      { id: 'ecc-4', position: 'End of rail (Reverse)', load: eccLoad, indication: eccLoad, deltaL: e * 0.5, calculated_P: eccLoad, error_E: 0, diffFromCenter: 0, isPass: true },
      { id: 'ecc-5', position: 'Middle of track (Reverse)', load: eccLoad, indication: eccLoad, deltaL: e * 0.49, calculated_P: eccLoad + 0.01 * e, error_E: 0.01 * e, diffFromCenter: 0.01 * e, isPass: true },
      { id: 'ecc-6', position: 'Beginning of rail (Reverse)', load: eccLoad, indication: eccLoad, deltaL: e * 0.5, calculated_P: eccLoad, error_E: 0, diffFromCenter: 0, isPass: true },
    ];
  } else {
    // Standard receptor (<= 4 points): Center + 4 quadrants
    eccObsPoints = [
      { id: 'ecc-1', position: 'Center position', load: eccLoad, indication: eccLoad, deltaL: e * 0.5, calculated_P: eccLoad, error_E: 0, diffFromCenter: 0, isPass: true },
      { id: 'ecc-2', position: 'Quarter 1 (Front-Left)', load: eccLoad, indication: eccLoad, deltaL: e * 0.45, calculated_P: eccLoad + 0.05 * e, error_E: 0.05 * e, diffFromCenter: 0.05 * e, isPass: true },
      { id: 'ecc-3', position: 'Quarter 2 (Front-Right)', load: eccLoad, indication: eccLoad, deltaL: e * 0.54, calculated_P: eccLoad - 0.04 * e, error_E: -0.04 * e, diffFromCenter: 0.04 * e, isPass: true },
      { id: 'ecc-4', position: 'Quarter 3 (Back-Right)', load: eccLoad, indication: eccLoad, deltaL: e * 0.48, calculated_P: eccLoad + 0.02 * e, error_E: 0.02 * e, diffFromCenter: 0.02 * e, isPass: true },
      { id: 'ecc-5', position: 'Quarter 4 (Back-Left)', load: eccLoad, indication: eccLoad, deltaL: e * 0.52, calculated_P: eccLoad - 0.02 * e, error_E: -0.02 * e, diffFromCenter: 0.02 * e, isPass: true },
    ];
  }

  // ==========================================================================
  // 5. Discrimination Test (Clause A.4.8)
  // ==========================================================================
  const extra14d = Math.round(1.4 * d * 10000) / 10000;
  const discPoints: DiscriminationPoint[] = [
    {
      id: 'dis-1',
      loadPointName: 'Minimum Capacity (Min)',
      load: min,
      indicationBefore: min,
      extraLoad_1_4d: extra14d,
      indicationAfter: Math.round((min + d) * 10000) / 10000,
      observedDelta: d,
      requiredResponse: 'Clear change of indication (+1d)',
      isPass: true,
      remarks: 'Decisive display increment observed upon gentle deposition of 1.4d',
    },
    {
      id: 'dis-2',
      loadPointName: 'Approx. 50% Max Capacity',
      load: Math.round(halfMax * 1000) / 1000,
      indicationBefore: Math.round(halfMax * 1000) / 1000,
      extraLoad_1_4d: extra14d,
      indicationAfter: Math.round((halfMax + d) * 1000) / 1000,
      observedDelta: d,
      requiredResponse: 'Clear change of indication (+1d)',
      isPass: true,
      remarks: 'Decisive display increment observed upon gentle deposition of 1.4d',
    },
    {
      id: 'dis-3',
      loadPointName: 'Maximum Capacity (Max)',
      load: max,
      indicationBefore: max,
      extraLoad_1_4d: extra14d,
      indicationAfter: Math.round((max + d) * 1000) / 1000,
      observedDelta: d,
      requiredResponse: 'Clear change of indication (+1d)',
      isPass: true,
      remarks: 'Decisive display increment observed upon gentle deposition of 1.4d',
    },
  ];

  // ==========================================================================
  // 6. Type Examination Repeatability (Clause A.4.10)
  // ==========================================================================
  const reqRptCount = getRequiredRepeatabilityCount(max);
  const rptSeries1Load = Math.round(halfMax * 1000) / 1000;
  const rptSeries2Load = max;

  const s1Weighings: RepeatabilityWeighing[] = [];
  const s2Weighings: RepeatabilityWeighing[] = [];
  for (let i = 1; i <= reqRptCount; i++) {
    // slight variation of turning points ~0.02e
    const offset1 = (i % 3 === 0 ? 0.02 : i % 2 === 0 ? -0.01 : 0.0) * e;
    const offset2 = (i % 3 === 1 ? -0.02 : i % 2 === 1 ? 0.01 : 0.0) * e;

    s1Weighings.push({
      id: `rep1-${i}`,
      repetitionIndex: i,
      load: rptSeries1Load,
      indication: rptSeries1Load,
      deltaL: Math.round((e * 0.5 - offset1) * 10000) / 10000,
      calculated_P: Math.round((rptSeries1Load + offset1) * 10000) / 10000,
      error_E: Math.round(offset1 * 10000) / 10000,
    });

    s2Weighings.push({
      id: `rep2-${i}`,
      repetitionIndex: i,
      load: rptSeries2Load,
      indication: rptSeries2Load,
      deltaL: Math.round((e * 0.5 - offset2) * 10000) / 10000,
      calculated_P: Math.round((rptSeries2Load + offset2) * 10000) / 10000,
      error_E: Math.round(offset2 * 10000) / 10000,
    });
  }

  // ==========================================================================
  // 7. Creep Test (Clause A.4.11.1)
  // ==========================================================================
  const creepLoad = max;
  const creepObs: CreepTimePoint[] = [
    { id: 'cr-0', elapsedMinutes: 0, indication: creepLoad, deltaL: e * 0.5, calculated_P: creepLoad, driftFromInitial: 0 },
    { id: 'cr-5', elapsedMinutes: 5, indication: creepLoad, deltaL: e * 0.49, calculated_P: creepLoad + 0.01 * e, driftFromInitial: 0.01 * e },
    { id: 'cr-15', elapsedMinutes: 15, indication: creepLoad, deltaL: e * 0.48, calculated_P: creepLoad + 0.02 * e, driftFromInitial: 0.02 * e },
    { id: 'cr-30', elapsedMinutes: 30, indication: creepLoad, deltaL: e * 0.47, calculated_P: creepLoad + 0.03 * e, driftFromInitial: 0.03 * e },
  ];
  // 30 min drift = 0.03e <= 0.5e, drift between 15-30 min = 0.01e <= 0.2e => qualified for early termination!

  // ==========================================================================
  // 8. Zero Return Test (Clause A.4.11.2)
  // ==========================================================================
  const zeroReturnObs = {
    preLoadZero: 0.0,
    appliedLoad: max,
    removalTimestamp: '2026-09-27 10:45:00',
    residualIndication: 0.0,
    residualDeltaL: Math.round(e * 0.49 * 10000) / 10000,
    calculatedResidualZero: Math.round(0.01 * e * 10000) / 10000,
    maxPermissibleLimit: Math.round(0.5 * e * 10000) / 10000,
    isPass: true,
  };

  // ==========================================================================
  // 9. Stability of Equilibrium (Clause A.4.12)
  // ==========================================================================
  const eqChecks: EquilibriumCheckItem[] = [
    {
      id: 'eq-1',
      condition: 'Manual disturbance (pan gently agitated)',
      operationAttempted: 'Print Command',
      expectedBehavior: 'Printing inhibited until weight reading stabilizes within 0.2 e band',
      observedBehavior: 'No printout emitted while motion symbol displayed; printed immediately upon equilibrium',
      isPass: true,
    },
    {
      id: 'eq-2',
      condition: 'Dynamic load variation (weight gently oscillating)',
      operationAttempted: 'Semi-automatic Tare Key',
      expectedBehavior: 'Tare operation locked out during non-equilibrium condition',
      observedBehavior: 'Tare command rejected with beep; tare only accepted after stabilization',
      isPass: true,
    },
    {
      id: 'eq-3',
      condition: 'Pan in motion during zeroing',
      operationAttempted: 'Zero-setting Key',
      expectedBehavior: 'Zero-setting inhibited while motion symbol is active',
      observedBehavior: 'Zero setting inhibited until stabilization was achieved',
      isPass: true,
    },
  ];

  // ==========================================================================
  // 10. Static Temperature Sequence (Clause A.5.3)
  // ==========================================================================
  const tempStages: TemperatureStage[] = [
    {
      id: 't-1',
      stageNumber: 1,
      stageName: 'Reference Temperature (+20 °C)',
      targetTempC: 20,
      actualTempC: 20.2,
      chamberHumidityRh: 50,
      zeroIndication: 0,
      zeroDeltaL: e * 0.5,
      maxLoad: max,
      maxLoadIndication: max,
      maxLoadDeltaL: e * 0.5,
      calculated_P_zero: 0,
      calculated_P_max: max,
      correctedError: 0,
      zeroShiftPer5C: 0,
      isPass: true,
    },
    {
      id: 't-2',
      stageNumber: 2,
      stageName: 'Specified High Temperature (+40 °C)',
      targetTempC: 40,
      actualTempC: 39.8,
      chamberHumidityRh: 45,
      zeroIndication: 0,
      zeroDeltaL: e * 0.48,
      maxLoad: max,
      maxLoadIndication: max,
      maxLoadDeltaL: e * 0.46,
      calculated_P_zero: 0.02 * e,
      calculated_P_max: max + 0.04 * e,
      correctedError: 0.02 * e,
      zeroShiftPer5C: (0.02 * e) / 4,
      isPass: true,
    },
    {
      id: 't-3',
      stageNumber: 3,
      stageName: 'Specified Low Temperature (-10 °C)',
      targetTempC: -10,
      actualTempC: -10.1,
      chamberHumidityRh: 35,
      zeroIndication: 0,
      zeroDeltaL: e * 0.52,
      maxLoad: max,
      maxLoadIndication: max,
      maxLoadDeltaL: e * 0.53,
      calculated_P_zero: -0.02 * e,
      calculated_P_max: max - 0.03 * e,
      correctedError: -0.01 * e,
      zeroShiftPer5C: (0.02 * e) / 6,
      isPass: true,
    },
    {
      id: 't-4',
      stageNumber: 4,
      stageName: 'Intermediate Temperature (+5 °C)',
      targetTempC: 5,
      actualTempC: 5.0,
      chamberHumidityRh: 48,
      zeroIndication: 0,
      zeroDeltaL: e * 0.51,
      maxLoad: max,
      maxLoadIndication: max,
      maxLoadDeltaL: e * 0.5,
      calculated_P_zero: -0.01 * e,
      calculated_P_max: max,
      correctedError: 0.01 * e,
      zeroShiftPer5C: (0.01 * e) / 3,
      isPass: true,
    },
    {
      id: 't-5',
      stageNumber: 5,
      stageName: 'Return to Reference (+20 °C)',
      targetTempC: 20,
      actualTempC: 20.0,
      chamberHumidityRh: 51,
      zeroIndication: 0,
      zeroDeltaL: e * 0.5,
      maxLoad: max,
      maxLoadIndication: max,
      maxLoadDeltaL: e * 0.49,
      calculated_P_zero: 0,
      calculated_P_max: max + 0.01 * e,
      correctedError: 0.01 * e,
      zeroShiftPer5C: 0,
      isPass: true,
    },
  ];

  // ==========================================================================
  // 11. Voltage Variation (Clause A.5.4)
  // ==========================================================================
  const voltPoints: VoltageConditionPoint[] = [];
  if (hasAcMains) {
    voltPoints.push(
      {
        id: 'vac-1',
        conditionName: 'Nominal AC Mains (100% Unom)',
        supplyType: 'AC_MAINS',
        targetVoltage: '230 V AC',
        actualVoltage: 230.1,
        load: halfMax,
        indication: halfMax,
        deltaL: e * 0.5,
        calculatedError: 0,
        mpe: e,
        isPass: true,
      },
      {
        id: 'vac-2',
        conditionName: 'Upper AC Limit (+10% Unom)',
        supplyType: 'AC_MAINS',
        targetVoltage: '253 V AC',
        actualVoltage: 253.2,
        load: halfMax,
        indication: halfMax,
        deltaL: e * 0.48,
        calculatedError: 0.02 * e,
        mpe: e,
        isPass: true,
      },
      {
        id: 'vac-3',
        conditionName: 'Lower AC Limit (-15% Unom)',
        supplyType: 'AC_MAINS',
        targetVoltage: '195.5 V AC',
        actualVoltage: 195.0,
        load: halfMax,
        indication: halfMax,
        deltaL: e * 0.51,
        calculatedError: -0.01 * e,
        mpe: e,
        isPass: true,
      }
    );
  }
  if (hasBattery) {
    voltPoints.push(
      {
        id: 'vbat-1',
        conditionName: 'Nominal Battery Voltage',
        supplyType: 'BATTERY',
        targetVoltage: '6.0 V DC',
        actualVoltage: 6.1,
        load: halfMax,
        indication: halfMax,
        deltaL: e * 0.5,
        calculatedError: 0,
        mpe: e,
        isPass: true,
      },
      {
        id: 'vbat-2',
        conditionName: 'Minimum Operating Voltage Before Shutoff',
        supplyType: 'BATTERY',
        targetVoltage: '5.2 V DC',
        actualVoltage: 5.18,
        load: halfMax,
        indication: halfMax,
        deltaL: e * 0.49,
        calculatedError: 0.01 * e,
        mpe: e,
        blankingBehaviorObserved: 'Low battery annunciator flashed; display blanked safely at 5.10 V without erroneous indications',
        isPass: true,
      }
    );
  }

  // ==========================================================================
  // 12. Damp Heat Steady State (Clause B.2)
  // ==========================================================================
  const dampHeatData = {
    chamberTempC: 40.0,
    chamberHumidityRh: 85.0,
    durationHours: 48,
    preExposureZero: 0.0,
    preExposureMaxError: 0.0,
    duringExposureZero: Math.round(0.02 * e * 10000) / 10000,
    duringExposureMaxError: Math.round(0.04 * e * 10000) / 10000,
    postRecoveryZero: Math.round(0.01 * e * 10000) / 10000,
    postRecoveryMaxError: Math.round(0.02 * e * 10000) / 10000,
    zeroShift: Math.round(0.01 * e * 10000) / 10000,
    mpeTolerance: e,
    isPass: true,
  };

  // ==========================================================================
  // 13. Span Stability Test (Clause B.4)
  // ==========================================================================
  const spanRuns: SpanStabilityRun[] = [
    { runIndex: 1, dayNumber: 0, testDate: '2026-09-01', referenceLoad: max, indication: max, deltaL: e * 0.5, ambientTempC: 20.1, ambientHumidityRh: 50, calculated_P: max, error: 0, driftFromDay0: 0, status: 'COMPLETED' },
    { runIndex: 2, dayNumber: 3, testDate: '2026-09-04', referenceLoad: max, indication: max, deltaL: e * 0.49, ambientTempC: 20.4, ambientHumidityRh: 52, calculated_P: max + 0.01 * e, error: 0.01 * e, driftFromDay0: 0.01 * e, status: 'COMPLETED' },
    { runIndex: 3, dayNumber: 7, testDate: '2026-09-08', referenceLoad: max, indication: max, deltaL: e * 0.51, ambientTempC: 19.8, ambientHumidityRh: 49, calculated_P: max - 0.01 * e, error: -0.01 * e, driftFromDay0: 0.01 * e, status: 'COMPLETED' },
    { runIndex: 4, dayNumber: 10, testDate: '2026-09-11', referenceLoad: max, indication: max, deltaL: e * 0.5, ambientTempC: 20.0, ambientHumidityRh: 51, calculated_P: max, error: 0, driftFromDay0: 0, status: 'SCHEDULED' },
    { runIndex: 5, dayNumber: 14, testDate: '2026-09-15', referenceLoad: max, indication: max, deltaL: e * 0.5, ambientTempC: 20.0, ambientHumidityRh: 50, calculated_P: max, error: 0, driftFromDay0: 0, status: 'SCHEDULED' },
    { runIndex: 6, dayNumber: 21, testDate: '2026-09-22', referenceLoad: max, indication: max, deltaL: e * 0.5, ambientTempC: 20.0, ambientHumidityRh: 50, calculated_P: max, error: 0, driftFromDay0: 0, status: 'SCHEDULED' },
    { runIndex: 7, dayNumber: 24, testDate: '2026-09-25', referenceLoad: max, indication: max, deltaL: e * 0.5, ambientTempC: 20.0, ambientHumidityRh: 50, calculated_P: max, error: 0, driftFromDay0: 0, status: 'SCHEDULED' },
    { runIndex: 8, dayNumber: 28, testDate: '2026-09-29', referenceLoad: max, indication: max, deltaL: e * 0.5, ambientTempC: 20.0, ambientHumidityRh: 50, calculated_P: max, error: 0, driftFromDay0: 0, status: 'SCHEDULED' },
  ];

  // Construct complete test list
  const testSuite: TestSuiteItem[] = [
    {
      id: 'test-admin',
      testCode: 'R76_ADMIN_MARKINGS',
      name: 'Administrative & Markings Examination',
      clause: '3.10, 4.1',
      purpose: 'Verify statutory inscriptions, identification plates, and mandatory metrological markings.',
      instruction: 'Inspect housing markings, accuracy class symbols, serial number plate, and stamping area against type documentation.',
      isApplicable: true,
      status: 'PASS',
      remarks: 'All statutory markings, model designations, and serial stamping verified compliant.',
      evidence: [],
      data: { items: adminItems, allChecked: true },
    },
    {
      id: 'test-const',
      testCode: 'R76_CONSTRUCTION',
      name: 'Technical Construction & Sealing',
      clause: '4.1–18',
      purpose: 'Examine mechanical leveling, zero-setting facilities, tare mechanisms, and software security.',
      instruction: 'Test leveling bubble, zero setting range, tare subtraction, and verify calibration audit counter integrity.',
      isApplicable: true,
      status: 'PASS',
      remarks: 'Leveling feet, zero tracking, tare subtraction, and cryptographic seal intact.',
      evidence: [],
      data: { items: constItems, allChecked: true },
    },
    {
      id: 'test-weigh',
      testCode: 'R76_WEIGH_INTRINSIC',
      name: 'Initial Intrinsic Error (Weighing Performance)',
      clause: 'A.4.4',
      purpose: 'Determine the instrument intrinsic error over the required load range from Min to Max.',
      instruction: 'Apply test loads in increasing and decreasing sequences. Use turning-point method (ΔL) to calculate true indication P and corrected error Ec.',
      isApplicable: true,
      status: weighingHasFailure ? 'FAIL' : 'PASS',
      remarks: weighingHasFailure
        ? 'Observation at Max exceeded Table 6 maximum permissible errors.'
        : 'All 10 observation points within Table 6 MPE limits.',
      evidence: [],
      data: { observations: evaluatedWeighingRows },
    },
    {
      id: 'test-ecc',
      testCode: 'R76_ECCENTRICITY',
      name: 'Eccentricity Test',
      clause: 'A.4.7',
      purpose: 'Determine the effect of eccentric loading across quadrants or designated supports.',
      instruction: 'Apply 1/3 Max load at the center and sequentially at each quarter segment or track section. Compare maximum difference against 1 e.',
      isApplicable: true,
      status: 'PASS',
      remarks: 'Maximum inter-position difference is 0.05 e, well within the 1 e permissible tolerance.',
      evidence: [],
      data: {
        receptorType: instrument.receptorType,
        testLoad: eccLoad,
        observations: eccObsPoints,
        maxDiff: 0.05 * e,
        mpeAllowed: e,
      },
    },
    {
      id: 'test-disc',
      testCode: 'R76_DISCRIMINATION',
      name: 'Discrimination Test',
      clause: 'A.4.8',
      purpose: 'Verify that the instrument responds decisively to an additional small load of 1.4 d.',
      instruction: 'At Min, 50% Max, and Max, gently apply 1.4 d extra weight and verify that the indication changes by at least 1 d.',
      isApplicable: true,
      status: 'PASS',
      remarks: 'Definite display transition observed at all three test points upon gentle application of 1.4 d.',
      evidence: [],
      data: { points: discPoints },
    },
    {
      id: 'test-rep',
      testCode: 'R76_REPEATABILITY',
      name: 'Type Examination Repeatability',
      clause: 'A.4.10',
      purpose: 'Determine repeatability under constant test conditions across two distinct load series.',
      instruction: `Execute 2 series of weighings (~50% Max and ~100% Max) with ${reqRptCount} weighings per series. Verify repeatability span ≤ |MPE|.`,
      isApplicable: true,
      status: 'PASS',
      remarks: `Executed 2 series of ${reqRptCount} weighings. Range: Series 1 = 0.03 e; Series 2 = 0.03 e; compliant with Table 6 MPE.`,
      evidence: [],
      data: {
        series1: {
          seriesName: 'Series 1 (approx. 50% Max)',
          nominalLoad: rptSeries1Load,
          targetPercent: 50,
          weighings: s1Weighings,
          maxError: 0.02 * e,
          minError: -0.01 * e,
          span: 0.03 * e,
          mpeMagnitude: e,
          isCompliant: true,
        },
        series2: {
          seriesName: 'Series 2 (approx. 100% Max)',
          nominalLoad: rptSeries2Load,
          targetPercent: 100,
          weighings: s2Weighings,
          maxError: 0.01 * e,
          minError: -0.02 * e,
          span: 0.03 * e,
          mpeMagnitude: 1.5 * e,
          isCompliant: true,
        },
        requiredObservationsPerSeries: reqRptCount,
      },
    },
    {
      id: 'test-creep',
      testCode: 'R76_CREEP',
      name: 'Creep Test',
      clause: 'A.4.11.1',
      purpose: 'Observe indication drift under full test load over time.',
      instruction: 'Apply load close to Max. Record initial reading P0, then observe at 5, 15, and 30 minutes. Evaluate early-termination criteria.',
      isApplicable: !isClassI,
      exclusionJustification: isClassI ? 'Per Clause A.4.11.1, Creep test is mandatory only for Classes II, III, and IIII.' : null,
      status: isClassI ? 'NOT_APPLICABLE' : 'PASS',
      remarks: isClassI ? 'Exempt for Class I analytical balance' : 'Early termination qualified at 30 min: drift ≤ 0.5 e and 15–30 min drift ≤ 0.2 e.',
      evidence: [],
      data: {
        appliedLoad: creepLoad,
        initialReading_P0: creepLoad,
        observations: creepObs,
        earlyTerminationQualified: true,
        earlyTerminatedAt30Min: true,
        isPass: true,
      },
    },
    {
      id: 'test-zero-ret',
      testCode: 'R76_ZERO_RETURN',
      name: 'Zero Return Test',
      clause: 'A.4.11.2',
      purpose: 'Measure residual indication upon load removal after creep evaluation.',
      instruction: 'Immediately after creep test load removal, record zero indication. Residual error must not exceed 0.5 e.',
      isApplicable: !isClassI,
      exclusionJustification: isClassI ? 'Per Clause A.4.11.2, Zero Return is mandatory only for Classes II, III, and IIII.' : null,
      status: isClassI ? 'NOT_APPLICABLE' : 'PASS',
      remarks: isClassI ? 'Exempt for Class I analytical balance' : 'Residual zero error is 0.01 e (limit: 0.5 e). Compliant.',
      evidence: [],
      data: zeroReturnObs,
    },
    {
      id: 'test-eq',
      testCode: 'R76_EQUILIBRIUM',
      name: 'Stability of Equilibrium',
      clause: 'A.4.12',
      purpose: 'Verify printing, zeroing, and tare operations are inhibited unless equilibrium is stable.',
      instruction: 'Introduce manual disturbances while attempting print, tare, and zeroing. Verify commands are locked out or delayed.',
      isApplicable: true,
      status: 'PASS',
      remarks: 'All printing, zeroing, and tare operations properly locked out during dynamic instability.',
      evidence: [],
      data: { checks: eqChecks },
    },
    {
      id: 'test-temp',
      testCode: 'R76_TEMPERATURE',
      name: 'Static Temperature Sequence',
      clause: 'A.5.3',
      purpose: 'Verify weighing accuracy and zero stability across specified temperature limits.',
      instruction: 'Execute thermal cycle in climatic chamber (+20°C → +40°C → -10°C → +5°C → +20°C). Allow 2 hours stabilization per stage.',
      isApplicable: true,
      status: 'PASS',
      remarks: 'Span shift and zero drift ≤ 1 e per 5 °C temperature difference. Compliant.',
      evidence: [],
      data: { stages: tempStages, referenceTempC: 20 },
    },
    {
      id: 'test-volt',
      testCode: 'R76_VOLTAGE',
      name: 'Voltage Variations Test',
      clause: 'A.5.4',
      purpose: 'Verify weighing accuracy under extreme supply voltage fluctuations.',
      instruction: hasAcMains
        ? 'Test AC Mains at 230 V (100%), 253 V (110%), and 195.5 V (85%). Verify zero and span errors stay within Table 6 MPE.'
        : 'Test internal battery supply from nominal voltage down to minimum operating voltage before automatic display blanking.',
      isApplicable: hasAcMains || hasBattery,
      exclusionJustification: !hasAcMains && !hasBattery ? 'Non-electrical mechanical balance.' : null,
      status: 'PASS',
      remarks: 'Weighing errors remain within MPE under extreme supply voltage variations.',
      evidence: [],
      data: {
        supplyType: hasAcMains && hasBattery ? 'DUAL' : hasAcMains ? 'AC_MAINS' : 'BATTERY',
        nominalVoltage: hasAcMains ? '230 V AC' : '6 V Battery',
        points: voltPoints,
      },
    },
    {
      id: 'test-damp',
      testCode: 'R76_DAMP_HEAT',
      name: 'Damp Heat Steady State (48 h)',
      clause: 'B.2',
      purpose: 'Verify immunity to prolonged high humidity and elevated ambient temperature.',
      instruction: 'Expose instrument to +40 °C and 85% RH for 48 hours. Observe insulation resistance, zero drift, and span error recovery.',
      isApplicable: true,
      status: 'PASS',
      remarks: 'Zero shift following 48 h damp heat is 0.01 e, well within 1 e tolerance.',
      evidence: [],
      data: dampHeatData,
    },
    {
      id: 'test-span',
      testCode: 'R76_SPAN_STABILITY',
      name: 'Span Stability Test (28 Days)',
      clause: 'B.4',
      purpose: 'Evaluate long-term span sensitivity drift over 8 measurement runs across 28 days.',
      instruction: 'Apply reference load at designated intervals over 28 days under consistent conditions. Track span drift from Day 0.',
      isApplicable: true,
      status: 'IN_PROGRESS',
      remarks: '3 of 8 measurement runs completed. Span drift to date is 0.01 e (limit: 0.5 e). In progress.',
      evidence: [],
      data: {
        runs: spanRuns,
        maxDriftAllowed: 0.5 * e,
        overallCompliant: true,
      },
    },
  ];

  return testSuite;
}
