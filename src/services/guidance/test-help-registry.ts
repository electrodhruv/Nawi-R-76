/**
 * Structured Test Help Metadata Registry for NAWI-R76
 *
 * Exposes concise, structured help definitions for every test in the evaluation suite.
 * Used by the Lab Assistant to answer "What is this checking?", "What should I enter?",
 * and "What evidence is needed?" without inventing unapproved responses.
 */

import { TestHelpMetadata } from './knowledge-types';

export const TEST_HELP_REGISTRY: Record<string, TestHelpMetadata> = {
  R76_WEIGH_INTRINSIC: {
    testCode: 'R76_WEIGH_INTRINSIC',
    clause: 'A.4.4',
    testName: 'Weighing Performance: Initial Intrinsic Error Determination',
    purpose:
      'Determine intrinsic weighing errors of the instrument across its entire operational range prior to environmental and endurance stress testing, verifying compliance against Table 6 Maximum Permissible Errors (MPE).',
    setup:
      'Level the instrument using leveling feet and spirit level. Connect to nominal power supply and allow minimum 30-minute thermal stabilization. Zero the scale. Ensure reference standard weights have valid calibration certificates with uncertainty <= 1/3 of MPE.',
    operatorInputs: [
      {
        name: 'Direction',
        symbol: 'Dir',
        description: 'Load sequence direction: INC (increasing from Zero to Max) or DEC (decreasing from Max to Zero).',
        example: 'INC',
      },
      {
        name: 'Nominal Load',
        symbol: 'L',
        description: 'Total standard mass placed on the load receptor.',
        unit: 'kg / g',
        example: '5.000',
      },
      {
        name: 'Indication',
        symbol: 'I',
        description: 'Digital reading observed on the instrument terminal before adding turning-point weights.',
        unit: 'kg / g',
        example: '5.000',
      },
      {
        name: 'Turning Point Weight',
        symbol: 'ΔL',
        description:
          'Small incremental sub-weights (typically 0.1e fractions) added to find the exact point where the digital display switches to the next higher interval (I + d).',
        unit: 'kg / g',
        example: '0.002',
      },
    ],
    calculatedOutputs: [
      {
        name: 'Indication before rounding',
        symbol: 'P',
        formula: 'P = I + 0.5e - ΔL',
        description: 'Continuous indication calculated per OIML R 76-1 Clause A.4.4.3.',
      },
      {
        name: 'Raw Error',
        symbol: 'E',
        formula: 'E = P - L',
        description: 'Difference between indication before rounding and applied standard load.',
      },
      {
        name: 'Zero Error',
        symbol: 'E0',
        formula: 'E0 = E at zero load',
        description: 'Baseline zero error recorded immediately prior to the measurement series.',
      },
      {
        name: 'Corrected Error',
        symbol: 'Ec',
        formula: 'Ec = E - E0',
        description: 'True intrinsic error adjusted for zero datum drift.',
      },
      {
        name: 'Maximum Permissible Error',
        symbol: 'MPE',
        formula: 'OIML Table 6 limit (±0.5e, ±1.0e, or ±1.5e)',
        description: 'Permissible error threshold based on verification scale intervals (m).',
      },
    ],
    requiredConditions:
      'Ambient temperature within 20 °C ± 2 °C; relative humidity between 40% and 70%; stable barometric pressure; draft shield closed if applicable.',
    evidencePolicy:
      'Photographic setup evidence is mandatory at Zero and Maximum capacity (Max), showing the terminal display and receptor load.',
    completionRequirements:
      'At least 5 increasing and 5 decreasing load points must be measured, including Zero, Min, 500e, 2000e, and Max.',
    standardCitation: 'OIML R 76-1:2006 (E), Clause A.4.4',
  },

  R76_REPEATABILITY: {
    testCode: 'R76_REPEATABILITY',
    clause: 'A.4.10',
    testName: 'Repeatability Test',
    purpose:
      'Verify that the instrument provides consistent indications when the same load is applied repeatedly under identical test conditions.',
    setup:
      'Zero the instrument before each series. Do not readjust leveling during the series. Prepare standard weights corresponding to approximately 50% Max and 100% Max.',
    operatorInputs: [
      {
        name: 'Run Number',
        symbol: 'Run #',
        description: 'Sequential iteration of the test series (1 to 10 for Classes I/II; 1 to 3 for Classes III/IIII).',
        example: '1',
      },
      {
        name: 'Nominal Load',
        symbol: 'L',
        description: 'Applied test load (typically 0.5 Max or 1.0 Max).',
        unit: 'kg / g',
        example: '7.500',
      },
      {
        name: 'Indication',
        symbol: 'I',
        description: 'Indicated reading on terminal.',
        unit: 'kg / g',
        example: '7.500',
      },
      {
        name: 'Turning Point Weight',
        symbol: 'ΔL',
        description: 'Sub-weights added to find transition point.',
        unit: 'kg / g',
        example: '0.0025',
      },
    ],
    calculatedOutputs: [
      {
        name: 'Indication before rounding',
        symbol: 'P',
        formula: 'P = I + 0.5e - ΔL',
        description: 'Calculated continuous value for each run.',
      },
      {
        name: 'Range of Readings',
        symbol: 'Span (Pmax - Pmin)',
        formula: 'Span = max(P) - min(P)',
        description: 'Difference between extreme results obtained in the series.',
      },
      {
        name: 'Maximum Permissible Span',
        symbol: 'MPE Span',
        formula: '|MPE| at applied load',
        description: 'Per Clause 3.6.1, span cannot exceed absolute value of MPE at that load.',
      },
    ],
    requiredConditions:
      'Stable room temperature. Load must be applied and removed smoothly without shock.',
    evidencePolicy:
      'Recommended photographic record of display indication on Run #1 and final run.',
    completionRequirements:
      'For Class I and II: minimum 10 weighings at 0.5 Max and 10 at Max. For Class III and IIII: minimum 3 weighings at 0.5 Max and 3 at Max.',
    standardCitation: 'OIML R 76-1:2006 (E), Clause A.4.10 & 3.6.1',
  },

  R76_ECC_STANDARD: {
    testCode: 'R76_ECC_STANDARD',
    clause: 'A.4.7.1',
    testName: 'Eccentricity Test (Standard Load Receptor)',
    purpose:
      'Verify that off-center placement of load does not produce errors exceeding the maximum permissible error for the applied load.',
    setup:
      'Test load shall be approximately 1/3 Max (or Max / 4 for multi-point supports). Center the load successively on the center and each of the 4 quarter sections of the pan.',
    operatorInputs: [
      {
        name: 'Location',
        symbol: 'Pos',
        description: 'Position on receptor: Center, Position 1 (Front-Left), Position 2 (Back-Left), Position 3 (Back-Right), Position 4 (Front-Right).',
        example: 'Position 1',
      },
      {
        name: 'Applied Load',
        symbol: 'L',
        description: 'Test load equal to approximately 1/3 Max.',
        unit: 'kg / g',
        example: '5.000',
      },
      {
        name: 'Indication',
        symbol: 'I',
        description: 'Observed reading.',
        unit: 'kg / g',
        example: '5.000',
      },
      {
        name: 'Turning Point Weight',
        symbol: 'ΔL',
        description: 'Sub-weights added to find transition point.',
        unit: 'kg / g',
        example: '0.002',
      },
    ],
    calculatedOutputs: [
      {
        name: 'Corrected Error',
        symbol: 'Ec',
        formula: 'Ec = (I + 0.5e - ΔL - L) - E0',
        description: 'Corrected error at each off-center position.',
      },
      {
        name: 'Applicable MPE',
        symbol: 'MPE',
        formula: 'Table 6 MPE at 1/3 Max',
        description: 'Maximum permissible error threshold.',
      },
    ],
    requiredConditions:
      'Receptor must be a standard stationary pan or platform. Tilt angle 0°. Center must be zeroed first.',
    evidencePolicy:
      'Photograph of off-center weight placement on at least one corner position.',
    completionRequirements:
      'All 5 designated positions (Center, Pos 1, Pos 2, Pos 3, Pos 4) must be measured.',
    standardCitation: 'OIML R 76-1:2006 (E), Clause A.4.7.1',
  },

  R76_ECC_ROLLING: {
    testCode: 'R76_ECC_ROLLING',
    clause: 'A.4.7.4',
    testName: 'Eccentricity Test (Rolling Track / Weighbridge)',
    purpose:
      'Verify eccentricity tolerance for instruments with rolling track receptors by applying a rolling vehicle axle load at beginning, middle, and end of the track.',
    setup:
      'Applicable only for rolling track receptors (rail weighbridges, vehicle scales). Use standard rolling test block or calibrated vehicle axle load equal to rolling test mass specification.',
    operatorInputs: [
      {
        name: 'Track Position',
        symbol: 'Pos',
        description: 'Beginning of track (Pos 1), Middle of track (Pos 2), End of track (Pos 3).',
        example: 'Beginning of track',
      },
      {
        name: 'Applied Rolling Load',
        symbol: 'L',
        description: 'Rolling standard load applied per axle.',
        unit: 'kg',
        example: '10000',
      },
      {
        name: 'Indication',
        symbol: 'I',
        description: 'Observed terminal indication.',
        unit: 'kg',
        example: '10000',
      },
      {
        name: 'Delta L',
        symbol: 'ΔL',
        description: 'Turning-point weight.',
        unit: 'kg',
        example: '0.5',
      },
    ],
    calculatedOutputs: [
      {
        name: 'Corrected Error',
        symbol: 'Ec',
        formula: 'Ec = P - L - E0',
        description: 'Error at each longitudinal rail track position.',
      },
    ],
    requiredConditions:
      'Receptor type must be ROLLING_TRACK. Test is automatically marked Not Applicable for standard pan scales.',
    evidencePolicy:
      'Photographic evidence of test vehicle/block on track positions.',
    completionRequirements:
      'Measurements at Beginning, Middle, and End of rolling track.',
    standardCitation: 'OIML R 76-1:2006 (E), Clause A.4.7.4',
  },

  R76_CREEP: {
    testCode: 'R76_CREEP',
    clause: 'A.4.11',
    testName: 'Creep and Zero Return Test',
    purpose:
      'Evaluate change of indication under sustained Maximum capacity load for 30 minutes, and measure zero return error 30 seconds after load removal.',
    setup:
      'Zero the instrument. Apply load equal to Maximum capacity (Max) swiftly and smoothly without shock. Start timer immediately.',
    operatorInputs: [
      {
        name: 'Elapsed Time',
        symbol: 'Time',
        description: 'Observation interval: 0 min (immediate), 5 min, 15 min, 30 min, and Zero Return (at 30.5 min).',
        example: '5 min',
      },
      {
        name: 'Indication',
        symbol: 'I',
        description: 'Observed reading at specified timestamp.',
        unit: 'kg / g',
        example: '15.000',
      },
      {
        name: 'Delta L',
        symbol: 'ΔL',
        description: 'Turning-point weight determined at observation time.',
        unit: 'kg / g',
        example: '0.002',
      },
    ],
    calculatedOutputs: [
      {
        name: 'Creep Difference',
        symbol: 'ΔP_creep',
        formula: 'P(30 min) - P(0 min)',
        description: 'Total creep deflection. Must not exceed 0.5e (and difference between 15 min and 30 min must not exceed 0.2e).',
      },
      {
        name: 'Zero Return Error',
        symbol: 'E_zero_return',
        formula: 'P_zero(30.5 min) - P_zero(initial)',
        description: 'Residual error on unloading. Must not exceed 0.5e.',
      },
    ],
    requiredConditions:
      'Ambient temperature must remain constant within ±1 °C throughout the 30-minute interval.',
    evidencePolicy:
      'Photographic record of display at 0 min and 30 min.',
    completionRequirements:
      'All 5 designated time intervals (0m, 5m, 15m, 30m, and Zero Return) recorded.',
    standardCitation: 'OIML R 76-1:2006 (E), Clause A.4.11',
  },

  R76_TILTING: {
    testCode: 'R76_TILTING',
    clause: 'A.5.1',
    testName: 'Tilting Test (Non-Fixed Instruments)',
    purpose:
      'Determine the influence of tilting on instruments without fixed leveling or with spirit level indicators.',
    setup:
      'Applicable to free-standing bench and portable scales. Tilt instrument forward, backward, left, and right to 50:1000 (or spirit level limit). If instrument has automatic leveling, this test is exempt.',
    operatorInputs: [
      {
        name: 'Tilt Orientation',
        symbol: 'Tilt',
        description: 'Level datum, Forward tilt, Backward tilt, Left tilt, Right tilt.',
        example: 'Left tilt (50:1000)',
      },
      {
        name: 'Test Load',
        symbol: 'L',
        description: 'Zero load and load near Max.',
        unit: 'kg / g',
        example: '15.000',
      },
      {
        name: 'Indication & ΔL',
        symbol: 'I, ΔL',
        description: 'Observed reading and turning point under tilt.',
        unit: 'kg / g',
        example: '15.000, 0.002',
      },
    ],
    calculatedOutputs: [
      {
        name: 'Tilt Influence Error',
        symbol: 'Ec_tilt',
        formula: 'P_tilted - L - E0',
        description: 'Error under tilt condition must not exceed Table 6 MPE.',
      },
    ],
    requiredConditions:
      'Clean tilt test fixture with calibrated angle indicator.',
    evidencePolicy:
      'Photo of level vial showing bubble at edge of ring or tilt fixture angle indicator.',
    completionRequirements:
      'Measurements at Level, Forward, Backward, Left, and Right orientations.',
    standardCitation: 'OIML R 76-1:2006 (E), Clause A.5.1',
  },

  R76_TEMP_STATIC: {
    testCode: 'R76_TEMP_STATIC',
    clause: 'A.5.3',
    testName: 'Static Temperature Test',
    purpose:
      'Evaluate instrument performance at temperature extremes within the specified operational temperature limits (e.g. -10 °C to +40 °C).',
    setup:
      'Place instrument in climatic chamber. Connect power and standard weights through chamber port or inside chamber. Stabilize for minimum 2 hours at each test temperature.',
    operatorInputs: [
      {
        name: 'Chamber Temperature',
        symbol: 'T (°C)',
        description: 'Nominal 20 °C, Upper limit (e.g. +40 °C), Lower limit (e.g. -10 °C), Return to 20 °C.',
        example: '40 °C',
      },
      {
        name: 'Relative Humidity',
        symbol: 'RH (%)',
        description: 'Monitored chamber humidity.',
        example: '50 %',
      },
      {
        name: 'Weighing Series',
        symbol: 'L, I, ΔL',
        description: 'Weighing run at Min, 500e, 2000e, Max.',
        example: 'Loads from Min to Max',
      },
    ],
    calculatedOutputs: [
      {
        name: 'Temperature Span Coefficient',
        symbol: 'TC',
        formula: '|Ec(T2) - Ec(T1)| / |T2 - T1|',
        description: 'Zero and span drift per degree Celsius must remain within OIML limits.',
      },
    ],
    requiredConditions:
      'Rate of temperature change shall not exceed 1 °C/min during ramp. 2 hours stabilization at steady state.',
    evidencePolicy:
      'Climatic chamber temperature recorder log and certificate.',
    completionRequirements:
      'Complete weighing series at Reference (20°C), High Temp (+40°C), Low Temp (-10°C), and Recovery (20°C).',
    standardCitation: 'OIML R 76-1:2006 (E), Clause 3.9.2.1, 3.9.2.2 & A.5.3.1',
  },

  R76_TEMP_EFFECT_NO_LOAD: {
    testCode: 'R76_TEMP_EFFECT_NO_LOAD',
    clause: '3.9.2.3, A.5.3.2',
    testName: 'Temperature Effect on No-Load Indication',
    purpose:
      'Determine that zero indication drift does not exceed 1e per 5 °C (or 0.2e per 5 °C for Class I) across the statutory temperature range.',
    setup:
      'Zero the instrument at reference temperature (+20 °C). At each temperature stage (High, Low, Reference), record the zero indication without re-zeroing.',
    operatorInputs: [
      {
        name: 'Chamber Temperature',
        symbol: 'T',
        description: 'Ambient temperature inside climatic chamber.',
        unit: '°C',
        example: '40.0',
      },
      {
        name: 'Zero Indication',
        symbol: 'I0',
        description: 'Observed reading at zero load.',
        unit: 'kg / g',
        example: '0.000',
      },
      {
        name: 'ΔL at Zero',
        symbol: 'ΔL',
        description: 'Additional load added to determine zero turning point.',
        unit: 'kg / g',
        example: '0.002',
      },
    ],
    calculatedOutputs: [
      {
        name: 'Zero Drift per 5 °C',
        symbol: 'ΔE0/5°C',
        formula: '|P0(T2) - P0(T1)| * 5 / |T2 - T1|',
        description: 'Zero drift per 5 °C difference shall not exceed 1 e (0.2 e for Class I).',
      },
    ],
    requiredConditions:
      'Minimum 2 hours stabilization at steady-state temperature before recording zero indication.',
    evidencePolicy:
      'Environmental chamber temperature and zero reading display photograph.',
    completionRequirements:
      'Zero indications recorded across reference, high, low, and return reference stages.',
    standardCitation: 'OIML R 76-1:2006 (E), Clause 3.9.2.3 & A.5.3.2',
  },
};

/**
 * Returns structured help metadata for a test code, with fallback to default intrinsic weighing.
 */
export function getTestHelpMetadata(testCode?: string): TestHelpMetadata {
  if (testCode) {
    if (TEST_HELP_REGISTRY[testCode]) {
      return TEST_HELP_REGISTRY[testCode];
    }
    if (testCode === 'R76_ECCENTRICITY' && TEST_HELP_REGISTRY['R76_ECC_STANDARD']) {
      return { ...TEST_HELP_REGISTRY['R76_ECC_STANDARD'], testCode: 'R76_ECCENTRICITY' };
    }
    if (testCode === 'R76_TEMPERATURE' && TEST_HELP_REGISTRY['R76_TEMP_STATIC']) {
      return { ...TEST_HELP_REGISTRY['R76_TEMP_STATIC'], testCode: 'R76_TEMPERATURE' };
    }
  }
  return TEST_HELP_REGISTRY['R76_WEIGH_INTRINSIC'];
}
