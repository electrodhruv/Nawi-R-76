/**
 * Approved Knowledge Base Repository for NAWI Lab Assistant
 *
 * Implements document storage and retrieval indexing for:
 * 1. OIML Standards (OIML R 76-1:2006)
 * 2. Approved Laboratory Standard Operating Procedures (SOPs)
 * 3. Approved Instrument Operating Manuals
 * 4. NAWI-R76 Application Guidance
 */

import { KnowledgeDocument, KnowledgeSection } from './knowledge-types';

export const APPROVED_KNOWLEDGE_DOCUMENTS: KnowledgeDocument[] = [
  // ==========================================================================
  // 1. OIML R 76-1:2006 (E) Standard
  // ==========================================================================
  {
    id: 'DOC-OIML-R76-1-2006',
    title: 'OIML R 76-1:2006 (E) Non-automatic weighing instruments - Part 1: Metrological and technical requirements',
    sourceType: 'OIML_STANDARD',
    version: '2006 (E)',
    effectiveDate: '2006-10-01',
    status: 'ACTIVE',
    sections: [
      {
        sectionId: 'OIML-3.5.1',
        sectionNumber: '3.5.1',
        title: 'Maximum Permissible Errors (MPE) on Pattern Evaluation',
        citation: 'OIML R 76-1:2006, Clause 3.5.1 & Table 6',
        keywords: ['mpe', 'tolerance', 'maximum permissible error', 'table 6', 'limits', 'class', 'error'],
        content:
          'Table 6 specifies the maximum permissible errors for pattern evaluation. For Class III instruments: ' +
          '0 <= m <= 500e: MPE is ±0.5e; 500e < m <= 2000e: MPE is ±1.0e; 2000e < m <= 10000e: MPE is ±1.5e. ' +
          'For Class II instruments: 0 <= m <= 5000e: MPE is ±0.5e; 5000e < m <= 20000e: MPE is ±1.0e; 20000e < m: MPE is ±1.5e. ' +
          'All errors must be evaluated against Table 6 for initial verification.',
      },
      {
        sectionId: 'OIML-3.7.1',
        sectionNumber: '3.7.1',
        title: 'Reference Standard Weights & Traceability',
        citation: 'OIML R 76-1:2006, Clause 3.7.1',
        keywords: ['reference standard', 'standard weights', 'traceability', 'uncertainty', 'calibration', 'weights'],
        content:
          'The standard weights used for type evaluation of an instrument shall not have an error greater than 1/3 of the ' +
          'maximum permissible error of the instrument for the applied load. Standard weights must be traceable to national ' +
          'standards and possess a valid, unexpired calibration certificate.',
      },
      {
        sectionId: 'OIML-A.4.4',
        sectionNumber: 'A.4.4',
        title: 'Determination of Initial Intrinsic Weighing Errors',
        citation: 'OIML R 76-1:2006, Clause A.4.4',
        keywords: ['intrinsic', 'weighing', 'turning point', 'delta l', 'rounding', 'ec', 'error', 'procedure'],
        content:
          'Apply test loads from zero up to and including Max, then remove the test loads back to zero. At each load, ' +
          'record the indication I. To eliminate rounding error, determine the turning point by adding small sub-weights ' +
          'ΔL (e.g. 0.1e increments) until the indication switches to I + d. The continuous indication before rounding is: ' +
          'P = I + 0.5e - ΔL. The error is E = P - L, and corrected error is Ec = E - E0.',
      },
      {
        sectionId: 'OIML-A.4.7',
        sectionNumber: 'A.4.7',
        title: 'Eccentricity Tests',
        citation: 'OIML R 76-1:2006, Clause A.4.7',
        keywords: ['eccentricity', 'off center', 'corner', 'pan', 'rolling', 'track', 'mobile', 'load receptor'],
        content:
          'For instruments with a standard pan receptor (A.4.7.1): Apply a load of approximately 1/3 Max to each of the ' +
          '4 quarter segments of the pan and the center. For instruments with a rolling track (A.4.7.4): Apply a rolling load ' +
          'at the beginning, middle, and end of the track. For mobile instruments (A.4.7.5): Apply load at designated positions. ' +
          'Standard pan scales are exempt from rolling-load tests.',
      },
      {
        sectionId: 'OIML-A.4.10',
        sectionNumber: 'A.4.10',
        title: 'Repeatability Test',
        citation: 'OIML R 76-1:2006, Clause A.4.10 & 3.6.1',
        keywords: ['repeatability', 'span', 'repetition', 'series', 'runs'],
        content:
          'Perform consecutive weighing runs with the same test load (approximately 0.5 Max and Max). The instrument must be ' +
          'zeroed before each series. For Class I and II: 10 weighings. For Class III and IIII: 3 weighings. ' +
          'The difference between the maximum and minimum continuous readings (Pmax - Pmin) must not exceed |MPE| for that load.',
      },
      {
        sectionId: 'OIML-A.4.5',
        sectionNumber: 'A.4.5',
        title: 'Tare Weighing Test',
        citation: 'OIML R 76-1:2006, Clause A.4.5',
        keywords: ['tare', 'subtractive', 'tare accuracy', 'tare mechanism', 'net'],
        content:
          'Weighing tests with tare shall be conducted using at least five different tare loads. The tare device shall be ' +
          'capable of setting the indication to zero with an accuracy of ±0.25e for electronic instruments. The net indication ' +
          'errors must satisfy the applicable Table 6 MPE limits.',
      },
      {
        sectionId: 'OIML-A.4.11',
        sectionNumber: 'A.4.11',
        title: 'Creep and Zero Return Test',
        citation: 'OIML R 76-1:2006, Clause A.4.11',
        keywords: ['creep', 'zero return', 'sustained load', '30 minutes', 'drift'],
        content:
          'Apply a load equal to Max and hold for 30 minutes. Record indication at 0, 5, 15, and 30 minutes. ' +
          'The total creep indication change between 0 and 30 minutes must not exceed 0.5e, and between 15 and 30 minutes must ' +
          'not exceed 0.2e. Remove load and check zero return after 30 seconds (residual error must not exceed 0.5e).',
      },
      {
        sectionId: 'OIML-A.5.1',
        sectionNumber: 'A.5.1',
        title: 'Tilting Test',
        citation: 'OIML R 76-1:2006, Clause A.5.1',
        keywords: ['tilt', 'tilting', 'leveling', 'spirit level', 'automatic leveling', 'angle'],
        content:
          'For instruments not fixed in place and not equipped with automatic leveling, tilt the instrument to 50:1000 ' +
          'in forward, backward, left, and right directions. The error under tilt must remain within applicable MPE. ' +
          'Instruments equipped with automatic self-leveling systems are exempt from manual tilting tests.',
      },
      {
        sectionId: 'OIML-A.5.3',
        sectionNumber: 'A.5.3',
        title: 'Static Temperature Test',
        citation: 'OIML R 76-1:2006, Clause A.5.3',
        keywords: ['temperature', 'static temperature', 'climatic', 'heat', 'cold', 'span drift'],
        content:
          'The test consists of exposure to the specified temperature limits: 20 °C (reference), upper temperature limit ' +
          '(e.g. +40 °C), lower temperature limit (e.g. -10 °C), and return to 20 °C. Maintain steady temperature for at least ' +
          '2 hours prior to measurement. Errors must comply with Table 6 at all temperatures.',
      },
      {
        sectionId: 'OIML-B.2.1',
        sectionNumber: 'B.2.1',
        title: 'Power Supply Voltage Variation Test',
        citation: 'OIML R 76-1:2006, Clause B.2.1 & B.2.2',
        keywords: ['voltage', 'mains', 'power supply', 'battery', 'electrical', 'variations'],
        content:
          'For AC mains powered instruments: Test at nominal voltage, upper limit (Unom + 10%), and lower limit (Unom - 15%). ' +
          'For battery-operated instruments: Test at nominal voltage and lower operating limit (Umin) until instrument display ' +
          'signals low battery or shuts down.',
      },
    ],
  },

  // ==========================================================================
  // 2. Approved Laboratory Standard Operating Procedures (SOPs)
  // ==========================================================================
  {
    id: 'DOC-SOP-MET-01',
    title: 'SOP-MET-01: Laboratory Environmental Conditions & Thermal Stabilization',
    sourceType: 'LAB_SOP',
    version: 'v3.2',
    effectiveDate: '2025-01-15',
    status: 'ACTIVE',
    sections: [
      {
        sectionId: 'SOP-01-1.1',
        sectionNumber: '1.1',
        title: 'Ambient Temperature & Humidity Stabilization',
        citation: 'Approved Laboratory SOP-MET-01, Section 1.1',
        keywords: ['ambient', 'temperature', 'humidity', 'stabilization', 'room', 'conditions'],
        content:
          'Testing rooms shall maintain an ambient temperature of 20.0 °C ± 2.0 °C with rate of temperature change <= 0.5 °C/h. ' +
          'Relative humidity shall be controlled between 40% and 70%. Instruments under test must be acclimated in the ' +
          'testing environment for a minimum of 1 hour (Classes III and IIII) or 4 hours (Classes I and II) before testing begins.',
      },
      {
        sectionId: 'SOP-01-1.2',
        sectionNumber: '1.2',
        title: 'Atmospheric Pressure Recording',
        citation: 'Approved Laboratory SOP-MET-01, Section 1.2',
        keywords: ['pressure', 'barometric', 'hpa', 'atmosphere'],
        content:
          'Barometric pressure shall be monitored using a calibrated digital barometer and recorded in the Test Setup step. ' +
          'Normal laboratory operational pressure is between 950 hPa and 1050 hPa.',
      },
    ],
  },

  {
    id: 'DOC-SOP-MET-04',
    title: 'SOP-MET-04: Handling & Usage of Standard Mass Sets',
    sourceType: 'LAB_SOP',
    version: 'v4.0',
    effectiveDate: '2024-11-01',
    status: 'ACTIVE',
    sections: [
      {
        sectionId: 'SOP-04-2.1',
        sectionNumber: '2.1',
        title: 'Weight Handling and Cleaning Protocol',
        citation: 'Approved Laboratory SOP-MET-04, Section 2.1',
        keywords: ['gloves', 'handling', 'weights', 'forceps', 'standard mass', 'cleaning'],
        content:
          'Standard weights of Class E2 and F1 shall never be touched with bare hands. Operators must wear clean lint-free ' +
          'cotton or chamois leather gloves. Fractional weights (< 1 g) must be manipulated using non-magnetic forceps ' +
          'with plastic tips. Standard weights must be allowed to reach thermal equilibrium with room air.',
      },
    ],
  },

  {
    id: 'DOC-SOP-MET-09',
    title: 'SOP-MET-09: Photographic Evidence & Terminal Display Capture Protocol',
    sourceType: 'LAB_SOP',
    version: 'v2.1',
    effectiveDate: '2025-03-01',
    status: 'ACTIVE',
    sections: [
      {
        sectionId: 'SOP-09-3.1',
        sectionNumber: '3.1',
        title: 'Terminal Display Evidence Capture Requirements',
        citation: 'Approved Laboratory SOP-MET-09, Section 3.1',
        keywords: ['evidence', 'photo', 'camera', 'ocr', 'photographic', 'display capture'],
        content:
          'Photographic evidence must capture the instrument terminal display clearly without specular glare or reflections. ' +
          'All primary display digits, legal units (kg/g), and annunciators (Center-of-Zero, Net, Stability) must be legible. ' +
          'Assisted OCR candidates must be verified for numeric consistency before saving.',
      },
    ],
  },

  {
    id: 'DOC-SOP-MET-12',
    title: 'SOP-MET-12: Anomaly Logging & Controlled Observation Correction',
    sourceType: 'LAB_SOP',
    version: 'v3.0',
    effectiveDate: '2025-02-10',
    status: 'ACTIVE',
    sections: [
      {
        sectionId: 'SOP-12-4.1',
        sectionNumber: '4.1',
        title: 'Observation Correction Protocol',
        citation: 'Approved Laboratory SOP-MET-12, Section 4.1',
        keywords: ['correction', 'edit observation', 'reason', 'mistake', 'audit', 'invalid'],
        content:
          'Raw laboratory observations may only be modified through the controlled Correction modal. The operator must record ' +
          'the original value, corrected value, explicit reason code (e.g. Transcription Typo, Wrong Standard Mass), and ' +
          'operator name. The system maintains immutable audit trails and never deletes original entries.',
      },
      {
        sectionId: 'SOP-12-4.2',
        sectionNumber: '4.2',
        title: 'Retest Initiation and Prior Attempt Archiving',
        citation: 'Approved Laboratory SOP-MET-12, Section 4.2',
        keywords: ['retest', 'request retest', 'repeat test', 'attempt'],
        content:
          'When a test sequence fails or is invalidated due to equipment anomaly, an official Retest Event must be logged. ' +
          'The previous attempt status and failure reasons are preserved in the evaluation record history, while the measurement ' +
          'sequence is reset for the new attempt.',
      },
    ],
  },

  // ==========================================================================
  // 3. Approved Instrument Operating Manuals
  // ==========================================================================
  {
    id: 'DOC-MAN-PB-B6',
    title: 'Precision-Bench-B6 Operating & Service Manual',
    sourceType: 'INSTRUMENT_MANUAL',
    instrumentModel: 'Precision-Bench-B6',
    version: 'Rev 1.4',
    effectiveDate: '2024-06-01',
    status: 'ACTIVE',
    sections: [
      {
        sectionId: 'MAN-B6-3.1',
        sectionNumber: '3.1',
        title: 'Warm-up and Power Initialization',
        citation: 'Precision-Bench-B6 Operating Manual, Section 3.1',
        keywords: ['warm-up', 'power on', 'start', 'initialize', 'turn on', 'boot'],
        content:
          'Connect the instrument to 230 V AC mains using the supplied shielded power cord. Press the power key on the front ' +
          'panel. The instrument displays a self-check countdown (999999 to 000000). For legal metrology evaluations, allow ' +
          'the unit to warm up for at least 30 minutes in a draft-free room before taking test measurements.',
      },
      {
        sectionId: 'MAN-B6-4.2',
        sectionNumber: '4.2',
        title: 'Zero Setting & Semi-Automatic Zeroing',
        citation: 'Precision-Bench-B6 Operating Manual, Section 4.2',
        keywords: ['zero', 'zeroing', 'zero key', 're-zero', 'balance zero'],
        content:
          'To zero the scale, ensure the platter is empty and clean. Press the [>0<] key. The Center-of-Zero indicator [O] ' +
          'will illuminate when zero is achieved within ±0.25d. Semi-automatic zero setting operates within ±2% of Max.',
      },
      {
        sectionId: 'MAN-B6-5.1',
        sectionNumber: '5.1',
        title: 'Tare Operation Procedure',
        citation: 'Precision-Bench-B6 Operating Manual, Section 5.1',
        keywords: ['tare', 'how to tare', 'taring', 'container', 'net', 'tare key'],
        content:
          'Place the empty container or receptacle on the load receiver. Wait for the stability annunciator [~] to turn off. ' +
          'Press the [T] key on the membrane keypad. The display resets to "0.000 g" and the [NET] indicator illuminates. ' +
          'To clear the tare, remove the container and press the [T] key again.',
      },
      {
        sectionId: 'MAN-B6-6.2',
        sectionNumber: '6.2',
        title: 'Internal Calibration & Sensitivity Adjustment',
        citation: 'Precision-Bench-B6 Operating Manual, Section 6.2',
        keywords: ['calibration', 'calibrate', 'internal cal', 'span adjustment'],
        content:
          'To perform internal calibration: With an empty pan, press and hold the [CAL] key for 3 seconds. The motor-driven ' +
          'internal weight will engage automatically. When calibration is complete, the display briefly flashes "CAL OK" ' +
          'and returns to standard weighing mode.',
      },
    ],
  },

  {
    id: 'DOC-MAN-AWT-3000',
    title: 'AWT-3000-Retail Commercial Scale Operating Manual',
    sourceType: 'INSTRUMENT_MANUAL',
    instrumentModel: 'AWT-3000-Retail',
    version: 'Rev 2.0',
    effectiveDate: '2025-01-10',
    status: 'ACTIVE',
    sections: [
      {
        sectionId: 'MAN-AWT-2.4',
        sectionNumber: '2.4',
        title: 'Dual-Interval Operation and Automatic Range Switching',
        citation: 'AWT-3000-Retail Operating Manual, Section 2.4',
        keywords: ['dual interval', 'range', 'range 1', 'range 2', 'intervals', 'switching'],
        content:
          'The AWT-3000 is a multi-interval scale with two ranges: Range 1 (0 to 6 kg, e1 = 2 g) and Range 2 (6 kg to 15 kg, e2 = 5 g). ' +
          'Range switching from Range 1 to Range 2 occurs automatically when the applied load exceeds 6.000 kg. ' +
          'When unloading, Range 1 is restored only after gross zero is reached.',
      },
      {
        sectionId: 'MAN-AWT-3.2',
        sectionNumber: '3.2',
        title: 'Tare Operation Procedure',
        citation: 'AWT-3000-Retail Operating Manual, Section 3.2',
        keywords: ['tare', 'how to tare', 'taring', 'tare key', 'net', 'container'],
        content:
          'Place the tare vessel or packaging on the stainless-steel pan. Press the red [TARE] button on the keyboard. ' +
          'The tare weight is deducted and the [NET] LED illuminates. The maximum tare capability is subtractive up to ' +
          '100% of Range 1 capacity (6 kg).',
      },
      {
        sectionId: 'MAN-AWT-4.1',
        sectionNumber: '4.1',
        title: 'Level Bubble Centering & Foot Screw Adjustment',
        citation: 'AWT-3000-Retail Operating Manual, Section 4.1',
        keywords: ['level', 'leveling', 'bubble', 'spirit level', 'feet', 'screws'],
        content:
          'Locate the spirit level bubble on the rear left corner of the housing. Rotate the four rubber leveling feet clockwise ' +
          'or counter-clockwise until the air bubble sits precisely in the center of the circular black ring. Lock the lock-nuts ' +
          'after adjustment to prevent vibration shift.',
      },
    ],
  },

  // ==========================================================================
  // 4. NAWI-R76 Application Guidance
  // ==========================================================================
  {
    id: 'DOC-APP-HELP-V1',
    title: 'NAWI-R76 Application Metrology User Guide',
    sourceType: 'APPLICATION_HELP',
    version: 'v1.0',
    effectiveDate: '2026-01-01',
    status: 'ACTIVE',
    sections: [
      {
        sectionId: 'APP-1.0',
        sectionNumber: '1.0',
        title: 'The 6-Step Laboratory Evaluation Workflow',
        citation: 'NAWI-R76 Metrology User Guide, Section 1.0',
        keywords: ['workflow', 'steps', 'how to use', 'navigation', 'stepper', 'process'],
        content:
          'The application guides evaluations through 6 sequential steps: ' +
          'Step 1 (Instrument): Review metrological characteristics. ' +
          'Step 2 (Test Setup): Record ambient temperature, humidity, pressure, and select traceable standard weights. ' +
          'Step 3 (Test Plan): View OIML test battery with automatic applicability rules. ' +
          'Step 4 (Testing): Enter raw turning points, view calculated errors, and upload embedded evidence. ' +
          'Step 5 (Review): Review test completion counting model and peer attestation. ' +
          'Step 6 (Report): Review OIML R 76-2 structured test report and digital QR verification.',
      },
      {
        sectionId: 'APP-2.0',
        sectionNumber: '2.0',
        title: 'How to Enter Turning Points and Delta L (ΔL)',
        citation: 'NAWI-R76 Metrology User Guide, Section 2.0',
        keywords: ['delta l', 'turning point', 'enter', 'sub weights', 'how to enter'],
        content:
          'When observing a measurement row in Step 4 Testing: Enter the nominal mass in "Load (L)", the display reading in ' +
          '"Indication (I)", and the turning point sub-weights in "ΔL". The system immediately recalculates continuous ' +
          'indication P = I + 0.5e - ΔL, error E, and corrected error Ec against Table 6 MPE limits.',
      },
      {
        sectionId: 'APP-3.0',
        sectionNumber: '3.0',
        title: 'Deterministic Engine & Non-Overridable Verdicts',
        citation: 'NAWI-R76 Metrology User Guide, Section 3.0',
        keywords: ['override', 'pass fail', 'server engine', 'deterministic', 'cannot override'],
        content:
          'In NAWI-R76, all compliance calculations are strictly server-authoritative and deterministic. Operators and assistants ' +
          'cannot manually toggle or force PASS or FAIL verdicts. If an observation exceeds MPE, review the raw reading for ' +
          'transcription errors via the Correct Observation modal or initiate an official Retest.',
      },
    ],
  },
];
