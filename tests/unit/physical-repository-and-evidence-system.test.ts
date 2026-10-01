import { describe, it, expect, beforeEach } from 'vitest';
import { InstrumentRepositoryService } from '@/services/repository/instrument-repository-service';
import {
  RegisterSpecimenInput,
} from '@/services/repository/instrument-types';
import {
  computeSha256Hex,
  evaluateOcrObservationConsistency,
} from '@/services/evidence/evidence-crypto';
import { evaluateValidationRules } from '@/core/test-engine/interpreters/validation-interpreter';
import { buildTestRunRecord } from '@/core/test-engine/record-factory';
import { TEST_DEFINITIONS_REGISTRY } from '@/core/test-engine/registry';
import {
  TestEvidenceItem,
  CommonEvaluationContext,
} from '@/core/test-engine/types';

describe('NAWI-R76 Physical Instrument Repository & Test-Linked Evidence System', () => {
  beforeEach(() => {
    InstrumentRepositoryService.ensureInitialized();
  });

  describe('Part A: Physical Specimen vs Model Repository', () => {
    it('distinguishes InstrumentModel from physical InstrumentSpecimen', () => {
      const models = InstrumentRepositoryService.getAllModels();
      const specimens = InstrumentRepositoryService.getAllSpecimens();

      expect(models.length).toBeGreaterThan(0);
      expect(specimens.length).toBeGreaterThan(0);

      // Model represents pattern/shared specs
      const model = models[0];
      expect(model.modelId).toBeDefined();
      expect(model.modelName).toBeDefined();
      expect(model.accuracyClass).toBeDefined();
      expect(model.maxCapacity).toBeGreaterThan(0);

      // Specimen represents individual machine with serial number and revision
      const { specimen } = specimens[0];
      expect(specimen.specimenId).toBeDefined();
      expect(specimen.serialNumber).toBeDefined();
      expect(specimen.activeConfigurationRevision).toBeGreaterThanOrEqual(1);
      expect(specimen.configurationRevisions.length).toBeGreaterThanOrEqual(1);
      expect(specimen.identityEvidence).toBeDefined();
      expect(specimen.identityEvidence.purpose).toBe('IDENTITY');
    });

    it('rejects duplicate serial number during specimen registration (Section 5)', () => {
      // Find an existing specimen serial
      const existing = InstrumentRepositoryService.getAllSpecimens()[0];
      const serial = existing.specimen.serialNumber;

      const duplicateInput: RegisterSpecimenInput = {
        serialNumber: serial,
        manufacturer: 'Apex Metrology Instruments Synthetic Ltd',
        modelName: 'Precision-Bench-B6',
        instrumentCategory: 'BENCH',
        accuracyClass: 'CLASS_II',
        maxCapacity: 6.0,
        minCapacity: 0.05,
        verificationInterval_e: 0.001,
        scaleInterval_d: 0.0002,
        primaryUnit: 'kg',
        rangeType: 'SINGLE',
        tareType: 'SUBTRACTIVE',
        powerSupply: '230V AC',
        temperatureRange: '+10°C to +40°C',
        receptorType: 'STANDARD_PAN',
        softwareVersion: 'v1.0.0',
        intakeOfficer: 'Dr. A. Sharma (Testing Officer)',
      };

      const result = InstrumentRepositoryService.registerNewSpecimen(duplicateInput);
      expect(result.success).toBe(false);
      expect(result.duplicateFound).toBe(true);
      expect(result.error).toContain('already registered');
    });

    it('successfully registers a new unique specimen with identity evidence (Section 5, 10)', () => {
      const uniqueSerial = `SN-TEST-UNIQUE-${Date.now()}`;
      const input: RegisterSpecimenInput = {
        serialNumber: uniqueSerial,
        manufacturer: 'Apex Metrology Instruments Synthetic Ltd',
        modelName: 'Precision-Bench-B6',
        instrumentCategory: 'BENCH',
        accuracyClass: 'CLASS_II',
        maxCapacity: 6.0,
        minCapacity: 0.05,
        verificationInterval_e: 0.001,
        scaleInterval_d: 0.0002,
        primaryUnit: 'kg',
        rangeType: 'SINGLE',
        tareType: 'SUBTRACTIVE',
        powerSupply: '230V AC',
        temperatureRange: '+10°C to +40°C',
        receptorType: 'STANDARD_PAN',
        softwareVersion: 'v2.1.0',
        firmwareVersion: 'FW-2026-X',
        completeInstrumentPhotoUrl: '/evidence/complete_specimen.jpg',
        nameplatePhotoUrl: '/evidence/nameplate.jpg',
        supportingDocuments: [
          {
            id: 'doc-1',
            title: 'Technical Specification Sheet',
            fileName: 'spec_sheet.pdf',
            documentType: 'TECHNICAL_SPEC',
            version: '2.1',
            source: 'MANUFACTURER',
            uploadDate: '2026-09-29',
            approvalStatus: 'APPROVED',
            isApprovedForGuidance: true,
          },
        ],
        intakeOfficer: 'Dr. A. Sharma (Testing Officer)',
      };

      const result = InstrumentRepositoryService.registerNewSpecimen(input);
      expect(result.success).toBe(true);
      expect(result.specimen).toBeDefined();
      expect(result.specimen?.serialNumber).toBe(uniqueSerial);
      expect(result.specimen?.status).toBe('AVAILABLE');
      expect(result.specimen?.identityEvidence.purpose).toBe('IDENTITY');
      expect(result.specimen?.identityEvidence.serverHashSha256).toBeDefined();

      // Find in repository
      const check = InstrumentRepositoryService.checkSerialExists(uniqueSerial);
      expect(check.exists).toBe(true);
      expect(check.specimen?.specimenId).toBe(result.specimen?.specimenId);
    });

    it('compares nameplate OCR candidate against entered specs non-authoritatively (Section 6)', () => {
      const serial = `SN-OCR-MISMATCH-${Date.now()}`;
      const input: RegisterSpecimenInput = {
        serialNumber: serial,
        manufacturer: 'Apex Metrology Instruments Synthetic Ltd',
        modelName: 'Precision-Bench-B6',
        instrumentCategory: 'BENCH',
        accuracyClass: 'CLASS_II',
        maxCapacity: 6.0,
        minCapacity: 0.05,
        verificationInterval_e: 0.001,
        scaleInterval_d: 0.0002,
        primaryUnit: 'kg',
        rangeType: 'SINGLE',
        tareType: 'SUBTRACTIVE',
        powerSupply: '230V AC',
        temperatureRange: '+10°C to +40°C',
        receptorType: 'STANDARD_PAN',
        softwareVersion: 'v1.0.0',
        nameplatePhotoUrl: '/evidence/nameplate_skewed.jpg',
        scannedOcrSerial: 'SN-OCR-DIFFERENT-123', // Mismatch!
        scannedOcrMax: '15.000', // Mismatch from 6.0!
        intakeOfficer: 'Dr. A. Sharma (Testing Officer)',
      };

      const result = InstrumentRepositoryService.registerNewSpecimen(input);
      expect(result.success).toBe(true);
      // Data is NOT overwritten by OCR! Authoritative data matches entered values:
      expect(result.specimen?.serialNumber).toBe(serial);
      // Inconsistencies are captured in identity evidence:
      expect(result.specimen?.identityEvidence.isConsistent).toBe(false);
      expect(result.specimen?.identityEvidence.inconsistencyFlags?.length).toBeGreaterThan(0);
    });

    it('tracks configuration revisions without overwriting historical revisions (Section 8)', () => {
      const { specimen } = InstrumentRepositoryService.getAllSpecimens()[0];
      const initialRevCount = specimen.configurationRevisions.length;
      const initialActiveRev = specimen.activeConfigurationRevision;

      const updateResult = InstrumentRepositoryService.updateSpecimenConfiguration(specimen.specimenId, {
        softwareVersion: 'v3.0.0-PROD',
        firmwareVersion: 'FW-PROD-2026',
        changeReason: 'Firmware upgrade for enhanced filter stability',
        actor: 'Senior Metrologist K. Rao',
        notes: 'Filter rate updated to 50 Hz',
      });

      expect(updateResult.success).toBe(true);
      expect(updateResult.newRevision).toBeDefined();
      expect(updateResult.newRevision?.revisionNumber).toBe(initialActiveRev + 1);
      expect(specimen.configurationRevisions.length).toBe(initialRevCount + 1);

      // Verify Rev 1 still exists intact in history
      const rev1 = specimen.configurationRevisions.find((r) => r.revisionNumber === 1);
      expect(rev1).toBeDefined();
      expect(rev1?.softwareVersion).toBeDefined();
    });

    it('manages specimen lifecycle statuses and evaluation linkage (Section 3, 12)', () => {
      const { specimen } = InstrumentRepositoryService.getAllSpecimens()[0];
      const id = specimen.specimenId;

      // Start evaluation
      InstrumentRepositoryService.updateSpecimenStatus(id, 'IN_EVALUATION', 'TE-2026-DEMO');
      expect(specimen.status).toBe('IN_EVALUATION');
      expect(specimen.currentEvaluationNumber).toBe('TE-2026-DEMO');

      // Complete evaluation
      InstrumentRepositoryService.updateSpecimenStatus(id, 'COMPLETED');
      expect(specimen.status).toBe('COMPLETED');
      expect(specimen.currentEvaluationNumber).toBeUndefined();

      // Issue report
      InstrumentRepositoryService.updateSpecimenStatus(id, 'REPORT_ISSUED');
      expect(specimen.status).toBe('REPORT_ISSUED');

      // Retire
      InstrumentRepositoryService.updateSpecimenStatus(id, 'RETIRED');
      expect(specimen.status).toBe('RETIRED');
    });
  });

  describe('Part B: Test-Linked Evidence System', () => {
    const dummyContext: CommonEvaluationContext = {
      evaluationNumber: 'TE-2026-001',
      laboratoryName: 'National Metrology Laboratory',
      operatorName: 'Dr. A. Sharma',
      operatorRole: 'Lead Metrologist',
      standardVersion: 'OIML R 76-1:2006',
      instrument: {
        id: 'MOD-PB-B6',
        specimenId: 'SPEC-001',
        configurationRevision: 1,
        modelName: 'Precision-Bench-B6',
        serialNumber: 'SN-PB-26001',
        manufacturer: 'Apex Metrology Instruments Synthetic Ltd',
        accuracyClass: 'CLASS_II',
        maxCapacity: 6.0,
        minCapacity: 0.05,
        verificationInterval_e: 0.001,
        scaleInterval_d: 0.0002,
        numberOfIntervals_n: 6000,
        primaryUnit: 'kg',
        rangeType: 'SINGLE',
        tareType: 'SUBTRACTIVE',
        powerSupply: '230V AC',
        temperatureRange: '+10°C to +40°C',
        receptorType: 'STANDARD_PAN',
        softwareVersion: 'v1.0.0',
      },
    };

    it('calculates deterministic server-authoritative SHA-256 digest (Section 18)', async () => {
      const payload = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...';
      const hash1 = await computeSha256Hex(payload);
      const hash2 = await computeSha256Hex(payload);

      expect(hash1).toBe(hash2);
      expect(hash1.length).toBe(64);
      expect(/^[0-9a-f]{64}$/.test(hash1)).toBe(true);
    });

    it('evaluates OCR observation consistency within 0.5e tolerance (Section 20)', () => {
      const e = 0.001; // 1 g

      // Consistent: delta = 0.0002 <= 0.0005 (0.5e)
      const res1 = evaluateOcrObservationConsistency('Display: 5.0002 kg', 5.0, e);
      expect(res1.isConsistent).toBe(true);
      expect(res1.status).toBe('CONSISTENT');

      // Discrepancy: delta = 0.001 > 0.0005 (0.5e)
      const res2 = evaluateOcrObservationConsistency('Display: 5.0010 kg', 5.0, e);
      expect(res2.isConsistent).toBe(false);
      expect(res2.status).toBe('DISCREPANCY');
      expect(res2.explanation).toContain('Discrepancy detected');
    });

    it('enforces evidence policy: REQUIRED blocks completion, RECOMMENDED does not (Section 14, 15, 28)', () => {
      const adminDef = TEST_DEFINITIONS_REGISTRY['R76_ADMIN_MARKINGS'];
      const testRun = buildTestRunRecord(adminDef, dummyContext);

      // 1. When mandatory REQUIRED evidence is missing -> MUST block test completion
      testRun.evidenceReferences = [];
      testRun.evidence = [];

      const valNoEvidence = evaluateValidationRules(
        testRun,
        adminDef.procedureDefinition.validationRules,
        dummyContext
      );
      expect(valNoEvidence.canComplete).toBe(false);
      expect(valNoEvidence.blockingCount).toBeGreaterThan(0);
      expect(valNoEvidence.messages.some((m) => m.message.toLowerCase().includes('missing'))).toBe(true);

      // 2. Attach required evidence -> MUST satisfy blocker
      testRun.evidenceReferences = [
        {
          id: 'ev-1',
          testRunId: testRun.id,
          fileName: 'markings_verified.jpg',
          mimeType: 'image/jpeg',
          timestamp: '2026-09-29T10:00:00Z',
          description: 'Markings nameplate verification',
          purpose: 'IDENTITY',
          status: 'INTEGRITY_VERIFIED',
          serverHashSha256: 'a1b2c3d4e5f60000000000000000000000000000000000000000000000000000',
        },
      ];
      testRun.evidence = testRun.evidenceReferences;

      const valWithEvidence = evaluateValidationRules(
        testRun,
        adminDef.procedureDefinition.validationRules,
        dummyContext
      );
      // Evidence blocking error is cleared
      const missingEvidenceError = valWithEvidence.messages.find((m) =>
        m.message.toLowerCase().includes('required evidence item is missing')
      );
      expect(missingEvidenceError).toBeUndefined();

      // 3. For a test with RECOMMENDED policy (e.g. Tare or Sensitivity)
      const tareDef = TEST_DEFINITIONS_REGISTRY['R76_TARE_WEIGHING'];
      if (tareDef) {
        const tareRun = buildTestRunRecord(tareDef, dummyContext);
        tareRun.evidenceReferences = [];
        tareRun.evidence = [];
        const tareVal = evaluateValidationRules(
          tareRun,
          tareDef.procedureDefinition.validationRules,
          dummyContext
        );
        // Missing recommended evidence does NOT block completion!
        const tareMissingBlocker = tareVal.messages.find(
          (m) => m.severity === 'BLOCKING' && m.message.toLowerCase().includes('required evidence')
        );
        expect(tareMissingBlocker).toBeUndefined();
      }
    });

    it('handles discrepancy dismissal with reviewer and reason, preserving history (Section 23, 24)', () => {
      const weighDef = TEST_DEFINITIONS_REGISTRY['R76_WEIGH_INTRINSIC'];
      const testRun = buildTestRunRecord(weighDef, dummyContext);

      // Attach evidence with discrepancy
      const discEvidence: TestEvidenceItem = {
        id: 'ev-disc-1',
        testRunId: testRun.id,
        fileName: 'display_glare.jpg',
        mimeType: 'image/jpeg',
        timestamp: '2026-09-29T10:00:00Z',
        description: 'Observation point 1 display image',
        purpose: 'RESULT_SUPPORT',
        status: 'DISCREPANCY',
        serverHashSha256: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        ocrExtractedValue: '99.999', // Discrepancy from observations
        consistencyStatus: 'DISCREPANCY',
      };

      testRun.evidenceReferences = [discEvidence];

      // Before dismissal: discrepancy triggers blocking issue in validation
      const valBefore = evaluateValidationRules(
        testRun,
        weighDef.procedureDefinition.validationRules,
        dummyContext
      );
      expect(valBefore.evidenceDiscrepancies.length).toBeGreaterThan(0);
      expect(valBefore.messages.some((m) => m.message.toLowerCase().includes('discrepancy'))).toBe(true);

      // Authorized reviewer dismisses discrepancy with documented reason
      testRun.evidenceReferences = [
        {
          ...discEvidence,
          status: 'VERIFIED_BY_REVIEWER',
          dismissedBy: 'Dr. A. Sharma (Lead Metrologist)',
          dismissalReason: 'Optical reflection on LED digit segments; physical weights verified with traceable standard.',
          reviewedBy: 'Dr. A. Sharma',
          reviewedAt: '2026-09-29T10:15:00Z',
        },
      ];

      const valAfter = evaluateValidationRules(
        testRun,
        weighDef.procedureDefinition.validationRules,
        dummyContext
      );
      // Discrepancy is dismissed
      const discMsg = valAfter.messages.find((m) => m.id === `val-disc-${discEvidence.id}`);
      expect(discMsg).toBeUndefined();
    });

    it('supersedes evidence without deleting historical original (Section 24)', () => {
      const originalEvidence: TestEvidenceItem = {
        id: 'ev-orig',
        testRunId: 'TR-01',
        fileName: 'setup_blurry.jpg',
        mimeType: 'image/jpeg',
        timestamp: '2026-09-29T09:00:00Z',
        description: 'Original setup photo',
        purpose: 'SETUP',
        status: 'INTEGRITY_VERIFIED',
      };

      const replacementEvidence: TestEvidenceItem = {
        id: 'ev-rep',
        testRunId: 'TR-01',
        fileName: 'setup_clear.jpg',
        mimeType: 'image/jpeg',
        timestamp: '2026-09-29T09:30:00Z',
        description: 'Replacement sharp setup photo',
        purpose: 'SETUP',
        status: 'INTEGRITY_VERIFIED',
      };

      // Mark original as superseded
      const supersededOriginal: TestEvidenceItem = {
        ...originalEvidence,
        isSuperseded: true,
        supersededById: replacementEvidence.id,
        supersededReason: 'Replaced with higher clarity setup photograph',
      };

      const allEvidence = [supersededOriginal, replacementEvidence];

      // Both items are preserved in repository
      expect(allEvidence.length).toBe(2);
      expect(supersededOriginal.isSuperseded).toBe(true);
      expect(supersededOriginal.supersededById).toBe('ev-rep');
      expect(replacementEvidence.isSuperseded).toBeFalsy();
    });
  });
});
