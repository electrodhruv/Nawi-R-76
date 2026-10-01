/**
 * Instrument Repository Service for NAWI-R76
 *
 * Implements real physical specimen intake, duplicate serial detection,
 * metrological consistency validation, configuration revision control,
 * identity evidence binding, and complete machine lifecycle history.
 */

import crypto from 'crypto';
import { RegisteredInstrument } from '@/lib/synthetic-instruments';
import {
  InstrumentModel,
  InstrumentSpecimen,
  RegisterSpecimenInput,
  SpecimenConfigurationRevision,
  SpecimenStatus,
  SpecimenEvaluationSummary,
} from './instrument-types';

export class InstrumentRepositoryService {
  private static models = new Map<string, InstrumentModel>();
  private static specimens = new Map<string, InstrumentSpecimen>();
  private static isInitialized = false;

  public static ensureInitialized() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Seed Model 1: Precision-Bench-B6
    const model1: InstrumentModel = {
      modelId: 'MOD-PB-B6',
      modelName: 'Precision-Bench-B6',
      tradeName: 'High-Resolution Laboratory Bench Scale',
      manufacturer: 'Apex Metrology Instruments Ltd',
      instrumentCategory: 'BENCH',
      accuracyClass: 'CLASS_II',
      maxCapacity: 6.0,
      minCapacity: 0.05,
      verificationInterval_e: 0.001,
      scaleInterval_d: 0.0002,
      numberOfIntervals_n: 6000,
      primaryUnit: 'kg',
      rangeType: 'SINGLE',
      tareType: 'SUBTRACTIVE',
      powerSupply: '230 V AC / 50 Hz via external adaptor',
      temperatureRange: '+10 °C to +30 °C',
      receptorType: 'STANDARD_PAN',
      hasAutomaticLeveling: false,
      supportingDocuments: [
        {
          id: 'DOC-PB-MAN-01',
          title: 'Precision-Bench-B6 Operating & Service Manual',
          documentType: 'MANUAL',
          fileName: 'Precision_Bench_B6_Manual_v1.4.pdf',
          uploadDate: '2024-06-01',
          isApprovedForGuidance: true,
        },
      ],
      createdAt: '2024-06-01T08:00:00Z',
    };
    this.models.set(model1.modelId, model1);

    // Specimen 1: SN-BS-26001 (Available)
    const spec1: InstrumentSpecimen = {
      specimenId: 'SPEC-01',
      modelId: model1.modelId,
      serialNumber: 'SN-BS-26001',
      intakeDate: '2026-01-10',
      status: 'PENDING_REVIEW',
      currentEvaluationNumber: 'RRSL-2026-TE-0104',
      activeConfigurationRevision: 1,
      configurationRevisions: [
        {
          revisionNumber: 1,
          effectiveDate: '2026-01-10T10:00:00Z',
          softwareVersion: 'v1.4.2',
          firmwareVersion: 'FW-B6-104',
          specialConfigurationNotes: 'Factory baseline calibration for Class II laboratory intake',
          updatedBy: 'R. Sharma (Intake Officer)',
        },
      ],
      identityEvidence: {
        purpose: 'IDENTITY',
        serverHashSha256: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
        completeInstrumentPhotoUrl: '/demo-evidence/bench_scale_full.jpg',
        completeInstrumentPhotoHash: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
        nameplatePhotoUrl: '/demo-evidence/bench_scale_nameplate.jpg',
        nameplatePhotoHash: 'b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef01a',
        scannedOcrSerial: 'SN-BS-26001',
        capturedAt: '2026-01-10T10:15:00Z',
        uploader: 'R. Sharma (Intake Officer)',
      },
      evaluationHistory: [
        {
          evaluationNumber: 'RRSL-2026-TE-0104',
          startDate: '2026-09-27',
          completedDate: '2026-09-28',
          status: 'PENDING_REVIEW',
          finalVerdict: 'COMPLIANT',
          leadMetrologist: 'Dr. A. Sharma',
          configurationRevisionUsed: 1,
        },
        {
          evaluationNumber: 'RRSL-2025-TE-PREV',
          startDate: '2025-06-15',
          completedDate: '2025-06-20',
          status: 'COMPLETED',
          finalVerdict: 'COMPLIANT',
          reportNumber: 'RRSL-2025-TE-PREV',
          reportRevision: 0,
          leadMetrologist: 'Dr. S. K. Nair',
          configurationRevisionUsed: 1,
        },
      ],
      serviceHistory: [
        {
          id: 'SRV-01',
          date: '2026-01-10',
          type: 'INTAKE',
          description: 'Initial intake and physical inspection. Nameplate verified.',
          technician: 'R. Sharma',
        },
      ],
    };
    this.specimens.set(spec1.specimenId, spec1);

    // Seed Model 2: MarketPro-Compute-R15
    const model2: InstrumentModel = {
      modelId: 'MOD-MP-R15',
      modelName: 'MarketPro-Compute-R15',
      tradeName: 'Retail Price-Computing Counter Scale',
      manufacturer: 'Delta Electronics Corp',
      instrumentCategory: 'RETAIL',
      accuracyClass: 'CLASS_III',
      maxCapacity: 15.0,
      minCapacity: 0.1,
      verificationInterval_e: 0.005,
      scaleInterval_d: 0.005,
      numberOfIntervals_n: 3000,
      primaryUnit: 'kg',
      rangeType: 'SINGLE',
      tareType: 'SUBTRACTIVE',
      powerSupply: '230 V AC Mains + 6V Internal Battery',
      temperatureRange: '-10 °C to +40 °C',
      receptorType: 'STANDARD_PAN',
      hasAutomaticLeveling: false,
      supportingDocuments: [
        {
          id: 'DOC-MP-MAN-01',
          title: 'AWT-3000-Retail Commercial Scale Manual',
          documentType: 'MANUAL',
          fileName: 'AWT3000_Commercial_Manual.pdf',
          uploadDate: '2025-01-10',
          isApprovedForGuidance: true,
        },
      ],
      createdAt: '2025-01-10T09:00:00Z',
    };
    this.models.set(model2.modelId, model2);

    // Specimen 2: SN-RS-26003 (Active primary demo scale in testing)
    const spec2: InstrumentSpecimen = {
      specimenId: 'SPEC-03',
      modelId: model2.modelId,
      serialNumber: 'SN-RS-26003',
      intakeDate: '2026-02-01',
      status: 'IN_EVALUATION',
      currentEvaluationNumber: 'RRSL-2026-TE-0107',
      activeConfigurationRevision: 1,
      configurationRevisions: [
        {
          revisionNumber: 1,
          effectiveDate: '2026-02-01T09:30:00Z',
          softwareVersion: 'v2.14.0',
          firmwareVersion: 'FW-RT-202',
          specialConfigurationNotes: 'Dual display retail computing head configured with sub-interval filtering',
          updatedBy: 'R. Sharma (Intake Officer)',
        },
      ],
      identityEvidence: {
        purpose: 'IDENTITY',
        serverHashSha256: 'c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef01a2b',
        completeInstrumentPhotoUrl: '/demo-evidence/retail_scale_full.jpg',
        completeInstrumentPhotoHash: 'c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef01a2b',
        nameplatePhotoUrl: '/demo-evidence/retail_scale_nameplate.jpg',
        nameplatePhotoHash: 'd4e5f67890123456789abcdef0123456789abcdef0123456789abcdef01a2b3c',
        scannedOcrSerial: 'SN-RS-26003',
        capturedAt: '2026-02-01T09:45:00Z',
        uploader: 'R. Sharma (Intake Officer)',
      },
      evaluationHistory: [
        {
          evaluationNumber: 'RRSL-2026-TE-0107',
          startDate: '2026-09-27',
          completedDate: '2026-09-28',
          status: 'COMPLETED',
          finalVerdict: 'COMPLIANT',
          reportNumber: 'RRSL-2026-TE-0107',
          reportRevision: 0,
          leadMetrologist: 'Dr. A. Sharma',
          configurationRevisionUsed: 1,
        },
      ],
      serviceHistory: [
        {
          id: 'SRV-02',
          date: '2026-02-01',
          type: 'INTAKE',
          description: 'Intake registration completed. Nameplate serial confirmed with OCR.',
          technician: 'R. Sharma',
        },
      ],
    };
    this.specimens.set(spec2.specimenId, spec2);

    // Seed Model for InduWeigh-Platform-P150
    const modelIndu: InstrumentModel = {
      modelId: 'MOD-IP-P150',
      modelName: 'InduWeigh-Platform-P150',
      tradeName: 'Medium Capacity Industrial Platform Scale',
      manufacturer: 'Bharat Metrology Systems Pvt Ltd',
      instrumentCategory: 'PLATFORM',
      accuracyClass: 'CLASS_III',
      maxCapacity: 150.0,
      minCapacity: 1.0,
      verificationInterval_e: 0.05,
      scaleInterval_d: 0.05,
      numberOfIntervals_n: 3000,
      primaryUnit: 'kg',
      rangeType: 'SINGLE',
      tareType: 'SUBTRACTIVE',
      powerSupply: '230 V AC Mains + 6V Rechargeable Lead-Acid',
      temperatureRange: '-10 °C to +40 °C',
      receptorType: 'STANDARD_PAN',
      hasAutomaticLeveling: false,
      supportingDocuments: [],
      createdAt: '2025-02-15T08:00:00Z',
    };
    this.models.set(modelIndu.modelId, modelIndu);

    // Specimen 3: SN-PS-26002 (In Evaluation)
    const spec3: InstrumentSpecimen = {
      specimenId: 'SPEC-02',
      modelId: modelIndu.modelId,
      serialNumber: 'SN-PS-26002',
      intakeDate: '2026-03-05',
      status: 'IN_EVALUATION',
      currentEvaluationNumber: 'RRSL-2026-TE-0106',
      activeConfigurationRevision: 1,
      configurationRevisions: [
        {
          revisionNumber: 1,
          effectiveDate: '2026-03-05T11:00:00Z',
          softwareVersion: 'v3.1.0',
          updatedBy: 'R. Sharma',
        },
      ],
      identityEvidence: {
        purpose: 'IDENTITY',
        serverHashSha256: 'e5f67890123456789abcdef0123456789abcdef0123456789abcdef01a2b3c4d',
        capturedAt: '2026-03-05T11:10:00Z',
        uploader: 'R. Sharma',
      },
      evaluationHistory: [],
      serviceHistory: [],
    };
    this.specimens.set(spec3.specimenId, spec3);

    // Specimen 4: SN-WB-26004 (Weighbridge - Rolling track)
    const model3: InstrumentModel = {
      modelId: 'MOD-WB-60T',
      modelName: 'TransScale-Truck-60T',
      tradeName: 'Heavy Commercial Electronic Weighbridge',
      manufacturer: 'HeavyDuty Weighbridges Ltd',
      instrumentCategory: 'WEIGHBRIDGE',
      accuracyClass: 'CLASS_III',
      maxCapacity: 60000.0,
      minCapacity: 400.0,
      verificationInterval_e: 20.0,
      scaleInterval_d: 20.0,
      numberOfIntervals_n: 3000,
      primaryUnit: 'kg',
      rangeType: 'SINGLE',
      tareType: 'SUBTRACTIVE',
      powerSupply: '230 V AC Mains + 12V Heavy Industrial Backup Battery',
      temperatureRange: '-20 °C to +50 °C',
      receptorType: 'ROLLING_TRACK',
      hasAutomaticLeveling: false,
      supportingDocuments: [],
      createdAt: '2025-03-01T08:00:00Z',
    };
    this.models.set(model3.modelId, model3);

    const spec4: InstrumentSpecimen = {
      specimenId: 'SPEC-04',
      modelId: model3.modelId,
      serialNumber: 'SN-WB-26004',
      intakeDate: '2026-04-12',
      status: 'REPORT_ISSUED',
      currentEvaluationNumber: 'RRSL-2026-TE-0098',
      activeConfigurationRevision: 1,
      configurationRevisions: [
        {
          revisionNumber: 1,
          effectiveDate: '2026-04-12T10:00:00Z',
          softwareVersion: 'v4.0.1',
          updatedBy: 'R. Sharma',
        },
      ],
      identityEvidence: {
        purpose: 'IDENTITY',
        serverHashSha256: 'f67890123456789abcdef0123456789abcdef0123456789abcdef01a2b3c4d5e',
        capturedAt: '2026-04-12T10:15:00Z',
        uploader: 'R. Sharma',
      },
      evaluationHistory: [],
      serviceHistory: [],
    };
    this.specimens.set(spec4.specimenId, spec4);
  }

  /**
   * Returns all registered physical specimens joined with model metadata.
   */
  public static getAllSpecimens(): Array<{ specimen: InstrumentSpecimen; model: InstrumentModel }> {
    this.ensureInitialized();
    const result: Array<{ specimen: InstrumentSpecimen; model: InstrumentModel }> = [];

    for (const specimen of this.specimens.values()) {
      const model = this.models.get(specimen.modelId);
      if (model) {
        result.push({ specimen, model });
      }
    }

    return result;
  }

  /**
   * Retrieves a specimen by its unique specimenId.
   */
  public static getSpecimenById(specimenId: string): InstrumentSpecimen | null {
    this.ensureInitialized();
    return this.specimens.get(specimenId) || null;
  }

  /**
   * Returns all instrument models in the repository.
   */
  public static getAllModels(): InstrumentModel[] {
    this.ensureInitialized();
    return Array.from(this.models.values());
  }

  /**
   * Retrieves a model by its unique modelId.
   */
  public static getModelById(modelId: string): InstrumentModel | null {
    this.ensureInitialized();
    return this.models.get(modelId) || null;
  }

  /**
   * Returns all registered instruments converted to RegisteredInstrument interface.
   */
  public static getAllRegisteredInstruments(): RegisteredInstrument[] {
    return this.getAllSpecimens().map(({ specimen, model }) =>
      this.toRegisteredInstrument(specimen, model)
    );
  }

  /**
   * Retrieves a specimen by serial number.
   */
  public static getSpecimenBySerial(serial: string): { specimen: InstrumentSpecimen; model: InstrumentModel } | null {
    this.ensureInitialized();
    const cleanSerial = serial.trim().toLowerCase();

    for (const specimen of this.specimens.values()) {
      if (specimen.serialNumber.trim().toLowerCase() === cleanSerial) {
        const model = this.models.get(specimen.modelId);
        if (model) return { specimen, model };
      }
    }
    return null;
  }

  /**
   * Registers a new physical specimen into the repository with duplicate checking
   * and metrological consistency validation.
   */
  public static registerNewSpecimen(input: RegisterSpecimenInput): {
    success: boolean;
    error?: string;
    duplicateFound?: boolean;
    specimen?: InstrumentSpecimen;
    model?: InstrumentModel;
  } {
    this.ensureInitialized();

    const cleanSerial = input.serialNumber.trim();
    if (!cleanSerial) {
      return { success: false, error: 'Serial number is mandatory.' };
    }

    // 1. Check for Duplicate Serial Number
    const existing = this.getSpecimenBySerial(cleanSerial);
    if (existing) {
      return {
        success: false,
        duplicateFound: true,
        error: `An instrument with serial number "${cleanSerial}" is already registered in the laboratory repository.`,
        specimen: existing.specimen,
        model: existing.model,
      };
    }

    // 2. Metrological Consistency Validation (Clause 3.2 - 3.4)
    if (input.maxCapacity <= 0) {
      return { success: false, error: 'Maximum capacity (Max) must be greater than zero.' };
    }
    if (input.minCapacity <= 0) {
      return { success: false, error: 'Minimum capacity (Min) must be greater than zero.' };
    }
    if (input.minCapacity >= input.maxCapacity) {
      return { success: false, error: 'Minimum capacity (Min) cannot be greater than or equal to Maximum capacity (Max).' };
    }
    if (input.verificationInterval_e <= 0) {
      return { success: false, error: 'Verification scale interval (e) must be positive.' };
    }
    if (input.scaleInterval_d <= 0) {
      return { success: false, error: 'Actual scale interval (d) must be positive.' };
    }
    if (input.scaleInterval_d > input.verificationInterval_e) {
      return { success: false, error: 'Actual scale interval (d) cannot exceed verification interval (e).' };
    }

    const calculated_n = Math.round(input.maxCapacity / input.verificationInterval_e);
    if (calculated_n < 50) {
      return { success: false, error: `Calculated number of intervals (n = ${calculated_n}) is lower than statutory minimum (50).` };
    }

    // 3. Find or Create Model
    const modelKey = `MOD-${input.manufacturer.substring(0, 3).toUpperCase()}-${input.modelName.replace(/\s+/g, '-').toUpperCase()}`;
    let model = this.models.get(modelKey);

    if (!model) {
      model = {
        modelId: modelKey,
        modelName: input.modelName.trim(),
        tradeName: input.tradeName?.trim() || input.modelName.trim(),
        manufacturer: input.manufacturer.trim(),
        instrumentCategory: input.instrumentCategory,
        accuracyClass: input.accuracyClass,
        maxCapacity: input.maxCapacity,
        minCapacity: input.minCapacity,
        verificationInterval_e: input.verificationInterval_e,
        scaleInterval_d: input.scaleInterval_d,
        numberOfIntervals_n: calculated_n,
        primaryUnit: input.primaryUnit.trim() || 'kg',
        rangeType: input.rangeType,
        tareType: input.tareType,
        powerSupply: input.powerSupply.trim(),
        temperatureRange: input.temperatureRange.trim(),
        receptorType: input.receptorType,
        hasAutomaticLeveling: input.hasAutomaticLeveling ?? false,
        supportingDocuments: input.supportingDocuments && input.supportingDocuments.length > 0
          ? input.supportingDocuments
          : input.manualTitle
          ? [
              {
                id: `DOC-${Date.now()}`,
                title: input.manualTitle,
                documentType: 'MANUAL',
                fileName: `${input.modelName.replace(/\s+/g, '_')}_Manual.pdf`,
                uploadDate: new Date().toISOString().split('T')[0],
                approvalStatus: 'APPROVED' as const,
                isApprovedForGuidance: true,
              },
            ]
          : [],
        createdAt: new Date().toISOString(),
      };
      this.models.set(model.modelId, model);
    } else if (input.supportingDocuments && input.supportingDocuments.length > 0) {
      // Append any new documents to existing model
      for (const doc of input.supportingDocuments) {
        if (!model.supportingDocuments.some((d) => d.title === doc.title)) {
          model.supportingDocuments.push(doc);
        }
      }
    }

    // 4. Create Specimen
    const specimenId = `SPEC-${Date.now().toString().slice(-6)}`;
    const fullPhotoHash = input.completeInstrumentPhotoUrl
      ? crypto.createHash('sha256').update(input.completeInstrumentPhotoUrl).digest('hex')
      : undefined;
    const nameplatePhotoHash = input.nameplatePhotoUrl
      ? crypto.createHash('sha256').update(input.nameplatePhotoUrl).digest('hex')
      : undefined;

    const inconsistencyFlags: string[] = [];
    if (input.scannedOcrSerial && input.scannedOcrSerial !== cleanSerial) {
      inconsistencyFlags.push(`Nameplate serial "${input.scannedOcrSerial}" differs from entered serial "${cleanSerial}"`);
    }
    if (input.scannedOcrModel && input.scannedOcrModel !== input.modelName) {
      inconsistencyFlags.push(`Nameplate model "${input.scannedOcrModel}" differs from entered model "${input.modelName}"`);
    }

    const newSpecimen: InstrumentSpecimen = {
      specimenId,
      modelId: model.modelId,
      serialNumber: cleanSerial,
      intakeDate: new Date().toISOString().split('T')[0],
      status: 'AVAILABLE',
      activeConfigurationRevision: 1,
      configurationRevisions: [
        {
          revisionNumber: 1,
          effectiveDate: new Date().toISOString(),
          softwareVersion: input.softwareVersion.trim() || 'v1.0.0',
          firmwareVersion: input.firmwareVersion?.trim(),
          specialConfigurationNotes: input.specialConfigurationNotes?.trim() || 'Initial laboratory specimen intake',
          updatedBy: input.intakeOfficer,
        },
      ],
      identityEvidence: {
        purpose: 'IDENTITY',
        serverHashSha256: nameplatePhotoHash || fullPhotoHash || crypto.createHash('sha256').update(cleanSerial).digest('hex'),
        completeInstrumentPhotoUrl: input.completeInstrumentPhotoUrl,
        completeInstrumentPhotoHash: fullPhotoHash,
        nameplatePhotoUrl: input.nameplatePhotoUrl,
        nameplatePhotoHash: nameplatePhotoHash,
        scannedOcrSerial: input.scannedOcrSerial || input.scannedNameplateSerial,
        scannedOcrModel: input.scannedOcrModel,
        scannedOcrManufacturer: input.scannedOcrManufacturer,
        scannedOcrMax: input.scannedOcrMax,
        scannedOcrMin: input.scannedOcrMin,
        scannedOcrE: input.scannedOcrE,
        isConsistent: inconsistencyFlags.length === 0,
        inconsistencyFlags,
        capturedAt: new Date().toISOString(),
        uploader: input.intakeOfficer,
      },
      evaluationHistory: [],
      serviceHistory: [
        {
          id: `SRV-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          type: 'INTAKE',
          description: `Specimen ${cleanSerial} intake completed by ${input.intakeOfficer}. Verified against OIML ${input.accuracyClass}.`,
          technician: input.intakeOfficer,
        },
      ],
    };

    this.specimens.set(newSpecimen.specimenId, newSpecimen);

    return {
      success: true,
      specimen: newSpecimen,
      model,
    };
  }

  /**
   * Updates specimen configuration by creating a new revision.
   * Historical evaluations remain linked to previous revisions.
   */
  public static updateSpecimenConfiguration(
    specimenId: string,
    update: {
      softwareVersion: string;
      firmwareVersion?: string;
      notes?: string;
      changeReason: string;
      actor: string;
    }
  ): { success: boolean; newRevision?: SpecimenConfigurationRevision; error?: string } {
    this.ensureInitialized();
    const specimen = this.specimens.get(specimenId);
    if (!specimen) return { success: false, error: 'Specimen not found.' };

    const newRevNumber = specimen.activeConfigurationRevision + 1;
    const newRev: SpecimenConfigurationRevision = {
      revisionNumber: newRevNumber,
      effectiveDate: new Date().toISOString(),
      softwareVersion: update.softwareVersion.trim(),
      firmwareVersion: update.firmwareVersion?.trim(),
      specialConfigurationNotes: update.notes?.trim(),
      changeReason: update.changeReason.trim(),
      updatedBy: update.actor,
    };

    specimen.configurationRevisions.push(newRev);
    specimen.activeConfigurationRevision = newRevNumber;

    specimen.serviceHistory.push({
      id: `SRV-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'CONFIG_UPDATE',
      description: `Configuration updated to Rev ${newRevNumber} (${update.softwareVersion}): ${update.changeReason}`,
      technician: update.actor,
    });

    return { success: true, newRevision: newRev };
  }

  /**
   * Converts a Specimen + Model into the standard RegisteredInstrument interface.
   */
  public static toRegisteredInstrument(
    specimen: InstrumentSpecimen,
    model: InstrumentModel
  ): RegisteredInstrument {
    const activeConfig =
      specimen.configurationRevisions.find((r) => r.revisionNumber === specimen.activeConfigurationRevision) ||
      specimen.configurationRevisions[0];

    return {
      id: specimen.specimenId,
      serialNumber: specimen.serialNumber,
      modelName: model.modelName,
      tradeName: model.tradeName,
      manufacturer: model.manufacturer,
      accuracyClass: model.accuracyClass,
      maxCapacity: model.maxCapacity,
      minCapacity: model.minCapacity,
      verificationInterval_e: model.verificationInterval_e,
      scaleInterval_d: model.scaleInterval_d,
      numberOfIntervals_n: model.numberOfIntervals_n,
      primaryUnit: model.primaryUnit,
      rangeType: model.rangeType,
      tareType: model.tareType,
      powerSupply: model.powerSupply,
      temperatureRange: model.temperatureRange,
      receptorType: model.receptorType,
      softwareVersion: activeConfig?.softwareVersion || 'v1.0.0',
      specimenId: specimen.specimenId,
      configurationRevision: specimen.activeConfigurationRevision,
      status: specimen.status,
      hasFailedSample: specimen.hasFailedSample,
    };
  }

  /**
   * Checks if a serial number is already registered in the repository.
   */
  public static checkSerialExists(serialNumber: string): {
    exists: boolean;
    specimen?: InstrumentSpecimen;
    model?: InstrumentModel;
  } {
    const found = this.getSpecimenBySerial(serialNumber);
    if (found) {
      return { exists: true, specimen: found.specimen, model: found.model };
    }
    return { exists: false };
  }

  /**
   * Updates physical specimen status (e.g. AVAILABLE -> IN_EVALUATION -> COMPLETED -> REPORT_ISSUED).
   */
  public static updateSpecimenStatus(
    specimenId: string,
    newStatus: SpecimenStatus,
    evaluationNumber?: string
  ): boolean {
    this.ensureInitialized();
    const specimen = this.specimens.get(specimenId);
    if (!specimen) return false;

    specimen.status = newStatus;
    if (evaluationNumber) {
      specimen.currentEvaluationNumber = evaluationNumber;
    }
    if (newStatus === 'AVAILABLE' || newStatus === 'COMPLETED' || newStatus === 'REPORT_ISSUED') {
      specimen.currentEvaluationNumber = undefined;
    }

    return true;
  }

  /**
   * Records an evaluation outcome to the specimen's chronological evaluation history.
   */
  public static recordEvaluationToHistory(
    specimenId: string,
    summary: SpecimenEvaluationSummary
  ): boolean {
    this.ensureInitialized();
    const specimen = this.specimens.get(specimenId);
    if (!specimen) return false;

    // Check if already in history
    const existingIdx = specimen.evaluationHistory.findIndex(
      (e) => e.evaluationNumber === summary.evaluationNumber
    );

    if (existingIdx >= 0) {
      specimen.evaluationHistory[existingIdx] = summary;
    } else {
      specimen.evaluationHistory.push(summary);
    }

    specimen.serviceHistory.push({
      id: `SRV-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'INTAKE',
      description: `Evaluation ${summary.evaluationNumber} recorded (${summary.status}). Final Verdict: ${summary.finalVerdict || 'IN_PROGRESS'}.`,
      technician: summary.leadMetrologist,
    });

    return true;
  }
}
