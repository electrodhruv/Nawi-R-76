/**
 * Evaluation Register & Operations Service for NAWI-R76
 *
 * Implements the central laboratory work queue, dynamic 'Assigned to Me' filtering,
 * timeline activity logging, readiness checks, and state-driven Next Action computation.
 */

import { ReferenceStandardsService } from '@/services/repository/reference-standards-service';
import { IssuesFindingsService } from './issues-findings-service';

export type EvaluationWorkflowStatus =
  | 'IN_TESTING'
  | 'PENDING_REVIEW'
  | 'CORRECTION_REQUIRED'
  | 'READY_FOR_FINALIZATION'
  | 'FINALIZED';

export type OverallResultType = 'PASS' | 'FAIL' | 'PENDING';

export interface TimelineEvent {
  id: string;
  eventName: string;
  timestamp: string;
  actor: string;
  details?: string;
  category?: 'CREATION' | 'TEST' | 'EVIDENCE' | 'REVIEW' | 'FINDING' | 'REPORT';
}

export interface ReadinessCheckItem {
  id: string;
  label: string;
  isSatisfied: boolean;
  blockerMessage?: string;
  actionLabel?: string;
  actionStep?: 1 | 2 | 3 | 4 | 5 | 6;
}

export interface ReadinessCheckResult {
  isReady: boolean;
  checks: ReadinessCheckItem[];
  blockers: string[];
}

export interface NextActionInfo {
  status: EvaluationWorkflowStatus;
  nextAction: string;
  blockers: string[];
  recommendedStep: 1 | 2 | 3 | 4 | 5 | 6;
}

export interface EvaluationRecord {
  id: string;
  evaluationNumber: string;
  specimenId: string;
  modelName: string;
  tradeName?: string;
  manufacturer: string;
  serialNumber: string;
  accuracyClass: string;
  maxCapacity: number;
  verificationInterval_e: number;
  primaryUnit: string;
  status: EvaluationWorkflowStatus;
  assignedOperator: string;
  createdDate: string;
  lastUpdated: string;
  overallResult: OverallResultType;
  configurationRevision: number;
  applicableTestsCount: number;
  completedTestsCount: number;
  assignedStandardIds: string[];
  timeline: TimelineEvent[];
  reportNumber?: string;
}

export class EvaluationRegisterService {
  private static evaluations: EvaluationRecord[] = [
    {
      id: 'eval-0104',
      evaluationNumber: 'RRSL-2026-TE-0104',
      specimenId: 'SPEC-01',
      modelName: 'Precision-Bench-B6',
      tradeName: 'High-Resolution Laboratory Bench Scale',
      manufacturer: 'Apex Metrology Instruments Ltd',
      serialNumber: 'SN-BS-26001',
      accuracyClass: 'Class II',
      maxCapacity: 6.0,
      verificationInterval_e: 0.001,
      primaryUnit: 'kg',
      status: 'PENDING_REVIEW',
      assignedOperator: 'Amit Verma (Testing Officer)',
      createdDate: '2026-09-27T08:30:00Z',
      lastUpdated: '2026-09-29T11:45:00Z',
      overallResult: 'PASS',
      configurationRevision: 1,
      applicableTestsCount: 13,
      completedTestsCount: 13,
      assignedStandardIds: ['STD-WT-001', 'STD-ENV-001'],
      timeline: [
        {
          id: 'tl-104-01',
          eventName: 'Evaluation Created',
          timestamp: '2026-09-27T08:30:00Z',
          actor: 'Amit Verma',
          details: 'Evaluation dossier initialized for Model Precision-Bench-B6',
          category: 'CREATION',
        },
        {
          id: 'tl-104-02',
          eventName: 'Instrument Registered',
          timestamp: '2026-09-27T09:15:00Z',
          actor: 'R. Sharma (Intake Officer)',
          details: 'Physical specimen SN-BS-26001 received into laboratory custody (Pan Bench)',
          category: 'CREATION',
        },
        {
          id: 'tl-104-03',
          eventName: 'Test Setup Configured',
          timestamp: '2026-09-27T10:00:00Z',
          actor: 'Amit Verma',
          details: 'Ambient conditions recorded (20.5 °C, 50.0% RH, 1013.2 hPa). Calibrated Class E2 weights assigned.',
          category: 'TEST',
        },
        {
          id: 'tl-104-04',
          eventName: '13-Test Matrix Completed',
          timestamp: '2026-09-27T14:30:00Z',
          actor: 'Amit Verma',
          details: 'All 13 statutory OIML R 76-1 tests executed with 0 failing points. Intrinsic error within Table 3 limits.',
          category: 'TEST',
        },
        {
          id: 'tl-104-05',
          eventName: 'Evidence & Readouts Attached',
          timestamp: '2026-09-27T15:00:00Z',
          actor: 'Amit Verma',
          details: 'Tamper-evident photographic evidence bound with SHA-256 digests. Automated OCR consistency verified.',
          category: 'EVIDENCE',
        },
        {
          id: 'tl-104-06',
          eventName: 'Submitted for Statutory Peer Review',
          timestamp: '2026-09-28T10:15:00Z',
          actor: 'Amit Verma (Testing Officer)',
          details: 'Dossier submitted to Lead Metrologist Dr. A. Sharma for statutory peer verification and PKI digital signing.',
          category: 'REVIEW',
        },
      ],
    },
    {
      id: 'eval-0105',
      evaluationNumber: 'RRSL-2026-TE-0105',
      specimenId: 'SPEC-07',
      modelName: 'NanoMicro-Class2-A220',
      tradeName: 'Precision Formulation Analytical Balance',
      manufacturer: 'Helios Scientific Balances Ltd',
      serialNumber: 'SN-AB-26007',
      accuracyClass: 'Class II',
      maxCapacity: 0.22,
      verificationInterval_e: 0.00001,
      primaryUnit: 'kg',
      status: 'PENDING_REVIEW',
      assignedOperator: 'M. Verma',
      createdDate: '2026-09-25T09:00:00Z',
      lastUpdated: '2026-09-28T16:20:00Z',
      overallResult: 'PASS',
      configurationRevision: 1,
      applicableTestsCount: 16,
      completedTestsCount: 16,
      assignedStandardIds: ['STD-WT-002', 'STD-ENV-001'],
      timeline: [
        {
          id: 'tl-105-01',
          eventName: 'Evaluation Created',
          timestamp: '2026-09-25T09:00:00Z',
          actor: 'M. Verma',
          details: 'Evaluation initialized for Class II analytical balance',
          category: 'CREATION',
        },
        {
          id: 'tl-105-02',
          eventName: 'Review Requested',
          timestamp: '2026-09-28T16:20:00Z',
          actor: 'M. Verma',
          details: 'All 16 applicable tests completed with zero failing points. Submitted for peer review.',
          category: 'REVIEW',
        },
      ],
    },
    {
      id: 'eval-0098',
      evaluationNumber: 'RRSL-2026-TE-0098',
      specimenId: 'SPEC-04',
      modelName: 'TransScale-Truck-60T',
      tradeName: 'Heavy Commercial Electronic Weighbridge',
      manufacturer: 'HeavyDuty Weighbridges Ltd',
      serialNumber: 'SN-WB-26004',
      accuracyClass: 'Class III',
      maxCapacity: 60000.0,
      verificationInterval_e: 20.0,
      primaryUnit: 'kg',
      status: 'FINALIZED',
      assignedOperator: 'Dr. A. Sharma',
      createdDate: '2026-09-20T08:00:00Z',
      lastUpdated: '2026-09-25T09:10:00Z',
      overallResult: 'PASS',
      configurationRevision: 1,
      applicableTestsCount: 14,
      completedTestsCount: 14,
      assignedStandardIds: ['STD-WT-003'],
      reportNumber: 'RRSL-2026-TE-0098',
      timeline: [
        {
          id: 'tl-098-01',
          eventName: 'Evaluation Created',
          timestamp: '2026-09-20T08:00:00Z',
          actor: 'Dr. A. Sharma',
          details: 'Weighbridge evaluation initiated',
          category: 'CREATION',
        },
        {
          id: 'tl-098-02',
          eventName: 'Evaluation Finalized',
          timestamp: '2026-09-25T09:00:00Z',
          actor: 'Dr. K. Patel (Director)',
          details: 'Final approval issued. Certificate RRSL-2026-TE-0098 generated with SHA-256 digest.',
          category: 'REPORT',
        },
      ],
    },
    {
      id: 'eval-0106',
      evaluationNumber: 'RRSL-2026-TE-0106',
      specimenId: 'SPEC-02',
      modelName: 'InduWeigh-Platform-P150',
      tradeName: 'Medium Capacity Industrial Platform Scale',
      manufacturer: 'Bharat Metrology Systems Pvt Ltd',
      serialNumber: 'SN-PS-26002',
      accuracyClass: 'Class III',
      maxCapacity: 150.0,
      verificationInterval_e: 0.05,
      primaryUnit: 'kg',
      status: 'IN_TESTING',
      assignedOperator: 'Dr. A. Sharma',
      createdDate: '2026-09-26T10:00:00Z',
      lastUpdated: '2026-09-28T15:00:00Z',
      overallResult: 'PENDING',
      configurationRevision: 1,
      applicableTestsCount: 17,
      completedTestsCount: 12,
      assignedStandardIds: ['STD-WT-001'],
      timeline: [
        {
          id: 'tl-106-01',
          eventName: 'Evaluation Created',
          timestamp: '2026-09-26T10:00:00Z',
          actor: 'Dr. A. Sharma',
          details: 'Industrial platform scale evaluation initialized',
          category: 'CREATION',
        },
        {
          id: 'tl-106-02',
          eventName: 'Testing in Progress',
          timestamp: '2026-09-28T15:00:00Z',
          actor: 'Dr. A. Sharma',
          details: 'Platform repeatability and load eccentricity tests in progress',
          category: 'TEST',
        },
      ],
    },
  ];

  private static listeners = new Set<() => void>();
  private static isStorageInitialized = false;

  private static ensureStorageLoaded(): void {
    if (this.isStorageInitialized) return;
    this.isStorageInitialized = true;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem('nawi_r76_evaluations_registry');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.evaluations = parsed;
          }
        }
      } catch (err) {
        console.warn('Failed to load evaluation registry from storage:', err);
      }
    }
  }

  private static persistStorage(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem('nawi_r76_evaluations_registry', JSON.stringify(this.evaluations));
      } catch (err) {
        console.warn('Failed to persist evaluation registry to storage:', err);
      }
    }
    this.notify();
  }

  public static subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notify(): void {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        console.error('Error in EvaluationRegisterService listener:', e);
      }
    });
  }

  public static getAllEvaluations(): EvaluationRecord[] {
    this.ensureStorageLoaded();
    return [...this.evaluations];
  }

  public static getEvaluationByNumber(evalNum: string): EvaluationRecord | null {
    this.ensureStorageLoaded();
    return this.evaluations.find((e) => e.evaluationNumber === evalNum) || null;
  }

  public static getEvaluationsForSpecimen(serialNumber: string): EvaluationRecord[] {
    this.ensureStorageLoaded();
    return this.evaluations.filter((e) => e.serialNumber === serialNumber);
  }

  public static upsertEvaluation(record: EvaluationRecord): void {
    this.ensureStorageLoaded();
    const idx = this.evaluations.findIndex(
      (e) => e.evaluationNumber === record.evaluationNumber || e.id === record.id
    );

    if (idx >= 0) {
      const existing = this.evaluations[idx];
      this.evaluations[idx] = {
        ...existing,
        ...record,
        lastUpdated: new Date().toISOString(),
      };
    } else {
      this.evaluations.unshift({
        ...record,
        lastUpdated: new Date().toISOString(),
      });
    }

    // Sync with synthetic instruments if in browser
    if (typeof window !== 'undefined') {
      import('@/lib/synthetic-instruments').then(({ SYNTHETIC_INSTRUMENTS }) => {
        const inst = SYNTHETIC_INSTRUMENTS.find((i) => i.serialNumber === record.serialNumber);
        if (inst) {
          if (record.status === 'FINALIZED') {
            inst.status = 'REPORT_ISSUED';
          } else if (record.status === 'PENDING_REVIEW' || record.status === 'READY_FOR_FINALIZATION') {
            inst.status = 'PENDING_REVIEW';
          } else if (record.status === 'IN_TESTING') {
            inst.status = 'IN_EVALUATION';
          }
        }
      }).catch(() => {});
    }

    this.persistStorage();
  }

  public static updateEvaluationStatus(
    evaluationNumber: string,
    status: EvaluationWorkflowStatus,
    overallResult?: OverallResultType
  ): void {
    this.ensureStorageLoaded();
    const evalRecord = this.evaluations.find((e) => e.evaluationNumber === evaluationNumber);
    if (!evalRecord) return;

    evalRecord.status = status;
    if (overallResult) evalRecord.overallResult = overallResult;
    evalRecord.lastUpdated = new Date().toISOString();

    if (typeof window !== 'undefined') {
      import('@/lib/synthetic-instruments').then(({ SYNTHETIC_INSTRUMENTS }) => {
        const inst = SYNTHETIC_INSTRUMENTS.find((i) => i.serialNumber === evalRecord.serialNumber);
        if (inst) {
          if (status === 'FINALIZED') {
            inst.status = 'REPORT_ISSUED';
          } else if (status === 'PENDING_REVIEW' || status === 'READY_FOR_FINALIZATION') {
            inst.status = 'PENDING_REVIEW';
          } else if (status === 'IN_TESTING' || status === 'CORRECTION_REQUIRED') {
            inst.status = 'IN_EVALUATION';
          }
        }
      }).catch(() => {});
    }

    this.persistStorage();
  }

  public static addTimelineEvent(evaluationNumber: string, event: Omit<TimelineEvent, 'id' | 'timestamp'>): void {
    this.ensureStorageLoaded();
    const evaluation = this.evaluations.find((e) => e.evaluationNumber === evaluationNumber);
    if (!evaluation) return;

    evaluation.timeline.unshift({
      ...event,
      id: `tl-${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
    });
    evaluation.lastUpdated = new Date().toISOString();
    this.persistStorage();
  }

  /**
   * Section 11 & 12: Lightweight Evaluation Readiness Check.
   * Evaluates if an evaluation has required prerequisite data before testing starts.
   */
  public static checkReadiness(evaluation: EvaluationRecord): ReadinessCheckResult {
    const checks: ReadinessCheckItem[] = [];
    const blockers: string[] = [];

    // 1. Instrument Identity
    const hasIdentity = Boolean(evaluation.modelName && evaluation.manufacturer);
    checks.push({
      id: 'chk-identity',
      label: 'Instrument Identity',
      isSatisfied: hasIdentity,
      blockerMessage: hasIdentity ? undefined : 'Manufacturer and Model name missing',
      actionLabel: 'Complete Instrument Data',
      actionStep: 1,
    });
    if (!hasIdentity) blockers.push('Manufacturer and Model name missing');

    // 2. Serial Number
    const hasSerial = Boolean(evaluation.serialNumber && evaluation.serialNumber.trim().length > 0);
    checks.push({
      id: 'chk-serial',
      label: 'Serial Number',
      isSatisfied: hasSerial,
      blockerMessage: hasSerial ? undefined : 'Physical specimen serial number is required',
      actionLabel: 'Assign Serial Number',
      actionStep: 1,
    });
    if (!hasSerial) blockers.push('Physical specimen serial number is required');

    // 3. Configuration Snapshot
    const hasConfig = Boolean(evaluation.configurationRevision && evaluation.configurationRevision > 0);
    checks.push({
      id: 'chk-config',
      label: 'Configuration Snapshot',
      isSatisfied: hasConfig,
      blockerMessage: hasConfig ? undefined : 'Active configuration revision snapshot missing',
      actionLabel: 'Verify Configuration',
      actionStep: 1,
    });
    if (!hasConfig) blockers.push('Active configuration revision snapshot missing');

    // 4. Required Information (Metrological ranges)
    const hasMetrology = Boolean(evaluation.maxCapacity > 0 && evaluation.verificationInterval_e > 0);
    checks.push({
      id: 'chk-metrology',
      label: 'Required Information',
      isSatisfied: hasMetrology,
      blockerMessage: hasMetrology ? undefined : 'Max capacity and scale interval (e) must be specified',
      actionLabel: 'Review Metrological Parameters',
      actionStep: 1,
    });
    if (!hasMetrology) blockers.push('Max capacity and scale interval (e) must be specified');

    // 5. Reference Standards Validity
    let standardsValid = true;
    let standardBlocker: string | undefined;

    if (!evaluation.assignedStandardIds || evaluation.assignedStandardIds.length === 0) {
      standardsValid = false;
      standardBlocker = 'No calibrated reference standard assigned to evaluation';
    } else {
      for (const stdId of evaluation.assignedStandardIds) {
        const std = ReferenceStandardsService.getStandardById(stdId);
        if (!std || std.status === 'EXPIRED') {
          standardsValid = false;
          standardBlocker = `Reference standard ${stdId} is expired (${std?.validUntil ?? 'unknown'})`;
          break;
        }
      }
    }

    checks.push({
      id: 'chk-standards',
      label: 'Reference Standards',
      isSatisfied: standardsValid,
      blockerMessage: standardBlocker,
      actionLabel: 'Select Valid Reference Standard',
      actionStep: 2,
    });
    if (!standardsValid && standardBlocker) blockers.push(standardBlocker);

    // 6. Assigned Operator
    const hasOperator = Boolean(evaluation.assignedOperator && evaluation.assignedOperator.trim().length > 0);
    checks.push({
      id: 'chk-operator',
      label: 'Assigned Operator',
      isSatisfied: hasOperator,
      blockerMessage: hasOperator ? undefined : 'Accredited testing officer must be assigned',
      actionLabel: 'Assign Operator',
      actionStep: 2,
    });
    if (!hasOperator) blockers.push('Accredited testing officer must be assigned');

    // 7. Test Plan
    const hasPlan = evaluation.applicableTestsCount > 0;
    checks.push({
      id: 'chk-plan',
      label: 'Test Plan',
      isSatisfied: hasPlan,
      blockerMessage: hasPlan ? undefined : 'Test plan contains no scheduled tests',
      actionLabel: 'Configure Test Plan',
      actionStep: 3,
    });
    if (!hasPlan) blockers.push('Test plan contains no scheduled tests');

    return {
      isReady: blockers.length === 0,
      checks,
      blockers,
    };
  }

  /**
   * Section 13: Computes dynamic Next Action based on actual evaluation state.
   */
  public static computeNextAction(evaluation: EvaluationRecord): NextActionInfo {
    const blockers: string[] = [];

    // Check blocking findings first
    const blockingFindingsCount = IssuesFindingsService.getBlockingFindingsCount(evaluation.evaluationNumber);
    if (blockingFindingsCount > 0) {
      blockers.push(`${blockingFindingsCount} blocking finding(s) require technical resolution`);
      return {
        status: evaluation.status,
        nextAction: `Resolve ${blockingFindingsCount} blocking finding(s) on test workspace`,
        blockers,
        recommendedStep: 4,
      };
    }

    switch (evaluation.status) {
      case 'IN_TESTING': {
        const remaining = evaluation.applicableTestsCount - evaluation.completedTestsCount;
        if (remaining > 0) {
          return {
            status: evaluation.status,
            nextAction: `Complete ${remaining} remaining test(s) (A.4.10 Repeatability scheduled)`,
            blockers: [],
            recommendedStep: 4,
          };
        }
        return {
          status: evaluation.status,
          nextAction: 'Submit completed test suite for peer technical review',
          blockers: [],
          recommendedStep: 5,
        };
      }
      case 'CORRECTION_REQUIRED': {
        return {
          status: evaluation.status,
          nextAction: 'Perform requested retest and upload corrected observations',
          blockers: ['Metrological non-linearity at Max capacity must be addressed'],
          recommendedStep: 4,
        };
      }
      case 'PENDING_REVIEW': {
        return {
          status: evaluation.status,
          nextAction: 'Conduct technical peer review on Section 11/12 test observations',
          blockers: [],
          recommendedStep: 5,
        };
      }
      case 'READY_FOR_FINALIZATION': {
        return {
          status: evaluation.status,
          nextAction: 'Generate and sign official OIML R 76-2 Test Report',
          blockers: [],
          recommendedStep: 6,
        };
      }
      case 'FINALIZED': {
        return {
          status: evaluation.status,
          nextAction: 'Evaluation complete. Certificate and public QR verification are active.',
          blockers: [],
          recommendedStep: 6,
        };
      }
      default:
        return {
          status: evaluation.status,
          nextAction: 'Open evaluation workspace to continue',
          blockers: [],
          recommendedStep: 4,
        };
    }
  }
}
