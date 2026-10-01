/**
 * Validation Interpreter for NAWI-R76 Generic Test Engine
 *
 * Distinctly separates four metrological concepts per Section 4:
 * A. INPUT VALIDATION: "Is this entered value valid?" (Load <= Max, valid unit, non-negative)
 * B. PROCEDURE VALIDATION: "Was the test performed under required conditions?" (Observation count, equipment valid, environment present)
 * C. COMPLIANCE: Pure deterministic engine verdict against statutory OIML limits.
 * D. EVIDENCE CONSISTENCY: "Does the attached evidence agree with recorded observations?" (OCR vs entered value discrepancy check)
 */

import {
  TestRunRecord,
  ValidationRule,
  InputValidationCheck,
  ProcedureValidationCheck,
  EvidenceDiscrepancyItem,
  ValidationEvaluationResult,
  CommonEvaluationContext,
} from '../types';

export function evaluateValidationRules(
  testRun: TestRunRecord,
  rules: ValidationRule[],
  context?: CommonEvaluationContext
): ValidationEvaluationResult {
  const inputIssues: InputValidationCheck[] = [];
  const procedureIssues: ProcedureValidationCheck[] = [];
  const evidenceDiscrepancies: EvidenceDiscrepancyItem[] = [];
  const messages: { id: string; message: string; severity: 'BLOCKING' | 'WARNING' }[] = [];

  // =========================================================================
  // 1. STATUTORY EXEMPTION VALIDATION (NOT_APPLICABLE)
  // =========================================================================
  if (!testRun.isApplicable || testRun.status === 'NOT_APPLICABLE') {
    if (!testRun.exclusionJustification || testRun.exclusionJustification.trim().length === 0) {
      const msg = 'A formal statutory justification is required when excluding an applicable test.';
      procedureIssues.push({
        id: 'val-na-justification',
        condition: 'Statutory exemption justification required',
        message: msg,
        severity: 'BLOCKING',
      });
      messages.push({
        id: 'val-na-justification',
        message: msg,
        severity: 'BLOCKING',
      });
    }

    const blockingCount = messages.filter((m) => m.severity === 'BLOCKING').length;
    return {
      canComplete: blockingCount === 0,
      blockingCount,
      warningCount: 0,
      userSummary:
        blockingCount > 0
          ? `${blockingCount} item(s) remain before this exemption can be completed.`
          : 'Exemption criteria verified.',
      inputIssues,
      procedureIssues,
      evidenceDiscrepancies,
      messages,
    };
  }

  // =========================================================================
  // 2. CONCEPT A: INPUT VALIDATION (Per-value / Field correctness)
  // =========================================================================
  const schema = testRun.testDefinition.procedureDefinition.observationSchema;
  const maxCapacity = Number(
    context?.instrument?.maxCapacity ??
    testRun.maxCapacity ??
    testRun.data?.maxCapacity ??
    schema.fields.find((f) => f.key === 'load')?.max ??
    1e9
  );

  testRun.rawObservations.forEach((row, rowIdx) => {
    schema.fields.forEach((field) => {
      const val = row[field.key];

      // Missing required field
      if (field.required && (val === undefined || val === null || val === '')) {
        const issue: InputValidationCheck = {
          id: `input-missing-${field.key}-${rowIdx}`,
          fieldKey: field.key,
          rowIndex: rowIdx,
          value: val,
          message: `Observation #${rowIdx + 1}: Required field "${field.label}" is missing.`,
        };
        inputIssues.push(issue);
      }

      // Numerical range check
      if (field.type === 'NUMBER' && val !== undefined && val !== null && val !== '') {
        const num = Number(val);
        if (isNaN(num)) {
          inputIssues.push({
            id: `input-nan-${field.key}-${rowIdx}`,
            fieldKey: field.key,
            rowIndex: rowIdx,
            value: val,
            message: `Observation #${rowIdx + 1}: "${field.label}" must be a valid number.`,
          });
        } else if (field.min !== undefined && num < field.min) {
          inputIssues.push({
            id: `input-min-${field.key}-${rowIdx}`,
            fieldKey: field.key,
            rowIndex: rowIdx,
            value: num,
            message: `Observation #${rowIdx + 1}: "${field.label}" (${num}) cannot be less than ${field.min}.`,
          });
        } else if (field.key === 'load' && maxCapacity < 1e8 && num > maxCapacity) {
          inputIssues.push({
            id: `input-load-cap-${rowIdx}`,
            fieldKey: 'load',
            rowIndex: rowIdx,
            value: num,
            message: `Observation #${rowIdx + 1}: Test load (${num}) exceeds Max capacity (${maxCapacity}).`,
          });
        }

        // Check negative values where forbidden
        if (num < 0 && (field.key === 'load' || field.key === 'testLoad' || field.key === 'appliedLoad' || field.key === 'elapsedMinutes' || field.key === 'elapsedDays' || field.key === 'completedCycles')) {
          inputIssues.push({
            id: `input-negative-${field.key}-${rowIdx}`,
            fieldKey: field.key,
            rowIndex: rowIdx,
            value: num,
            message: `Observation #${rowIdx + 1}: "${field.label}" cannot be negative (${num}).`,
          });
        }
      }
    });
  });

  // Check Pattern B checklist items for verification status and mandatory N/A justification
  if (testRun.testDefinition.pattern === 'PATTERN_B_CHECKLIST') {
    testRun.rawObservations.forEach((row, rowIdx) => {
      if (!row.status || row.status === 'NOT_TESTED') {
        inputIssues.push({
          id: `input-untested-${rowIdx}`,
          fieldKey: 'status',
          rowIndex: rowIdx,
          value: row.status,
          message: `Checklist item #${rowIdx + 1} (${row.requirement || 'Requirement'}): Verification pending (select PASS, FAIL, or N/A).`,
        });
      }
      if (row.status === 'NOT_APPLICABLE' && (!row.naReason || String(row.naReason).trim().length === 0)) {
        inputIssues.push({
          id: `input-na-reason-${rowIdx}`,
          fieldKey: 'naReason',
          rowIndex: rowIdx,
          value: row.naReason,
          message: `Checklist item #${rowIdx + 1} (${row.requirement || 'Requirement'}): Marked N/A requires a structured justification reason.`,
        });
      }
    });
  }

  if (inputIssues.length > 0) {
    messages.push({
      id: 'val-input-errors',
      message: `${inputIssues.length} invalid or missing raw input value(s) require correction.`,
      severity: 'BLOCKING',
    });
  }

  // =========================================================================
  // 3. CONCEPT B: PROCEDURE VALIDATION (Testing conditions & requirements)
  // =========================================================================
  const completionRules = testRun.testDefinition.completionRules || testRun.testDefinition.procedureDefinition.completionRules;
  if (completionRules?.minObservations && testRun.rawObservations.length < completionRules.minObservations) {
    const msg = `Procedure requires at least ${completionRules.minObservations} observation(s) to be complete (recorded: ${testRun.rawObservations.length}).`;
    procedureIssues.push({
      id: 'val-min-completion-obs',
      condition: `Minimum observations: ${completionRules.minObservations}`,
      message: msg,
      severity: 'BLOCKING',
    });
    messages.push({ id: 'val-min-completion-obs', message: msg, severity: 'BLOCKING' });
  }

  if (completionRules?.requiredDirections && completionRules.requiredDirections.length > 0) {
    const recordedDirs = new Set(testRun.rawObservations.map((r) => String(r.direction || '')));
    for (const reqDir of completionRules.requiredDirections) {
      const hasDir = recordedDirs.has(reqDir) || (reqDir === 'ASCENDING' && recordedDirs.has('INC')) || (reqDir === 'DESCENDING' && recordedDirs.has('DEC'));
      if (!hasDir) {
        const msg = `Procedure requires test observations in the ${reqDir} direction.`;
        procedureIssues.push({
          id: `val-dir-${reqDir}`,
          condition: `Required direction: ${reqDir}`,
          message: msg,
          severity: 'BLOCKING',
        });
        messages.push({ id: `val-dir-${reqDir}`, message: msg, severity: 'BLOCKING' });
      }
    }
  }
  for (const rule of rules) {
    switch (rule.ruleType) {
      case 'OBSERVATION_COUNT': {
        const min = rule.min ?? schema.minObservations ?? 1;
        const currentCount = testRun.rawObservations.length;
        if (currentCount < min) {
          const msg = `At least ${min} observation(s) are required per procedure (currently ${currentCount}).`;
          procedureIssues.push({
            id: rule.id,
            condition: `Minimum observations: ${min}`,
            message: msg,
            severity: rule.severity,
          });
          messages.push({ id: rule.id, message: msg, severity: rule.severity });
        }
        break;
      }

      case 'EQUIPMENT_CALIBRATION_VALID': {
        if (!testRun.equipmentUsed || testRun.equipmentUsed.length === 0) {
          const msg = 'No certified reference standard equipment is assigned to this test run.';
          procedureIssues.push({
            id: rule.id,
            condition: 'Certified equipment assigned',
            message: msg,
            severity: 'BLOCKING',
          });
          messages.push({ id: rule.id, message: msg, severity: 'BLOCKING' });
        } else {
          const expiredEquip = testRun.equipmentUsed.filter((e) => !e.isCalibrated);
          if (expiredEquip.length > 0) {
            const msg = `Assigned equipment "${expiredEquip.map((e) => e.name).join(', ')}" calibration certificate has expired.`;
            procedureIssues.push({
              id: rule.id,
              condition: 'Calibration validity',
              message: msg,
              severity: 'BLOCKING',
            });
            messages.push({ id: rule.id, message: msg, severity: 'BLOCKING' });
          }
        }
        break;
      }

      default:
        break;
    }
  }

  // =========================================================================
  // 3B. STATUTORY EVIDENCE POLICY ENFORCEMENT (Sections 14, 15, 28)
  // Only REQUIRED evidence blocks completion. Recommended/optional are non-blocking.
  // =========================================================================
  const evidencePolicy = testRun.testDefinition.procedureDefinition.evidencePolicy;
  if (evidencePolicy) {
    const isRequired = evidencePolicy.level === 'REQUIRED' || evidencePolicy.required === true;
    const validEvidence = (testRun.evidenceReferences ?? []).filter((e) => !e.isSuperseded);
    const attachedCount = validEvidence.length;
    const minItems = evidencePolicy.minItems ?? 1;

    if (isRequired && attachedCount < minItems) {
      const missing = minItems - attachedCount;
      const msg = `${missing} required evidence item${missing > 1 ? 's are' : ' is'} missing.`;
      procedureIssues.push({
        id: 'val-evidence-policy-required',
        condition: 'Mandatory evidence policy',
        message: msg,
        severity: 'BLOCKING',
      });
      messages.push({ id: 'val-evidence-policy-required', message: msg, severity: 'BLOCKING' });
    } else if (evidencePolicy.level === 'RECOMMENDED' && attachedCount === 0) {
      procedureIssues.push({
        id: 'val-evidence-policy-recommended',
        condition: 'Recommended evidence policy',
        message: 'Supporting setup or display evidence is recommended for this procedure.',
        severity: 'WARNING',
      });
      messages.push({
        id: 'val-evidence-policy-recommended',
        message: 'Supporting setup or display evidence is recommended for this procedure.',
        severity: 'WARNING',
      });
    }
  }

  // Check environmental snapshot recorded
  if (!testRun.environmentalSnapshot || !testRun.environmentalSnapshot.temperatureC) {
    const msg = 'Ambient laboratory conditions (temperature, humidity, pressure) have not been recorded.';
    procedureIssues.push({
      id: 'val-env-snapshot',
      condition: 'Ambient conditions snapshot recorded',
      message: msg,
      severity: 'WARNING',
    });
    messages.push({ id: 'val-env-snapshot', message: msg, severity: 'WARNING' });
  }

  // =========================================================================
  // 4. CONCEPT D: EVIDENCE CONSISTENCY (OCR vs Observation Check - Section 20, 23)
  // =========================================================================
  if (testRun.testDefinition.pattern !== 'PATTERN_B_CHECKLIST' && testRun.evidenceDiscrepancies && testRun.evidenceDiscrepancies.length > 0) {
    testRun.evidenceDiscrepancies.forEach((disc) => {
      if (disc.status === 'DISCREPANCY_FLAGGED') {
        const msg = `Evidence Discrepancy on ${disc.fieldKey}: Recorded value (${disc.recordedValue}) disagrees with OCR extracted value (${disc.ocrExtractedValue || disc.ocrValue}). Manual review or re-capture is required.`;
        if (!messages.some((m) => m.id === `val-disc-${disc.id}`)) {
          messages.push({
            id: `val-disc-${disc.id}`,
            message: msg,
            severity: 'BLOCKING',
          });
        }
        if (!evidenceDiscrepancies.some((d) => d.id === disc.id)) {
          evidenceDiscrepancies.push(disc);
        }
      }
    });
  }

  if (testRun.evidenceReferences && testRun.evidenceReferences.length > 0) {
    testRun.evidenceReferences.forEach((ev) => {
      // Ignore superseded evidence
      if (ev.isSuperseded) return;

      // If dismissed by reviewer or verified, do not block
      if (ev.dismissalReason || ev.status === 'VERIFIED_BY_REVIEWER') return;

      if (testRun.testDefinition.pattern !== 'PATTERN_B_CHECKLIST' && ev.ocrExtractedValue !== undefined && ev.ocrExtractedValue !== null && ev.ocrExtractedValue !== '') {
        const ocrStr = String(ev.ocrExtractedValue);
        const ocrNum = parseFloat(ocrStr);

        // Compare with recorded indication or load (tolerance 0.5e)
        const eTolerance = 0.5 * Number(context?.instrument?.verificationInterval_e ?? 0.005);
        const matchingObs = testRun.rawObservations.find((r) => {
          const ind = parseFloat(String(r.indication ?? ''));
          const ld = parseFloat(String(r.load ?? ''));
          return (!isNaN(ind) && Math.abs(ind - ocrNum) <= eTolerance) || (!isNaN(ld) && Math.abs(ld - ocrNum) <= eTolerance);
        });

        if (!matchingObs || ev.consistencyStatus === 'DISCREPANCY') {
          const disc: EvidenceDiscrepancyItem = {
            id: `disc-${ev.id}`,
            evidenceId: ev.id,
            fieldKey: 'indication',
            recordedValue: String(testRun.rawObservations[0]?.indication ?? 'N/A'),
            ocrExtractedValue: ocrStr,
            ocrValue: isNaN(ocrNum) ? undefined : ocrNum,
            status: 'DISCREPANCY_FLAGGED',
            flaggedAt: new Date().toISOString(),
          };
          if (!evidenceDiscrepancies.some((d) => d.id === disc.id || d.evidenceId === ev.id)) {
            evidenceDiscrepancies.push(disc);
          }

          const msg = `Evidence Discrepancy on ${ev.fileName}: OCR extracted ${ocrStr} differs from recorded observation (${disc.recordedValue}). Manual inspection required.`;
          if (!messages.some((m) => m.id === `val-disc-${ev.id}`)) {
            messages.push({
              id: `val-disc-${ev.id}`,
              message: msg,
              severity: 'BLOCKING',
            });
          }
        }
      }
    });
  }

  // =========================================================================
  // 5. SUMMARY AND COMPLETION GATE
  // =========================================================================
  const blockingCount = messages.filter((m) => m.severity === 'BLOCKING').length;
  const warningCount = messages.filter((m) => m.severity === 'WARNING').length;

  const userSummary =
    blockingCount > 0
      ? `${blockingCount} item(s) remain before this test can be completed.`
      : warningCount > 0
      ? `Ready to complete with ${warningCount} advisory notice(s).`
      : 'All test conditions and observations verified compliant.';

  return {
    canComplete: blockingCount === 0,
    blockingCount,
    warningCount,
    userSummary,
    inputIssues,
    procedureIssues,
    evidenceDiscrepancies,
    messages,
  };
}
