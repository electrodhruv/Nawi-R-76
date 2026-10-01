/**
 * Test Run Record Factory for NAWI-R76 Generic Test Engine
 *
 * Constructs strongly typed TestRunRecords initialized with common evaluation context,
 * standard equipment, environmental snapshots, and realistic initial observations.
 */

import { CommonEvaluationContext, TestRunRecord, TestDefinition, EquipmentAssigned, TestEvidenceItem, TestStatusCode, EvidencePurpose } from './types';
import { TEST_DEFINITIONS_REGISTRY } from './registry';
import { interpretCalculations, CalculationResultOutput } from './interpreters/calculation-interpreter';
import { interpretCompliance } from './interpreters/compliance-interpreter';
import { evaluateValidationRules } from './interpreters/validation-interpreter';

export const STANDARD_DEMO_EQUIPMENT: EquipmentAssigned[] = [
  {
    id: 'eq-e2-set',
    name: 'Class E2 Stainless Steel Standard Mass Set (1 mg – 20 kg)',
    serialNumber: 'CAL-E2-99042',
    certificateNumber: 'NPLI/MS/2026/0881',
    calibrationDate: '2026-01-15',
    calibrationExpiry: '2027-01-14',
    isCalibrated: true,
  },
  {
    id: 'eq-dmm',
    name: 'Keysight 34465A 6½ Digit Digital Multimeter',
    serialNumber: 'MY57018244',
    certificateNumber: 'RRSL/ELEC/2025/1109',
    calibrationDate: '2025-09-10',
    calibrationExpiry: '2026-09-09',
    isCalibrated: true,
  },
  {
    id: 'eq-env-station',
    name: 'Vaisala PTU300 Barometric, Temperature & Humidity Transmitter',
    serialNumber: 'V-ENV-2024-810',
    certificateNumber: 'NPLI/ENV/2025/4412',
    calibrationDate: '2025-11-20',
    calibrationExpiry: '2026-11-19',
    isCalibrated: true,
  },
];

export function buildTestRunRecord(
  testDef: TestDefinition,
  context: CommonEvaluationContext,
  prefillDemoData: boolean = true
): TestRunRecord {
  const { instrument } = context;
  const max = instrument.maxCapacity;
  const min = instrument.minCapacity;
  const e = instrument.verificationInterval_e;
  const d = instrument.scaleInterval_d;
  const isClassI = instrument.accuracyClass === 'CLASS_I';
  const isFailedSpecimen = Boolean(instrument.hasFailedSample);
  const receptor = (instrument.receptorType || 'STANDARD_PAN').toUpperCase();
  const isRollingReceptor = receptor.includes('ROLLING') || receptor.includes('TRACK');
  const isMobileReceptor = receptor.includes('MOBILE') || receptor.includes('CRANE') || receptor.includes('HANGING');
  const isNonSelfIndicating = instrument.scaleType === 'NON_SELF_INDICATING';

  // Applicability logic
  let isApplicable = true;
  let exclusionJustification: string | null = null;

  if (testDef.code === 'R76_CREEP' || testDef.code === 'R76_ZERO_RETURN') {
    if (isClassI) {
      isApplicable = false;
      exclusionJustification = 'Per Clause A.4.11.1, Creep and Zero Return are mandatory only for Classes II, III, and IIII. Class I analytical balances are exempt.';
    }
  } else if (testDef.code === 'R76_ECCENTRICITY') {
    if (isRollingReceptor) {
      isApplicable = false;
      exclusionJustification = 'Clause A.4.7.1 is for standard load receptors. Instrument is equipped with a rolling load receptor evaluated under Clause A.4.7.4.';
    } else if (isMobileReceptor) {
      isApplicable = false;
      exclusionJustification = 'Clause A.4.7.1 is for fixed receptors. Instrument is a mobile/crane device evaluated under Clause A.4.7.5.';
    }
  } else if (testDef.code === 'R76_ECC_ROLLING') {
    if (!isRollingReceptor) {
      isApplicable = false;
      exclusionJustification = 'Clause A.4.7.4 is applicable only to rolling-load instruments (e.g. rail weighbridges, overhead tracks). Current receptor type is stationary pan/platform.';
    }
  } else if (testDef.code === 'R76_ECC_MOBILE') {
    if (!isMobileReceptor) {
      isApplicable = false;
      exclusionJustification = 'Clause A.4.7.5 is applicable only to mobile, crane, or hanging instruments. Current instrument is a fixed laboratory/bench device.';
    }
  } else if (testDef.code === 'R76_SENSITIVITY') {
    if (!isNonSelfIndicating) {
      isApplicable = false;
      exclusionJustification = 'Clause A.4.9 is applicable only to non-self-indicating instruments. Instrument is an electronic digital self-indicating NAWI.';
    }
  } else if (testDef.code === 'R76_TILTING') {
    if (isClassI) {
      isApplicable = false;
      exclusionJustification = 'Per Clause 3.9.1.1, Tilting test is not applicable to Class I analytical balances.';
    } else if ((instrument as unknown as { hasAutomaticLeveling?: boolean }).hasAutomaticLeveling) {
      isApplicable = false;
      exclusionJustification = 'Per Clause 3.9.1.1, instrument is equipped with an automatic leveling device that inhibits weighing under out-of-level conditions.';
    }
  }

  // Raw observations generation based on test code
  let rawObservations: Record<string, unknown>[] = [];
  const halfMax = Math.round(max * 0.5 * 1000) / 1000;
  const eccLoad = Math.round((max / 3) * 1000) / 1000;

  if (isApplicable) {
    if (testDef.code === 'R76_ADMIN_MARKINGS') {
      rawObservations = [
        { requirement: 'Accuracy Class designation mark (I, II, III, IIII)', clause: '3.10', observation: prefillDemoData ? `Clearly marked: Class ${instrument.accuracyClass.replace('_', ' ')} inside oval border` : '', status: prefillDemoData ? 'PASS' : 'NOT_TESTED' },
        { requirement: 'Maximum capacity (Max) and Minimum capacity (Min)', clause: '3.10', observation: prefillDemoData ? `Max = ${max} ${instrument.primaryUnit}, Min = ${min} ${instrument.primaryUnit} permanently engraved` : '', status: prefillDemoData ? 'PASS' : 'NOT_TESTED' },
        { requirement: 'Verification scale interval (e) and scale interval (d)', clause: '3.10', observation: prefillDemoData ? `e = ${e} ${instrument.primaryUnit}, d = ${d} ${instrument.primaryUnit} inscribed on main fascia` : '', status: prefillDemoData ? 'PASS' : 'NOT_TESTED' },
        { requirement: 'Manufacturer name, trade mark, and serial number', clause: '3.10', observation: prefillDemoData ? `Manufacturer: ${instrument.manufacturer}, Serial: ${instrument.serialNumber}` : '', status: prefillDemoData ? 'PASS' : 'NOT_TESTED' },
        { requirement: 'Pattern approval sign and statutory verification area', clause: '3.10', observation: prefillDemoData ? 'Designated blank area for statutory stamping provided' : '', status: prefillDemoData ? 'PASS' : 'NOT_TESTED' },
      ];
    } else if (testDef.code === 'R76_CONSTRUCTION') {
      rawObservations = [
        { requirement: 'Level indicator and leveling feet', clause: '4.1.2.2', observation: prefillDemoData ? 'Spirit bubble level indicator visible through front bezel with 4 screw-threaded feet' : '', status: prefillDemoData ? 'PASS' : 'NOT_TESTED' },
        { requirement: 'Zero-setting and zero-tracking bounds (±2% Max)', clause: '4.5', observation: prefillDemoData ? 'Semi-automatic zero operates within 4% of Max range; zero tracking ≤ 0.5 e/s' : '', status: prefillDemoData ? 'PASS' : 'NOT_TESTED' },
        { requirement: 'Tare device subtraction accuracy and NET indication', clause: '4.6', observation: prefillDemoData ? `Subtractive tare operates over 0 to ${Math.round(max * 0.4)} ${instrument.primaryUnit} with NET annunciator` : '', status: prefillDemoData ? 'PASS' : 'NOT_TESTED' },
        { requirement: 'Physical security sealing of calibration switch', clause: '4.17', observation: prefillDemoData ? `Hardware calibration switch secured by wire seal; audit counter increments on entry` : '', status: prefillDemoData ? 'PASS' : 'NOT_TESTED' },
        { requirement: 'Software version and cryptographic checksum verification', clause: '4.18', observation: prefillDemoData ? `Firmware checksum verified against type approval documentation: v${instrument.softwareVersion}` : '', status: prefillDemoData ? 'PASS' : 'NOT_TESTED' },
      ];
    } else if (prefillDemoData) {
      switch (testDef.code) {
        case 'R76_WEIGH_INTRINSIC': {
          if (isFailedSpecimen) {
        // Deliberate out-of-tolerance failure at Max
        rawObservations = [
          { direction: 'INC', load: 0, indication: 0, deltaL: e * 0.5 },
          { direction: 'INC', load: min, indication: min, deltaL: e * 0.48 },
          { direction: 'INC', load: halfMax, indication: halfMax, deltaL: e * 0.5 },
          { direction: 'INC', load: max, indication: max + e * 3.0, deltaL: e * 0.2 }, // Exceeds MPE
          { direction: 'DEC', load: halfMax, indication: halfMax, deltaL: e * 0.5 },
          { direction: 'DEC', load: 0, indication: 0, deltaL: e * 0.5 },
        ];
      } else {
        // Fully compliant
        rawObservations = [
          { direction: 'INC', load: 0, indication: 0, deltaL: e * 0.5 },
          { direction: 'INC', load: min, indication: min, deltaL: e * 0.52 },
          { direction: 'INC', load: Math.round(halfMax * 0.5 * 1000) / 1000, indication: Math.round(halfMax * 0.5 * 1000) / 1000, deltaL: e * 0.46 },
          { direction: 'INC', load: halfMax, indication: halfMax, deltaL: e * 0.5 },
          { direction: 'INC', load: Math.round(max * 0.75 * 1000) / 1000, indication: Math.round(max * 0.75 * 1000) / 1000, deltaL: e * 0.48 },
          { direction: 'INC', load: max, indication: max, deltaL: e * 0.45 },
          { direction: 'DEC', load: halfMax, indication: halfMax, deltaL: e * 0.52 },
          { direction: 'DEC', load: 0, indication: 0, deltaL: e * 0.5 },
        ];
      }
      break;
    }

    case 'R76_ECCENTRICITY': {
      // Ordinary load receptor: Center + 4 quadrants (Clause A.4.7.1–A.4.7.3)
      rawObservations = [
        { position: 'Center position', load: eccLoad, indication: eccLoad, deltaL: e * 0.5 },
        { position: 'Quarter 1 (Front-Left)', load: eccLoad, indication: eccLoad, deltaL: e * 0.45 },
        { position: 'Quarter 2 (Front-Right)', load: eccLoad, indication: eccLoad, deltaL: e * 0.54 },
        { position: 'Quarter 3 (Back-Right)', load: eccLoad, indication: eccLoad, deltaL: e * 0.48 },
        { position: 'Quarter 4 (Back-Left)', load: eccLoad, indication: eccLoad, deltaL: e * 0.52 },
      ];
      break;
    }

    case 'R76_ECC_ROLLING': {
      // Rolling-load instruments: Beginning, Middle, End (Forward & Reverse) (Clause A.4.7.4)
      rawObservations = [
        { position: 'Beginning of rail (Forward)', load: eccLoad, indication: eccLoad, deltaL: e * 0.5 },
        { position: 'Middle of track (Forward)', load: eccLoad, indication: eccLoad, deltaL: e * 0.48 },
        { position: 'End of rail (Forward)', load: eccLoad, indication: eccLoad, deltaL: e * 0.51 },
        { position: 'End of rail (Reverse)', load: eccLoad, indication: eccLoad, deltaL: e * 0.5 },
        { position: 'Middle of track (Reverse)', load: eccLoad, indication: eccLoad, deltaL: e * 0.49 },
        { position: 'Beginning of rail (Reverse)', load: eccLoad, indication: eccLoad, deltaL: e * 0.5 },
      ];
      break;
    }

    case 'R76_ECC_MOBILE': {
      // Mobile / Crane instruments: Level + Tilts (Clause A.4.7.5)
      rawObservations = [
        { position: 'Plumb Vertical (Level)', load: eccLoad, indication: eccLoad, deltaL: e * 0.5 },
        { position: 'Forward Tilt (+5°)', load: eccLoad, indication: eccLoad, deltaL: e * 0.47 },
        { position: 'Backward Tilt (-5°)', load: eccLoad, indication: eccLoad, deltaL: e * 0.53 },
        { position: 'Lateral Tilt Left (+5°)', load: eccLoad, indication: eccLoad, deltaL: e * 0.49 },
        { position: 'Lateral Tilt Right (-5°)', load: eccLoad, indication: eccLoad, deltaL: e * 0.51 },
      ];
      break;
    }

    case 'R76_DISCRIMINATION': {
      const extra14d = Math.round(1.4 * d * 10000) / 10000;
      rawObservations = [
        {
          loadPoint: 'Minimum Capacity (Min)',
          loadPointName: 'Minimum Capacity (Min)',
          load: min,
          baseLoad: min,
          indication: min,
          initialIndication: min,
          baseIndication: min,
          indicationBefore: min,
          deltaL: extra14d,
          additionalLoad: extra14d,
          extraLoad_1_4d: extra14d,
          finalIndication: Math.round((min + d) * 10000) / 10000,
          newIndication: Math.round((min + d) * 10000) / 10000,
          indicationAfter: Math.round((min + d) * 10000) / 10000,
        },
        {
          loadPoint: 'Approx. 50% Max Capacity',
          loadPointName: 'Approx. 50% Max Capacity',
          load: halfMax,
          baseLoad: halfMax,
          indication: halfMax,
          initialIndication: halfMax,
          baseIndication: halfMax,
          indicationBefore: halfMax,
          deltaL: extra14d,
          additionalLoad: extra14d,
          extraLoad_1_4d: extra14d,
          finalIndication: Math.round((halfMax + d) * 10000) / 10000,
          newIndication: Math.round((halfMax + d) * 10000) / 10000,
          indicationAfter: Math.round((halfMax + d) * 10000) / 10000,
        },
        {
          loadPoint: 'Maximum Capacity (Max)',
          loadPointName: 'Maximum Capacity (Max)',
          load: max,
          baseLoad: max,
          indication: max,
          initialIndication: max,
          baseIndication: max,
          indicationBefore: max,
          deltaL: extra14d,
          additionalLoad: extra14d,
          extraLoad_1_4d: extra14d,
          finalIndication: Math.round((max + d) * 10000) / 10000,
          newIndication: Math.round((max + d) * 10000) / 10000,
          indicationAfter: Math.round((max + d) * 10000) / 10000,
        },
      ];
      break;
    }

    case 'R76_SENSITIVITY': {
      rawObservations = [
        { loadPointName: 'Minimum (Min)', appliedLoad: min, initialIndication: min, additionalLoad: d, responseDisplacementMm: 3.5 },
        { loadPointName: '50% Max', appliedLoad: halfMax, initialIndication: halfMax, additionalLoad: d, responseDisplacementMm: 3.2 },
        { loadPointName: 'Maximum (Max)', appliedLoad: max, initialIndication: max, additionalLoad: d, responseDisplacementMm: 3.0 },
      ];
      break;
    }

    case 'R76_REPEATABILITY': {
      const genSeries = (loadVal: number) => {
        return Array.from({ length: 10 }, (_, i) => ({
          repetitionIndex: i + 1,
          load: loadVal,
          indication: loadVal,
          deltaL: Math.round((e * (0.47 + ((i * 7) % 7) * 0.01)) * 10000) / 10000,
        }));
      };
      // 10 weighings at 50% Max, 10 weighings at 100% Max
      rawObservations = [...genSeries(halfMax), ...genSeries(max)];
      break;
    }

    case 'R76_CREEP': {
      rawObservations = [
        { elapsedMinutes: 0, indication: max, deltaL: e * 0.5, temperatureC: 20.4, load: max },
        { elapsedMinutes: 5, indication: max, deltaL: e * 0.49, temperatureC: 20.4, load: max },
        { elapsedMinutes: 15, indication: max, deltaL: e * 0.48, temperatureC: 20.5, load: max },
        { elapsedMinutes: 30, indication: max, deltaL: e * 0.47, temperatureC: 20.5, load: max },
      ];
      break;
    }

    case 'R76_ZERO_RETURN': {
      rawObservations = [
        {
          preLoadZero: 0.0,
          appliedLoad: max,
          removalTimestamp: '10:30:15',
          residualIndication: 0.0,
          residualDeltaL: e * 0.51,
        },
      ];
      break;
    }

    case 'R76_EQUILIBRIUM': {
      rawObservations = [
        { operation: 'Print command lockout during disturbed equilibrium', clause: '4.4.5', observation: 'Print trigger rejected while pan subjected to vibration; accepted when stable', status: 'PASS' },
        { operation: 'Data storage / transmission lockout during motion', clause: '4.4.5', observation: 'Continuous serial output tags flag bit 0x02 (in-motion); storage command deferred', status: 'PASS' },
        { operation: 'Zero-setting inhibition during unstable equilibrium', clause: '4.5.4', observation: 'Zero button displays Err-02 during disturbed equilibrium', status: 'PASS' },
        { operation: 'Tare balancing inhibition during disturbed equilibrium', clause: '4.6.4', observation: 'Tare key displays Err-02 during disturbed equilibrium', status: 'PASS' },
      ];
      break;
    }

    case 'R76_TILTING': {
      rawObservations = [
        { tiltOrientation: 'Level datum (0 mm/m)', testLoad: 0, indication: 0, deltaL: e * 0.5, observedCondition: 'Stable level reference at zero' },
        { tiltOrientation: 'Level datum (0 mm/m)', testLoad: max, indication: max, deltaL: e * 0.5, observedCondition: 'Stable level reference at Max' },
        { tiltOrientation: 'Forward tilt (50:1000)', testLoad: max, indication: max, deltaL: e * 0.49, observedCondition: 'Tilted forward 50/1000' },
        { tiltOrientation: 'Backward tilt (50:1000)', testLoad: max, indication: max, deltaL: e * 0.51, observedCondition: 'Tilted backward 50/1000' },
        { tiltOrientation: 'Left tilt (50:1000)', testLoad: max, indication: max, deltaL: e * 0.5, observedCondition: 'Tilted left 50/1000' },
        { tiltOrientation: 'Right tilt (50:1000)', testLoad: max, indication: max, deltaL: e * 0.49, observedCondition: 'Tilted right 50/1000' },
      ];
      break;
    }

    case 'R76_TEMPERATURE': {
      rawObservations = [
        { stageName: 'Reference Temperature (+20 °C)', targetTempC: 20, actualTempC: 20.3, soakHours: 2, load: halfMax, indication: halfMax, deltaL: e * 0.5 },
        { stageName: 'High Temperature (+40 °C)', targetTempC: 40, actualTempC: 40.1, soakHours: 2, load: halfMax, indication: halfMax, deltaL: e * 0.48 },
        { stageName: 'Low Temperature (-10 °C)', targetTempC: -10, actualTempC: -9.8, soakHours: 2, load: halfMax, indication: halfMax, deltaL: e * 0.52 },
        { stageName: 'Return to Reference (+20 °C)', targetTempC: 20, actualTempC: 20.2, soakHours: 2, load: halfMax, indication: halfMax, deltaL: e * 0.5 },
      ];
      break;
    }

    case 'R76_TEMP_EFFECT_NO_LOAD': {
      rawObservations = [
        { stageName: 'Reference Temperature (+20 °C)', temperatureC: 20.2, zeroIndication: 0, deltaL: e * 0.5 },
        { stageName: 'High Temperature (+40 °C)', temperatureC: 40.1, zeroIndication: 0, deltaL: e * 0.49 },
        { stageName: 'Low Temperature (-10 °C)', temperatureC: -9.9, zeroIndication: 0, deltaL: e * 0.51 },
        { stageName: 'Return to Reference (+20 °C)', temperatureC: 20.1, zeroIndication: 0, deltaL: e * 0.5 },
      ];
      break;
    }

    case 'R76_VOLTAGE': {
      const isBatteryOnly = instrument.powerSupply.toLowerCase().includes('battery') && !instrument.powerSupply.toLowerCase().includes('mains');
      if (isBatteryOnly) {
        rawObservations = [
          { supplyCondition: 'Nominal Battery Voltage (6.0 V)', targetVoltageV: 6.0, actualVoltageV: 6.02, load: halfMax, indication: halfMax, response: 'Stable normal weighing' },
          { supplyCondition: 'Reduced Voltage (5.4 V)', targetVoltageV: 5.4, actualVoltageV: 5.41, load: halfMax, indication: halfMax, response: 'Low battery warning annunciator on; weighing within MPE' },
          { supplyCondition: 'Cut-off Voltage (5.0 V)', targetVoltageV: 5.0, actualVoltageV: 4.98, load: halfMax, indication: 0, response: 'Display blanked / inhibited weighing (bAtt-oFF)' },
        ];
      } else {
        rawObservations = [
          { supplyCondition: 'Nominal AC Mains (230 V / 50 Hz)', targetVoltageV: 230, actualVoltageV: 230.2, load: halfMax, indication: halfMax, response: 'Compliant within MPE' },
          { supplyCondition: 'Upper Extreme (+10% = 253 V)', targetVoltageV: 253, actualVoltageV: 252.8, load: halfMax, indication: halfMax, response: 'Compliant within MPE' },
          { supplyCondition: 'Lower Extreme (-15% = 195.5 V)', targetVoltageV: 195.5, actualVoltageV: 195.3, load: halfMax, indication: halfMax, response: 'Compliant within MPE' },
        ];
      }
      break;
    }

    case 'R76_ELECTRICAL_DISTURBANCE': {
      rawObservations = [
        { disturbanceType: 'Voltage Dips & Short Interruptions', testCondition: '0% UT for 0.5 cycles (10 ms)', appliedDisturbance: 'AC Mains dip', load: halfMax, baselineIndication: halfMax, indicationDuringDisturbance: halfMax, significantFaultDetected: 'NO' },
        { disturbanceType: 'Electrical Fast Transient / Bursts', testCondition: '±1.0 kV Power supply lines, 5/50 ns', appliedDisturbance: 'Burst pulses', load: halfMax, baselineIndication: halfMax, indicationDuringDisturbance: halfMax, significantFaultDetected: 'NO' },
        { disturbanceType: 'Electrostatic Discharge (ESD)', testCondition: '6 kV Contact discharge, 8 kV Air discharge', appliedDisturbance: 'Contact & Air ESD', load: halfMax, baselineIndication: halfMax, indicationDuringDisturbance: halfMax, significantFaultDetected: 'NO' },
        { disturbanceType: 'Surge Immunity', testCondition: '1 kV Line-to-line, 2 kV Line-to-ground', appliedDisturbance: '1.2/50 μs Surge pulse', load: halfMax, baselineIndication: halfMax, indicationDuringDisturbance: halfMax, significantFaultDetected: 'NO' },
      ];
      break;
    }

    case 'R76_DAMP_HEAT': {
      rawObservations = [
        { stage: 'Pre-exposure ambient (20 °C, 50% RH)', chamberTempC: 20.4, chamberHumidityRh: 50.2, durationHours: 0, zeroIndication: 0, testLoad: halfMax, testIndication: halfMax },
        { stage: '48 h Damp Heat exposure (+40 °C, 85% RH)', chamberTempC: 40.0, chamberHumidityRh: 85.1, durationHours: 48, zeroIndication: 0, testLoad: halfMax, testIndication: halfMax },
        { stage: '24 h Recovery at ambient (20 °C, 50% RH)', chamberTempC: 20.5, chamberHumidityRh: 51.0, durationHours: 24, zeroIndication: 0.001, testLoad: halfMax, testIndication: halfMax },
      ];
      break;
    }

    case 'R76_SPAN_STABILITY': {
      rawObservations = [
        { runIndex: 1, recordedDate: '2026-09-01 10:00', elapsedDays: 0, load: max, indication: max, temperatureC: 20.2, humidityPercent: 48, pressureHpa: 1013 },
        { runIndex: 2, recordedDate: '2026-09-02 10:15', elapsedDays: 1, load: max, indication: max, temperatureC: 20.3, humidityPercent: 49, pressureHpa: 1014 },
        { runIndex: 3, recordedDate: '2026-09-04 10:00', elapsedDays: 3, load: max, indication: max, temperatureC: 20.5, humidityPercent: 50, pressureHpa: 1012 },
        { runIndex: 4, recordedDate: '2026-09-08 11:00', elapsedDays: 7, load: max, indication: max, temperatureC: 20.1, humidityPercent: 47, pressureHpa: 1015 },
        { runIndex: 5, recordedDate: '2026-09-15 10:30', elapsedDays: 14, load: max, indication: max, temperatureC: 20.4, humidityPercent: 51, pressureHpa: 1011 },
      ];
      break;
    }

    case 'R76_ENDURANCE': {
      rawObservations = [
        { phase: 'Pre-endurance Weighing', load: halfMax, indication: halfMax, deltaL: e * 0.5, cyclesCompleted: 0, observationNote: 'Initial reference weighing completed prior to endurance cycles' },
        { phase: 'Repetitive Loading Cycles', load: halfMax, indication: halfMax, deltaL: e * 0.5, cyclesCompleted: 100000, observationNote: '100,000 cycles completed at approx. 50% Max with automatic pneumatic actuator' },
        { phase: 'Post-endurance Weighing', load: halfMax, indication: halfMax, deltaL: e * 0.49, cyclesCompleted: 100000, observationNote: 'Post-loading intrinsic error verified within applicable MPE' },
      ];
      break;
    }

    case 'R76_TARE': {
      const tareVal = Math.round(max * 0.3 * 1000) / 1000;
      const netVal1 = Math.round(max * 0.2 * 1000) / 1000;
      const netVal2 = Math.round(max * 0.5 * 1000) / 1000;
      rawObservations = [
        { tareLoad: tareVal, grossLoad: tareVal + min, netIndication: min, netDeltaL: e * 0.5 },
        { tareLoad: tareVal, grossLoad: tareVal + netVal1, netIndication: netVal1, netDeltaL: e * 0.49 },
        { tareLoad: tareVal, grossLoad: tareVal + netVal2, netIndication: netVal2, netDeltaL: e * 0.48 },
      ];
      break;
    }

    case 'R76_WARMUP': {
      rawObservations = [
        { elapsedMinutes: 0, zeroReading: 0.0, temperatureC: 20.4 },
        { elapsedMinutes: 5, zeroReading: 0.0002, temperatureC: 20.4 },
        { elapsedMinutes: 15, zeroReading: 0.0004, temperatureC: 20.5 },
        { elapsedMinutes: 30, zeroReading: 0.0005, temperatureC: 20.5 },
      ];
      break;
    }

    default:
      rawObservations = [];
  }
  }
  }

  // Calculation rules execution
  const calcOutput: CalculationResultOutput = (prefillDemoData && isApplicable)
    ? interpretCalculations(
        testDef.procedureDefinition.calculationRule.ruleId,
        rawObservations,
        context
      )
    : {
        calculatedValues: {},
        trace: {},
        summary: {
          passedCount: 0,
          failedCount: 0,
          isAllPassed: true,
          headline: 'No observations recorded yet.',
        },
      };

  // Evaluate compliance
  let compResult: {
    verdict: 'PASS' | 'FAIL' | 'INCOMPLETE' | 'NOT_APPLICABLE' | 'INCONCLUSIVE';
    summaryStatement: string;
    failedPointsCount: number;
    passedPointsCount: number;
    trace?: Record<string, unknown>;
  };

  let status: TestStatusCode;

  if (!isApplicable) {
    status = 'NOT_APPLICABLE';
    compResult = {
      verdict: 'NOT_APPLICABLE',
      summaryStatement: exclusionJustification || 'Not applicable to this instrument configuration per OIML R76-1',
      failedPointsCount: 0,
      passedPointsCount: 0,
    };
  } else if (!prefillDemoData) {
    status = 'NOT_TESTED';
    compResult = {
      verdict: 'INCOMPLETE',
      summaryStatement: 'No observations recorded yet. Enter test measurements to evaluate.',
      failedPointsCount: 0,
      passedPointsCount: 0,
    };
  } else {
    const authComp = interpretCompliance(calcOutput, isApplicable, exclusionJustification);
    compResult = {
      verdict: authComp.verdict,
      summaryStatement: authComp.summaryStatement,
      failedPointsCount: authComp.failedPointsCount,
      passedPointsCount: authComp.passedPointsCount,
      trace: authComp.trace,
    };
    status = authComp.status;
  }

  // Build evidence according to policy (only when prefillDemoData is true)
  const policy = testDef.procedureDefinition.evidencePolicy;
  const minRequiredEvidence = policy.required ? (policy.minItems || 1) : (prefillDemoData ? 1 : 0);
  const evidenceList: TestEvidenceItem[] = [];

  if ((prefillDemoData || policy.required || testDef.pattern === 'PATTERN_B_CHECKLIST') && minRequiredEvidence > 0) {
    const purposes: EvidencePurpose[] = policy.purposes && policy.purposes.length > 0 ? policy.purposes : ['SETUP'];
    for (let i = 0; i < minRequiredEvidence; i++) {
      const purpose: EvidencePurpose = (purposes[i] || purposes[0] || 'SETUP') as EvidencePurpose;
      const suffix = minRequiredEvidence > 1 ? `_${i + 1}` : '';
      const isSealing = purpose === 'IDENTITY' || testDef.code === 'R76_CONSTRUCTION' && i === 1;
      const desc = isSealing
        ? `Physical security sealing arrangement & hardware calibration switch photograph for ${testDef.name}`
        : `Official setup and metrological inspection photograph for ${testDef.name}`;

      evidenceList.push({
        id: `ev-${testDef.code.toLowerCase()}${suffix}`,
        fileName: `${testDef.code.toLowerCase()}_${purpose.toLowerCase()}${suffix}.jpg`,
        fileSizeBytes: 245000 + i * 18500,
        mimeType: 'image/jpeg',
        dataUrl: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/><text x="150" y="90" font-family="sans-serif" font-size="12" font-weight="bold" fill="#1e293b" text-anchor="middle">Metrological Evidence Artifact</text><text x="150" y="115" font-family="sans-serif" font-size="10" fill="#64748b" text-anchor="middle">${testDef.name}</text><text x="150" y="135" font-family="sans-serif" font-size="9" fill="#0284c7" text-anchor="middle">Purpose: ${purpose} • Clause: ${testDef.clause}</text></svg>`),
        sha256Hash: i === 0 ? '7c86a9f4c391d84b2341209b556e4091a1820f4c30c85b1901c87e411b4f492b' : '3f58e1c668924b1d6210f92d47e8bc6f827a51d8b9e604f32371c11d08bc3e41',
        timestamp: '2026-09-27T09:45:00Z',
        description: desc,
        category: isSealing ? 'SEALING' : 'SETUP_PHOTO',
        purpose,
        verifiedByMetrologist: true,
        ocrExtractedValue: isFailedSpecimen && testDef.code === 'R76_WEIGH_INTRINSIC' && i === 0 ? `${max + 0.025} ${instrument.primaryUnit}` : undefined,
        consistencyStatus: isFailedSpecimen && testDef.code === 'R76_WEIGH_INTRINSIC' && i === 0 ? 'DISCREPANCY' : 'CONSISTENT',
      });
    }
  }

  // Demo discrepancy for failed specimen (Evaluation B) on Weighing Performance
  const evidenceDiscrepancies = (prefillDemoData && isFailedSpecimen && testDef.code === 'R76_WEIGH_INTRINSIC')
    ? [
        {
          id: 'disc-demo-01',
          evidenceId: `ev-${testDef.code.toLowerCase()}`,
          fieldKey: 'indication',
          recordedValue: `${max}.000 ${instrument.primaryUnit}`,
          ocrExtractedValue: `${max + 0.025} ${instrument.primaryUnit}`,
          status: 'DISCREPANCY_FLAGGED' as const,
          notes: `Automated camera OCR extracted ${max + 0.025} ${instrument.primaryUnit} but observation record shows ${max}.000 ${instrument.primaryUnit}. Manual laboratory inspection required.`,
          flaggedAt: '2026-09-27T09:48:00Z',
        },
      ]
    : [];

  const structuredRemarks = (prefillDemoData && isFailedSpecimen && testDef.code === 'R76_WEIGH_INTRINSIC')
    ? [
        {
          id: 'rem-01',
          reasonCode: 'INVALID_VALUE' as const,
          description: 'Calculated intrinsic error at Max exceeds permissible OIML Table 6 limits.',
          additionalNote: 'Loadcell linearity degradation observed during increasing load sequence.',
          timestamp: '2026-09-27T10:15:00Z',
          actor: context.operatorName,
        },
      ]
    : [];

  const testRun: TestRunRecord = {
    id: `tr-${testDef.code.toLowerCase().replace(/_/g, '-')}`,
    evaluationId: context.evaluationNumber,
    testCode: testDef.code,
    name: testDef.name,
    clause: testDef.clause,
    purpose: testDef.procedureDefinition.summary,
    instruction: testDef.procedureDefinition.whatIsBeingChecked,
    pattern: testDef.pattern,
    testDefinition: testDef,
    procedureVersion: testDef.procedureDefinition.procedureVersion,
    operator: {
      fullName: context.operatorName,
      role: context.operatorRole,
      email: 'sharma@metrology.gov.in',
    },
    startTime: '2026-09-27T09:30:00Z',
    status,
    isApplicable,
    exclusionJustification,
    equipmentUsed: STANDARD_DEMO_EQUIPMENT,
    environmentalSnapshot: {
      temperatureC: 20.4,
      humidityPercent: 48.2,
      pressureHpa: 1013.2,
      recordedAt: '2026-09-27T09:30:00Z',
    },
    rawObservations,
    calculatedValues: calcOutput.calculatedValues,
    complianceResult: compResult,
    structuredRemarks,
    remarks: isApplicable ? (structuredRemarks[0]?.description || '') : (exclusionJustification || ''),
    evidenceReferences: evidenceList,
    evidence: evidenceList,
    evidenceDiscrepancies,
    correctionsHistory: [],
    retestHistory: [],
    maxCapacity: max,
    data: { ...calcOutput.calculatedValues, maxCapacity: max },
    reviewState: 'UNREVIEWED',
    validationMessages: [],
  };

  // Evaluate validation messages
  const valResult = evaluateValidationRules(testRun, testDef.procedureDefinition.validationRules, context);
  testRun.validationMessages = valResult.messages;
  testRun.inputValidationIssues = valResult.inputIssues;
  testRun.procedureValidationIssues = valResult.procedureIssues;
  if (!testRun.evidenceDiscrepancies || testRun.evidenceDiscrepancies.length === 0) {
    testRun.evidenceDiscrepancies = valResult.evidenceDiscrepancies;
  }

  return testRun;
}

export function buildCompleteEvaluationSuite(
  context: CommonEvaluationContext,
  prefillDemoData: boolean = true
): TestRunRecord[] {
  const definitions = Object.values(TEST_DEFINITIONS_REGISTRY);
  return definitions.map((def) => buildTestRunRecord(def, context, prefillDemoData));
}

