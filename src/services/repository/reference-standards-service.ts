/**
 * Reference Standards Register Service for NAWI-R76
 *
 * Implements centralized traceability management for reference standards,
 * automatic validity date evaluation, expired standard blocking, and
 * seamless auto-population during laboratory testing per OIML R 76-1 Clause 3.7.1.
 */

export type StandardClassType = 'E1' | 'E2' | 'F1' | 'F2' | 'M1' | 'SENSOR' | 'CHAMBER' | 'ELECTRICAL';
export type StandardStatusType = 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' | 'NOT_VERIFIED';

export interface ReferenceStandardRecord {
  standardId: string;
  description: string;
  serialNumber: string;
  standardClass: StandardClassType;
  certificateNumber: string;
  calibrationProvider: string;
  calibrationDate: string;
  validUntil: string;
  uncertainty: string;
  nominalRange?: string;
  location?: string;
}

export class ReferenceStandardsService {
  private static standards: ReferenceStandardRecord[] = [
    {
      standardId: 'STD-WT-001',
      description: 'OIML Class F1 Stainless Steel Mass Set (1 mg to 20 kg)',
      serialNumber: 'SN-STD-F1-2024-015',
      standardClass: 'F1',
      certificateNumber: 'CC-NPLI-2024-8842',
      calibrationProvider: 'National Physical Laboratory of India (NPLI)',
      calibrationDate: '2024-04-10',
      validUntil: '2027-04-09',
      uncertainty: 'U = 0.25 mg (k=2)',
      nominalRange: '1 mg – 20 kg',
      location: 'Primary Metrology Vault (Room 102)',
    },
    {
      standardId: 'STD-WT-002',
      description: 'OIML Class E2 Ultra-Precision Analytical Mass Set (1 mg to 500 g)',
      serialNumber: 'SN-STD-E2-2023-004',
      standardClass: 'E2',
      certificateNumber: 'CC-RRSL-2023-1190',
      calibrationProvider: 'Regional Reference Standard Laboratory, Ahmedabad',
      calibrationDate: '2023-11-15',
      validUntil: '2026-11-14',
      uncertainty: 'U = 0.03 mg (k=2)',
      nominalRange: '1 mg – 500 g',
      location: 'Micro-balance Cleanroom (Room 105)',
    },
    {
      standardId: 'STD-WT-003',
      description: 'OIML Class M1 Cast Iron Working Block Weights (10 kg to 500 kg)',
      serialNumber: 'SN-STD-M1-2024-091',
      standardClass: 'M1',
      certificateNumber: 'CC-LM-2024-4410',
      calibrationProvider: 'State Metrology Calibration Facility',
      calibrationDate: '2024-06-20',
      validUntil: '2027-06-19',
      uncertainty: 'U = 50 mg (k=2)',
      nominalRange: '10 kg – 500 kg',
      location: 'Heavy Industrial Testing Bay (Bay 2)',
    },
    {
      standardId: 'STD-ENV-001',
      description: 'Vaisala PTU300 Combined Digital Barometer & Hygrometer',
      serialNumber: 'SN-VAIS-PTU300-88',
      standardClass: 'SENSOR',
      certificateNumber: 'CC-CAL-ENV-2024-72',
      calibrationProvider: 'Vaisala Accredited Calibration Laboratory',
      calibrationDate: '2024-01-18',
      validUntil: '2026-12-31',
      uncertainty: 'U = 0.15 hPa, 1.2% RH, 0.1 °C',
      nominalRange: '500–1100 hPa, 0–100% RH',
      location: 'Environmental Monitoring Bench (Bench 1)',
    },
    {
      standardId: 'STD-CHM-001',
      description: 'Weiss Technik Climatic Stress Chamber WK11-180',
      serialNumber: 'SN-WT-CHAMBER-2022-04',
      standardClass: 'CHAMBER',
      certificateNumber: 'CC-TUV-2024-901',
      calibrationProvider: 'TUV SUD South Asia Metrology',
      calibrationDate: '2024-07-01',
      validUntil: '2027-06-30',
      uncertainty: 'U = 0.2 °C, 1.5% RH',
      nominalRange: '-40 °C to +180 °C',
      location: 'Environmental Stress Testing Lab',
    },
    {
      standardId: 'STD-EXP-001',
      description: 'Secondary Working Class F2 Mass Set (100 g to 5 kg)',
      serialNumber: 'SN-STD-F2-2022-033',
      standardClass: 'F2',
      certificateNumber: 'CC-LM-2022-0941',
      calibrationProvider: 'Regional Verification Center',
      calibrationDate: '2022-12-01',
      validUntil: '2024-11-30', // Intentionally EXPIRED for validity testing
      uncertainty: 'U = 1.6 mg (k=2)',
      nominalRange: '100 g – 5 kg',
      location: 'Routine Inspection Bench (Storage B)',
    },
  ];

  /**
   * Evaluates the dynamic validity status of a reference standard against current date.
   */
  public static evaluateStatus(validUntilStr: string): StandardStatusType {
    if (!validUntilStr) return 'NOT_VERIFIED';
    const validUntil = new Date(validUntilStr);
    if (isNaN(validUntil.getTime())) return 'NOT_VERIFIED';

    const now = new Date();
    if (validUntil < now) {
      return 'EXPIRED';
    }

    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    if (validUntil.getTime() - now.getTime() < thirtyDaysInMs) {
      return 'EXPIRING_SOON';
    }

    return 'VALID';
  }

  public static getAllStandards(): (ReferenceStandardRecord & { status: StandardStatusType })[] {
    return this.standards.map((std) => ({
      ...std,
      status: this.evaluateStatus(std.validUntil),
    }));
  }

  public static getStandardById(standardId: string): (ReferenceStandardRecord & { status: StandardStatusType }) | null {
    const found = this.standards.find((s) => s.standardId === standardId);
    if (!found) return null;
    return {
      ...found,
      status: this.evaluateStatus(found.validUntil),
    };
  }

  public static isStandardValid(standardId: string): boolean {
    const std = this.getStandardById(standardId);
    if (!std) return false;
    return std.status === 'VALID' || std.status === 'EXPIRING_SOON';
  }

  public static registerStandard(record: ReferenceStandardRecord): ReferenceStandardRecord {
    const existingIndex = this.standards.findIndex((s) => s.standardId === record.standardId);
    if (existingIndex >= 0) {
      this.standards[existingIndex] = record;
    } else {
      this.standards.push(record);
    }
    return record;
  }
}
