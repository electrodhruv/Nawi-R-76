/**
 * NAWI-R76 Master Database Seed
 *
 * Seeds canonical OIML R 76 test definitions, accredited laboratory staff,
 * calibrated reference standards, and benchmark instrument models.
 */

import {
  PrismaClient,
  UserRole,
  AccuracyClass,
  RangeType,
  PowerSupplyType,
  ReceptorType,
  TareType,
  TestCategory,
  StandardType,
  StandardWeightClass,
  EvaluationStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting NAWI-R76 database seeding...');

  // ==========================================================================
  // 1. Canonical Test Definitions (OIML R 76-1:2006 & R 76-2:2007)
  // ==========================================================================
  console.log('Seeding canonical OIML R 76 test definitions...');

  const testDefinitions = [
    {
      testCode: 'R76_ADMIN_EXAM',
      clauseReference: '3.10, 4.1',
      title: 'Administrative & Descriptive Markings Examination',
      category: TestCategory.CONSTRUCTION,
      isMandatory: true,
      declarativeProcedure: {
        description: 'Verify mandatory markings, inscriptions, descriptive plate, and software version identifiers.',
        checklistItems: [
          'Manufacturer mark / name',
          'Accuracy class designation (I, II, III, IIII)',
          'Max and Min indications in SI units',
          'Verification scale interval e',
          'Actual scale interval d if d != e',
          'Temperature limits if different from -10 °C to +40 °C',
          'Pattern approval mark and serial number',
          'Software version and checksum display',
        ],
        applicableClasses: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'],
      },
    },
    {
      testCode: 'R76_CONST_CHECK',
      clauseReference: '3.10, 4.1-18',
      title: 'Technical Construction, Security Sealing & Software Integrity',
      category: TestCategory.CONSTRUCTION,
      isMandatory: true,
      declarativeProcedure: {
        description: 'Physical and logical examination of construction, sealing mechanisms, and protection against unauthorized adjustments.',
        checklistItems: [
          'Suitability of application and design',
          'Security sealing and audit trail event counter',
          'Protection against fraudulent use and tampering',
          'Zero-setting and zero-tracking devices limit (+-4% or +-2%)',
          'Tare device mechanism and tare indication',
          'Display stability and legibility under glare',
        ],
        applicableClasses: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'],
      },
    },
    {
      testCode: 'R76_WEIGH_INTRINSIC',
      clauseReference: 'A.4.4',
      title: 'Weighing Performance: Initial Intrinsic Error Determination',
      category: TestCategory.METROLOGICAL,
      isMandatory: true,
      declarativeProcedure: {
        description: 'Determine intrinsic errors with >= 10 test loads, increasing and decreasing, including Min, Max, and MPE transition points.',
        minLoadPoints: 10,
        requiredDirections: ['INCREASING', 'DECREASING'],
        criticalPoints: ['Min', 'mpe_step_1', 'mpe_step_2', 'Max'],
        turningPointMethod: 'A.4.4.3',
        deltaL: '0.1e',
        evaluationFormula: 'Ec = E - E0; |Ec| <= MPE',
        applicableClasses: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'],
      },
    },
    {
      testCode: 'R76_ECC_WEIGHTS',
      clauseReference: 'A.4.7.1-3',
      title: 'Eccentricity Loading Using Weights (Standard Receptors)',
      category: TestCategory.METROLOGICAL,
      isMandatory: true,
      declarativeProcedure: {
        description: 'Eccentricity test with standard weights on instruments with <= 4 supports, > 4 supports, or special receptors.',
        loadingRules: {
          fourSupportsOrFewer: '1/3 Max (or 1/3 (Max + Max Additive Tare)) placed in center of each quarter',
          moreThanFourSupports: '1/(N-1) Max placed over each support point',
          specialReceptor: '1/10 Max placed at each support point',
        },
        turningPointMethod: 'A.4.4.3',
        evaluationFormula: '|Ec| <= MPE',
        applicableClasses: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'],
      },
    },
    {
      testCode: 'R76_ECC_ROLLING',
      clauseReference: 'A.4.7.4',
      title: 'Eccentricity with Rolling Load (Weighbridges & Rail Scales)',
      category: TestCategory.METROLOGICAL,
      isMandatory: false,
      declarativeProcedure: {
        description: 'Rolling load moved along receptor positions: beginning, middle, and end in normal and reverse directions per track segment.',
        standardAxleLoad: 'Typical loaded rolling vehicle axle or defined rolling test load',
        requiredPositions: ['BEGINNING', 'MIDDLE', 'END'],
        bidirectionalTesting: true,
        evaluationFormula: '|Ec| <= MPE',
        applicableClasses: ['CLASS_III', 'CLASS_IIII'],
      },
    },
    {
      testCode: 'R76_ECC_MOBILE',
      clauseReference: 'A.4.7.5',
      title: 'Eccentricity on Mobile Instruments',
      category: TestCategory.METROLOGICAL,
      isMandatory: false,
      declarativeProcedure: {
        description: 'Eccentricity evaluation specifically for mobile instruments (pallet trucks, crane scales, vehicle-mounted scales).',
        testLoad: '1/3 Max',
        inclinationTesting: 'Evaluated under both horizontal and allowable tilted mobile postures',
        applicableClasses: ['CLASS_III', 'CLASS_IIII'],
      },
    },
    {
      testCode: 'R76_DISCRIMINATION',
      clauseReference: 'A.4.8',
      title: 'Discrimination Test (Digital Display)',
      category: TestCategory.METROLOGICAL,
      isMandatory: true,
      declarativeProcedure: {
        description: 'An additional load equal to 1.4d smoothly applied must increase the indication by at least 1d.',
        testLoads: ['Min', '0.5 Max', 'Max'],
        additionalLoad: '1.4d',
        requiredIndicationChange: 'At least 1d',
        applicableClasses: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'],
      },
    },
    {
      testCode: 'R76_SENSITIVITY',
      clauseReference: 'A.4.9',
      title: 'Sensitivity for Non-Self-Indicating Instruments',
      category: TestCategory.METROLOGICAL,
      isMandatory: false,
      declarativeProcedure: {
        description: 'Determination of sensitivity for non-self-indicating balances by application of an extra mass equal to |MPE|.',
        applicableClasses: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'],
      },
    },
    {
      testCode: 'R76_REPEATABILITY',
      clauseReference: 'A.4.10',
      title: 'Type Examination Repeatability Test',
      category: TestCategory.METROLOGICAL,
      isMandatory: true,
      declarativeProcedure: {
        description: 'Two series of weighings: one at approx. 50% Max, one close to 100% Max. 10 weighings if Max < 1000 kg; >= 3 weighings if Max >= 1000 kg.',
        seriesTargets: ['approx_50_pct_max', 'close_to_100_pct_max'],
        countRule: 'Max < 1000 kg => 10; Max >= 1000 kg => >= 3',
        spanFormula: 'Delta_E = E_max - E_min',
        complianceRule: 'Delta_E <= |MPE| for that test load',
        applicableClasses: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'],
      },
    },
    {
      testCode: 'R76_CREEP',
      clauseReference: 'A.4.11.1',
      title: 'Creep Test (Classes II, III, IIII)',
      category: TestCategory.METROLOGICAL,
      isMandatory: true,
      declarativeProcedure: {
        description: 'Observe indication under load close to Max over 4 hours. Early termination after 30 min permitted if 30-min criteria are met.',
        testLoad: 'Close to Max',
        nominalDurationMinutes: 240,
        earlyTerminationDurationMinutes: 30,
        earlyTerminationRule: 'Delta_P(30m - 0m) <= 0.5e AND Delta_P(30m - 15m) <= 0.2e',
        fullDurationRule: 'Total creep over 4 hours <= 0.5e; difference between 4h and 2h <= 0.2e',
        applicableClasses: ['CLASS_II', 'CLASS_III', 'CLASS_IIII'],
      },
    },
    {
      testCode: 'R76_ZERO_RETURN',
      clauseReference: 'A.4.11.2',
      title: 'Zero Return Test (Residual Indication)',
      category: TestCategory.METROLOGICAL,
      isMandatory: true,
      declarativeProcedure: {
        description: 'Immediately upon removing the creep test load after 30 min or 4 h, the zero return indication is observed.',
        stabilizationTimeSeconds: 60,
        complianceRule: '|E_ret| <= 0.5e (for multi-interval: <= 0.5e1)',
        applicableClasses: ['CLASS_II', 'CLASS_III', 'CLASS_IIII'],
      },
    },
    {
      testCode: 'R76_STAB_EQUILIB',
      clauseReference: '4.4.2, A.4.12',
      title: 'Stability of Equilibrium Test',
      category: TestCategory.METROLOGICAL,
      isMandatory: true,
      declarativeProcedure: {
        description: 'Verify that printing, zero-setting, and tare operations are inhibited during disturbances until stable equilibrium is reached.',
        disturbanceMethods: ['Hand oscillation', 'Vibration table', 'Dynamic mass release'],
        acceptanceCriteria: 'No printout or taring executed while motion indicator is active; printed value matches stable value within 1e',
        applicableClasses: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'],
      },
    },
    {
      testCode: 'R76_TILTING',
      clauseReference: 'A.5.1',
      title: 'Tilting Sensitivity Test',
      category: TestCategory.ENVIRONMENTAL,
      isMandatory: true,
      declarativeProcedure: {
        description: 'For Class II, III, IIII without automatic leveling. Subject instrument to tilt of 50/1000 or limiting tilt angle.',
        testLoads: ['Min', '0.5 Max', 'Max'],
        tiltConditions: ['Level reference', 'Tilt left', 'Tilt right', 'Tilt front', 'Tilt back'],
        complianceRule: '|Ec| <= MPE under tilted condition',
        applicableClasses: ['CLASS_II', 'CLASS_III', 'CLASS_IIII'],
      },
    },
    {
      testCode: 'R76_WARM_UP',
      clauseReference: 'A.5.2',
      title: 'Warm-up Time Test',
      category: TestCategory.ENVIRONMENTAL,
      isMandatory: true,
      declarativeProcedure: {
        description: 'Disconnect power for at least 8 hours. Connect power, observe zero and near-Max indications immediately and at specified intervals up to warm-up period.',
        unpoweredSoakHours: 8,
        observationIntervalsMinutes: [0, 5, 15, 30],
        complianceRule: 'Zero deviation <= 0.25e; span deviation <= MPE',
        applicableClasses: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'],
      },
    },
    {
      testCode: 'R76_TEMP_INFLUENCE',
      clauseReference: 'A.5.3',
      title: 'Static Temperature Sequence Test',
      category: TestCategory.ENVIRONMENTAL,
      isMandatory: true,
      declarativeProcedure: {
        description: 'Dynamic temperature cycle: Reference temp (20 °C) -> Specified High -> Specified Low -> +5 °C (if Low <= 0 °C) -> Reference (20 °C).',
        temperatureSteps: ['T_ref_20C', 'T_high_specified', 'T_low_specified', 'T_plus_5C_if_applicable', 'T_ref_final'],
        soakTimeHours: 2,
        loadPoints: ['Zero', 'Min', 'mpe_boundaries', 'Max'],
        complianceRule: '|Ec| <= MPE at each temperature; Zero drift <= 1e per 5 °C (or 0.2e per 5 °C for Class I)',
        applicableClasses: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'],
      },
    },
    {
      testCode: 'R76_VOLT_AC_MAINS',
      clauseReference: 'A.5.4.1',
      title: 'Voltage Variation: AC Mains Supply',
      category: TestCategory.ELECTRICAL,
      isMandatory: true,
      declarativeProcedure: {
        description: 'Test instrument powered at AC mains nominal voltage Unom, then upper extreme (+10% or declared max), then lower extreme (-15% or declared min).',
        voltageLevels: ['Unom', 'Unom + 10%', 'Unom - 15%'],
        complianceRule: '|Ec| <= MPE at each voltage level; no significant fault',
        applicableClasses: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'],
      },
    },
    {
      testCode: 'R76_VOLT_EXT_AC_DC',
      clauseReference: 'A.5.4.2',
      title: 'Voltage Variation: External AC/DC Power Supply Device',
      category: TestCategory.ELECTRICAL,
      isMandatory: false,
      declarativeProcedure: {
        description: 'For instruments powered by an external AC/DC plug-in adaptor. Tested at declared upper and lower limits of supply voltage.',
        applicableClasses: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'],
      },
    },
    {
      testCode: 'R76_VOLT_BATTERY',
      clauseReference: 'A.5.4.3',
      title: 'Voltage Variation: Battery-Operated Instruments',
      category: TestCategory.ELECTRICAL,
      isMandatory: false,
      declarativeProcedure: {
        description: 'Reduce DC battery voltage from Unom down to the minimum operating cut-off voltage at which instrument inhibits weighing.',
        complianceRule: 'Before cut-off: |Ec| <= MPE. At/below cut-off: Instrument inhibits weighing or provides clear unambiguous error indication.',
        applicableClasses: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'],
      },
    },
    {
      testCode: 'R76_VOLT_VEHICLE',
      clauseReference: 'A.5.4.4',
      title: 'Voltage Variation: Road Vehicle Battery Supply',
      category: TestCategory.ELECTRICAL,
      isMandatory: false,
      declarativeProcedure: {
        description: 'For 12 V or 24 V road vehicle battery-powered scales. Tested at 9 V to 16 V (for 12 V systems) or 16 V to 32 V (for 24 V systems).',
        complianceRule: '|Ec| <= MPE across supply range',
        applicableClasses: ['CLASS_III', 'CLASS_IIII'],
      },
    },
    {
      testCode: 'R76_DAMP_HEAT',
      clauseReference: 'B.2',
      title: 'Damp Heat Steady State Test (48 Hours)',
      category: TestCategory.ENVIRONMENTAL,
      isMandatory: true,
      declarativeProcedure: {
        description: 'Instrument conditioned at 40 °C and 85% relative humidity for 48 hours. Intrinsic weighing tests performed before, during, and after.',
        exposureTempCelsius: 40,
        exposureRHPct: 85,
        exposureHours: 48,
        recoveryHours: 24,
        complianceRule: '|Ec| <= MPE during and post-recovery; zero change <= 1e',
        applicableClasses: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'],
      },
    },
    {
      testCode: 'R76_DISTURB_BURST',
      clauseReference: 'B.3.2',
      title: 'Electrical Fast Transients / Bursts (EFT)',
      category: TestCategory.ELECTRICAL,
      isMandatory: true,
      declarativeProcedure: {
        description: 'Apply fast transient bursts to AC/DC power supply lines and I/O signal lines with half-load applied.',
        testVoltageLevels: ['1 kV on AC mains', '0.5 kV on signal lines'],
        significantFaultThreshold: 'Difference > 1e is a significant fault unless detected and indicated',
        complianceRule: 'No significant fault or instrument provides clear fault alarm',
        applicableClasses: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'],
      },
    },
    {
      testCode: 'R76_DISTURB_ESD',
      clauseReference: 'B.3.3',
      title: 'Electrostatic Discharge (ESD)',
      category: TestCategory.ELECTRICAL,
      isMandatory: true,
      declarativeProcedure: {
        description: 'Apply contact discharges (+-4 kV) and air discharges (+-8 kV) to all accessible operator touch points with instrument under load.',
        contactVoltageKV: 4,
        airVoltageKV: 8,
        dischargesPerPolarity: 10,
        complianceRule: 'No significant fault (> 1e) without detection/interlocking',
        applicableClasses: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'],
      },
    },
    {
      testCode: 'R76_DISTURB_DIPS',
      clauseReference: 'B.3.1',
      title: 'AC Mains Voltage Dips and Short Interruptions',
      category: TestCategory.ELECTRICAL,
      isMandatory: true,
      declarativeProcedure: {
        description: 'Mains voltage reduced to 0% (0.5 cycle), 40% (10/12 cycles), and 70% (25/30 cycles) repeated 3 times at 10 s intervals.',
        reductionLevelsPct: [0, 40, 70],
        complianceRule: 'No significant fault or proper recovery',
        applicableClasses: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'],
      },
    },
    {
      testCode: 'R76_DISTURB_SURGE',
      clauseReference: 'B.3.4',
      title: 'Surge Immunity on Power Lines',
      category: TestCategory.ELECTRICAL,
      isMandatory: true,
      declarativeProcedure: {
        description: 'Apply 1.2/50 us surge pulses to power supply lines (line-to-line 1 kV, line-to-ground 2 kV).',
        lineLineVoltageKV: 1,
        lineGroundVoltageKV: 2,
        complianceRule: 'No significant fault without detection',
        applicableClasses: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'],
      },
    },
    {
      testCode: 'R76_DISTURB_RF',
      clauseReference: 'B.3.5',
      title: 'Radiated Electromagnetic Fields (RF Immunity)',
      category: TestCategory.ELECTRICAL,
      isMandatory: true,
      declarativeProcedure: {
        description: 'Expose instrument to 80 MHz - 2 GHz electromagnetic fields at 10 V/m field strength with 80% 1 kHz amplitude modulation.',
        frequencyRangeMHz: [80, 2000],
        fieldStrengthVM: 10,
        modulationPct: 80,
        complianceRule: '|Ec| <= MPE or significant fault detected and indicated',
        applicableClasses: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'],
      },
    },
    {
      testCode: 'R76_SPAN_STABILITY',
      clauseReference: 'B.4',
      title: 'Span Stability Test (Multi-Day Drift)',
      category: TestCategory.METROLOGICAL,
      isMandatory: true,
      declarativeProcedure: {
        description: 'Measure span error with near-Max reference load over at least 28 days (or minimum 8 measurements spaced across the period).',
        durationDays: 28,
        minMeasurementPoints: 8,
        complianceRule: 'Span drift <= 0.5e between any two consecutive measurements; total span drift <= 1.0e over full duration',
        applicableClasses: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'],
      },
    },
    {
      testCode: 'R76_ENDURANCE',
      clauseReference: 'A.6',
      title: 'Endurance Test (Repetitive Loading 100 000 Cycles)',
      category: TestCategory.METROLOGICAL,
      isMandatory: false,
      declarativeProcedure: {
        description: 'Repetitive loading of load receptor close to Max for 100 000 cycles. Applicable for instruments with Max <= 100 kg.',
        cycles: 100000,
        maxApplicableCapacityKg: 100,
        complianceRule: '|Ec| <= MPE after completion of endurance cycles',
        applicableClasses: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'],
      },
    },
    {
      testCode: 'R76_PORTABLE_WEIGHBRIDGE',
      clauseReference: 'A.4.13',
      title: 'Portable Weighbridges Additional Testing',
      category: TestCategory.METROLOGICAL,
      isMandatory: false,
      declarativeProcedure: {
        description: 'Special dismantling, reassembly, and support foundation deflection tests for portable weighbridges.',
        applicableClasses: ['CLASS_III', 'CLASS_IIII'],
      },
    },
  ];

  for (const def of testDefinitions) {
    await prisma.testDefinition.upsert({
      where: { testCode: def.testCode },
      update: {
        clauseReference: def.clauseReference,
        title: def.title,
        category: def.category,
        isMandatory: def.isMandatory,
        declarativeProcedure: def.declarativeProcedure,
      },
      create: {
        testCode: def.testCode,
        clauseReference: def.clauseReference,
        title: def.title,
        category: def.category,
        isMandatory: def.isMandatory,
        declarativeProcedure: def.declarativeProcedure,
      },
    });
  }

  console.log(`✅ Seeded ${testDefinitions.length} canonical test definitions.`);

  // ==========================================================================
  // 2. Default Laboratory Personnel (RBAC Matrix)
  // ==========================================================================
  console.log('Seeding laboratory staff...');

  const users = [
    {
      email: 'admin@nawi-lab.gov',
      fullName: 'Dr. Rajesh Sharma',
      role: UserRole.ADMIN,
      accreditationId: 'RRSL-DIR-001',
      signatureHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    },
    {
      email: 'manager@nawi-lab.gov',
      fullName: 'Priya Patel',
      role: UserRole.LAB_MANAGER,
      accreditationId: 'RRSL-QM-004',
      signatureHash: 'a1b2c3d4e5f60123456789abcdef0123456789abcdef0123456789abcdef0123',
    },
    {
      email: 'officer@nawi-lab.gov',
      fullName: 'Amit Verma',
      role: UserRole.TESTING_OFFICER,
      accreditationId: 'RRSL-MET-2024-042',
      signatureHash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    },
    {
      email: 'reviewer@nawi-lab.gov',
      fullName: 'Dr. S. K. Nair',
      role: UserRole.TECHNICAL_REVIEWER,
      accreditationId: 'RRSL-REV-2021-018',
      signatureHash: 'fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
    },
    {
      email: 'signatory@nawi-lab.gov',
      fullName: 'Director General V. K. Malhotra',
      role: UserRole.APPROVING_SIGNATORY,
      accreditationId: 'RRSL-SIG-1998-002',
      signatureHash: '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff',
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        fullName: user.fullName,
        role: user.role,
        accreditationId: user.accreditationId,
        signatureHash: user.signatureHash,
      },
      create: {
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        accreditationId: user.accreditationId,
        signatureHash: user.signatureHash,
      },
    });
  }

  console.log(`✅ Seeded ${users.length} laboratory staff accounts.`);

  // ==========================================================================
  // 3. Accredited Reference Standards (Clause 3.7.1)
  // ==========================================================================
  console.log('Seeding calibrated reference standards...');

  const now = new Date();
  const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

  const referenceStandards = [
    {
      serialNumber: 'STD-E2-2024-001',
      name: 'Class E2 Analytical Weight Set (1 mg - 500 g)',
      standardType: StandardType.WEIGHT_SET,
      weightClass: StandardWeightClass.E2,
      nominalMass: 0.5000,
      conventionalMass: 0.5000002,
      standardError: 0.0000002,
      expandedUncertainty_U: 0.000015,
      coverageFactor_k: 2.0,
      certificateNumber: 'NPLI-CAL-2024-E2-9081',
      calibratedBy: 'National Physical Laboratory of India (NPLI)',
      calibratedAt: sixMonthsAgo,
      validUntil: oneYearFromNow,
    },
    {
      serialNumber: 'STD-F1-2024-015',
      name: 'Class F1 Precision Stainless Steel Set (1 g - 20 kg)',
      standardType: StandardType.WEIGHT_SET,
      weightClass: StandardWeightClass.F1,
      nominalMass: 20.0000,
      conventionalMass: 20.000008,
      standardError: 0.000008,
      expandedUncertainty_U: 0.00025,
      coverageFactor_k: 2.0,
      certificateNumber: 'RRSL-CAL-2024-F1-4412',
      calibratedBy: 'Regional Reference Standard Laboratory, Ahmedabad',
      calibratedAt: sixMonthsAgo,
      validUntil: oneYearFromNow,
    },
    {
      serialNumber: 'STD-M1-2023-109',
      name: 'Class M1 Cast Iron Heavy Mass Set (50 kg x 20 = 1000 kg)',
      standardType: StandardType.WEIGHT_SET,
      weightClass: StandardWeightClass.M1,
      nominalMass: 1000.0000,
      conventionalMass: 1000.0040,
      standardError: 0.0040,
      expandedUncertainty_U: 0.015,
      coverageFactor_k: 2.0,
      certificateNumber: 'RRSL-CAL-2023-M1-1098',
      calibratedBy: 'Regional Reference Standard Laboratory, Bangalore',
      calibratedAt: sixMonthsAgo,
      validUntil: oneYearFromNow,
    },
    {
      serialNumber: 'CHAMBER-WT-2022-04',
      name: 'Weiss Technik Climatic Chamber Model WK11-180',
      standardType: StandardType.ENVIRONMENTAL_CHAMBER,
      weightClass: StandardWeightClass.NOT_APPLICABLE,
      nominalMass: 0,
      conventionalMass: 0,
      certificateNumber: 'NABL-ENV-2024-WT-003',
      calibratedBy: 'TUV SUD South Asia Calibration Lab',
      calibratedAt: sixMonthsAgo,
      validUntil: oneYearFromNow,
    },
    {
      serialNumber: 'HYGRO-PTU300-09',
      name: 'Vaisala PTU300 Barometric Pressure & Humidity Transmitter',
      standardType: StandardType.HYGROMETER,
      weightClass: StandardWeightClass.NOT_APPLICABLE,
      nominalMass: 0,
      conventionalMass: 0,
      certificateNumber: 'MET-PTU-2024-887',
      calibratedBy: 'Vaisala Metrology Center',
      calibratedAt: sixMonthsAgo,
      validUntil: oneYearFromNow,
    },
  ];

  for (const std of referenceStandards) {
    await prisma.referenceStandard.upsert({
      where: { serialNumber: std.serialNumber },
      update: {
        name: std.name,
        standardType: std.standardType,
        weightClass: std.weightClass,
        nominalMass: std.nominalMass,
        conventionalMass: std.conventionalMass,
        standardError: std.standardError,
        expandedUncertainty_U: std.expandedUncertainty_U,
        coverageFactor_k: std.coverageFactor_k,
        certificateNumber: std.certificateNumber,
        calibratedBy: std.calibratedBy,
        calibratedAt: std.calibratedAt,
        validUntil: std.validUntil,
      },
      create: {
        serialNumber: std.serialNumber,
        name: std.name,
        standardType: std.standardType,
        weightClass: std.weightClass,
        nominalMass: std.nominalMass,
        conventionalMass: std.conventionalMass,
        standardError: std.standardError,
        expandedUncertainty_U: std.expandedUncertainty_U,
        coverageFactor_k: std.coverageFactor_k,
        certificateNumber: std.certificateNumber,
        calibratedBy: std.calibratedBy,
        calibratedAt: std.calibratedAt,
        validUntil: std.validUntil,
      },
    });
  }

  console.log(`✅ Seeded ${referenceStandards.length} reference standards.`);

  // ==========================================================================
  // 4. Sample Manufacturers & Instrument Models
  // ==========================================================================
  console.log('Seeding manufacturers and representative instrument models...');

  // Manufacturer 1: Avery Weigh-Tronix
  const mfgAvery = await prisma.manufacturer.upsert({
    where: { name: 'Avery Weigh-Tronix India Pvt Ltd' },
    update: {
      countryCode: 'IN',
      address: 'Plot 50-51, Sector 25, Ballabgarh, Faridabad, Haryana 121004',
      contactPerson: 'Karan Mehra',
      contactEmail: 'kmehra@averyweigh-tronix.com',
    },
    create: {
      name: 'Avery Weigh-Tronix India Pvt Ltd',
      countryCode: 'IN',
      address: 'Plot 50-51, Sector 25, Ballabgarh, Faridabad, Haryana 121004',
      contactPerson: 'Karan Mehra',
      contactEmail: 'kmehra@averyweigh-tronix.com',
    },
  });

  // Model 1A: Class III Commercial Retail Scale (Single Range)
  const benchModel = await prisma.instrumentModel.upsert({
    where: {
      manufacturerId_modelName: {
        manufacturerId: mfgAvery.id,
        modelName: 'AWT-3000-Retail',
      },
    },
    update: {
      tradeName: 'Avery Point-of-Sale Computing Scale',
      softwareVersion: 'v2.14.0',
      serialNumberPattern: 'AWT3K-2026-####',
      accuracyClass: AccuracyClass.CLASS_III,
      rangeType: RangeType.SINGLE,
      maxCapacity: 15.0000,
      minCapacity: 0.1000,
      verificationInterval_e: 0.0050,
      scaleInterval_d: 0.0050,
      numberOfIntervals_n: 3000,
      primaryUnit: 'kg',
      specifiedTempMin: -10.0,
      specifiedTempMax: 40.0,
      powerSupplyType: PowerSupplyType.DUAL_MAINS_BATTERY,
      nominalVoltage: 230.0,
      batteryCutoffVoltage: 5.4,
      receptorType: ReceptorType.STANDARD_PAN,
      numberOfSupportPoints: 4,
      numberOfReceptorSections: 1,
      isBidirectionalTraffic: false,
      tareType: TareType.SUBTRACTIVE,
      hasAutomaticLeveling: false,
      isElectronic: true,
    },
    create: {
      manufacturerId: mfgAvery.id,
      modelName: 'AWT-3000-Retail',
      tradeName: 'Avery Point-of-Sale Computing Scale',
      softwareVersion: 'v2.14.0',
      serialNumberPattern: 'AWT3K-2026-####',
      accuracyClass: AccuracyClass.CLASS_III,
      rangeType: RangeType.SINGLE,
      maxCapacity: 15.0000,
      minCapacity: 0.1000,
      verificationInterval_e: 0.0050,
      scaleInterval_d: 0.0050,
      numberOfIntervals_n: 3000,
      primaryUnit: 'kg',
      specifiedTempMin: -10.0,
      specifiedTempMax: 40.0,
      powerSupplyType: PowerSupplyType.DUAL_MAINS_BATTERY,
      nominalVoltage: 230.0,
      batteryCutoffVoltage: 5.4,
      receptorType: ReceptorType.STANDARD_PAN,
      numberOfSupportPoints: 4,
      numberOfReceptorSections: 1,
      isBidirectionalTraffic: false,
      tareType: TareType.SUBTRACTIVE,
      hasAutomaticLeveling: false,
      isElectronic: true,
    },
  });

  // Model 1B: Class III Multi-Interval Scale
  const multiIntervalModel = await prisma.instrumentModel.upsert({
    where: {
      manufacturerId_modelName: {
        manufacturerId: mfgAvery.id,
        modelName: 'AWT-6000-DualInterval',
      },
    },
    update: {
      tradeName: 'Avery Dual-Range Supermarket Checkout Scale',
      softwareVersion: 'v3.01.2',
      serialNumberPattern: 'AWT6K-DI-####',
      accuracyClass: AccuracyClass.CLASS_III,
      rangeType: RangeType.MULTI_INTERVAL,
      maxCapacity: 15.0000,
      minCapacity: 0.0400,
      verificationInterval_e: 0.0020, // e1 base
      scaleInterval_d: 0.0020,
      numberOfIntervals_n: 6000,
      primaryUnit: 'kg',
      specifiedTempMin: -10.0,
      specifiedTempMax: 40.0,
      powerSupplyType: PowerSupplyType.MAINS_AC,
      nominalVoltage: 230.0,
      receptorType: ReceptorType.STANDARD_PAN,
      numberOfSupportPoints: 4,
      numberOfReceptorSections: 1,
      isBidirectionalTraffic: false,
      tareType: TareType.SUBTRACTIVE,
      hasAutomaticLeveling: false,
      isElectronic: true,
    },
    create: {
      manufacturerId: mfgAvery.id,
      modelName: 'AWT-6000-DualInterval',
      tradeName: 'Avery Dual-Range Supermarket Checkout Scale',
      softwareVersion: 'v3.01.2',
      serialNumberPattern: 'AWT6K-DI-####',
      accuracyClass: AccuracyClass.CLASS_III,
      rangeType: RangeType.MULTI_INTERVAL,
      maxCapacity: 15.0000,
      minCapacity: 0.0400,
      verificationInterval_e: 0.0020,
      scaleInterval_d: 0.0020,
      numberOfIntervals_n: 6000,
      primaryUnit: 'kg',
      specifiedTempMin: -10.0,
      specifiedTempMax: 40.0,
      powerSupplyType: PowerSupplyType.MAINS_AC,
      nominalVoltage: 230.0,
      receptorType: ReceptorType.STANDARD_PAN,
      numberOfSupportPoints: 4,
      numberOfReceptorSections: 1,
      isBidirectionalTraffic: false,
      tareType: TareType.SUBTRACTIVE,
      hasAutomaticLeveling: false,
      isElectronic: true,
    },
  });

  // Partial ranges for Multi-Interval model:
  // W1: 0 - 6 kg, e1 = 2 g, n1 = 3000
  // W2: 6 - 15 kg, e2 = 5 g, n2 = 1800
  await prisma.partialWeighingRange.upsert({
    where: {
      instrumentId_rangeIndex: {
        instrumentId: multiIntervalModel.id,
        rangeIndex: 1,
      },
    },
    update: {
      minCapacity_i: 0.0400,
      maxCapacity_i: 6.0000,
      verificationInterval_ei: 0.0020,
      scaleInterval_di: 0.0020,
      numberOfIntervals_ni: 3000,
    },
    create: {
      instrumentId: multiIntervalModel.id,
      rangeIndex: 1,
      minCapacity_i: 0.0400,
      maxCapacity_i: 6.0000,
      verificationInterval_ei: 0.0020,
      scaleInterval_di: 0.0020,
      numberOfIntervals_ni: 3000,
    },
  });

  await prisma.partialWeighingRange.upsert({
    where: {
      instrumentId_rangeIndex: {
        instrumentId: multiIntervalModel.id,
        rangeIndex: 2,
      },
    },
    update: {
      minCapacity_i: 6.0000,
      maxCapacity_i: 15.0000,
      verificationInterval_ei: 0.0050,
      scaleInterval_di: 0.0050,
      numberOfIntervals_ni: 1800,
    },
    create: {
      instrumentId: multiIntervalModel.id,
      rangeIndex: 2,
      minCapacity_i: 6.0000,
      maxCapacity_i: 15.0000,
      verificationInterval_ei: 0.0050,
      scaleInterval_di: 0.0050,
      numberOfIntervals_ni: 1800,
    },
  });

  // Manufacturer 2: Mettler Toledo
  const mfgMettler = await prisma.manufacturer.upsert({
    where: { name: 'Mettler Toledo Metrology AG' },
    update: {
      countryCode: 'CH',
      address: 'Im Langacher 44, 8606 Greifensee, Switzerland',
      contactPerson: 'Dr. Hans-Peter Steiner',
      contactEmail: 'hp.steiner@mt.com',
    },
    create: {
      name: 'Mettler Toledo Metrology AG',
      countryCode: 'CH',
      address: 'Im Langacher 44, 8606 Greifensee, Switzerland',
      contactPerson: 'Dr. Hans-Peter Steiner',
      contactEmail: 'hp.steiner@mt.com',
    },
  });

  // Model 2: Class I Analytical Balance (High Precision)
  await prisma.instrumentModel.upsert({
    where: {
      manufacturerId_modelName: {
        manufacturerId: mfgMettler.id,
        modelName: 'XPR-205',
      },
    },
    update: {
      tradeName: 'Excellence Level Analytical Balance',
      softwareVersion: 'v1.4.9',
      serialNumberPattern: 'XPR205-CH-####',
      accuracyClass: AccuracyClass.CLASS_I,
      rangeType: RangeType.SINGLE,
      maxCapacity: 0.2200, // 220 g in kg
      minCapacity: 0.0010, // 1 g in kg
      verificationInterval_e: 0.0010, // 1 mg in kg = 0.000001? (Keep in unit kg: 1 mg = 0.000001 kg, or if unit is g: max=220g)
      scaleInterval_d: 0.00001, // 0.01 mg
      numberOfIntervals_n: 220000,
      primaryUnit: 'g',
      specifiedTempMin: 10.0,
      specifiedTempMax: 30.0,
      powerSupplyType: PowerSupplyType.EXTERNAL_AC_DC,
      nominalVoltage: 24.0,
      receptorType: ReceptorType.STANDARD_PAN,
      numberOfSupportPoints: 1, // Central load cell
      numberOfReceptorSections: 1,
      isBidirectionalTraffic: false,
      tareType: TareType.SUBTRACTIVE,
      hasAutomaticLeveling: true,
      isElectronic: true,
    },
    create: {
      manufacturerId: mfgMettler.id,
      modelName: 'XPR-205',
      tradeName: 'Excellence Level Analytical Balance',
      softwareVersion: 'v1.4.9',
      serialNumberPattern: 'XPR205-CH-####',
      accuracyClass: AccuracyClass.CLASS_I,
      rangeType: RangeType.SINGLE,
      maxCapacity: 220.0000, // in grams
      minCapacity: 0.0100,   // in grams
      verificationInterval_e: 0.0010, // 1 mg = 0.001 g
      scaleInterval_d: 0.00001,      // 0.01 mg = 0.00001 g
      numberOfIntervals_n: 220000,
      primaryUnit: 'g',
      specifiedTempMin: 10.0,
      specifiedTempMax: 30.0,
      powerSupplyType: PowerSupplyType.EXTERNAL_AC_DC,
      nominalVoltage: 24.0,
      receptorType: ReceptorType.STANDARD_PAN,
      numberOfSupportPoints: 1,
      numberOfReceptorSections: 1,
      isBidirectionalTraffic: false,
      tareType: TareType.SUBTRACTIVE,
      hasAutomaticLeveling: true,
      isElectronic: true,
    },
  });

  // Manufacturer 3: Essae-Teraoka Ltd (Heavy Industrial Weighbridge)
  const mfgEssae = await prisma.manufacturer.upsert({
    where: { name: 'Essae-Teraoka Ltd' },
    update: {
      countryCode: 'IN',
      address: '377/22, 6th Cross, Wilson Garden, Bangalore 560027',
      contactPerson: 'Ramesh Sundaram',
      contactEmail: 'ramesh.sundaram@essae.com',
    },
    create: {
      name: 'Essae-Teraoka Ltd',
      countryCode: 'IN',
      address: '377/22, 6th Cross, Wilson Garden, Bangalore 560027',
      contactPerson: 'Ramesh Sundaram',
      contactEmail: 'ramesh.sundaram@essae.com',
    },
  });

  const platformModel = await prisma.instrumentModel.upsert({
    where: {
      manufacturerId_modelName: {
        manufacturerId: mfgEssae.id,
        modelName: 'WB-60T-Axle',
      },
    },
    update: {
      tradeName: 'Essae Electronic Pitless Road Weighbridge',
      softwareVersion: 'v5.2.0',
      serialNumberPattern: 'ESS-WB60T-####',
      accuracyClass: AccuracyClass.CLASS_III,
      rangeType: RangeType.SINGLE,
      maxCapacity: 60000.0000,
      minCapacity: 400.0000,
      verificationInterval_e: 20.0000,
      scaleInterval_d: 20.0000,
      numberOfIntervals_n: 3000,
      primaryUnit: 'kg',
      specifiedTempMin: -10.0,
      specifiedTempMax: 50.0,
      powerSupplyType: PowerSupplyType.MAINS_AC,
      nominalVoltage: 230.0,
      receptorType: ReceptorType.ROLLING_TRACK,
      numberOfSupportPoints: 6,
      numberOfReceptorSections: 2,
      isBidirectionalTraffic: true,
      tareType: TareType.SUBTRACTIVE,
      hasAutomaticLeveling: false,
      isElectronic: true,
    },
    create: {
      manufacturerId: mfgEssae.id,
      modelName: 'WB-60T-Axle',
      tradeName: 'Essae Electronic Pitless Road Weighbridge',
      softwareVersion: 'v5.2.0',
      serialNumberPattern: 'ESS-WB60T-####',
      accuracyClass: AccuracyClass.CLASS_III,
      rangeType: RangeType.SINGLE,
      maxCapacity: 60000.0000,
      minCapacity: 400.0000,
      verificationInterval_e: 20.0000,
      scaleInterval_d: 20.0000,
      numberOfIntervals_n: 3000,
      primaryUnit: 'kg',
      specifiedTempMin: -10.0,
      specifiedTempMax: 50.0,
      powerSupplyType: PowerSupplyType.MAINS_AC,
      nominalVoltage: 230.0,
      receptorType: ReceptorType.ROLLING_TRACK,
      numberOfSupportPoints: 6,
      numberOfReceptorSections: 2,
      isBidirectionalTraffic: true,
      tareType: TareType.SUBTRACTIVE,
      hasAutomaticLeveling: false,
      isElectronic: true,
    },
  });

  console.log('✅ Seeded representative manufacturers and instrument models.');

  // ==========================================================================
  // 5. Sample Evaluations (1 Active Bench Scale, 1 Completed Platform Scale)
  // ==========================================================================
  console.log('Seeding sample evaluations...');

  const leadMetrologist = await prisma.user.findUnique({ where: { email: 'officer@nawi-lab.gov' } });
  const techReviewer = await prisma.user.findUnique({ where: { email: 'reviewer@nawi-lab.gov' } });
  const signatoryDirector = await prisma.user.findUnique({ where: { email: 'signatory@nawi-lab.gov' } });

  if (leadMetrologist && benchModel && platformModel) {
    // 1. Active Bench Scale Evaluation
    const activeEval = await prisma.typeEvaluation.upsert({
      where: { evaluationNumber: 'RRSL-2026-TE-0104' },
      update: {
        instrumentId: benchModel.id,
        leadMetrologistId: leadMetrologist.id,
        reviewerId: techReviewer?.id,
        status: EvaluationStatus.IN_TESTING,
        startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      create: {
        evaluationNumber: 'RRSL-2026-TE-0104',
        instrumentId: benchModel.id,
        leadMetrologistId: leadMetrologist.id,
        reviewerId: techReviewer?.id,
        status: EvaluationStatus.IN_TESTING,
        standard: 'OIML R 76-1',
        standardVersion: '2006 (E)',
        rulePackVersion: 'R76-2006-v1',
        startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    });

    // 2. Completed Platform Scale Evaluation
    const completedEval = await prisma.typeEvaluation.upsert({
      where: { evaluationNumber: 'RRSL-2026-TE-0102' },
      update: {
        instrumentId: platformModel.id,
        leadMetrologistId: leadMetrologist.id,
        reviewerId: techReviewer?.id,
        signatoryId: signatoryDirector?.id,
        status: EvaluationStatus.REPORT_ISSUED,
        startedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        approvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      create: {
        evaluationNumber: 'RRSL-2026-TE-0102',
        instrumentId: platformModel.id,
        leadMetrologistId: leadMetrologist.id,
        reviewerId: techReviewer?.id,
        signatoryId: signatoryDirector?.id,
        status: EvaluationStatus.REPORT_ISSUED,
        standard: 'OIML R 76-1',
        standardVersion: '2006 (E)',
        rulePackVersion: 'R76-2006-v1',
        startedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        approvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    });

    console.log(`✅ Seeded 2 sample evaluations: ${activeEval.evaluationNumber} (Active Bench Scale) and ${completedEval.evaluationNumber} (Completed Platform Scale).`);
  }

  console.log('✨ NAWI-R76 database seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
