-- ============================================================================
-- NAWI-R76 UNIFIED SUPABASE & POSTGRESQL INITIALIZATION SCRIPT
-- Generated for Local PostgreSQL & Supabase Deployment
-- Standards: OIML R 76-1:2006 (E) | OIML R 76-2:2007 (E) | ISO/IEC 17025:2017
-- ============================================================================

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


-- ============================================================================
-- NAWI-R76 Automated Stored Procedures & Integrity Triggers
-- Enforcing OIML R 76 Table 6 MPE limits, turning point math, and audit hash chaining
-- ============================================================================

-- 1. Function: Calculate statutory Table 6 MPE in units of e for a given load step
CREATE OR REPLACE FUNCTION get_table_6_mpe(
    p_accuracy_class accuracy_class,
    p_load_in_divisions DECIMAL(14,4) -- m = L / e
) RETURNS DECIMAL(14,4) AS $$
BEGIN
    -- Table 6 Maximum Permissible Errors on initial verification:
    -- Class I:
    --   0 <= m <= 50,000 : +-0.5 e
    --   50,000 < m <= 200,000 : +-1.0 e
    --   200,000 < m : +-1.5 e
    -- Class II:
    --   0 <= m <= 5,000 : +-0.5 e
    --   5,000 < m <= 20,000 : +-1.0 e
    --   20,000 < m <= 100,000 : +-1.5 e
    -- Class III:
    --   0 <= m <= 500 : +-0.5 e
    --   500 < m <= 2,000 : +-1.0 e
    --   2,000 < m <= 10,000 : +-1.5 e
    -- Class IIII:
    --   0 <= m <= 50 : +-0.5 e
    --   50 < m <= 200 : +-1.0 e
    --   200 < m <= 1,000 : +-1.5 e

    IF p_accuracy_class = 'CLASS_I' THEN
        IF p_load_in_divisions <= 50000 THEN RETURN 0.5;
        ELSIF p_load_in_divisions <= 200000 THEN RETURN 1.0;
        ELSE RETURN 1.5;
        END IF;
    ELSIF p_accuracy_class = 'CLASS_II' THEN
        IF p_load_in_divisions <= 5000 THEN RETURN 0.5;
        ELSIF p_load_in_divisions <= 20000 THEN RETURN 1.0;
        ELSE RETURN 1.5;
        END IF;
    ELSIF p_accuracy_class = 'CLASS_III' THEN
        IF p_load_in_divisions <= 500 THEN RETURN 0.5;
        ELSIF p_load_in_divisions <= 2000 THEN RETURN 1.0;
        ELSE RETURN 1.5;
        END IF;
    ELSE -- CLASS_IIII
        IF p_load_in_divisions <= 50 THEN RETURN 0.5;
        ELSIF p_load_in_divisions <= 200 THEN RETURN 1.0;
        ELSE RETURN 1.5;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Trigger Function: Server-Authoritative calculation on observation_points
CREATE OR REPLACE FUNCTION trg_calculate_observation_point()
RETURNS TRIGGER AS $$
DECLARE
    v_e DECIMAL(14,4);
    v_accuracy_class accuracy_class;
    v_divisions DECIMAL(14,4);
    v_mpe_in_e DECIMAL(14,4);
    v_mpe_absolute DECIMAL(14,4);
BEGIN
    -- Fetch the verification scale interval e and accuracy class of the evaluated instrument
    SELECT im.verification_interval_e, im.accuracy_class
    INTO v_e, v_accuracy_class
    FROM evaluation_test_runs tr
    JOIN type_evaluations te ON tr.evaluation_id = te.id
    JOIN registered_specimens rs ON te.specimen_id = rs.id
    JOIN instrument_models im ON rs.instrument_model_id = im.id
    WHERE tr.id = NEW.test_run_id;

    IF v_e IS NULL OR v_e <= 0 THEN
        v_e := 0.001; -- Fallback default 1 g
    END IF;

    -- P = I + 0.5e - dL (Clause A.4.4.3)
    NEW.calculated_p := NEW.indicated_val_i + (0.5 * v_e) - NEW.turning_point_dl;
    -- E = P - L
    NEW.raw_error_e := NEW.calculated_p - NEW.nominal_load_l;
    -- Ec = E - E0
    NEW.corrected_error_ec := NEW.raw_error_e - COALESCE(NEW.zero_error_e0, 0);

    -- Calculate load in divisions: m = L / e
    v_divisions := ABS(NEW.nominal_load_l) / v_e;
    v_mpe_in_e := get_table_6_mpe(COALESCE(v_accuracy_class, 'CLASS_II'), v_divisions);
    v_mpe_absolute := v_mpe_in_e * v_e;

    NEW.applicable_mpe := v_mpe_absolute;

    -- Check compliance: |Ec| <= MPE
    IF ABS(NEW.corrected_error_ec) <= (v_mpe_absolute + 0.000001) THEN
        NEW.compliance_status := 'PASS';
    ELSE
        NEW.compliance_status := 'FAIL';
        -- Automatically fail the parent test run if not invalidated!
        UPDATE evaluation_test_runs
        SET status = 'FAIL', updated_at = NOW()
        WHERE id = NEW.test_run_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_obs_calc ON observation_points;
CREATE TRIGGER trg_obs_calc
BEFORE INSERT OR UPDATE ON observation_points
FOR EACH ROW
EXECUTE FUNCTION trg_calculate_observation_point();

-- 3. Trigger Function: Cryptographic Hash Chaining for Audit Ledger (ISO 17025 §8.5)
CREATE OR REPLACE FUNCTION trg_chain_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    v_prev_hash CHAR(64);
BEGIN
    -- Retrieve the current_hash of the immediately preceding record
    SELECT current_hash INTO v_prev_hash
    FROM audit_logs
    ORDER BY event_index DESC
    LIMIT 1;

    IF v_prev_hash IS NULL THEN
        -- Genesis hash for the laboratory ledger
        v_prev_hash := '0000000000000000000000000000000000000000000000000000000000000000';
    END IF;

    NEW.previous_hash := v_prev_hash;
    -- current_hash = SHA256(prev_hash + actor_id + action + entity_type + entity_id + new_state + created_at)
    NEW.current_hash := encode(
        digest(
            v_prev_hash ||
            NEW.actor_id::text ||
            NEW.action ||
            NEW.entity_type ||
            NEW.entity_id ||
            NEW.new_state::text ||
            COALESCE(NEW.created_at, NOW())::text,
            'sha256'
        ),
        'hex'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_chain ON audit_logs;
CREATE TRIGGER trg_audit_chain
BEFORE INSERT ON audit_logs
FOR EACH ROW
EXECUTE FUNCTION trg_chain_audit_log();


-- ============================================================================
-- NAWI-R76 Comprehensive Metrology Seed Data
-- Aligned with the demo and video walkthrough
-- ============================================================================

-- 1. Regional Reference Standard Laboratory (RRSL Ahmedabad)
INSERT INTO laboratories (id, lab_code, name, accreditation_number, address, city, state, country_code)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
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
    'u0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'verma.amit@metrology.gov.in',
    '$2b$10$ep/0tq6kF6Vv4b8uJb1wtepI1oGv9G8u6U1Hk0eP.n9C0b1v4t3yq',
    'Amit Verma',
    'TESTING_OFFICER',
    'RRSL-TECH-2023-14',
    'NABL-MET-TO-889',
    TRUE
),
(
    'u0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'sharma.a@metrology.gov.in',
    '$2b$10$ep/0tq6kF6Vv4b8uJb1wtepI1oGv9G8u6U1Hk0eP.n9C0b1v4t3yq',
    'Dr. A. Sharma',
    'LEAD_METROLOGIST',
    'RRSL-MET-2024-88',
    'NABL-MET-LM-102',
    TRUE
),
(
    'u0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
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
    'm0000000-0000-0000-0000-000000000001',
    'Apex Metrology Instruments Ltd',
    'IN',
    'GIDC Electronics Zone, Sector 25, Gandhinagar, Gujarat',
    'Prakash Joshi',
    'compliance@apexmetrology.com',
    'LM/MFG/GJ/2022/4412'
),
(
    'm0000000-0000-0000-0000-000000000002',
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
    'i0000000-0000-0000-0000-000000000001',
    'm0000000-0000-0000-0000-000000000001',
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
    'i0000000-0000-0000-0000-000000000002',
    'm0000000-0000-0000-0000-000000000002',
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
    's0000000-0000-0000-0000-000000000001',
    'i0000000-0000-0000-0000-000000000001',
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
    'std00000-0000-0000-0000-000000000001',
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
    'std00000-0000-0000-0000-000000000002',
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
    'std00000-0000-0000-0000-000000000003',
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
    'std00000-0000-0000-0000-000000000004',
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
    'std00000-0000-0000-0000-000000000005',
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
    'e0000000-0000-0000-0000-000000000001',
    'RRSL-2026-TE-0104',
    0,
    's0000000-0000-0000-0000-000000000001',
    'OIML R 76-1:2006 (E)',
    'R76-2006-v1',
    'IN_TESTING',
    'u0000000-0000-0000-0000-000000000002',
    'u0000000-0000-0000-0000-000000000001',
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
    't0000000-0000-0000-0000-000000000001',
    'e0000000-0000-0000-0000-000000000001',
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
    't0000000-0000-0000-0000-000000000002',
    'e0000000-0000-0000-0000-000000000001',
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
    't0000000-0000-0000-0000-000000000003',
    'e0000000-0000-0000-0000-000000000001',
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
    't0000000-0000-0000-0000-000000000004',
    'e0000000-0000-0000-0000-000000000001',
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
    't0000000-0000-0000-0000-000000000005',
    'e0000000-0000-0000-0000-000000000001',
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
    't0000000-0000-0000-0000-000000000006',
    'e0000000-0000-0000-0000-000000000001',
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
    't0000000-0000-0000-0000-000000000007',
    'e0000000-0000-0000-0000-000000000001',
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
    't0000000-0000-0000-0000-000000000008',
    'e0000000-0000-0000-0000-000000000001',
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
    't0000000-0000-0000-0000-000000000009',
    'e0000000-0000-0000-0000-000000000001',
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
    't0000000-0000-0000-0000-000000000010',
    'e0000000-0000-0000-0000-000000000001',
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
    't0000000-0000-0000-0000-000000000011',
    'e0000000-0000-0000-0000-000000000001',
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
    't0000000-0000-0000-0000-000000000012',
    'e0000000-0000-0000-0000-000000000001',
    'R76_EQUILIBRIUM_LOCK',
    '4.4.2, A.4.12',
    'Stability of Equilibrium Interlocking Test',
    'METROLOGICAL',
    12,
    TRUE,
    NULL,
    'PASS'
) ON CONFLICT (evaluation_id, test_code) DO NOTHING;
