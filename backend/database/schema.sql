-- ============================================================================
-- NAWI-R76 PostgreSQL Database Schema
-- Conforming to OIML R 76-1:2006 (E), OIML R 76-2:2007 (E) & ISO/IEC 17025:2017
-- Compatible with local PostgreSQL & Supabase
-- ============================================================================

-- Enable UUID & Cryptographic extensions (standard in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. ENUMS
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'ADMIN',
        'LAB_MANAGER',
        'TESTING_OFFICER',
        'TECHNICAL_REVIEWER',
        'LEAD_METROLOGIST',
        'GUEST_AUDITOR'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE accuracy_class AS ENUM (
        'CLASS_I',
        'CLASS_II',
        'CLASS_III',
        'CLASS_IIII'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE range_type AS ENUM (
        'SINGLE',
        'MULTI_INTERVAL',
        'MULTI_RANGE'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE tare_type AS ENUM (
        'SUBTRACTIVE',
        'ADDITIVE',
        'PRESET',
        'NONE'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE receptor_type AS ENUM (
        'STANDARD_PAN',
        'ROLLING_TRACK',
        'HOPPER',
        'MOBILE_SCALE'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE power_supply_type AS ENUM (
        'MAINS_AC',
        'EXTERNAL_AC_DC',
        'BATTERY_INTERNAL',
        'ROAD_VEHICLE_BATTERY',
        'DUAL_MAINS_BATTERY'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE standard_type AS ENUM (
        'MASS_STANDARD',
        'BAROMETER',
        'HYGROMETER',
        'THERMOMETER',
        'CLIMATIC_CHAMBER',
        'VOLTAGE_SOURCE'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE weight_class AS ENUM (
        'E1',
        'E2',
        'F1',
        'F2',
        'M1',
        'M1_2',
        'M2',
        'M2_3',
        'M3',
        'NOT_APPLICABLE'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE standard_status AS ENUM (
        'VALID',
        'EXPIRING_SOON',
        'EXPIRED',
        'DECOMMISSIONED'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE evaluation_status AS ENUM (
        'DRAFT',
        'PLAN_CONFIGURED',
        'IN_TESTING',
        'PENDING_REVIEW',
        'REVISIONS_REQUESTED',
        'COMPLIANT',
        'NON_COMPLIANT',
        'SIGNED_AND_ISSUED'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE test_category AS ENUM (
        'METROLOGICAL',
        'ENVIRONMENTAL',
        'ELECTRICAL',
        'CONSTRUCTION'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE test_run_status AS ENUM (
        'NOT_TESTED',
        'INCOMPLETE',
        'PASS',
        'FAIL',
        'INCONCLUSIVE',
        'NOT_APPLICABLE'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE load_direction AS ENUM (
        'ASCENDING',
        'DECREASING',
        'STATIC'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE compliance_status AS ENUM (
        'PASS',
        'FAIL'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE evidence_type AS ENUM (
        'NAMEPLATE_PHOTO',
        'DISPLAY_PHOTO',
        'SEAL_PHOTO',
        'ENVIRONMENT_PHOTO',
        'CERTIFICATE_PDF'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE integrity_status AS ENUM (
        'VERIFIED',
        'DISCREPANCY_FLAGGED',
        'MANUAL_REVIEW'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE review_stage AS ENUM (
        'PEER_REVIEW',
        'FINAL_APPROVAL'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE review_decision AS ENUM (
        'ACCEPTED',
        'REVISIONS_REQUESTED',
        'REJECTED'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================================================
-- 2. CORE REGISTRIES: LABORATORIES & USERS (ISO/IEC 17025 §6.2)
-- ============================================================================

CREATE TABLE IF NOT EXISTS laboratories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_code VARCHAR(32) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    accreditation_number VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    country_code CHAR(2) NOT NULL DEFAULT 'IN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    laboratory_id UUID REFERENCES laboratories(id) ON DELETE SET NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role user_role NOT NULL DEFAULT 'TESTING_OFFICER',
    employee_id VARCHAR(64) UNIQUE NOT NULL,
    accreditation_id VARCHAR(64),
    public_key_pem TEXT,
    signature_pin_hash VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. MANUFACTURERS & INSTRUMENT PATTERNS (OIML R 76-1 CLAUSES 3 & 4)
-- ============================================================================

CREATE TABLE IF NOT EXISTS manufacturers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    country_code CHAR(2) NOT NULL DEFAULT 'IN',
    address TEXT NOT NULL,
    contact_person VARCHAR(150),
    contact_email VARCHAR(255),
    license_number VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS instrument_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manufacturer_id UUID NOT NULL REFERENCES manufacturers(id) ON DELETE CASCADE,
    model_name VARCHAR(150) NOT NULL,
    trade_name VARCHAR(150),
    software_version VARCHAR(64),
    accuracy_class accuracy_class NOT NULL,
    range_type range_type NOT NULL DEFAULT 'SINGLE',

    -- Metrological core parameters
    max_capacity DECIMAL(14,4) NOT NULL,
    min_capacity DECIMAL(14,4) NOT NULL,
    verification_interval_e DECIMAL(14,4) NOT NULL,
    scale_interval_d DECIMAL(14,4) NOT NULL,
    division_count_n INTEGER NOT NULL,
    primary_unit VARCHAR(10) NOT NULL DEFAULT 'kg',

    -- Physical, Electrical & Environmental characteristics
    tare_type tare_type NOT NULL DEFAULT 'SUBTRACTIVE',
    receptor_type receptor_type NOT NULL DEFAULT 'STANDARD_PAN',
    power_supply_type power_supply_type NOT NULL DEFAULT 'MAINS_AC',
    nominal_voltage DECIMAL(6,2) DEFAULT 230.00,
    temp_min DECIMAL(5,2) DEFAULT 10.00,
    temp_max DECIMAL(5,2) DEFAULT 30.00,
    has_automatic_leveling BOOLEAN DEFAULT FALSE,
    is_electronic BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_manufacturer_model UNIQUE (manufacturer_id, model_name)
);

CREATE TABLE IF NOT EXISTS partial_weighing_ranges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instrument_model_id UUID NOT NULL REFERENCES instrument_models(id) ON DELETE CASCADE,
    range_index INTEGER NOT NULL,
    min_capacity_i DECIMAL(14,4) NOT NULL,
    max_capacity_i DECIMAL(14,4) NOT NULL,
    verification_interval_ei DECIMAL(14,4) NOT NULL,
    scale_interval_di DECIMAL(14,4) NOT NULL,
    division_count_ni INTEGER NOT NULL,
    CONSTRAINT uk_model_range UNIQUE (instrument_model_id, range_index)
);

CREATE TABLE IF NOT EXISTS registered_specimens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instrument_model_id UUID NOT NULL REFERENCES instrument_models(id) ON DELETE RESTRICT,
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    applicant_name VARCHAR(255) NOT NULL,
    intake_date DATE NOT NULL DEFAULT CURRENT_DATE,
    condition_at_receipt TEXT NOT NULL DEFAULT 'Good condition, seals intact',
    security_seal_id VARCHAR(100),
    is_intake_verified BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 4. REFERENCE STANDARDS & METROLOGICAL TRACEABILITY (CLAUSE 3.7.1)
-- ============================================================================

CREATE TABLE IF NOT EXISTS reference_standards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    standard_code VARCHAR(64) UNIQUE NOT NULL,
    description VARCHAR(255) NOT NULL,
    standard_type standard_type NOT NULL DEFAULT 'MASS_STANDARD',
    weight_class weight_class NOT NULL DEFAULT 'F1',
    nominal_mass DECIMAL(14,4),
    nominal_range VARCHAR(100) NOT NULL,
    expanded_uncertainty_u DECIMAL(14,6), -- In mg, k=2
    coverage_factor_k DECIMAL(4,2) NOT NULL DEFAULT 2.00,
    certificate_number VARCHAR(100) NOT NULL,
    calibrated_by VARCHAR(255) NOT NULL,
    calibration_date DATE NOT NULL,
    valid_until DATE NOT NULL,
    status standard_status NOT NULL DEFAULT 'VALID',
    location VARCHAR(100) NOT NULL DEFAULT 'Cleanroom Bench 01',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 5. TYPE EVALUATION DOSSIERS (OIML R 76-2:2007)
-- ============================================================================

CREATE TABLE IF NOT EXISTS type_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_number VARCHAR(64) UNIQUE NOT NULL,
    revision_index INTEGER NOT NULL DEFAULT 0,
    specimen_id UUID NOT NULL REFERENCES registered_specimens(id) ON DELETE RESTRICT,

    -- Pinned standards
    standard_ref VARCHAR(64) NOT NULL DEFAULT 'OIML R 76-1:2006 (E)',
    rule_pack_version VARCHAR(32) NOT NULL DEFAULT 'R76-2006-v1',
    status evaluation_status NOT NULL DEFAULT 'DRAFT',

    -- Stakeholders
    lead_metrologist_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    assigned_officer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    signatory_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- General test ambient conditions
    ambient_temp DECIMAL(5,2),
    relative_humidity DECIMAL(5,2),
    atmospheric_pressure DECIMAL(6,2),

    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS evaluation_test_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID NOT NULL REFERENCES type_evaluations(id) ON DELETE CASCADE,
    test_code VARCHAR(64) NOT NULL,
    clause_reference VARCHAR(64) NOT NULL,
    test_title VARCHAR(255) NOT NULL,
    category test_category NOT NULL DEFAULT 'METROLOGICAL',
    execution_order INTEGER NOT NULL,
    is_applicable BOOLEAN NOT NULL DEFAULT TRUE,
    exclusion_reason TEXT,
    status test_run_status NOT NULL DEFAULT 'NOT_TESTED',
    test_parameters JSONB, -- Dynamic checklist / configuration
    calculated_summary JSONB,
    executed_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_eval_test_code UNIQUE (evaluation_id, test_code)
);

CREATE TABLE IF NOT EXISTS test_run_equipment_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_run_id UUID NOT NULL REFERENCES evaluation_test_runs(id) ON DELETE CASCADE,
    reference_standard_id UUID NOT NULL REFERENCES reference_standards(id) ON DELETE RESTRICT,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_test_standard UNIQUE (test_run_id, reference_standard_id)
);

-- ============================================================================
-- 6. METROLOGICAL OBSERVATION POINTS & CALCULATIONS (CLAUSE 3.5.1, A.4.4)
-- ============================================================================

CREATE TABLE IF NOT EXISTS observation_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_run_id UUID NOT NULL REFERENCES evaluation_test_runs(id) ON DELETE CASCADE,
    series_index INTEGER NOT NULL DEFAULT 1,
    step_index INTEGER NOT NULL,
    direction load_direction NOT NULL DEFAULT 'ASCENDING',
    location_code VARCHAR(32), -- 'CTR', 'Q1', 'Q2', 'Q3', 'Q4'

    -- Raw inputs from metrologist / telemetry
    nominal_load_l DECIMAL(14,4) NOT NULL,
    indicated_val_i DECIMAL(14,4) NOT NULL,
    turning_point_dl DECIMAL(14,4) NOT NULL DEFAULT 0,

    -- Server authoritative calculations
    calculated_p DECIMAL(14,4) NOT NULL,    -- P = I + 0.5e - dL
    raw_error_e DECIMAL(14,4) NOT NULL,     -- E = P - L
    zero_error_e0 DECIMAL(14,4) NOT NULL DEFAULT 0,
    corrected_error_ec DECIMAL(14,4) NOT NULL, -- Ec = E - E0
    applicable_mpe DECIMAL(14,4) NOT NULL,  -- Derived statutory Table 6 MPE
    compliance_status compliance_status NOT NULL DEFAULT 'PASS',

    is_invalidated BOOLEAN NOT NULL DEFAULT FALSE,
    invalidation_reason TEXT,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 7. EVIDENCE REPOSITORY & SHA-256 HASHING (ISO/IEC 17025 §7.5)
-- ============================================================================

CREATE TABLE IF NOT EXISTS evidence_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID NOT NULL REFERENCES type_evaluations(id) ON DELETE CASCADE,
    test_run_id UUID REFERENCES evaluation_test_runs(id) ON DELETE SET NULL,
    uploader_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    evidence_type evidence_type NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(512) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    sha256_hash CHAR(64) NOT NULL,
    ocr_extracted_text TEXT,
    ocr_confidence DECIMAL(5,4),
    integrity_status integrity_status NOT NULL DEFAULT 'VERIFIED',
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS evidence_observation_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_file_id UUID NOT NULL REFERENCES evidence_files(id) ON DELETE CASCADE,
    observation_point_id UUID NOT NULL REFERENCES observation_points(id) ON DELETE CASCADE,
    is_discrepancy BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    CONSTRAINT uk_evidence_obs UNIQUE (evidence_file_id, observation_point_id)
);

-- ============================================================================
-- 8. REVIEW WORKFLOWS & IMMUTABLE CRYPTOGRAPHIC AUDIT TRAIL (ISO 17025 §8.5)
-- ============================================================================

CREATE TABLE IF NOT EXISTS review_workflow_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID NOT NULL REFERENCES type_evaluations(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    stage review_stage NOT NULL DEFAULT 'PEER_REVIEW',
    decision review_decision NOT NULL DEFAULT 'ACCEPTED',
    comments TEXT NOT NULL,
    signature_hash VARCHAR(255),
    decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_index BIGSERIAL NOT NULL,
    evaluation_id UUID REFERENCES type_evaluations(id) ON DELETE SET NULL,
    actor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    actor_role VARCHAR(64) NOT NULL,
    action VARCHAR(64) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    previous_state JSONB,
    new_state JSONB NOT NULL,
    change_reason TEXT NOT NULL,
    client_ip VARCHAR(45) NOT NULL,
    previous_hash CHAR(64) NOT NULL,
    current_hash CHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 9. REPORTS, PKI DIGITAL SIGNATURES & PUBLIC VERIFICATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS evaluation_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID NOT NULL REFERENCES type_evaluations(id) ON DELETE CASCADE,
    report_number VARCHAR(64) UNIQUE NOT NULL,
    revision_number INTEGER NOT NULL DEFAULT 0,
    storage_url VARCHAR(512) NOT NULL,
    file_sha256 CHAR(64) NOT NULL,
    canonical_payload JSONB NOT NULL,
    pki_signature TEXT NOT NULL,
    signed_by_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID UNIQUE NOT NULL REFERENCES evaluation_reports(id) ON DELETE CASCADE,
    verification_token VARCHAR(100) UNIQUE NOT NULL,
    qr_code_url VARCHAR(512) NOT NULL,
    canonical_sha256 CHAR(64) NOT NULL,
    verification_count INTEGER NOT NULL DEFAULT 0,
    last_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 10. OIML AI KNOWLEDGE BASE & CONSULTATION AUDIT
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_regulatory_knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    standard_name VARCHAR(64) NOT NULL DEFAULT 'OIML R 76-1:2006',
    clause_reference VARCHAR(32) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content_text TEXT NOT NULL,
    keywords TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_consultation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    test_run_id UUID REFERENCES evaluation_test_runs(id) ON DELETE SET NULL,
    user_prompt TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    cited_clauses TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 11. INDEXES FOR HIGH-THROUGHPUT & METROLOGICAL QUERYING
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_specimens_serial ON registered_specimens(serial_number);
CREATE INDEX IF NOT EXISTS idx_evaluations_number ON type_evaluations(evaluation_number);
CREATE INDEX IF NOT EXISTS idx_evaluations_status ON type_evaluations(status);
CREATE INDEX IF NOT EXISTS idx_test_runs_eval_code ON evaluation_test_runs(evaluation_id, test_code);
CREATE INDEX IF NOT EXISTS idx_obs_test_run ON observation_points(test_run_id, series_index, step_index);
CREATE INDEX IF NOT EXISTS idx_evidence_sha ON evidence_files(sha256_hash);
CREATE INDEX IF NOT EXISTS idx_audit_event_index ON audit_logs(event_index);
CREATE INDEX IF NOT EXISTS idx_audit_current_hash ON audit_logs(current_hash);
CREATE INDEX IF NOT EXISTS idx_public_token ON public_verification_tokens(verification_token);
