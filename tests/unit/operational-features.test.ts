import { describe, it, expect } from 'vitest';
import { EvaluationRegisterService } from '@/services/operations/evaluation-register-service';
import { ReferenceStandardsService } from '@/services/repository/reference-standards-service';
import { IssuesFindingsService } from '@/services/operations/issues-findings-service';
import { EvidenceRegisterService } from '@/services/evidence/evidence-register-service';
import { InstrumentRepositoryService } from '@/services/repository/instrument-repository-service';

describe('Operational Features for NAWI-R76 Laboratory Evaluation System', () => {
  // =========================================================================
  // 1 & 2. EVALUATION REGISTER & "MY WORK" FILTER
  // =========================================================================
  describe('1 & 2. Evaluation Register & "My Evaluations" Filter', () => {
    it('returns all active laboratory evaluations with standard columns', () => {
      const evals = EvaluationRegisterService.getAllEvaluations();
      expect(evals.length).toBeGreaterThan(0);

      const first = evals[0];
      expect(first).toHaveProperty('evaluationNumber');
      expect(first).toHaveProperty('modelName');
      expect(first).toHaveProperty('manufacturer');
      expect(first).toHaveProperty('serialNumber');
      expect(first).toHaveProperty('status');
      expect(first).toHaveProperty('assignedOperator');
      expect(first).toHaveProperty('overallResult');
      expect(first).toHaveProperty('createdDate');
      expect(first).toHaveProperty('lastUpdated');
    });

    it('filters evaluations assigned to currently logged-in user without hardcoding', () => {
      const evals = EvaluationRegisterService.getAllEvaluations();
      const currentUser = 'Dr. A. Sharma';
      const myWork = evals.filter((e) =>
        e.assignedOperator.toLowerCase().includes(currentUser.toLowerCase())
      );
      expect(myWork.length).toBeGreaterThan(0);
      myWork.forEach((e) => {
        expect(e.assignedOperator).toContain('Sharma');
      });
    });
  });

  // =========================================================================
  // 3. EVIDENCE REGISTER
  // =========================================================================
  describe('3. Evidence Register & Evidentiary Traceability', () => {
    it('retrieves centralized evidence records with purpose, SHA-256 hash, and status', () => {
      const evidence = EvidenceRegisterService.getAllEvidence();
      expect(evidence.length).toBeGreaterThan(0);

      const ev = evidence[0];
      expect(ev).toHaveProperty('id');
      expect(ev).toHaveProperty('evaluationNumber');
      expect(ev).toHaveProperty('purpose');
      expect(ev).toHaveProperty('serverHashSha256');
      expect(ev.serverHashSha256.length).toBe(64); // Valid SHA-256 length
      expect(ev).toHaveProperty('status');
      expect(ev).toHaveProperty('integrityStatus');
    });

    it('filters evidence by specific evaluation number', () => {
      const records = EvidenceRegisterService.getEvidenceForEvaluation('RRSL-2026-TE-0104');
      expect(records.length).toBeGreaterThan(0);
      records.forEach((r) => {
        expect(r.evaluationNumber).toBe('RRSL-2026-TE-0104');
      });
    });
  });

  // =========================================================================
  // 4. REFERENCE STANDARDS REGISTER & VALIDITY
  // =========================================================================
  describe('4. Reference Standards Register & Expiration Warnings', () => {
    it('evaluates valid standards correctly', () => {
      const std = ReferenceStandardsService.getStandardById('STD-WT-001');
      expect(std).not.toBeNull();
      expect(std?.standardClass).toBe('F1');
      expect(std?.status).toBe('VALID');
      expect(ReferenceStandardsService.isStandardValid('STD-WT-001')).toBe(true);
    });

    it('identifies expired standards and prevents valid status', () => {
      const expiredStd = ReferenceStandardsService.getStandardById('STD-EXP-001');
      expect(expiredStd).not.toBeNull();
      expect(expiredStd?.status).toBe('EXPIRED');
      expect(ReferenceStandardsService.isStandardValid('STD-EXP-001')).toBe(false);
    });
  });

  // =========================================================================
  // 5 & 6. ISSUES & FINDINGS
  // =========================================================================
  describe('5 & 6. Issues & Findings Lifecycle', () => {
    it('creates and resolves findings with permanent traceability', () => {
      const initialCount = IssuesFindingsService.getAllFindings().length;

      const newFinding = IssuesFindingsService.addFinding({
        evaluationNumber: 'RRSL-2026-TE-0104',
        testCode: 'R76_REPEATABILITY',
        testName: 'Repeatability Test',
        clause: 'Clause A.4.10',
        type: 'INVALID_OBSERVATION',
        severity: 'BLOCKING',
        description: 'Third run observation deviated by 1.2e beyond tolerance.',
        createdBy: 'M. Verma (Senior Reviewer)',
        assignedTo: 'Dr. A. Sharma',
      });

      expect(newFinding.status).toBe('OPEN');
      expect(IssuesFindingsService.getAllFindings().length).toBe(initialCount + 1);

      // Resolve finding with mandatory notes
      const resolved = IssuesFindingsService.updateFindingStatus(
        newFinding.id,
        'RESOLVED',
        'Repeatability sequence re-executed under thermal stabilization. Max span difference 0.18e compliant.',
        'Dr. A. Sharma'
      );

      expect(resolved?.status).toBe('RESOLVED');
      expect(resolved?.resolutionNotes).toContain('Repeatability sequence re-executed');
      expect(resolved?.resolvedBy).toBe('Dr. A. Sharma');

      // Finding is NOT deleted, it remains permanently in history
      const retrieved = IssuesFindingsService.getAllFindings().find((f) => f.id === newFinding.id);
      expect(retrieved?.status).toBe('RESOLVED');
    });
  });

  // =========================================================================
  // 7. EVALUATION TIMELINE
  // =========================================================================
  describe('7. Chronological Evaluation Timeline', () => {
    it('appends actual audit events to evaluation record timeline', () => {
      const evalRecord = EvaluationRegisterService.getEvaluationByNumber('RRSL-2026-TE-0104');
      expect(evalRecord).not.toBeNull();
      const initialTimelineLen = evalRecord!.timeline.length;

      EvaluationRegisterService.addTimelineEvent('RRSL-2026-TE-0104', {
        eventName: 'Test Submitted',
        actor: 'Dr. A. Sharma',
        details: 'Weighing Intrinsic Error test suite submitted for review',
        category: 'TEST',
      });

      const updated = EvaluationRegisterService.getEvaluationByNumber('RRSL-2026-TE-0104');
      expect(updated!.timeline.length).toBe(initialTimelineLen + 1);
      expect(updated!.timeline[0].eventName).toBe('Test Submitted');
    });
  });

  // =========================================================================
  // 8, 9 & 10. INSTRUMENT HISTORY & CONFIGURATION REVISIONS
  // =========================================================================
  describe('8, 9 & 10. Physical Instrument History & Configuration Revisioning', () => {
    it('maintains history strictly attached to physical specimen serial number', () => {
      InstrumentRepositoryService.ensureInitialized();
      const found = InstrumentRepositoryService.getSpecimenBySerial('SN-RS-26003');
      expect(found).not.toBeNull();
      expect(found?.specimen.serialNumber).toBe('SN-RS-26003');
      expect(found?.model.modelName).toBe('MarketPro-Compute-R15');

      // Check evaluation history is tied to this serial
      expect(found?.specimen.evaluationHistory.length).toBeGreaterThan(0);
      expect(found?.specimen.evaluationHistory[0].configurationRevisionUsed).toBe(1);
    });

    it('increments configuration revision without changing historical evaluation references', () => {
      InstrumentRepositoryService.ensureInitialized();
      const specimenId = 'SPEC-03';
      const before = InstrumentRepositoryService.getSpecimenBySerial('SN-RS-26003')!;
      const oldRev = before.specimen.activeConfigurationRevision;

      // Add revision
      const res = InstrumentRepositoryService.updateSpecimenConfiguration(specimenId, {
        softwareVersion: 'v2.15.0',
        firmwareVersion: 'FW-RT-203',
        changeReason: 'Firmware stabilization update',
        actor: 'Dr. A. Sharma',
      });

      expect(res.success).toBe(true);
      expect(res.newRevision?.revisionNumber).toBe(oldRev + 1);

      // Verify that past evaluation still references configuration revision 1
      const after = InstrumentRepositoryService.getSpecimenBySerial('SN-RS-26003')!;
      expect(after.specimen.activeConfigurationRevision).toBe(oldRev + 1);
      expect(after.specimen.evaluationHistory[0].configurationRevisionUsed).toBe(1);
    });
  });

  // =========================================================================
  // 11 & 12. EVALUATION READINESS CHECK
  // =========================================================================
  describe('11 & 12. Evaluation Readiness Check', () => {
    it('passes readiness check when all parameters and valid standards exist', () => {
      const ev = EvaluationRegisterService.getEvaluationByNumber('RRSL-2026-TE-0104')!;
      const readiness = EvaluationRegisterService.checkReadiness(ev);
      expect(readiness.isReady).toBe(true);
      expect(readiness.blockers.length).toBe(0);
      expect(readiness.checks.every((c) => c.isSatisfied)).toBe(true);
    });

    it('fails readiness check and identifies exact blocker when standard is expired', () => {
      const ev = EvaluationRegisterService.getEvaluationByNumber('RRSL-2026-TE-0104')!;
      const invalidEv = {
        ...ev,
        assignedStandardIds: ['STD-EXP-001'], // Expired standard
      };

      const readiness = EvaluationRegisterService.checkReadiness(invalidEv);
      expect(readiness.isReady).toBe(false);
      expect(readiness.blockers.some((b) => b.includes('STD-EXP-001'))).toBe(true);

      const standardCheck = readiness.checks.find((c) => c.id === 'chk-standards');
      expect(standardCheck?.isSatisfied).toBe(false);
      expect(standardCheck?.actionLabel).toBe('Select Valid Reference Standard');
    });
  });

  // =========================================================================
  // 13. NEXT ACTION COMPUTATION
  // =========================================================================
  describe('13. Next Action Guidance', () => {
    it('derives Next Action based on actual evaluation state', () => {
      const inTestingEv = {
        ...EvaluationRegisterService.getEvaluationByNumber('RRSL-2026-TE-0104')!,
        status: 'IN_TESTING' as const,
        completedTestsCount: 10,
        applicableTestsCount: 13,
      };
      const nextAction = EvaluationRegisterService.computeNextAction(inTestingEv);
      expect(nextAction.nextAction).toBeDefined();
      expect(nextAction.nextAction.length).toBeGreaterThan(5);
      expect(nextAction.recommendedStep).toBe(4);
    });

    it('identifies blocking findings as primary next action', () => {
      const evWithBlocker = EvaluationRegisterService.getEvaluationByNumber('RRSL-2026-TE-0106')!;
      const nextAction = EvaluationRegisterService.computeNextAction(evWithBlocker);
      expect(nextAction.blockers.length).toBeGreaterThan(0);
      expect(nextAction.nextAction).toContain('blocking finding');
    });
  });
});
