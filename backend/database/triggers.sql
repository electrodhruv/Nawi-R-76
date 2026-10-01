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
