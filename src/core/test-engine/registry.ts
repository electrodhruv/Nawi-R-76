/**
 * Declarative Test Definitions Registry for NAWI-R76
 *
 * Implements authoritative declarative definitions for all 22 OIML R 76 evaluation tests:
 * 1. Administrative & Markings Examination (Clause 3.10, 4.1) [Checklist]
 * 2. Technical Construction, Security Sealing & Software (Clause 3.10, 4.1–18) [Checklist]
 * 3. Weighing Performance: Initial Intrinsic Error (Clause 3.5.1, A.4.4) [Measurement Table]
 * 4. Eccentricity with Standard Weights (Clause 3.6.2, A.4.7.1–A.4.7.3) [Measurement Table / Grid]
 * 5. Eccentricity with Rolling Load (Clause 3.6.2.4, A.4.7.4) [Measurement Table]
 * 6. Eccentricity on Mobile / Suspended Instruments (Clause 3.6.2.5, A.4.7.5) [Measurement Table]
 * 7. Discrimination Test (Clause 3.8, A.4.8) [Measurement Table]
 * 8. Sensitivity for Non-Self-Indicating Instruments (Clause 3.7, A.4.9) [Measurement Table]
 * 9. Type Examination Repeatability Test (Clause 3.6.1, A.4.10) [Measurement Table]
 * 10. Creep Test under Constant Load (Clause 3.9.4.1, A.4.11.1) [Time Series]
 * 11. Zero Return Residual Error Test (Clause 3.9.4.2, A.4.11.2) [Measurement Table]
 * 12. Stability of Equilibrium Interlocking Test (Clause 4.4.2, A.4.12) [Checklist]
 * 13. Weighing Test with Tare Device (Clause 4.6, A.4.5) [Measurement Table]
 * 14. Tilting Sensitivity Test (Clause 3.9.1.1, A.5.1) [Environmental / Stress]
 * 15. Warm-up Time Test (Clause 5.3.5, A.5.2) [Time Series]
 * 16. Static Temperature Weighing Sequence Test (Clause 3.9.2.1, 3.9.2.2, A.5.3.1) [Environmental / Stress]
 * 17. Temperature Effect on No-Load Indication (Clause 3.9.2.3, A.5.3.2) [Time Series]
 * 18. Voltage Variation Test (Clause 3.9.3, A.5.4) [Environmental / Stress]
 * 19. Electrical Disturbances Immunity Test (Clause 5.4.3, Annex B.3) [Measurement Table]
 * 20. Damp Heat Steady State Test (Clause 3.9.2.4, Annex B.2) [Environmental / Stress]
 * 21. Span Stability Test (Clause 3.9.5, Annex B.4) [Time Series]
 * 22. Endurance Repetitive Loading Test (Clause 3.9.4.3, Clause A.6) [Environmental / Stress]
 */

import { TestDefinition } from './types';

export const TEST_DEFINITIONS_REGISTRY: Record<string, TestDefinition> = {
  // ==========================================================================
  // 1. ADMINISTRATIVE EXAMINATION (Clause 3.10, 4.1) [Pattern B: Checklist]
  // ==========================================================================
  R76_ADMIN_MARKINGS: {
    id: 'R76_ADMIN_MARKINGS',
    code: 'R76_ADMIN_MARKINGS',
    name: 'Administrative & Markings Examination',
    clause: '3.10, 4.1',
    standard: 'OIML R 76-1:2006',
    category: 'EXAMINATION',
    pattern: 'PATTERN_B_CHECKLIST',
    purpose: 'Verify presence, clarity, and permanence of all mandatory statutory descriptive markings and stamping areas.',
    applicableClasses: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'],
    applicability: {
      applicableClasses: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'],
    },
    completionRules: {
      minObservations: 5,
      requiredFields: ['requirement', 'clause', 'observation', 'status'],
    },
    reportMapping: {
      reportItemNumber: '1',
      reportItemTitle: 'Administrative & Markings Examination',
      formNumber: 'R76-2 Form 1',
      isTopLevelReportItem: true,
    },
    procedureDefinition: {
      procedureVersion: '2006.1',
      pattern: 'PATTERN_B_CHECKLIST',
      summary: 'Verify presence, clarity, and permanence of all mandatory statutory descriptive markings and stamping areas.',
      whatIsBeingChecked: 'Clause 3.10 and 4.1 require permanent inscription of manufacturer identity, accuracy class, Max, Min, e, d, serial number, and pattern approval mark.',
      setupInstructions: [
        'Inspect nameplate on the main fascia or data badge adjacent to the weight display.',
        'Verify software version display sequence upon instrument power-on.',
        'Ensure descriptive markings are indelible and clearly legible.',
      ],
      requiredInputs: ['instrumentNameplate', 'softwareVersion'],
      requiredObservations: ['requirement', 'observation', 'status'],
      observationSchema: {
        layout: 'CHECKLIST',
        fields: [
          { key: 'requirement', label: 'Requirement', type: 'STRING', required: true, readOnly: true },
          { key: 'clause', label: 'Clause', type: 'STRING', required: true, readOnly: true },
          { key: 'observation', label: 'Observed Condition', type: 'STRING', required: false },
          { key: 'status', label: 'Status', type: 'SELECT', required: true, options: [{ label: 'PASS', value: 'PASS' }, { label: 'FAIL', value: 'FAIL' }, { label: 'NOT_APPLICABLE', value: 'NOT_APPLICABLE' }] },
        ],
        minObservations: 5,
      },
      validationRules: [
        { id: 'v-admin-all', ruleType: 'REQUIRED_FIELDS', description: 'All administrative checklist items must be reviewed and given an observation note.', severity: 'BLOCKING' },
        { id: 'v-admin-photo', ruleType: 'EVIDENCE_ATTACHED', description: 'Nameplate photograph is mandatory for administrative compliance.', severity: 'BLOCKING' },
      ],
      calculationRule: { ruleId: 'CALC_CHECKLIST' },
      complianceRule: {
        ruleId: 'COMP_CHECKLIST',
        clause: '3.10, 4.1',
        description: 'All applicable markings must pass without defect or omission.',
      },
      evidencePolicy: {
        level: 'REQUIRED',
        required: true,
        purposes: ['IDENTITY'],
        minItems: 1,
        recommendedTypes: ['NAMEPLATE', 'DOCUMENT'],
        explanation: 'Clear photograph of the instrument identification nameplate showing model, serial number, Max, Min, and e.',
      },
    },
  },

  // ==========================================================================
  // 2. TECHNICAL CONSTRUCTION & SEALING (Clause 3.10, 4.1–18) [Pattern B: Checklist]
  // ==========================================================================
  R76_CONSTRUCTION: {
    id: 'R76_CONSTRUCTION',
    code: 'R76_CONSTRUCTION',
    name: 'Technical Construction & Security Sealing',
    clause: '3.10, 4.1–18',
    standard: 'OIML R 76-1:2006',
    category: 'EXAMINATION',
    pattern: 'PATTERN_B_CHECKLIST',
    purpose: 'Verify mechanical build quality, leveling device, security sealing arrangements, and software integrity protections.',
    applicableClasses: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'],
    applicability: {
      applicableClasses: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'],
    },
    completionRules: {
      minObservations: 5,
      requiredFields: ['requirement', 'clause', 'observation', 'status'],
    },
    reportMapping: {
      reportItemNumber: '2',
      reportItemTitle: 'Technical Construction & Security Sealing',
      formNumber: 'R76-2 Form 2',
      isTopLevelReportItem: true,
    },
    procedureDefinition: {
      procedureVersion: '2006.1',
      pattern: 'PATTERN_B_CHECKLIST',
      summary: 'Verify mechanical build quality, leveling device, security sealing arrangements, and software integrity protections.',
      whatIsBeingChecked: 'Clauses 4.1 through 4.18 mandate physical protection against fraudulent adjustment, spirit bubble level visibility, and software audit trails.',
      setupInstructions: [
        'Examine physical seals (wire or tamper-evident sticker) protecting calibration switches.',
        'Inspect level indicator bubble and adjustable leveling feet.',
        'Verify zero-setting and tare controls operate strictly within prescribed limits.',
      ],
      requiredInputs: ['sealingArrangement', 'auditTrailCounter'],
      requiredObservations: ['requirement', 'observation', 'status'],
      observationSchema: {
        layout: 'CHECKLIST',
        fields: [
          { key: 'requirement', label: 'Requirement', type: 'STRING', required: true, readOnly: true },
          { key: 'clause', label: 'Clause', type: 'STRING', required: true, readOnly: true },
          { key: 'observation', label: 'Observed Condition', type: 'STRING', required: false },
          { key: 'status', label: 'Status', type: 'SELECT', required: true, options: [{ label: 'PASS', value: 'PASS' }, { label: 'FAIL', value: 'FAIL' }, { label: 'NOT_APPLICABLE', value: 'NOT_APPLICABLE' }] },
        ],
        minObservations: 5,
      },
      validationRules: [
        { id: 'v-const-all', ruleType: 'REQUIRED_FIELDS', description: 'All construction examination items must be evaluated.', severity: 'BLOCKING' },
        { id: 'v-const-photo', ruleType: 'EVIDENCE_ATTACHED', description: 'Complete instrument photograph and sealing arrangement photo required.', severity: 'BLOCKING' },
      ],
      calculationRule: { ruleId: 'CALC_CHECKLIST' },
      complianceRule: {
        ruleId: 'COMP_CHECKLIST',
        clause: '3.10, 4.1–18',
        description: 'Construction and sealing must comply with all mandatory metrological safeguards.',
      },
      evidencePolicy: {
        level: 'REQUIRED',
        required: true,
        purposes: ['SETUP', 'IDENTITY'],
        minItems: 2,
        recommendedTypes: ['SEALING', 'SETUP_PHOTO'],
        explanation: 'Photographs of the physical security seal and overall construction.',
      },
    },
  },

  // ==========================================================================
  // 3. WEIGHING PERFORMANCE (Clause 3.5.1, A.4.4) [Pattern A: Measurement Table]
  // ==========================================================================
  R76_WEIGH_INTRINSIC: {
    id: 'R76_WEIGH_INTRINSIC',
    code: 'R76_WEIGH_INTRINSIC',
    name: 'Weighing Performance: Initial Intrinsic Error',
    clause: '3.5.1, A.4.4',
    standard: 'OIML R 76-1:2006',
    category: 'METROLOGICAL',
    pattern: 'PATTERN_A_MEASUREMENT_TABLE',
    purpose: 'Determine intrinsic error of the instrument with at least 10 test loads, increasing and decreasing, including Min, Max, and MPE transition points.',
    applicableClasses: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'],
    applicability: {
      applicableClasses: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'],
    },
    completionRules: {
      minObservations: 5,
      requiredDirections: ['INC', 'DEC'],
      requiresReturnToZero: true,
      requiresAllLoadsWithinCapacity: true,
    },
    reportMapping: {
      reportItemNumber: '3',
      reportItemTitle: 'Weighing Performance (Initial Intrinsic Error)',
      formNumber: 'R76-2 Form 3',
      isTopLevelReportItem: true,
    },
    procedureDefinition: {
      procedureVersion: '2006.1',
      pattern: 'PATTERN_A_MEASUREMENT_TABLE',
      summary: 'Determine intrinsic errors of the instrument across increasing and decreasing load sequences at standard test conditions.',
      whatIsBeingChecked: 'Clause 3.5.1 and A.4.4 evaluate corrected errors Ec = (P - L) - E0 against Table 6 Maximum Permissible Errors (MPE) for the accuracy class at Min, step transitions, and Max.',
      setupInstructions: [
        'Zero the instrument before loading.',
        'Apply at least 5 representative test loads in an ascending sequence up to Max, including Min and MPE boundary steps.',
        'Apply additional load ΔL in 0.1e increments until the indication unambiguously increments by 1d to determine turning point P = I + 0.5e - ΔL.',
        'Follow ascending sequence to Max, then descending sequence to zero.',
      ],
      requiredInputs: ['load', 'indication', 'deltaL'],
      requiredObservations: ['load', 'indication', 'deltaL', 'direction'],
      observationSchema: {
        layout: 'TABLE',
        fields: [
          { key: 'direction', label: 'Direction', type: 'SELECT', required: true, options: [{ label: 'Ascending (INC)', value: 'INC' }, { label: 'Descending (DEC)', value: 'DEC' }] },
          { key: 'load', label: 'Load (L)', type: 'NUMBER', required: true, unitKey: 'primaryUnit', min: 0 },
          { key: 'indication', label: 'Indication (I)', type: 'NUMBER', required: true, unitKey: 'primaryUnit', min: 0 },
          { key: 'deltaL', label: 'ΔL Added', type: 'NUMBER', required: true, unitKey: 'primaryUnit', min: 0, helpText: 'Additional load added to reach next indication turning point' },
        ],
        minObservations: 5,
        allowAddRows: true,
        allowDeleteRows: true,
      },
      validationRules: [
        { id: 'v-wgh-count', ruleType: 'OBSERVATION_COUNT', min: 5, description: 'At least 5 load points are required (Min, 500e, 2000e, Max, zero return).', severity: 'BLOCKING' },
        { id: 'v-wgh-fields', ruleType: 'REQUIRED_FIELDS', description: 'Load, Indication, and ΔL are required for every point.', severity: 'BLOCKING' },
        { id: 'v-wgh-cap', ruleType: 'LOAD_WITHIN_CAPACITY', description: 'Loads must not exceed certified maximum capacity.', severity: 'BLOCKING' },
        { id: 'v-wgh-equip', ruleType: 'EQUIPMENT_CALIBRATION_VALID', description: 'Calibrated standard mass set must be assigned.', severity: 'BLOCKING' },
      ],
      calculationRule: { ruleId: 'CALC_WEIGHING_INTRINSIC' },
      complianceRule: {
        ruleId: 'COMP_TABLE_6',
        clause: '3.5.1, A.4.4',
        mpeSource: 'TABLE_6',
        description: 'Corrected error Ec = (P - L) - E0 must not exceed Table 6 maximum permissible errors.',
      },
      evidencePolicy: {
        level: 'RECOMMENDED',
        required: true,
        purposes: ['SETUP', 'RESULT'],
        minItems: 1,
        recommendedTypes: ['SETUP_PHOTO', 'OBSERVATION'],
        explanation: 'Photograph showing representative instrument display under test with standard weights applied.',
      },
    },
  },

  // ==========================================================================
  // 4. ECCENTRICITY: ORDINARY RECEPTORS (Clause 3.6.2, A.4.7.1–A.4.7.3) [Pattern A]
  // ==========================================================================
  R76_ECCENTRICITY: {
    id: 'R76_ECCENTRICITY',
    code: 'R76_ECCENTRICITY',
    name: 'Eccentricity with Standard Weights',
    clause: '3.6.2, A.4.7.1–A.4.7.3',
    standard: 'OIML R 76-1:2006',
    category: 'METROLOGICAL',
    pattern: 'PATTERN_A_MEASUREMENT_TABLE',
    purpose: 'Verify that load indication is insensitive to the position of load on standard load receptor with standard weights.',
    applicableClasses: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'],
    applicability: {
      applicableClasses: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'],
      excludedReceptorTypes: ['ROLLING_LOAD', 'ROLLING_TRACK', 'MOBILE', 'CRANE', 'HANGING'],
    },
    completionRules: {
      minObservations: 5,
      requiredFields: ['position', 'load', 'indication', 'deltaL'],
    },
    reportMapping: {
      reportItemNumber: '4.1',
      reportItemTitle: 'Eccentricity Loading with Standard Weights',
      formNumber: 'R76-2 Form 4',
      isTopLevelReportItem: false,
      parentReportItemNumber: '4',
      parentReportItemTitle: 'Eccentricity (Clause 3.6.2, A.4.7)',
    },
    procedureDefinition: {
      procedureVersion: '2006.1',
      pattern: 'PATTERN_A_MEASUREMENT_TABLE',
      summary: 'Apply eccentric load (typically 1/3 Max for <= 4 supports) across center and 4 quarter positions.',
      whatIsBeingChecked: 'Clause 3.6.2 requires that the difference between the indications obtained in different positions shall not exceed the maximum permissible error.',
      setupInstructions: [
        'Place load equal to 1/3 Max at center of load receptor and note indication and turning point.',
        'Deposit identical load successively in each of the 4 quarter sections without excessive shock.',
        'Calculate error difference between each eccentric position and center reference.',
      ],
      requiredInputs: ['load', 'indication', 'deltaL', 'position'],
      requiredObservations: ['position', 'load', 'indication', 'deltaL'],
      observationSchema: {
        layout: 'LOCATION_GRID',
        fields: [
          { key: 'position', label: 'Position / Quadrant', type: 'STRING', required: true, readOnly: true },
          { key: 'load', label: 'Test Load (L)', type: 'NUMBER', required: true, unitKey: 'primaryUnit' },
          { key: 'indication', label: 'Indication (I)', type: 'NUMBER', required: true, unitKey: 'primaryUnit' },
          { key: 'deltaL', label: 'ΔL Added', type: 'NUMBER', required: true, unitKey: 'primaryUnit' },
        ],
        minObservations: 5,
      },
      validationRules: [
        { id: 'v-ecc-all', ruleType: 'REQUIRED_FIELDS', description: 'All 5 positions (Center and 4 quadrants) must have observations.', severity: 'BLOCKING' },
        { id: 'v-ecc-photo', ruleType: 'EVIDENCE_ATTACHED', description: 'At least one photo showing eccentric load placement required.', severity: 'BLOCKING' },
      ],
      calculationRule: { ruleId: 'CALC_ECCENTRICITY' },
      complianceRule: {
        ruleId: 'COMP_TABLE_6',
        clause: '3.6.2, A.4.7.1–A.4.7.3',
        mpeSource: 'TABLE_6',
        description: 'Error difference relative to center reading must not exceed Table 6 MPE (1 e).',
      },
      evidencePolicy: {
        level: 'REQUIRED',
        required: true,
        purposes: ['LOAD_POSITION'],
        minItems: 1,
        recommendedTypes: ['SETUP_PHOTO'],
        explanation: 'Photograph showing weight set placed at an off-center quadrant on the receptor.',
      },
    },
  },

  // ==========================================================================
  // 5. ECCENTRICITY: ROLLING LOAD (Clause 3.6.2.4, A.4.7.4) [Pattern A]
  // ==========================================================================
  R76_ECC_ROLLING: {
    id: 'R76_ECC_ROLLING',
    code: 'R76_ECC_ROLLING',
    name: 'Eccentricity with Rolling Load',
    clause: '3.6.2.4, A.4.7.4',
    standard: 'OIML R 76-1:2006',
    category: 'METROLOGICAL',
    pattern: 'PATTERN_A_MEASUREMENT_TABLE',
    purpose: 'Verify eccentricity performance under rolling axle loads along tracks or rails for weighbridges and overhead track scales.',
    applicableClasses: ['CLASS_III', 'CLASS_IIII'],
    applicability: {
      applicableClasses: ['CLASS_III', 'CLASS_IIII'],
      requiresReceptorType: ['ROLLING_LOAD', 'ROLLING_TRACK', 'WEIGHBRIDGE'],
    },
    completionRules: {
      minObservations: 4,
      requiredFields: ['trackPosition', 'direction', 'load', 'indication', 'deltaL'],
    },
    reportMapping: {
      reportItemNumber: '4.2',
      reportItemTitle: 'Eccentricity with Rolling Load',
      formNumber: 'R76-2 Form 4',
      isTopLevelReportItem: false,
      parentReportItemNumber: '4',
      parentReportItemTitle: 'Eccentricity (Clause 3.6.2, A.4.7)',
    },
    procedureDefinition: {
      procedureVersion: '2006.1',
      pattern: 'PATTERN_A_MEASUREMENT_TABLE',
      summary: 'Move rolling test load along designated track positions (beginning, middle, end) in forward and reverse directions.',
      whatIsBeingChecked: 'Clause 3.6.2.4 and A.4.7.4 evaluate errors under a rolling axle load moved along the rail or track segment.',
      setupInstructions: [
        'Position rolling axle load at beginning of track segment.',
        'Record indication and turning point.',
        'Roll load to middle, then end, repeating in reverse direction.',
      ],
      requiredInputs: ['load', 'indication', 'deltaL', 'trackPosition'],
      requiredObservations: ['trackPosition', 'direction', 'load', 'indication', 'deltaL'],
      observationSchema: {
        layout: 'TABLE',
        fields: [
          { key: 'trackPosition', label: 'Track Position', type: 'STRING', required: true },
          { key: 'direction', label: 'Traffic Direction', type: 'SELECT', required: true, options: [{ label: 'Forward', value: 'FORWARD' }, { label: 'Reverse', value: 'REVERSE' }] },
          { key: 'load', label: 'Axle Load', type: 'NUMBER', required: true, unitKey: 'primaryUnit' },
          { key: 'indication', label: 'Indication', type: 'NUMBER', required: true, unitKey: 'primaryUnit' },
          { key: 'deltaL', label: 'ΔL', type: 'NUMBER', required: true, unitKey: 'primaryUnit' },
        ],
        minObservations: 4,
        allowAddRows: true,
      },
      validationRules: [
        { id: 'v-ecc-roll-count', ruleType: 'OBSERVATION_COUNT', min: 4, description: 'Minimum 4 track points required for rolling eccentricity.', severity: 'BLOCKING' },
      ],
      calculationRule: { ruleId: 'CALC_ECCENTRICITY' },
      complianceRule: {
        ruleId: 'COMP_TABLE_6',
        clause: '3.6.2.4, A.4.7.4',
        mpeSource: 'TABLE_6',
        description: 'Errors under rolling load must not exceed Table 6 MPE.',
      },
      evidencePolicy: {
        level: 'RECOMMENDED',
        required: false,
        purposes: ['LOAD_POSITION'],
        minItems: 0,
        recommendedTypes: ['SETUP_PHOTO'],
        explanation: 'Photograph of rolling test vehicle on rail/track.',
      },
    },
  },

  // ==========================================================================
  // 6. ECCENTRICITY: MOBILE INSTRUMENTS (Clause 3.6.2.5, A.4.7.5) [Pattern A]
  // ==========================================================================
  R76_ECC_MOBILE: {
    id: 'R76_ECC_MOBILE',
    code: 'R76_ECC_MOBILE',
    name: 'Eccentricity on Mobile / Suspended Instruments',
    clause: '3.6.2.5, A.4.7.5',
    standard: 'OIML R 76-1:2006',
    category: 'METROLOGICAL',
    pattern: 'PATTERN_A_MEASUREMENT_TABLE',
    purpose: 'Verify that off-center and tilted suspension on mobile, crane, or hanging instruments does not induce errors beyond MPE.',
    applicableClasses: ['CLASS_III', 'CLASS_IIII'],
    applicability: {
      applicableClasses: ['CLASS_III', 'CLASS_IIII'],
      requiresReceptorType: ['MOBILE', 'CRANE', 'HANGING', 'PALLET'],
    },
    completionRules: {
      minObservations: 4,
      requiredFields: ['suspensionPosture', 'load', 'indication', 'deltaL'],
    },
    reportMapping: {
      reportItemNumber: '4.3',
      reportItemTitle: 'Eccentricity on Mobile / Suspended Instruments',
      formNumber: 'R76-2 Form 4',
      isTopLevelReportItem: false,
      parentReportItemNumber: '4',
      parentReportItemTitle: 'Eccentricity (Clause 3.6.2, A.4.7)',
    },
    procedureDefinition: {
      procedureVersion: '2006.1',
      pattern: 'PATTERN_A_MEASUREMENT_TABLE',
      summary: 'Evaluate load receptor under off-center loading and allowable tilt/inclination postures.',
      whatIsBeingChecked: 'Clause 3.6.2.5 and A.4.7.5 evaluate mobile scales (crane, pallet truck) under tilted or off-axis loading.',
      setupInstructions: [
        'Apply 1/3 Max test load at center suspension.',
        'Incline or tilt suspension to limiting angles allowed by manufacturer.',
        'Record indication and turning point.',
      ],
      requiredInputs: ['load', 'indication', 'deltaL', 'suspensionPosture'],
      requiredObservations: ['suspensionPosture', 'load', 'indication', 'deltaL'],
      observationSchema: {
        layout: 'TABLE',
        fields: [
          { key: 'suspensionPosture', label: 'Suspension Posture', type: 'STRING', required: true },
          { key: 'load', label: 'Test Load', type: 'NUMBER', required: true, unitKey: 'primaryUnit' },
          { key: 'indication', label: 'Indication', type: 'NUMBER', required: true, unitKey: 'primaryUnit' },
          { key: 'deltaL', label: 'ΔL', type: 'NUMBER', required: true, unitKey: 'primaryUnit' },
        ],
        minObservations: 4,
      },
      validationRules: [
        { id: 'v-ecc-mob-count', ruleType: 'OBSERVATION_COUNT', min: 4, description: 'Minimum 4 posture observations required.', severity: 'BLOCKING' },
      ],
      calculationRule: { ruleId: 'CALC_ECCENTRICITY' },
      complianceRule: {
        ruleId: 'COMP_TABLE_6',
        clause: '3.6.2.5, A.4.7.5',
        mpeSource: 'TABLE_6',
        description: 'Errors under mobile inclination postures must not exceed Table 6 MPE.',
      },
      evidencePolicy: {
        level: 'RECOMMENDED',
        required: false,
        purposes: ['LOAD_POSITION'],
        minItems: 0,
        recommendedTypes: ['SETUP_PHOTO'],
        explanation: 'Photograph of tilted suspension posture.',
      },
    },
  },

  // ==========================================================================
  // 7. DISCRIMINATION (Clause 3.8, A.4.8) [Pattern A: Measurement Table]
  // ==========================================================================
  R76_DISCRIMINATION: {
    id: 'R76_DISCRIMINATION',
    code: 'R76_DISCRIMINATION',
    name: 'Discrimination Test (1.4d additional load)',
    clause: '3.8, A.4.8',
    standard: 'OIML R 76-1:2006',
    category: 'METROLOGICAL',
    pattern: 'PATTERN_A_MEASUREMENT_TABLE',
    purpose: 'Verify that an additional load of 1.4d smoothly applied to instrument in equilibrium produces an unambiguous increase in indication of at least 1d.',
    applicableClasses: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'],
    applicability: {
      applicableClasses: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'],
    },
    completionRules: {
      minObservations: 3,
      requiredFields: ['loadPoint', 'baseLoad', 'baseIndication', 'extraLoad_1_4d', 'newIndication'],
    },
    reportMapping: {
      reportItemNumber: '5',
      reportItemTitle: 'Discrimination Test',
      formNumber: 'R76-2 Form 5',
      isTopLevelReportItem: true,
    },
    procedureDefinition: {
      procedureVersion: '2006.1',
      pattern: 'PATTERN_A_MEASUREMENT_TABLE',
      summary: 'Deposit an extra load of 1.4d smoothly onto the load receptor at Min, 1/2 Max, and Max.',
      whatIsBeingChecked: 'Clause 3.8 and A.4.8 require that an additional load of 1.4d gently placed on the loaded instrument shall cause the display to advance by at least 1d.',
      setupInstructions: [
        'Establish stable equilibrium at specified load point (Min, 1/2 Max, or Max).',
        'Gently deposit small weight equal to 1.4d onto receptor without causing excessive vibration.',
        'Observe if digital indication advances decisively by at least 1d.',
      ],
      requiredInputs: ['baseLoad', 'baseIndication', 'extraLoad_1_4d', 'newIndication'],
      requiredObservations: ['loadPoint', 'baseLoad', 'baseIndication', 'extraLoad_1_4d', 'newIndication'],
      observationSchema: {
        layout: 'DISCRIMINATION_POINTS',
        fields: [
          { key: 'loadPoint', label: 'Load Point', type: 'STRING', required: true, readOnly: true },
          { key: 'baseLoad', label: 'Base Load', type: 'NUMBER', required: true, unitKey: 'primaryUnit' },
          { key: 'baseIndication', label: 'Initial Indication (I1)', type: 'NUMBER', required: true, unitKey: 'primaryUnit' },
          { key: 'extraLoad_1_4d', label: 'Extra Load (1.4d)', type: 'NUMBER', required: true, unitKey: 'primaryUnit' },
          { key: 'newIndication', label: 'New Indication (I2)', type: 'NUMBER', required: true, unitKey: 'primaryUnit' },
        ],
        minObservations: 3,
      },
      validationRules: [
        { id: 'v-disc-all', ruleType: 'REQUIRED_FIELDS', description: 'Observations at Min, 1/2 Max, and Max required.', severity: 'BLOCKING' },
      ],
      calculationRule: { ruleId: 'CALC_DISCRIMINATION' },
      complianceRule: {
        ruleId: 'COMP_DISCRIMINATION',
        clause: '3.8, A.4.8',
        description: 'Display must advance by at least 1d upon deposition of 1.4d extra mass.',
      },
      evidencePolicy: {
        level: 'OPTIONAL',
        required: false,
        purposes: ['RESULT'],
        minItems: 0,
        recommendedTypes: ['OBSERVATION'],
        explanation: 'Discrimination test display photograph.',
      },
    },
  },

  // ==========================================================================
  // 8. SENSITIVITY (Clause 3.7, A.4.9) [Pattern A: Measurement Table]
  // ==========================================================================
  R76_SENSITIVITY: {
    id: 'R76_SENSITIVITY',
    code: 'R76_SENSITIVITY',
    name: 'Sensitivity for Non-Self-Indicating Instruments',
    clause: '3.7, A.4.9',
    standard: 'OIML R 76-1:2006',
    category: 'METROLOGICAL',
    pattern: 'PATTERN_A_MEASUREMENT_TABLE',
    purpose: 'Determine displacement response for non-self-indicating balances by application of an extra mass equal to |MPE|.',
    applicableClasses: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'],
    applicability: {
      applicableClasses: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'],
      requiresScaleType: ['NON_SELF_INDICATING', 'MECHANICAL'],
    },
    completionRules: {
      minObservations: 2,
      requiredFields: ['loadPointName', 'appliedLoad', 'initialIndication', 'additionalLoad', 'responseDisplacementMm'],
    },
    reportMapping: {
      reportItemNumber: '6',
      reportItemTitle: 'Sensitivity for Non-Self-Indicating Instruments',
      formNumber: 'R76-2 Form 6',
      isTopLevelReportItem: true,
    },
    procedureDefinition: {
      procedureVersion: '2006.1',
      pattern: 'PATTERN_A_MEASUREMENT_TABLE',
      summary: 'Determine pointer or index displacement upon application of an extra mass equal to |MPE| on non-self-indicating instruments.',
      whatIsBeingChecked: 'Clause 3.7 and A.4.9 require that applying an extra load equal to |MPE| produces a displacement of the indicating element of at least the prescribed minimum distance in mm.',
      setupInstructions: [
        'Balance instrument at zero, Min, and Max.',
        'Deposit an extra load equal to |MPE| for that test load.',
        'Measure linear displacement of pointer or graticule line in millimeters.',
      ],
      requiredInputs: ['appliedLoad', 'initialIndication', 'additionalLoad', 'responseDisplacementMm'],
      requiredObservations: ['loadPointName', 'appliedLoad', 'initialIndication', 'additionalLoad', 'responseDisplacementMm'],
      observationSchema: {
        layout: 'TABLE',
        fields: [
          { key: 'loadPointName', label: 'Load Point', type: 'STRING', required: true },
          { key: 'appliedLoad', label: 'Applied Load (L)', type: 'NUMBER', required: true, unitKey: 'primaryUnit' },
          { key: 'initialIndication', label: 'Initial Indication', type: 'NUMBER', required: true, unitKey: 'primaryUnit' },
          { key: 'additionalLoad', label: 'Extra Load (|MPE|)', type: 'NUMBER', required: true, unitKey: 'primaryUnit' },
          { key: 'responseDisplacementMm', label: 'Displacement (mm)', type: 'NUMBER', required: true },
        ],
        minObservations: 2,
      },
      validationRules: [
        { id: 'v-sens-fields', ruleType: 'REQUIRED_FIELDS', description: 'Displacement must be recorded for each point.', severity: 'BLOCKING' },
      ],
      calculationRule: { ruleId: 'CALC_SENSITIVITY' },
      complianceRule: {
        ruleId: 'COMP_SENSITIVITY',
        clause: '3.7, A.4.9',
        description: 'Displacement must meet or exceed minimum statutory millimeter requirements.',
      },
      evidencePolicy: {
        level: 'OPTIONAL',
        required: false,
        purposes: ['RESULT'],
        minItems: 0,
        recommendedTypes: ['OBSERVATION'],
        explanation: 'Pointer displacement photograph.',
      },
    },
  },

  // ==========================================================================
  // 9. REPEATABILITY (Clause 3.6.1, A.4.10) [Pattern A: Measurement Table]
  // ==========================================================================
  R76_REPEATABILITY: {
    id: 'R76_REPEATABILITY',
    code: 'R76_REPEATABILITY',
    name: 'Type Examination Repeatability Test',
    clause: '3.6.1, A.4.10',
    standard: 'OIML R 76-1:2006',
    category: 'METROLOGICAL',
    pattern: 'PATTERN_A_MEASUREMENT_TABLE',
    purpose: 'Verify agreement between results of successive weighings of the same load carried out under identical conditions.',
    applicableClasses: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'],
    applicability: {
      applicableClasses: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'],
    },
    completionRules: {
      minObservations: 6,
      requiredFields: ['runNumber', 'load', 'indication', 'deltaL'],
    },
    reportMapping: {
      reportItemNumber: '7',
      reportItemTitle: 'Repeatability Test',
      formNumber: 'R76-2 Form 7',
      isTopLevelReportItem: true,
    },
    procedureDefinition: {
      procedureVersion: '2006.1',
      pattern: 'PATTERN_A_MEASUREMENT_TABLE',
      summary: 'Perform two distinct weighing series (approx. 50% Max and close to 100% Max) with at least 3 weighings each (10 weighings if Max < 1000 kg).',
      whatIsBeingChecked: 'Clause 3.6.1 mandates that the difference between the results of several weighings of the same load shall not exceed the absolute value of the maximum permissible error of the instrument for that load.',
      setupInstructions: [
        'Zero the instrument before each weighing run.',
        'Deposit test load gently, note indication and turning point.',
        'Unload receptor completely and verify zero return.',
        'Repeat for designated series count at 50% Max and 100% Max.',
      ],
      requiredInputs: ['load', 'indication', 'deltaL', 'runNumber'],
      requiredObservations: ['runNumber', 'load', 'indication', 'deltaL'],
      observationSchema: {
        layout: 'INCREMENTAL_RUNS',
        fields: [
          { key: 'runNumber', label: 'Run #', type: 'NUMBER', required: true, readOnly: true },
          { key: 'load', label: 'Test Load', type: 'NUMBER', required: true, unitKey: 'primaryUnit' },
          { key: 'indication', label: 'Indication', type: 'NUMBER', required: true, unitKey: 'primaryUnit' },
          { key: 'deltaL', label: 'ΔL', type: 'NUMBER', required: true, unitKey: 'primaryUnit' },
        ],
        minObservations: 6,
        allowAddRows: true,
        allowDeleteRows: true,
      },
      validationRules: [
        { id: 'v-rep-count', ruleType: 'OBSERVATION_COUNT', min: 6, description: 'Minimum 6 observations across both series required.', severity: 'BLOCKING' },
        { id: 'v-rep-photo', ruleType: 'EVIDENCE_ATTACHED', description: 'Repeatability test photo required.', severity: 'BLOCKING' },
      ],
      calculationRule: { ruleId: 'CALC_REPEATABILITY' },
      complianceRule: {
        ruleId: 'COMP_TABLE_6',
        clause: '3.6.1, A.4.10',
        mpeSource: 'TABLE_6',
        description: 'Maximum spread (E_max - E_min) for each series must not exceed Table 6 MPE.',
      },
      evidencePolicy: {
        level: 'REQUIRED',
        required: true,
        purposes: ['RESULT', 'SETUP'],
        minItems: 1,
        recommendedTypes: ['SETUP_PHOTO'],
        explanation: 'Photograph showing repeatable mass application setup.',
      },
    },
  },

  // ==========================================================================
  // 10. CREEP (Clause 3.9.4.1, A.4.11.1) [Pattern C: Time Series]
  // ==========================================================================
  R76_CREEP: {
    id: 'R76_CREEP',
    code: 'R76_CREEP',
    name: 'Creep Test under Constant Load',
    clause: '3.9.4.1, A.4.11.1',
    standard: 'OIML R 76-1:2006',
    category: 'METROLOGICAL',
    pattern: 'PATTERN_C_TIME_SERIES',
    purpose: 'Determine slow indication drift while load near Max remains on receptor over 30 minutes or 4 hours.',
    applicableClasses: ['CLASS_II', 'CLASS_III', 'CLASS_IIII'],
    isExemptible: true,
    exemptionRuleDescription: 'Per Clause A.4.11.1, Creep is mandatory only for Classes II, III, and IIII. Class I analytical balances are exempt.',
    applicability: {
      applicableClasses: ['CLASS_II', 'CLASS_III', 'CLASS_IIII'],
      isExemptible: true,
      exemptionRuleDescription: 'Per Clause A.4.11.1, Creep is mandatory only for Classes II, III, and IIII. Class I analytical balances are exempt.',
    },
    completionRules: {
      minObservations: 4,
      requiredFields: ['intervalMinutes', 'load', 'indication', 'deltaL'],
    },
    reportMapping: {
      reportItemNumber: '8.1',
      reportItemTitle: 'Creep Test',
      formNumber: 'R76-2 Form 8',
      isTopLevelReportItem: false,
      parentReportItemNumber: '8',
      parentReportItemTitle: 'Time-Dependent Effects under Load (Clause 3.9.4, A.4.11)',
    },
    procedureDefinition: {
      procedureVersion: '2006.1',
      pattern: 'PATTERN_C_TIME_SERIES',
      summary: 'Keep load near Max continuously on the receptor for 30 minutes (or up to 4 hours) and monitor indication drift.',
      whatIsBeingChecked: 'Clause 3.9.4.1 and A.4.11.1 evaluate indication drift: total 30-min drift must be ≤ 0.5 e and drift between 15 and 30 min must be ≤ 0.2 e.',
      setupInstructions: [
        'Apply test load close to Max as soon as possible without shock.',
        'Record initial indication and turning point immediately (t = 0).',
        'Record indications and turning points at 5 min, 15 min, and 30 min.',
        'If 30-min early termination criteria are met, test may conclude; otherwise continue to 4 hours.',
      ],
      requiredInputs: ['load', 'indication', 'deltaL', 'intervalMinutes'],
      requiredObservations: ['intervalMinutes', 'load', 'indication', 'deltaL'],
      observationSchema: {
        layout: 'TIME_SERIES',
        fields: [
          { key: 'intervalMinutes', label: 'Time (min)', type: 'NUMBER', required: true, readOnly: true },
          { key: 'load', label: 'Test Load', type: 'NUMBER', required: true, unitKey: 'primaryUnit' },
          { key: 'indication', label: 'Indication', type: 'NUMBER', required: true, unitKey: 'primaryUnit' },
          { key: 'deltaL', label: 'ΔL', type: 'NUMBER', required: true, unitKey: 'primaryUnit' },
        ],
        minObservations: 4,
      },
      validationRules: [
        { id: 'v-creep-intervals', ruleType: 'OBSERVATION_COUNT', min: 4, description: 'Readings at 0m, 5m, 15m, and 30m required.', severity: 'BLOCKING' },
      ],
      calculationRule: { ruleId: 'CALC_CREEP' },
      complianceRule: {
        ruleId: 'COMP_CREEP',
        clause: '3.9.4.1, A.4.11.1',
        description: 'Total creep over 30 min ≤ 0.5 e; 15-to-30 min difference ≤ 0.2 e.',
      },
      evidencePolicy: {
        level: 'RECOMMENDED',
        required: false,
        purposes: ['RESULT'],
        minItems: 0,
        recommendedTypes: ['OBSERVATION'],
        explanation: 'Photo of display during creep observation.',
      },
    },
  },

  // ==========================================================================
  // 11. ZERO RETURN (Clause 3.9.4.2, A.4.11.2) [Pattern A: Measurement Table]
  // ==========================================================================
  R76_ZERO_RETURN: {
    id: 'R76_ZERO_RETURN',
    code: 'R76_ZERO_RETURN',
    name: 'Zero Return Residual Error Test',
    clause: '3.9.4.2, A.4.11.2',
    standard: 'OIML R 76-1:2006',
    category: 'METROLOGICAL',
    pattern: 'PATTERN_A_MEASUREMENT_TABLE',
    purpose: 'Determine residual zero error within 60 seconds of removing load that was applied during creep test.',
    applicableClasses: ['CLASS_II', 'CLASS_III', 'CLASS_IIII'],
    isExemptible: true,
    exemptionRuleDescription: 'Per Clause A.4.11.2, Zero Return is mandatory only for Classes II, III, and IIII. Class I analytical balances are exempt.',
    applicability: {
      applicableClasses: ['CLASS_II', 'CLASS_III', 'CLASS_IIII'],
      isExemptible: true,
      exemptionRuleDescription: 'Per Clause A.4.11.2, Zero Return is mandatory only for Classes II, III, and IIII. Class I analytical balances are exempt.',
    },
    completionRules: {
      minObservations: 1,
      requiresZeroReturnCheck: true,
    },
    reportMapping: {
      reportItemNumber: '8.2',
      reportItemTitle: 'Zero Return Test',
      formNumber: 'R76-2 Form 8',
      isTopLevelReportItem: false,
      parentReportItemNumber: '8',
      parentReportItemTitle: 'Time-Dependent Effects under Load (Clause 3.9.4, A.4.11)',
    },
    procedureDefinition: {
      procedureVersion: '2006.1',
      pattern: 'PATTERN_A_MEASUREMENT_TABLE',
      summary: 'Measure residual indication at zero within 60 seconds of removing the creep test load.',
      whatIsBeingChecked: 'Clause 3.9.4.2 and A.4.11.2 mandate that the zero indication deviation within 60 seconds after load removal shall not exceed 0.5 e (0.5 e1 for multi-interval instruments).',
      setupInstructions: [
        'Remove creep test load immediately after concluding creep test.',
        'Wait for initial stabilization (within 60 seconds).',
        'Record residual zero indication and turning point.',
      ],
      requiredInputs: ['residualZeroReading', 'deltaL'],
      requiredObservations: ['condition', 'residualZeroReading', 'deltaL'],
      observationSchema: {
        layout: 'TABLE',
        fields: [
          { key: 'condition', label: 'Observation Condition', type: 'STRING', required: true, readOnly: true },
          { key: 'residualZeroReading', label: 'Indication at Zero', type: 'NUMBER', required: true, unitKey: 'primaryUnit' },
          { key: 'deltaL', label: 'ΔL Added', type: 'NUMBER', required: true, unitKey: 'primaryUnit' },
        ],
        minObservations: 1,
      },
      validationRules: [
        { id: 'v-zr-reading', ruleType: 'REQUIRED_FIELDS', description: 'Zero return observation must be entered.', severity: 'BLOCKING' },
      ],
      calculationRule: { ruleId: 'CALC_ZERO_RETURN' },
      complianceRule: {
        ruleId: 'COMP_ZERO_RETURN',
        clause: '3.9.4.2, A.4.11.2',
        mpeSource: 'FIXED_FACTOR_E',
        factorOfE: 0.5,
        description: 'Residual zero error must not exceed 0.5 e.',
      },
      evidencePolicy: {
        level: 'OPTIONAL',
        required: false,
        purposes: ['RESULT'],
        minItems: 0,
        recommendedTypes: ['OBSERVATION'],
        explanation: 'Photo of zero indication post-creep.',
      },
    },
  },

  // ==========================================================================
  // 12. STABILITY OF EQUILIBRIUM (Clause 4.4.2, A.4.12) [Pattern B: Checklist]
  // ==========================================================================
  R76_EQUILIBRIUM: {
    id: 'R76_EQUILIBRIUM',
    code: 'R76_EQUILIBRIUM',
    name: 'Stability of Equilibrium Interlocking Test',
    clause: '4.4.2, A.4.12',
    standard: 'OIML R 76-1:2006',
    category: 'FUNCTIONAL',
    pattern: 'PATTERN_B_CHECKLIST',
    purpose: 'Verify that printing, zero-setting, and tare operations are interlocked against execution while equilibrium is disturbed.',
    applicableClasses: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'],
    applicability: {
      applicableClasses: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'],
    },
    completionRules: {
      minObservations: 3,
      requiredFields: ['actionAttempted', 'disturbanceApplied', 'motionIndicatorActive', 'commandExecuted', 'resultState'],
    },
    reportMapping: {
      reportItemNumber: '9',
      reportItemTitle: 'Stability of Equilibrium Interlocking Test',
      formNumber: 'R76-2 Form 9',
      isTopLevelReportItem: true,
    },
    procedureDefinition: {
      procedureVersion: '2006.1',
      pattern: 'PATTERN_B_CHECKLIST',
      summary: 'Verify interlocking of print, tare, and zero-setting commands while scale is in motion.',
      whatIsBeingChecked: 'Clause 4.4.2 and A.4.12 mandate that printing, automatic zero-setting, and tare operations cannot be executed while equilibrium is disturbed.',
      setupInstructions: [
        'Induce disturbance (manual oscillation, gentle continuous vibration).',
        'Verify that motion/instability indicator illuminates.',
        'Attempt to trigger print command: verify no printout or error returned.',
        'Attempt to trigger tare and zero commands: verify interlocking prohibits execution until stable.',
      ],
      requiredInputs: ['motionIndicatorActive', 'commandExecuted'],
      requiredObservations: ['actionAttempted', 'disturbanceApplied', 'motionIndicatorActive', 'commandExecuted', 'resultState'],
      observationSchema: {
        layout: 'CHECKLIST',
        fields: [
          { key: 'actionAttempted', label: 'Command Attempted', type: 'STRING', required: true, readOnly: true },
          { key: 'disturbanceApplied', label: 'Disturbance Method', type: 'STRING', required: true },
          { key: 'motionIndicatorActive', label: 'Motion Annunciator Active?', type: 'SELECT', required: true, options: [{ label: 'YES', value: 'YES' }, { label: 'NO', value: 'NO' }] },
          { key: 'commandExecuted', label: 'Did Scale Execute Command?', type: 'SELECT', required: true, options: [{ label: 'BLOCKED (PASS)', value: 'BLOCKED' }, { label: 'EXECUTED (FAIL)', value: 'EXECUTED' }] },
          { key: 'resultState', label: 'Result Verdict', type: 'SELECT', required: true, options: [{ label: 'PASS', value: 'PASS' }, { label: 'FAIL', value: 'FAIL' }] },
        ],
        minObservations: 3,
      },
      validationRules: [
        { id: 'v-eq-all', ruleType: 'REQUIRED_FIELDS', description: 'All 3 stability checks (Print, Tare, Zero) required.', severity: 'BLOCKING' },
      ],
      calculationRule: { ruleId: 'CALC_CHECKLIST' },
      complianceRule: {
        ruleId: 'COMP_CHECKLIST',
        clause: '4.4.2, A.4.12',
        description: 'All operations must be blocked during dynamic instability.',
      },
      evidencePolicy: {
        level: 'OPTIONAL',
        required: false,
        purposes: ['FUNCTIONAL_BEHAVIOR'],
        minItems: 0,
        recommendedTypes: ['OBSERVATION'],
        explanation: 'Display photo showing motion annunciator.',
      },
    },
  },

  // ==========================================================================
  // 13. TARE WEIGHING OPERATION (Clause 4.6, A.4.5) [Pattern A: Measurement Table]
  // ==========================================================================
  R76_TARE: {
    id: 'R76_TARE',
    code: 'R76_TARE',
    name: 'Weighing Test with Tare Device',
    clause: '4.6, A.4.5',
    standard: 'OIML R 76-1:2006',
    category: 'METROLOGICAL',
    pattern: 'PATTERN_A_MEASUREMENT_TABLE',
    purpose: 'Determine weighing accuracy with tare device engaged under various tare and net load combinations.',
    applicableClasses: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'],
    applicability: {
      applicableClasses: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'],
    },
    completionRules: {
      minObservations: 3,
      requiredFields: ['tareLoad', 'grossLoad', 'netIndication', 'netDeltaL'],
    },
    reportMapping: {
      reportItemNumber: '10',
      reportItemTitle: 'Tare Weighing Test',
      formNumber: 'R76-2 Form 10',
      isTopLevelReportItem: true,
    },
    procedureDefinition: {
      procedureVersion: '2006.1',
      pattern: 'PATTERN_A_MEASUREMENT_TABLE',
      summary: 'Determine weighing accuracy with tare device engaged under various tare and net load combinations.',
      whatIsBeingChecked: 'Clause 4.6 and A.4.5 mandate that the net indication error does not exceed the MPE for the net load applied.',
      setupInstructions: [
        'Apply a tare load and actuate the tare balancing mechanism.',
        'Verify the NET annunciator illuminates and display resets to zero.',
        'Deposit net test loads in ascending increments.',
        'Calculate error P_net - L_net and compare against MPE(L_net).',
      ],
      requiredInputs: ['tareLoad', 'grossLoad', 'netIndication', 'netDeltaL'],
      requiredObservations: ['tareLoad', 'grossLoad', 'netIndication', 'netDeltaL'],
      observationSchema: {
        layout: 'TABLE',
        fields: [
          { key: 'tareLoad', label: 'Tare Load', type: 'NUMBER', required: true, unitKey: 'primaryUnit' },
          { key: 'grossLoad', label: 'Gross Load', type: 'NUMBER', required: true, unitKey: 'primaryUnit' },
          { key: 'netIndication', label: 'Net Indication', type: 'NUMBER', required: true, unitKey: 'primaryUnit' },
          { key: 'netDeltaL', label: 'Net ΔL', type: 'NUMBER', required: true, unitKey: 'primaryUnit' },
        ],
        minObservations: 3,
        allowAddRows: true,
      },
      validationRules: [
        { id: 'v-tare-fields', ruleType: 'REQUIRED_FIELDS', description: 'Tare load, gross load, and net indication must be entered.', severity: 'BLOCKING' },
      ],
      calculationRule: { ruleId: 'CALC_TARE' },
      complianceRule: {
        ruleId: 'COMP_TABLE_6',
        clause: '4.6, A.4.5',
        mpeSource: 'TABLE_6',
        description: 'Net weighing error must not exceed Table 6 MPE for the net load.',
      },
      evidencePolicy: {
        level: 'OPTIONAL',
        required: false,
        purposes: ['RESULT'],
        minItems: 0,
        recommendedTypes: ['OBSERVATION'],
        explanation: 'Tare operation photographs are optional.',
      },
    },
  },

  // ==========================================================================
  // 14. TILTING TEST (Clause 3.9.1.1, A.5.1) [Pattern D: Environmental / Stress]
  // ==========================================================================
  R76_TILTING: {
    id: 'R76_TILTING',
    code: 'R76_TILTING',
    name: 'Tilting Sensitivity Test (Non-Fixed Instruments)',
    clause: '3.9.1.1, A.5.1',
    standard: 'OIML R 76-1:2006',
    category: 'ENVIRONMENTAL',
    pattern: 'PATTERN_D_ENVIRONMENTAL_STRESS',
    purpose: 'Determine the influence of tilting on instruments without fixed leveling or with spirit level indicators at 50:1000 or limiting tilt angle.',
    applicableClasses: ['CLASS_II', 'CLASS_III', 'CLASS_IIII'],
    isExemptible: true,
    exemptionRuleDescription: 'Per Clause 3.9.1.1, Class I balances and instruments with automatic leveling devices that inhibit weighing when tilted are exempt.',
    applicability: {
      applicableClasses: ['CLASS_II', 'CLASS_III', 'CLASS_IIII'],
      requiresTiltingCapability: true,
      isExemptible: true,
      exemptionRuleDescription: 'Per Clause 3.9.1.1, Class I balances and instruments with automatic leveling devices that inhibit weighing when tilted are exempt.',
    },
    completionRules: {
      minObservations: 5,
      requiredFields: ['tiltOrientation', 'testLoad', 'indication', 'deltaL', 'observedCondition'],
    },
    reportMapping: {
      reportItemNumber: '11',
      reportItemTitle: 'Tilting Sensitivity Test',
      formNumber: 'R76-2 Form 11',
      isTopLevelReportItem: true,
    },
    procedureDefinition: {
      procedureVersion: '2006.1',
      pattern: 'PATTERN_D_ENVIRONMENTAL_STRESS',
      summary: 'Subject free-standing instrument to forward, backward, left, and right tilt of 50:1000 (or spirit level limit) and evaluate weighing errors.',
      whatIsBeingChecked: 'Clause 3.9.1.1 and A.5.1 require that for an instrument liable to be tilted, the influence of tilting shall not cause errors exceeding the maximum permissible error for the applied load.',
      setupInstructions: [
        'Level instrument initially using its leveling device and verify zero indication.',
        'Apply zero load and load near Max under level datum.',
        'Tilt instrument to limiting value of 50:1000 forward, backward, left, and right.',
        'Record indication and turning point for each tilt posture.',
      ],
      requiredInputs: ['testLoad', 'indication', 'deltaL', 'tiltOrientation'],
      requiredObservations: ['tiltOrientation', 'testLoad', 'indication', 'deltaL', 'observedCondition'],
      observationSchema: {
        layout: 'STRESS_SEQUENCE',
        fields: [
          { key: 'tiltOrientation', label: 'Tilt Orientation', type: 'STRING', required: true },
          { key: 'testLoad', label: 'Test Load (L)', type: 'NUMBER', required: true, unitKey: 'primaryUnit' },
          { key: 'indication', label: 'Indication (I)', type: 'NUMBER', required: true, unitKey: 'primaryUnit' },
          { key: 'deltaL', label: 'ΔL Added', type: 'NUMBER', required: true, unitKey: 'primaryUnit' },
          { key: 'observedCondition', label: 'Condition Note', type: 'STRING', required: true },
        ],
        minObservations: 5,
        allowAddRows: true,
      },
      validationRules: [
        { id: 'v-tilt-count', ruleType: 'OBSERVATION_COUNT', min: 5, description: 'Level datum and 4 tilt directions required.', severity: 'BLOCKING' },
        { id: 'v-tilt-fields', ruleType: 'REQUIRED_FIELDS', description: 'Tilt orientation, load, indication, and ΔL required.', severity: 'BLOCKING' },
      ],
      calculationRule: { ruleId: 'CALC_TILTING' },
      complianceRule: {
        ruleId: 'COMP_TABLE_6',
        clause: '3.9.1.1, A.5.1',
        mpeSource: 'TABLE_6',
        description: 'Corrected errors under tilted conditions must not exceed Table 6 MPE.',
      },
      evidencePolicy: {
        level: 'RECOMMENDED',
        required: false,
        purposes: ['SETUP', 'ENVIRONMENT'],
        minItems: 0,
        recommendedTypes: ['SETUP_PHOTO'],
        explanation: 'Photograph of instrument on tilting table with inclination gauge visible.',
      },
    },
  },

  // ==========================================================================
  // 15. WARM-UP TIME (Clause 5.3.5, A.5.2) [Pattern C: Time Series]
  // ==========================================================================
  R76_WARMUP: {
    id: 'R76_WARMUP',
    code: 'R76_WARMUP',
    name: 'Warm-up Time Test',
    clause: '5.3.5, A.5.2',
    standard: 'OIML R 76-1:2006',
    category: 'ENVIRONMENTAL',
    pattern: 'PATTERN_C_TIME_SERIES',
    purpose: 'Verify that electronic instruments provide accurate indications immediately after connection to power following at least 8 hours unpowered.',
    applicableClasses: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'],
    applicability: {
      applicableClasses: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'],
    },
    completionRules: {
      minObservations: 4,
      requiredFields: ['elapsedMinutes', 'zeroReading', 'temperatureC'],
    },
    reportMapping: {
      reportItemNumber: '12',
      reportItemTitle: 'Warm-up Time Test',
      formNumber: 'R76-2 Form 12',
      isTopLevelReportItem: true,
    },
    procedureDefinition: {
      procedureVersion: '2006.1',
      pattern: 'PATTERN_C_TIME_SERIES',
      summary: 'Keep instrument disconnected from power supply for at least 8 hours, then power on and monitor zero reading drift at 0, 5, 15, and 30 minutes.',
      whatIsBeingChecked: 'Clause 5.3.5 and A.5.2 require that an instrument shall not indicate or transmit weight results during warm-up time, or error during warm-up shall not exceed Table 6 MPE and zero drift shall not exceed 1e.',
      setupInstructions: [
        'Disconnect instrument from mains/battery for at least 8 hours prior to test.',
        'Connect supply, power on, and observe zero reading immediately (t = 0).',
        'Record zero readings at 5, 15, and 30 minutes.',
        'Verify zero deviation does not exceed 1 e.',
      ],
      requiredInputs: ['elapsedMinutes', 'zeroReading', 'temperatureC'],
      requiredObservations: ['elapsedMinutes', 'zeroReading', 'temperatureC'],
      observationSchema: {
        layout: 'TIME_SERIES',
        fields: [
          { key: 'elapsedMinutes', label: 'Elapsed Time (min)', type: 'NUMBER', required: true, readOnly: true },
          { key: 'zeroReading', label: 'Zero Indication', type: 'NUMBER', required: true, unitKey: 'primaryUnit' },
          { key: 'temperatureC', label: 'Ambient Temp (°C)', type: 'NUMBER', required: true, unitKey: 'celsius' },
        ],
        minObservations: 4,
      },
      validationRules: [
        { id: 'v-warmup-count', ruleType: 'OBSERVATION_COUNT', min: 4, description: 'Readings at 0m, 5m, 15m, and 30m required.', severity: 'BLOCKING' },
      ],
      calculationRule: { ruleId: 'CALC_WARMUP' },
      complianceRule: {
        ruleId: 'COMP_WARMUP',
        clause: '5.3.5, A.5.2',
        mpeSource: 'FIXED_FACTOR_E',
        factorOfE: 1.0,
        description: 'Zero drift during warm-up period must not exceed 1.0 e.',
      },
      evidencePolicy: {
        level: 'OPTIONAL',
        required: false,
        purposes: ['RESULT'],
        minItems: 0,
        recommendedTypes: ['OBSERVATION'],
        explanation: 'Display photo upon initial power-on.',
      },
    },
  },

  // ==========================================================================
  // 16. STATIC TEMPERATURE SEQUENCE (Clause 3.9.2.1, 3.9.2.2, A.5.3.1) [Pattern D]
  // ==========================================================================
  R76_TEMPERATURE: {
    id: 'R76_TEMPERATURE',
    code: 'R76_TEMPERATURE',
    name: 'Static Temperature Weighing Sequence Test',
    clause: '3.9.2.1, 3.9.2.2, A.5.3.1',
    standard: 'OIML R 76-1:2006',
    category: 'ENVIRONMENTAL',
    pattern: 'PATTERN_D_ENVIRONMENTAL_STRESS',
    purpose: 'Determine intrinsic error across operating temperature limits (reference +20 °C, high, low, +5 °C, return to reference).',
    applicableClasses: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'],
    applicability: {
      applicableClasses: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'],
    },
    completionRules: {
      minObservations: 4,
      requiredFields: ['stageName', 'targetTempC', 'actualTempC', 'soakHours', 'load', 'indication', 'deltaL'],
    },
    reportMapping: {
      reportItemNumber: '13',
      reportItemTitle: 'Static Temperature Weighing Sequence',
      formNumber: 'R76-2 Form 13',
      isTopLevelReportItem: true,
    },
    procedureDefinition: {
      procedureVersion: '2006.1',
      pattern: 'PATTERN_D_ENVIRONMENTAL_STRESS',
      summary: 'Evaluate instrument weighing performance across the statutory operating temperature range in a climatic chamber.',
      whatIsBeingChecked: 'Clause 3.9.2.1, 3.9.2.2, and A.5.3.1 evaluate weighing errors at +20°C, high specified temp (+40°C), low temp (-10°C or +5°C), and return to +20°C. Corrected errors must not exceed Table 6 MPE.',
      setupInstructions: [
        'Place instrument in climatic chamber at reference +20°C.',
        'Stabilize for at least 2 hours at each temperature stage.',
        'Record weighing performance with test loads at each temperature stage.',
        'Follow complete sequence: Reference -> High -> Low -> Reference.',
      ],
      requiredInputs: ['targetTempC', 'actualTempC', 'soakHours', 'load', 'indication', 'deltaL'],
      requiredObservations: ['stageName', 'targetTempC', 'actualTempC', 'soakHours', 'load', 'indication', 'deltaL'],
      observationSchema: {
        layout: 'STRESS_SEQUENCE',
        fields: [
          { key: 'stageName', label: 'Temperature Stage', type: 'STRING', required: true },
          { key: 'targetTempC', label: 'Target Temp (°C)', type: 'NUMBER', required: true, unitKey: 'celsius' },
          { key: 'actualTempC', label: 'Actual Temp (°C)', type: 'NUMBER', required: true, unitKey: 'celsius' },
          { key: 'soakHours', label: 'Stabilization Time (h)', type: 'NUMBER', required: true },
          { key: 'load', label: 'Test Load', type: 'NUMBER', required: true, unitKey: 'primaryUnit' },
          { key: 'indication', label: 'Indication', type: 'NUMBER', required: true, unitKey: 'primaryUnit' },
          { key: 'deltaL', label: 'ΔL', type: 'NUMBER', required: true, unitKey: 'primaryUnit' },
        ],
        minObservations: 4,
      },
      validationRules: [
        { id: 'v-temp-stages', ruleType: 'OBSERVATION_COUNT', min: 4, description: 'All temperature stages (+20°C, high, low, +20°C return) required.', severity: 'BLOCKING' },
        { id: 'v-temp-photo', ruleType: 'EVIDENCE_ATTACHED', description: 'Chamber setup photograph required.', severity: 'BLOCKING' },
      ],
      calculationRule: { ruleId: 'CALC_TEMPERATURE' },
      complianceRule: {
        ruleId: 'COMP_TABLE_6',
        clause: '3.9.2.1, 3.9.2.2, A.5.3.1',
        mpeSource: 'TABLE_6',
        description: 'Errors at each temperature stage must be within Table 6 MPE.',
      },
      evidencePolicy: {
        level: 'REQUIRED',
        required: true,
        purposes: ['ENVIRONMENT', 'SETUP'],
        minItems: 1,
        recommendedTypes: ['SETUP_PHOTO'],
        explanation: 'Photograph showing instrument situated inside climatic chamber with chamber controller display visible.',
      },
    },
  },

  // ==========================================================================
  // 17. TEMPERATURE EFFECT ON NO-LOAD INDICATION (Clause 3.9.2.3, A.5.3.2) [Pattern C]
  // ==========================================================================
  R76_TEMP_EFFECT_NO_LOAD: {
    id: 'R76_TEMP_EFFECT_NO_LOAD',
    code: 'R76_TEMP_EFFECT_NO_LOAD',
    name: 'Temperature Effect on No-Load Indication',
    clause: '3.9.2.3, A.5.3.2',
    standard: 'OIML R 76-1:2006',
    category: 'ENVIRONMENTAL',
    pattern: 'PATTERN_C_TIME_SERIES',
    purpose: 'Verify that the zero indication drift across temperature steps does not exceed 1e per 5 °C (or 0.2e per 5 °C for Class I).',
    applicableClasses: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'],
    applicability: {
      applicableClasses: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'],
    },
    completionRules: {
      minObservations: 4,
      requiredFields: ['stageName', 'temperatureC', 'zeroIndication', 'deltaL'],
    },
    reportMapping: {
      reportItemNumber: '14',
      reportItemTitle: 'Temperature Effect on No-Load Indication',
      formNumber: 'R76-2 Form 14',
      isTopLevelReportItem: true,
    },
    procedureDefinition: {
      procedureVersion: '2006.1',
      pattern: 'PATTERN_C_TIME_SERIES',
      summary: 'Measure zero indication drift at zero load across consecutive temperature stages (+20 °C, High, Low, +5 °C, Reference).',
      whatIsBeingChecked: 'Clause 3.9.2.3 and A.5.3.2 require that the zero indication shall not vary by more than one verification scale interval for a difference in temperature of 5 °C (0.2e per 5 °C for Class I instruments).',
      setupInstructions: [
        'Zero the instrument at reference temperature +20 °C.',
        'Change chamber temperature to High, then Low, then Return to Reference, allowing stabilization.',
        'At each temperature step, observe zero reading and turning point ΔL without re-zeroing.',
        'Calculate zero drift per 5 °C between successive temperature stages.',
      ],
      requiredInputs: ['temperatureC', 'zeroIndication', 'deltaL'],
      requiredObservations: ['stageName', 'temperatureC', 'zeroIndication', 'deltaL'],
      observationSchema: {
        layout: 'TIME_SERIES',
        fields: [
          { key: 'stageName', label: 'Stage Name', type: 'STRING', required: true },
          { key: 'temperatureC', label: 'Chamber Temp (°C)', type: 'NUMBER', required: true, unitKey: 'celsius' },
          { key: 'zeroIndication', label: 'Zero Indication', type: 'NUMBER', required: true, unitKey: 'primaryUnit' },
          { key: 'deltaL', label: 'ΔL at Zero', type: 'NUMBER', required: true, unitKey: 'primaryUnit' },
        ],
        minObservations: 4,
      },
      validationRules: [
        { id: 'v-tnl-count', ruleType: 'OBSERVATION_COUNT', min: 4, description: 'At least 4 temperature stages required for zero drift evaluation.', severity: 'BLOCKING' },
      ],
      calculationRule: { ruleId: 'CALC_TEMP_EFFECT_NO_LOAD' },
      complianceRule: {
        ruleId: 'COMP_ZERO_DRIFT_TEMP',
        clause: '3.9.2.3, A.5.3.2',
        description: 'Zero drift must not exceed 1 e per 5 °C (0.2 e per 5 °C for Class I).',
      },
      evidencePolicy: {
        level: 'OPTIONAL',
        required: false,
        purposes: ['ENVIRONMENT'],
        minItems: 0,
        recommendedTypes: ['OBSERVATION'],
        explanation: 'Photograph of zero display during climatic chamber transition.',
      },
    },
  },

  // ==========================================================================
  // 18. VOLTAGE VARIATION (Clause 3.9.3, A.5.4) [Pattern D: Stress Test]
  // ==========================================================================
  R76_VOLTAGE: {
    id: 'R76_VOLTAGE',
    code: 'R76_VOLTAGE',
    name: 'Voltage Variation Test (AC Mains / Battery)',
    clause: '3.9.3, A.5.4',
    standard: 'OIML R 76-1:2006',
    category: 'ELECTRICAL',
    pattern: 'PATTERN_D_ENVIRONMENTAL_STRESS',
    purpose: 'Evaluate instrument performance under statutory extreme supply voltage variations (AC mains +10%/-15% or battery limits).',
    applicableClasses: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'],
    applicability: {
      applicableClasses: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'],
    },
    completionRules: {
      minObservations: 3,
      requiredFields: ['supplyCondition', 'targetVoltageV', 'actualVoltageV', 'load', 'indication', 'response'],
    },
    reportMapping: {
      reportItemNumber: '15',
      reportItemTitle: 'Voltage Variation Test',
      formNumber: 'R76-2 Form 15',
      isTopLevelReportItem: true,
    },
    procedureDefinition: {
      procedureVersion: '2006.1',
      pattern: 'PATTERN_D_ENVIRONMENTAL_STRESS',
      summary: 'Evaluate instrument performance under statutory extreme supply voltage variations (AC mains +10%/-15% or battery limits).',
      whatIsBeingChecked: 'Clause 3.9.3 and A.5.4 mandate that the instrument shall comply with Table 6 MPE under extreme supply voltage limits.',
      setupInstructions: [
        'Power instrument through variable AC source (variac) or adjustable DC bench power supply.',
        'Test at nominal supply voltage (Unom).',
        'Vary supply to upper extreme (+10% for AC mains) and lower extreme (-15% for AC mains) or down to battery cut-off voltage.',
        'Record weighing performance at each voltage level.',
      ],
      requiredInputs: ['targetVoltageV', 'actualVoltageV', 'load', 'indication'],
      requiredObservations: ['supplyCondition', 'targetVoltageV', 'actualVoltageV', 'load', 'indication', 'response'],
      observationSchema: {
        layout: 'STRESS_SEQUENCE',
        fields: [
          { key: 'supplyCondition', label: 'Supply Condition', type: 'STRING', required: true },
          { key: 'targetVoltageV', label: 'Target Voltage (V)', type: 'NUMBER', required: true, unitKey: 'volt' },
          { key: 'actualVoltageV', label: 'Actual Voltage (V)', type: 'NUMBER', required: true, unitKey: 'volt' },
          { key: 'load', label: 'Test Load', type: 'NUMBER', required: true, unitKey: 'primaryUnit' },
          { key: 'indication', label: 'Indication', type: 'NUMBER', required: true, unitKey: 'primaryUnit' },
          { key: 'response', label: 'Behavior / Response', type: 'STRING', required: true },
        ],
        minObservations: 3,
      },
      validationRules: [
        { id: 'v-volt-count', ruleType: 'OBSERVATION_COUNT', min: 3, description: 'Readings at nominal, upper extreme, and lower extreme required.', severity: 'BLOCKING' },
        { id: 'v-volt-photo', ruleType: 'EVIDENCE_ATTACHED', description: 'Power source test setup photograph required.', severity: 'BLOCKING' },
      ],
      calculationRule: { ruleId: 'CALC_VOLTAGE' },
      complianceRule: {
        ruleId: 'COMP_TABLE_6',
        clause: '3.9.3, A.5.4',
        mpeSource: 'TABLE_6',
        description: 'Errors under voltage extremes must remain within Table 6 MPE.',
      },
      evidencePolicy: {
        level: 'REQUIRED',
        required: true,
        purposes: ['EQUIPMENT', 'SETUP'],
        minItems: 1,
        recommendedTypes: ['SETUP_PHOTO'],
        explanation: 'Photograph showing variable power supply setup and DMM measuring supply voltage.',
      },
    },
  },

  // ==========================================================================
  // 19. ELECTRICAL DISTURBANCES (Clause 5.4.3, Annex B.3) [Pattern A]
  // ==========================================================================
  R76_ELECTRICAL_DISTURBANCE: {
    id: 'R76_ELECTRICAL_DISTURBANCE',
    code: 'R76_ELECTRICAL_DISTURBANCE',
    name: 'Electrical Disturbances Immunity Test',
    clause: '5.4.3, B.3',
    standard: 'OIML R 76-1:2006',
    category: 'ELECTRICAL',
    pattern: 'PATTERN_A_MEASUREMENT_TABLE',
    purpose: 'Verify instrument immunity to mains dips, fast transient bursts, electrostatic discharge, and surges without significant faults (> 1e).',
    applicableClasses: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'],
    applicability: {
      applicableClasses: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'],
    },
    completionRules: {
      minObservations: 4,
      requiredFields: ['disturbanceType', 'testCondition', 'appliedDisturbance', 'load', 'baselineIndication', 'indicationDuringDisturbance', 'significantFaultDetected'],
    },
    reportMapping: {
      reportItemNumber: '16',
      reportItemTitle: 'Electrical Disturbances Immunity Test',
      formNumber: 'R76-2 Form 16',
      isTopLevelReportItem: true,
    },
    procedureDefinition: {
      procedureVersion: '2006.1',
      pattern: 'PATTERN_A_MEASUREMENT_TABLE',
      summary: 'Subject electronic instrument under test load to electrical bursts, ESD, voltage dips, and surges.',
      whatIsBeingChecked: 'Clause 5.4.3 and Annex B.3 evaluate electronic disturbances. Either no significant fault occurs (error <= 1e), or significant faults are automatically detected and indicated.',
      setupInstructions: [
        'Apply approx. 50% Max test load to receptor.',
        'Apply AC mains voltage dips (B.3.1) of 0%, 40%, and 70%.',
        'Apply EFT bursts (B.3.2) ±1.0 kV to power lines.',
        'Apply ESD (B.3.3) 6 kV contact / 8 kV air discharge to accessible touch points.',
        'Apply Surge pulses (B.3.4) 1 kV line-to-line, 2 kV line-to-ground.',
      ],
      requiredInputs: ['load', 'baselineIndication', 'indicationDuringDisturbance', 'significantFaultDetected'],
      requiredObservations: ['disturbanceType', 'testCondition', 'appliedDisturbance', 'load', 'baselineIndication', 'indicationDuringDisturbance', 'significantFaultDetected'],
      observationSchema: {
        layout: 'TABLE',
        fields: [
          { key: 'disturbanceType', label: 'Disturbance Type', type: 'STRING', required: true },
          { key: 'testCondition', label: 'Severity Level', type: 'STRING', required: true },
          { key: 'appliedDisturbance', label: 'Disturbance Method', type: 'STRING', required: true },
          { key: 'load', label: 'Test Load', type: 'NUMBER', required: true, unitKey: 'primaryUnit' },
          { key: 'baselineIndication', label: 'Baseline Indication', type: 'NUMBER', required: true, unitKey: 'primaryUnit' },
          { key: 'indicationDuringDisturbance', label: 'Disturbed Indication', type: 'NUMBER', required: true, unitKey: 'primaryUnit' },
          { key: 'significantFaultDetected', label: 'Significant Fault (>1e)?', type: 'SELECT', required: true, options: [{ label: 'NO (PASS)', value: 'NO' }, { label: 'YES (FAIL)', value: 'YES' }] },
        ],
        minObservations: 4,
        allowAddRows: true,
      },
      validationRules: [
        { id: 'v-dist-all', ruleType: 'REQUIRED_FIELDS', description: 'All disturbance tests must have recorded results.', severity: 'BLOCKING' },
      ],
      calculationRule: { ruleId: 'CALC_ELECTRICAL_DISTURBANCE' },
      complianceRule: {
        ruleId: 'COMP_DISTURBANCE',
        clause: '5.4.3, B.3',
        description: 'No significant fault (> 1 e) shall occur without immediate interlocking/alarm.',
      },
      evidencePolicy: {
        level: 'RECOMMENDED',
        required: false,
        purposes: ['EQUIPMENT'],
        minItems: 0,
        recommendedTypes: ['SETUP_PHOTO'],
        explanation: 'EMC test generator setup photograph.',
      },
    },
  },

  // ==========================================================================
  // 20. DAMP HEAT STEADY STATE (Clause 3.9.2.4, Annex B.2) [Pattern D]
  // ==========================================================================
  R76_DAMP_HEAT: {
    id: 'R76_DAMP_HEAT',
    code: 'R76_DAMP_HEAT',
    name: 'Damp Heat Steady State Test (48 Hours)',
    clause: '3.9.2.4, B.2',
    standard: 'OIML R 76-1:2006',
    category: 'ENVIRONMENTAL',
    pattern: 'PATTERN_D_ENVIRONMENTAL_STRESS',
    purpose: 'Soak instrument in climatic chamber at +40 °C and 85% relative humidity for 48 hours to evaluate moisture resilience.',
    applicableClasses: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'],
    applicability: {
      applicableClasses: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'],
    },
    completionRules: {
      minObservations: 3,
      requiredFields: ['stage', 'chamberTempC', 'chamberHumidityRh', 'durationHours', 'zeroIndication', 'testLoad', 'testIndication'],
    },
    reportMapping: {
      reportItemNumber: '17',
      reportItemTitle: 'Damp Heat Steady State Test',
      formNumber: 'R76-2 Form 17',
      isTopLevelReportItem: true,
    },
    procedureDefinition: {
      procedureVersion: '2006.1',
      pattern: 'PATTERN_D_ENVIRONMENTAL_STRESS',
      summary: 'Soak instrument in climatic chamber at +40°C and 85% relative humidity for 48 hours to evaluate moisture resilience.',
      whatIsBeingChecked: 'Clause 3.9.2.4 and Annex B Clause B.2 require that after 48 h damp heat conditioning and standard recovery period, the zero shift does not exceed 1.0 e and weighing performance remains compliant.',
      setupInstructions: [
        'Record pre-exposure zero and span at +20°C reference.',
        'Condition instrument at +40°C and 85% RH for 48 hours.',
        'Observe operation under conditioning.',
        'Recover for 4 hours at reference conditions and evaluate residual zero shift.',
      ],
      requiredInputs: ['chamberTempC', 'chamberHumidityRh', 'durationHours', 'zeroIndication', 'testLoad', 'testIndication'],
      requiredObservations: ['stage', 'chamberTempC', 'chamberHumidityRh', 'durationHours', 'zeroIndication', 'testLoad', 'testIndication'],
      observationSchema: {
        layout: 'STRESS_SEQUENCE',
        fields: [
          { key: 'stage', label: 'Conditioning Stage', type: 'STRING', required: true },
          { key: 'chamberTempC', label: 'Chamber Temp (°C)', type: 'NUMBER', required: true, unitKey: 'celsius' },
          { key: 'chamberHumidityRh', label: 'Humidity (% RH)', type: 'NUMBER', required: true, unitKey: 'rh' },
          { key: 'durationHours', label: 'Duration (h)', type: 'NUMBER', required: true },
          { key: 'zeroIndication', label: 'Zero Indication', type: 'NUMBER', required: true, unitKey: 'primaryUnit' },
          { key: 'testLoad', label: 'Test Load', type: 'NUMBER', required: true, unitKey: 'primaryUnit' },
          { key: 'testIndication', label: 'Indication at Load', type: 'NUMBER', required: true, unitKey: 'primaryUnit' },
        ],
        minObservations: 3,
      },
      validationRules: [
        { id: 'v-dh-fields', ruleType: 'REQUIRED_FIELDS', description: 'Pre, during, and post exposure readings are required.', severity: 'BLOCKING' },
        { id: 'v-dh-photo', ruleType: 'EVIDENCE_ATTACHED', description: 'Chamber setup photograph required.', severity: 'BLOCKING' },
      ],
      calculationRule: { ruleId: 'CALC_DAMP_HEAT' },
      complianceRule: {
        ruleId: 'COMP_DAMP_HEAT',
        clause: '3.9.2.4, B.2',
        mpeSource: 'FIXED_FACTOR_E',
        factorOfE: 1.0,
        description: 'Post-recovery zero shift must not exceed 1.0 e; weighing errors within Table 6 MPE.',
      },
      evidencePolicy: {
        level: 'REQUIRED',
        required: true,
        purposes: ['ENVIRONMENT', 'SETUP'],
        minItems: 1,
        recommendedTypes: ['SETUP_PHOTO'],
        explanation: 'Photograph showing instrument situated in climatic chamber at 85% RH exposure.',
      },
    },
  },

  // ==========================================================================
  // 21. SPAN STABILITY (Clause 3.9.5, Annex B.4) [Pattern C: Time Series]
  // ==========================================================================
  R76_SPAN_STABILITY: {
    id: 'R76_SPAN_STABILITY',
    code: 'R76_SPAN_STABILITY',
    name: 'Span Stability Test (28 Days)',
    clause: '3.9.5, B.4',
    standard: 'OIML R 76-1:2006',
    category: 'METROLOGICAL',
    pattern: 'PATTERN_C_TIME_SERIES',
    purpose: 'Monitor long-term span drift across a 28-day testing period comprising 8 separate measurement runs.',
    applicableClasses: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'],
    applicability: {
      applicableClasses: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'],
    },
    completionRules: {
      minObservations: 5,
      requiredFields: ['runIndex', 'recordedDate', 'elapsedDays', 'load', 'indication', 'temperatureC', 'humidityPercent', 'pressureHpa'],
    },
    reportMapping: {
      reportItemNumber: '18',
      reportItemTitle: 'Span Stability Test',
      formNumber: 'R76-2 Form 18',
      isTopLevelReportItem: true,
    },
    procedureDefinition: {
      procedureVersion: '2006.1',
      pattern: 'PATTERN_C_TIME_SERIES',
      summary: 'Monitor long-term span drift across a 28-day testing period comprising 8 separate measurement runs.',
      whatIsBeingChecked: 'Clause 3.9.5 and Annex B Clause B.4 evaluate long-term drift. Maximum span drift between consecutive measurements must not exceed 0.5 e and total span drift over 28 days must not exceed 1.0 e.',
      setupInstructions: [
        'Take baseline measurement Run #1 at Day 0 with load close to Max.',
        'Take measurements on Days 1, 3, 7, 10, 14, 21, and 28.',
        'Calculate error at each run: Error = Indication - Reference Load.',
        'Maximum drift from baseline run must be ≤ 0.5 e.',
      ],
      requiredInputs: ['load', 'indication', 'temperatureC', 'humidityPercent', 'pressureHpa'],
      requiredObservations: ['runIndex', 'recordedDate', 'elapsedDays', 'load', 'indication', 'temperatureC', 'humidityPercent', 'pressureHpa'],
      observationSchema: {
        layout: 'INCREMENTAL_RUNS',
        fields: [
          { key: 'runIndex', label: 'Run #', type: 'NUMBER', required: true, readOnly: true },
          { key: 'elapsedDays', label: 'Elapsed Days', type: 'NUMBER', required: true },
          { key: 'recordedDate', label: 'Date & Time', type: 'STRING', required: true },
          { key: 'load', label: 'Reference Load', type: 'NUMBER', required: true, unitKey: 'primaryUnit' },
          { key: 'indication', label: 'Indication', type: 'NUMBER', required: true, unitKey: 'primaryUnit' },
          { key: 'temperatureC', label: 'Temp (°C)', type: 'NUMBER', required: true, unitKey: 'celsius' },
          { key: 'humidityPercent', label: 'Humidity (%)', type: 'NUMBER', required: true, unitKey: 'percent' },
        ],
        minObservations: 5,
        allowAddRows: true,
        allowDeleteRows: true,
      },
      validationRules: [
        { id: 'v-span-count', ruleType: 'OBSERVATION_COUNT', min: 5, description: 'Measurement runs across the 28-day span are required.', severity: 'BLOCKING' },
        { id: 'v-span-photo', ruleType: 'EVIDENCE_ATTACHED', description: 'Initial setup photograph required.', severity: 'BLOCKING' },
      ],
      calculationRule: { ruleId: 'CALC_SPAN_STABILITY' },
      complianceRule: {
        ruleId: 'COMP_SPAN_STABILITY',
        clause: '3.9.5, B.4',
        mpeSource: 'FIXED_FACTOR_E',
        factorOfE: 0.5,
        description: 'Maximum drift between consecutive runs must not exceed 0.5 e; total drift ≤ 1.0 e.',
      },
      evidencePolicy: {
        level: 'REQUIRED',
        required: true,
        purposes: ['SETUP', 'ENVIRONMENT'],
        minItems: 1,
        recommendedTypes: ['SETUP_PHOTO'],
        explanation: 'Initial setup photograph showing baseline span stability measurement.',
      },
    },
  },

  // ==========================================================================
  // 22. ENDURANCE TEST (Clause 3.9.4.3, Clause A.6) [Pattern D: Stress Test]
  // ==========================================================================
  R76_ENDURANCE: {
    id: 'R76_ENDURANCE',
    code: 'R76_ENDURANCE',
    name: 'Endurance Repetitive Loading Test (100,000 Cycles)',
    clause: '3.9.4.3, A.6',
    standard: 'OIML R 76-1:2006',
    category: 'METROLOGICAL',
    pattern: 'PATTERN_D_ENVIRONMENTAL_STRESS',
    purpose: 'Evaluate durability and mechanical resilience after 100,000 cycles of repetitive loading at approx. 50% Max.',
    applicableClasses: ['CLASS_II', 'CLASS_III', 'CLASS_IIII'],
    applicability: {
      applicableClasses: ['CLASS_II', 'CLASS_III', 'CLASS_IIII'],
    },
    completionRules: {
      minObservations: 3,
      requiredFields: ['phase', 'load', 'indication', 'deltaL', 'cyclesCompleted', 'observationNote'],
    },
    reportMapping: {
      reportItemNumber: '19',
      reportItemTitle: 'Endurance Test',
      formNumber: 'R76-2 Form 19',
      isTopLevelReportItem: true,
    },
    procedureDefinition: {
      procedureVersion: '2006.1',
      pattern: 'PATTERN_D_ENVIRONMENTAL_STRESS',
      summary: 'Evaluate durability and mechanical resilience after 100,000 cycles of repetitive loading.',
      whatIsBeingChecked: 'Clause 3.9.4.3 and Clause A.6 mandate that after applying 100,000 repetitive load cycles, the difference in error before and after endurance does not exceed the Table 6 MPE for the applied load.',
      setupInstructions: [
        'Perform initial intrinsic weighing before endurance cycling and note error E_pre.',
        'Subject instrument to 100,000 repetitive load cycles using automated endurance loader.',
        'Perform post-endurance weighing at the same load and note error E_post.',
        'Calculate durability error shift: |E_post - E_pre| ≤ MPE(L).',
      ],
      requiredInputs: ['load', 'indication', 'deltaL', 'cyclesCompleted'],
      requiredObservations: ['phase', 'load', 'indication', 'deltaL', 'cyclesCompleted', 'observationNote'],
      observationSchema: {
        layout: 'ENDURANCE_CYCLE',
        fields: [
          { key: 'phase', label: 'Test Phase', type: 'STRING', required: true, readOnly: true },
          { key: 'load', label: 'Endurance Load', type: 'NUMBER', required: true, unitKey: 'primaryUnit' },
          { key: 'indication', label: 'Indication', type: 'NUMBER', required: true, unitKey: 'primaryUnit' },
          { key: 'deltaL', label: 'ΔL', type: 'NUMBER', required: true, unitKey: 'primaryUnit' },
          { key: 'cyclesCompleted', label: 'Completed Cycles', type: 'NUMBER', required: true },
          { key: 'observationNote', label: 'Observation Note', type: 'STRING', required: true },
        ],
        minObservations: 3,
      },
      validationRules: [
        { id: 'v-end-cycles', ruleType: 'REQUIRED_FIELDS', description: 'Endurance cycles and pre/post weighing errors must be recorded.', severity: 'BLOCKING' },
        { id: 'v-end-photo', ruleType: 'EVIDENCE_ATTACHED', description: 'Pre-test and post-test setup photographs required.', severity: 'BLOCKING' },
      ],
      calculationRule: { ruleId: 'CALC_ENDURANCE' },
      complianceRule: {
        ruleId: 'COMP_TABLE_6',
        clause: '3.9.4.3, A.6',
        mpeSource: 'TABLE_6',
        description: 'Error difference before and after endurance cycling must not exceed Table 6 MPE.',
      },
      evidencePolicy: {
        level: 'REQUIRED',
        required: true,
        purposes: ['SETUP', 'EQUIPMENT'],
        minItems: 1,
        recommendedTypes: ['SETUP_PHOTO'],
        explanation: 'Photographs of instrument mounted in repetitive loading apparatus before and after cycling.',
      },
    },
  },
};
