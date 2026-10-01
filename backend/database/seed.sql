-- ============================================================================
-- NAWI-R76 Comprehensive Metrology Seed Data
-- Aligned with the demo and video walkthrough
-- ============================================================================

-- 1. Regional Reference Standard Laboratory (RRSL Ahmedabad)
INSERT INTO laboratories (id, lab_code, name, accreditation_number, address, city, state, country_code)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'RRSL-AHMEDABAD',
    'Regional Reference Standard Laboratory, Ahmedabad',
    'NABL-LM-TC-2024-0891',
    'Plot 42, Metrology Industrial Estate, Makarba',
    'Ahmedabad',
    'Gujarat',
    'IN'
) ON CONFLICT (lab_code) DO NOTHING;

-- 2. Certified Users
-- Passwords hashed (default test password 'Metrology@2026')
INSERT INTO users (id, laboratory_id, email, password_hash, full_name, role, employee_id, accreditation_id, is_active)
VALUES 
(
    '00000001-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'verma.amit@metrology.gov.in',
    '$2b$10$ep/0tq6kF6Vv4b8uJb1wtepI1oGv9G8u6U1Hk0eP.n9C0b1v4t3yq',
    'Amit Verma',
    'TESTING_OFFICER',
    'RRSL-TECH-2023-14',
    'NABL-MET-TO-889',
    TRUE
),
(
    '00000001-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'sharma.a@metrology.gov.in',
    '$2b$10$ep/0tq6kF6Vv4b8uJb1wtepI1oGv9G8u6U1Hk0eP.n9C0b1v4t3yq',
    'Dr. A. Sharma',
    'LEAD_METROLOGIST',
    'RRSL-MET-2024-88',
    'NABL-MET-LM-102',
    TRUE
),
(
    '00000001-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'director@rrsl.gov.in',
    '$2b$10$ep/0tq6kF6Vv4b8uJb1wtepI1oGv9G8u6U1Hk0eP.n9C0b1v4t3yq',
    'Dr. Rajesh K. Patel',
    'LAB_MANAGER',
    'RRSL-DIR-2020-01',
    'LM-DIR-GUJ-04',
    TRUE
) ON CONFLICT (email) DO NOTHING;

-- 3. Manufacturers
INSERT INTO manufacturers (id, name, country_code, address, contact_person, contact_email, license_number)
VALUES
(
    '00000002-0000-0000-0000-000000000001',
    'Apex Metrology Instruments Ltd',
    'IN',
    'GIDC Electronics Zone, Sector 25, Gandhinagar, Gujarat',
    'Prakash Joshi',
    'compliance@apexmetrology.com',
    'LM/MFG/GJ/2022/4412'
),
(
    '00000002-0000-0000-0000-000000000002',
    'Delta Electronics Synthetic Corp',
    'IN',
    'Okhla Industrial Area Phase III, New Delhi',
    'Sunil Mehra',
    'legal@deltaelec.co.in',
    'LM/MFG/DL/2021/1190'
) ON CONFLICT (name) DO NOTHING;

-- 4. Instrument Models
INSERT INTO instrument_models (
    id, manufacturer_id, model_name, trade_name, software_version, 
    accuracy_class, range_type, max_capacity, min_capacity, 
    verification_interval_e, scale_interval_d, division_count_n, primary_unit
)
VALUES
(
    '00000003-0000-0000-0000-000000000001',
    '00000002-0000-0000-0000-000000000001',
    'Precision-Bench-B6',
    'High-Resolution Laboratory Bench Scale',
    'v1.4.2',
    'CLASS_II',
    'SINGLE',
    6.0000,
    0.0500,
    0.0010,
    0.0002,
    6000,
    'kg'
),
(
    '00000003-0000-0000-0000-000000000002',
    '00000002-0000-0000-0000-000000000002',
    'MarketPro-Compute-R15',
    'Retail Price-Computing Counter Scale',
    'v2.1.0',
    'CLASS_III',
    'SINGLE',
    15.0000,
    0.1000,
    0.0050,
    0.0050,
    3000,
    'kg'
) ON CONFLICT (manufacturer_id, model_name) DO NOTHING;

-- 5. Registered Physical Test Specimen
INSERT INTO registered_specimens (id, instrument_model_id, serial_number, applicant_name, intake_date, condition_at_receipt)
VALUES
(
    '00000004-0000-0000-0000-000000000001',
    '00000003-0000-0000-0000-000000000001',
    'SN-BS-26001',
    'Apex Metrology Instruments Ltd (Commercial Division)',
    CURRENT_DATE - INTERVAL '10 days',
    'Factory packed, lead seals intact, calibrated bubble vial level'
) ON CONFLICT (serial_number) DO NOTHING;

-- 6. Calibration Reference Standards (Clause 3.7.1)
INSERT INTO reference_standards (
    id, standard_code, description, standard_type, weight_class, nominal_range,
    expanded_uncertainty_u, coverage_factor_k, certificate_number, calibrated_by,
    calibration_date, valid_until, status, location
)
VALUES
(
    '00000005-0000-0000-0000-000000000001',
    'STD-WT-001',
    'OIML Class F1 Stainless Steel Mass Set (1 mg to 20 kg)',
    'MASS_STANDARD',
    'F1',
    '1 mg to 20 kg',
    0.250000,
    2.00,
    'CC-NPLI-2024-8842',
    'National Physical Laboratory of India (NPLI)',
    '2024-04-10',
    '2027-04-09',
    'VALID',
    'Primary Metrology Vault (Room 102)'
),
(
    '00000005-0000-0000-0000-000000000002',
    'STD-WT-002',
    'OIML Class E2 Ultra-Precision Analytical Mass Set (1 mg to 500 g)',
    'MASS_STANDARD',
    'E2',
    '1 mg to 500 g',
    0.030000,
    2.00,
    'CC-RRSL-2023-1190',
    'Regional Reference Standard Laboratory',
    '2023-11-15',
    '2026-11-14',
    'VALID',
    'Micro-balance Cleanroom (Room 105)'
),
(
    '00000005-0000-0000-0000-000000000003',
    'STD-WT-003',
    'OIML Class M1 Cast Iron Working Block Weights (10 kg to 500 kg)',
    'MASS_STANDARD',
    'M1',
    '10 kg to 500 kg',
    50.000000,
    2.00,
    'CC-LM-2024-4410',
    'State Metrology Calibration Wing',
    '2024-06-20',
    '2027-06-19',
    'VALID',
    'Heavy Industrial Testing Bay (Bay 2)'
),
(
    '00000005-0000-0000-0000-000000000004',
    'STD-ENV-001',
    'Vaisala PTU300 Combined Digital Barometer & Hygrometer',
    'BAROMETER',
    'NOT_APPLICABLE',
    '500 to 1100 hPa / 0 to 100% RH',
    0.150000,
    2.00,
    'CC-CAL-ENV-2024-72',
    'Vaisala Accredited Calibration Lab',
    '2024-01-18',
    '2026-12-31',
    'VALID',
    'Environmental Monitoring Bench 1'
),
(
    '00000005-0000-0000-0000-000000000005',
    'STD-EXP-001',
    'Secondary Working Class F2 Mass Set (100 g to 5 kg)',
    'MASS_STANDARD',
    'F2',
    '100 g to 5 kg',
    1.600000,
    2.00,
    'CC-LM-2022-0941',
    'Regional Verification Center',
    '2022-12-01',
    '2024-11-30', -- EXPIRED!
    'EXPIRED',
    'Routine Inspection Bench (Storage B)'
) ON CONFLICT (standard_code) DO NOTHING;

-- 7. Type Evaluation Dossier
INSERT INTO type_evaluations (
    id, evaluation_number, revision_index, specimen_id, standard_ref, rule_pack_version,
    status, lead_metrologist_id, assigned_officer_id, ambient_temp, relative_humidity, atmospheric_pressure,
    started_at
)
VALUES
(
    '00000006-0000-0000-0000-000000000001',
    'RRSL-2026-TE-0104',
    0,
    '00000004-0000-0000-0000-000000000001',
    'OIML R 76-1:2006 (E)',
    'R76-2006-v1',
    'IN_TESTING',
    '00000001-0000-0000-0000-000000000002',
    '00000001-0000-0000-0000-000000000001',
    20.04,
    41.00,
    1003.00,
    NOW() - INTERVAL '2 days'
) ON CONFLICT (evaluation_number) DO NOTHING;

-- 8. Procedural Test Runs for Evaluation RRSL-2026-TE-0104
INSERT INTO evaluation_test_runs (
    id, evaluation_id, test_code, clause_reference, test_title, category, execution_order, is_applicable, exclusion_reason, status
)
VALUES
(
    '00000007-0000-0000-0000-000000000001',
    '00000006-0000-0000-0000-000000000001',
    'R76_ADMIN_MARKINGS',
    '3.10, 4.1',
    'Administrative & Markings Examination',
    'CONSTRUCTION',
    1,
    TRUE,
    NULL,
    'PASS'
),
(
    '00000007-0000-0000-0000-000000000002',
    '00000006-0000-0000-0000-000000000001',
    'R76_TECH_SEALING',
    '3.10, 4.1-18',
    'Technical Construction & Security Sealing',
    'CONSTRUCTION',
    2,
    TRUE,
    NULL,
    'PASS'
),
(
    '00000007-0000-0000-0000-000000000003',
    '00000006-0000-0000-0000-000000000001',
    'R76_WEIGH_INTRINSIC',
    '3.5.1, A.4.4',
    'Weighing Performance: Initial Intrinsic Error',
    'METROLOGICAL',
    3,
    TRUE,
    NULL,
    'PASS'
),
(
    '00000007-0000-0000-0000-000000000004',
    '00000006-0000-0000-0000-000000000001',
    'R76_ECCENTRICITY',
    '3.6.2, A.4.7.1-3',
    'Eccentricity with Standard Weights',
    'METROLOGICAL',
    4,
    TRUE,
    NULL,
    'PASS'
),
(
    '00000007-0000-0000-0000-000000000005',
    '00000006-0000-0000-0000-000000000001',
    'R76_ECC_ROLLING',
    '3.6.2.4, A.4.7.4',
    'Eccentricity with Rolling Load',
    'METROLOGICAL',
    5,
    FALSE,
    'Clause A.4.7.4 is applicable only to rolling-load instruments (e.g. rail weighbridges, overhead tracks). Current instrument is a bench scale.',
    'NOT_APPLICABLE'
),
(
    '00000007-0000-0000-0000-000000000006',
    '00000006-0000-0000-0000-000000000001',
    'R76_ECC_MOBILE',
    '3.6.2.5, A.4.7.5',
    'Eccentricity on Mobile / Suspended Instruments',
    'METROLOGICAL',
    6,
    FALSE,
    'Clause A.4.7.5 is applicable only to mobile, crane, or hanging instruments. Current instrument is installed on bench foundation.',
    'NOT_APPLICABLE'
),
(
    '00000007-0000-0000-0000-000000000007',
    '00000006-0000-0000-0000-000000000001',
    'R76_DISCRIMINATION',
    '3.8, A.4.8',
    'Discrimination Test (1.4d additional load)',
    'METROLOGICAL',
    7,
    TRUE,
    NULL,
    'PASS'
),
(
    '00000007-0000-0000-0000-000000000008',
    '00000006-0000-0000-0000-000000000001',
    'R76_SENSITIVITY_NON_SELF',
    '3.7, A.4.9',
    'Sensitivity for Non-Self-Indicating Instruments',
    'METROLOGICAL',
    8,
    FALSE,
    'Clause A.4.9 is applicable only to non-self-indicating instruments. Instrument is an electronic digital terminal.',
    'NOT_APPLICABLE'
),
(
    '00000007-0000-0000-0000-000000000009',
    '00000006-0000-0000-0000-000000000001',
    'R76_REPEATABILITY',
    '3.6.1, A.4.10',
    'Type Examination Repeatability Test',
    'METROLOGICAL',
    9,
    TRUE,
    NULL,
    'PASS'
),
(
    '00000007-0000-0000-0000-000000000010',
    '00000006-0000-0000-0000-000000000001',
    'R76_CREEP',
    '3.9.4.1, A.4.11.1',
    'Creep Test under Constant Load',
    'METROLOGICAL',
    10,
    TRUE,
    NULL,
    'PASS'
),
(
    '00000007-0000-0000-0000-000000000011',
    '00000006-0000-0000-0000-000000000001',
    'R76_ZERO_RETURN',
    '3.9.4.2, A.4.11.2',
    'Zero Return Residual Error Test',
    'METROLOGICAL',
    11,
    TRUE,
    NULL,
    'PASS'
),
(
    '00000007-0000-0000-0000-000000000012',
    '00000006-0000-0000-0000-000000000001',
    'R76_EQUILIBRIUM_LOCK',
    '4.4.2, A.4.12',
    'Stability of Equilibrium Interlocking Test',
    'METROLOGICAL',
    12,
    TRUE,
    NULL,
    'PASS'
) ON CONFLICT (evaluation_id, test_code) DO NOTHING;

