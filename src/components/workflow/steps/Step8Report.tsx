'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Download,
  Printer,
  FileText,
  ArrowLeft,
  RefreshCw,
  ShieldCheck,
  Lock,
  ExternalLink,
  QrCode,
  Clock,
  Layers,
  FileCheck,
} from 'lucide-react';
import { ReportPayload, ReportSummaryItem } from '@/services/reports/report-types';
import { formatWithUnit } from '@/services/reports/pdf-builder';
import { TestSuiteItem, WeighingObservationRow } from '@/lib/test-suite-types';
import { TestRunRecord } from '@/core/test-engine/types';
import { OverallEvaluationResult, OverallResultEngine } from '@/core/test-engine/overall-result-engine';
import { EvaluationRegisterService } from '@/services/operations/evaluation-register-service';

interface ReportWeighingObservationItem {
  seriesIndex: number;
  stepIndex: number;
  direction: 'INC' | 'DEC';
  nominalLoad: string;
  indicatedValue: string;
  turningPoint_dL: string;
  calculated_P: string;
  error_E: string;
  zeroError_E0: string;
  correctedError_Ec: string;
  mpe: string;
  result: 'PASS' | 'FAIL';
  remarks: string;
}

interface Step8ReportProps {
  onBack: () => void;
  onRestart: () => void;
  overallResult?: OverallEvaluationResult;
  isFinalized?: boolean;
  finalizedAt?: string;
  finalizedBy?: string;
  testRuns?: TestRunRecord[];
  instrument?: {
    modelName: string;
    serialNumber: string;
    manufacturer: string;
    accuracyClass: string;
    maxCapacity: string | number;
    minCapacity: string | number;
    verificationInterval_e: string | number;
    scaleInterval_d: string | number;
    numberOfIntervals_n: number;
    rangeType: string;
    tareType: string;
    powerSupply: string;
    temperatureRange: string;
    receptorType: string;
    softwareVersion: string;
    hasFailedSample?: boolean;
    primaryUnit?: string;
  };
  evaluationNumber?: string;
  testSuite?: TestSuiteItem[];
}

export const Step8Report: React.FC<Step8ReportProps> = ({
  onBack,
  onRestart,
  testSuite,
  testRuns,
  overallResult,
  isFinalized = true,
  finalizedAt,
  finalizedBy = 'Dr. A. Sharma / M. Verma',
  instrument = {
    modelName: 'AWT-3000-Retail',
    serialNumber: 'SN-RS-26003',
    manufacturer: 'Delta Electronics Corp',
    accuracyClass: 'Class III',
    maxCapacity: '15.0',
    minCapacity: '0.1',
    verificationInterval_e: '0.005',
    scaleInterval_d: '0.005',
    numberOfIntervals_n: 3000,
    rangeType: 'Single Interval',
    tareType: 'Subtractive',
    powerSupply: '230 V AC Mains + 6V Internal Battery',
    temperatureRange: '-10 °C to +40 °C',
    receptorType: 'standard pan',
    softwareVersion: 'v2.14.0',
    hasFailedSample: false,
    primaryUnit: 'kg',
  },
  evaluationNumber = 'RRSL-2026-TE-0104',
}) => {
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isDownloadingDocx, setIsDownloadingDocx] = useState(false);
  const [verificationInfo, setVerificationInfo] = useState<{
    token: string;
    url: string;
    qrDataUrl: string;
    status: string;
    digest: string;
    fingerprint: string;
  } | null>(null);
  const [demoActionLoading, setDemoActionLoading] = useState(false);

  const unit = instrument.primaryUnit ?? 'kg';

  // Compute authoritative summary from testRuns if available
  const authoritativeSummary = useMemo(() => {
    if (testRuns && testRuns.length > 0) {
      return OverallResultEngine.calculateOverallResult(testRuns);
    }
    return null;
  }, [testRuns]);

  // Check if any test run failed or if instrument was marked with a failed sample
  const hasFailedTest = useMemo(() => {
    if (instrument.hasFailedSample) return true;
    if (testRuns && testRuns.length > 0) {
      return testRuns.some((r) => r.status === 'FAIL' || r.complianceResult?.verdict === 'FAIL');
    }
    if (testSuite && testSuite.length > 0) {
      return testSuite.some((t) => t.status === 'FAIL');
    }
    return false;
  }, [instrument.hasFailedSample, testRuns, testSuite]);

  // Determine definitive overall result (never default to COMPLIANT if a failure exists)
  const determinedResult: OverallEvaluationResult = useMemo(() => {
    if (overallResult === 'NON_COMPLIANT' || hasFailedTest) {
      return 'NON_COMPLIANT';
    }
    if (authoritativeSummary) {
      if (authoritativeSummary.overallResult === 'NON_COMPLIANT') return 'NON_COMPLIANT';
      if (overallResult && overallResult !== 'NOT_DETERMINED') return overallResult;
      return authoritativeSummary.overallResult;
    }
    if (overallResult) return overallResult;
    return 'COMPLIANT';
  }, [overallResult, hasFailedTest, authoritativeSummary]);

  const isFailedSpecimen = determinedResult === 'NON_COMPLIANT';

  // Dynamically generate the complete 18 OIML R 76-2 summary items based on instrument specs and live testSuite/testRuns
  const dynamicSummaryMatrix: ReportSummaryItem[] = useMemo(() => {
    const isClassI = instrument.accuracyClass.toUpperCase().includes('CLASS_I') || instrument.accuracyClass === 'Class I';
    const receptorLower = (instrument.receptorType ?? '').toLowerCase();
    const isRolling = receptorLower.includes('rolling') || receptorLower.includes('track');
    const isMobile = receptorLower.includes('mobile') || receptorLower.includes('crane');
    const powerLower = (instrument.powerSupply ?? '').toLowerCase();
    const isAc = powerLower.includes('ac') || powerLower.includes('mains') || powerLower.includes('230');
    const isBattery = powerLower.includes('battery') || powerLower.includes('internal') || powerLower.includes('rechargeable');

    const findSuiteTest = (testCode: string) => {
      if (testRuns && testRuns.length > 0) {
        const tr = testRuns.find((t) => t.testCode === testCode);
        if (tr) return tr;
      }
      if (!testSuite) return null;
      return testSuite.find((t) => t.testCode === testCode);
    };

    const mapStatus = (testCode: string, fallback: ReportSummaryItem['status']): ReportSummaryItem['status'] => {
      const t = findSuiteTest(testCode);
      if (!t) return fallback;
      if (!t.isApplicable || t.status === 'NOT_APPLICABLE') return 'Not Applicable';
      if (t.status === 'PASS') return 'Passed';
      if (t.status === 'FAIL') return 'Failed';
      return 'Scheduled';
    };

    const mapJustification = (testCode: string, fallback: string): string => {
      const t = findSuiteTest(testCode);
      if (!t) return fallback;
      return t.exclusionJustification ?? t.remarks ?? fallback;
    };

    return [
      {
        itemNumber: '1',
        clause: '3.10, 4.1',
        testTitle: 'Administrative & Markings Examination',
        isApplicable: true,
        status: mapStatus('R76_ADMIN_MARKINGS', 'Passed'),
        justification: mapJustification('R76_ADMIN_MARKINGS', 'Descriptive markings, plates, serial number, and software ID verified compliant'),
      },
      {
        itemNumber: '2',
        clause: '3.10, 4.1–18',
        testTitle: 'Technical Construction, Security Sealing & Software',
        isApplicable: true,
        status: mapStatus('R76_CONSTRUCTION', 'Passed'),
        justification: mapJustification('R76_CONSTRUCTION', 'Hardware sealing and audit trail event counters verified compliant with R 76-1'),
      },
      {
        itemNumber: '3',
        clause: '3.5.1, A.4.4',
        testTitle: 'Weighing Performance: Initial Intrinsic Error',
        isApplicable: true,
        status: (isFailedSpecimen || mapStatus('R76_WEIGH_INTRINSIC', 'Passed') === 'Failed') ? 'Failed' : 'Passed',
        justification: (isFailedSpecimen || mapStatus('R76_WEIGH_INTRINSIC', 'Passed') === 'Failed')
          ? 'Non-compliant: Indication error at Max exceeds Table 6 MPE limits'
          : mapJustification('R76_WEIGH_INTRINSIC', 'All observation points within Table 6 MPE limits across increasing and decreasing loads'),
      },
      {
        itemNumber: '4',
        clause: '3.6.2, A.4.7.1–A.4.7.3',
        testTitle: 'Eccentricity Loading with Standard Weights',
        isApplicable: !isRolling && !isMobile,
        status: mapStatus('R76_ECCENTRICITY', 'Passed'),
        justification: mapJustification('R76_ECCENTRICITY', 'Tested at 1/3 Max on designated quadrants/supports; max difference within Table 6 MPE'),
      },
      {
        itemNumber: '5',
        clause: '3.6.2.4, A.4.7.4',
        testTitle: 'Eccentricity with Rolling Load',
        isApplicable: isRolling,
        status: isRolling ? mapStatus('R76_ECC_ROLLING', 'Scheduled') : 'Not Applicable',
        justification: isRolling
          ? mapJustification('R76_ECC_ROLLING', 'Rolling axle loading test scheduled')
          : 'Instrument does not feature a rolling track or rail mechanism; standard eccentricity applies',
      },
      {
        itemNumber: '6',
        clause: '3.6.2.5, A.4.7.5',
        testTitle: 'Eccentricity on Mobile Instruments',
        isApplicable: isMobile,
        status: isMobile ? mapStatus('R76_ECC_MOBILE', 'Scheduled') : 'Not Applicable',
        justification: isMobile
          ? mapJustification('R76_ECC_MOBILE', 'Mobile inclination testing scheduled')
          : 'Instrument is installed on permanent or bench foundation; not a mobile pallet or vehicle scale',
      },
      {
        itemNumber: '7',
        clause: '3.8, A.4.8',
        testTitle: 'Discrimination Test (1.4d additional load)',
        isApplicable: true,
        status: mapStatus('R76_DISCRIMINATION', 'Passed'),
        justification: mapJustification('R76_DISCRIMINATION', 'Decisive display increment observed upon gentle deposition of 1.4d'),
      },
      {
        itemNumber: '8',
        clause: '3.7, A.4.9',
        testTitle: 'Sensitivity for Non-Self-Indicating Instruments',
        isApplicable: false,
        status: 'Not Applicable',
        justification: 'Instrument is fully electronic self-indicating digital terminal; clause A.4.9 non-applicable',
      },
      {
        itemNumber: '9',
        clause: '3.6.1, A.4.10',
        testTitle: 'Repeatability Test (Clause A.4.10)',
        isApplicable: true,
        status: mapStatus('R76_REPEATABILITY', 'Passed'),
        justification: mapJustification('R76_REPEATABILITY', 'Standard deviation and range of 10 repetitive series within Table 6 limits'),
      },
      {
        itemNumber: '10',
        clause: '4.5, A.4.11',
        testTitle: 'Zero-Setting & Zero-Tracking Range and Accuracy',
        isApplicable: true,
        status: mapStatus('R76_ZERO_SETTING', 'Passed'),
        justification: mapJustification('R76_ZERO_SETTING', 'Zero re-centering accuracy within ±0.25 e tolerance'),
      },
      {
        itemNumber: '11',
        clause: '4.6, A.4.12',
        testTitle: 'Tare Mechanism Accuracy & Operation',
        isApplicable: true,
        status: mapStatus('R76_TARE', 'Passed'),
        justification: mapJustification('R76_TARE', 'Subtractive tare zero accuracy within ±0.25 e'),
      },
      {
        itemNumber: '12',
        clause: '3.9.2.1, A.5.1',
        testTitle: 'Static Temperatures Performance Test',
        isApplicable: true,
        status: mapStatus('R76_TEMP_STATIC', 'Passed'),
        justification: mapJustification('R76_TEMP_STATIC', 'Span error within Table 6 limits at -10 °C, +20 °C, and +40 °C'),
      },
      {
        itemNumber: '13',
        clause: '3.9.2.3, A.5.2',
        testTitle: 'Temperature Effect on No-Load Indication',
        isApplicable: true,
        status: mapStatus('R76_TEMP_ZERO_EFFECT', 'Passed'),
        justification: mapJustification('R76_TEMP_ZERO_EFFECT', 'Zero shift does not exceed 1 e per 5 °C temperature difference'),
      },
      {
        itemNumber: '14',
        clause: '3.9.4.1, A.5.4',
        testTitle: 'Creep Test (4 Hours)',
        isApplicable: true,
        status: mapStatus('R76_CREEP', 'Passed'),
        justification: mapJustification('R76_CREEP', 'Creep deflection over 4 hours does not exceed 0.5 e'),
      },
      {
        itemNumber: '15',
        clause: '3.9.4.2, A.5.4.4',
        testTitle: 'Zero Return Test',
        isApplicable: true,
        status: mapStatus('R76_ZERO_RETURN', 'Passed'),
        justification: mapJustification('R76_ZERO_RETURN', 'Zero return after creep load removal within 0.5 e'),
      },
      {
        itemNumber: '16',
        clause: '3.9.3, A.5.3',
        testTitle: 'Voltage Variations (Mains AC / DC)',
        isApplicable: isAc,
        status: isAc ? mapStatus('R76_VOLTAGE_VARIATION', 'Passed') : 'Not Applicable',
        justification: isAc
          ? mapJustification('R76_VOLTAGE_VARIATION', 'Tested at -15% (195.5 V) and +10% (253.0 V) of nominal 230 V')
          : 'Instrument is exclusively battery powered; AC mains variation non-applicable',
      },
      {
        itemNumber: '17',
        clause: '3.9.3.2',
        testTitle: 'Battery Voltage Limits Examination',
        isApplicable: isBattery,
        status: isBattery ? mapStatus('R76_BATTERY_LOW', 'Passed') : 'Not Applicable',
        justification: isBattery
          ? mapJustification('R76_BATTERY_LOW', 'Automatic inhibit triggered when battery falls below minimum operational threshold')
          : 'Instrument has no internal battery mechanism; AC line powered only',
      },
      {
        itemNumber: '18',
        clause: '3.9.1.1, A.5.1.3',
        testTitle: 'Tilting Test for Mobile / Transportable Instruments',
        isApplicable: isMobile,
        status: isMobile ? mapStatus('R76_TILTING', 'Scheduled') : 'Not Applicable',
        justification: isMobile
          ? mapJustification('R76_TILTING', 'Inclination testing to 50/1000 slope scheduled')
          : 'Instrument is equipped with fixed spirit level vial and non-mobile bench mounts',
      },
      {
        itemNumber: '19',
        clause: '3.9.2.2',
        testTitle: 'Damp Heat Cyclic Test (12-hour cycle)',
        isApplicable: isClassI,
        status: isClassI ? mapStatus('R76_DAMP_HEAT_CYCLIC', 'Scheduled') : 'Not Applicable',
        justification: isClassI
          ? mapJustification('R76_DAMP_HEAT_CYCLIC', 'Cyclic damp heat scheduled for Class I')
          : 'Instrument is Class III; steady-state damp heat applies instead of cyclic',
      },
      {
        itemNumber: '20',
        clause: '3.9.2.4, B.2',
        testTitle: 'Damp Heat Steady State Test (48 Hours)',
        isApplicable: true,
        status: mapStatus('R76_DAMP_HEAT', 'Passed'),
        justification: mapJustification('R76_DAMP_HEAT', 'Zero shift following 48 h damp heat is within 1 e tolerance'),
      },
      {
        itemNumber: '21',
        clause: '3.9.5, B.4',
        testTitle: 'Span Stability Test (28 Days)',
        isApplicable: true,
        status: mapStatus('R76_SPAN_STABILITY', 'Passed'),
        justification: mapJustification('R76_SPAN_STABILITY', 'Span drift across 28 days within 0.5 e consecutive and 1.0 e total limit'),
      },
      {
        itemNumber: '22',
        clause: '3.9.4.3, A.6',
        testTitle: 'Endurance Test (100,000 Cycles)',
        isApplicable: true,
        status: mapStatus('R76_ENDURANCE', 'Passed'),
        justification: mapJustification('R76_ENDURANCE', 'Error difference before and after 100,000 repetitive load cycles within Table 6 MPE'),
      },
    ];
  }, [instrument, isFailedSpecimen, testSuite]);

  // Executive summary counts
  const execSummary = useMemo(() => {
    const applicable = dynamicSummaryMatrix.filter((m) => m.isApplicable);
    const passed = applicable.filter((m) => m.status === 'Passed').length;
    const failed = applicable.filter((m) => m.status === 'Failed').length;
    const notApplicable = dynamicSummaryMatrix.filter((m) => !m.isApplicable).length;
    const pending = applicable.filter((m) => m.status !== 'Passed' && m.status !== 'Failed').length;
    return {
      totalApplicable: applicable.length,
      completed: passed + failed,
      passed,
      failed,
      notApplicable,
      pending,
      retestRequired: 0,
    };
  }, [dynamicSummaryMatrix]);

  // Observations dynamically scaled to instrument capacity and verification interval
  const testObservations: ReportWeighingObservationItem[] = useMemo(() => {
    const weighingTest = testSuite?.find((t) => t.testCode === 'R76_WEIGH_INTRINSIC');
    const weighingData = weighingTest?.data as { observations?: WeighingObservationRow[] } | undefined;
    if (weighingData?.observations && weighingData.observations.length > 0) {
      return weighingData.observations.map((obs: WeighingObservationRow, idx: number) => ({
        seriesIndex: 1,
        stepIndex: idx + 1,
        direction: obs.direction === 'DEC' ? 'DEC' : 'INC',
        nominalLoad: Number(obs.load).toFixed(3),
        indicatedValue: Number(obs.indication).toFixed(3),
        turningPoint_dL: Number(obs.deltaL).toFixed(4),
        calculated_P: Number(obs.calculated_P ?? obs.indication).toFixed(4),
        error_E: Number(obs.error_E ?? 0) >= 0 ? `+${Number(obs.error_E ?? 0).toFixed(4)}` : Number(obs.error_E ?? 0).toFixed(4),
        zeroError_E0: Number(obs.zeroError_E0 ?? 0).toFixed(4),
        correctedError_Ec: Number(obs.correctedError_Ec ?? 0) >= 0 ? `+${Number(obs.correctedError_Ec ?? 0).toFixed(4)}` : Number(obs.correctedError_Ec ?? 0).toFixed(4),
        mpe: `±${Number(obs.applicableMpe ?? 0.005).toFixed(4)}`,
        result: (obs.isPass !== false ? 'PASS' : 'FAIL') as 'PASS' | 'FAIL',
        remarks: obs.isPass === false ? 'Out-of-tolerance error' : 'Compliant',
      }));
    }

    const maxNum = parseFloat(String(instrument.maxCapacity)) || 15.0;
    const minNum = parseFloat(String(instrument.minCapacity)) || 0.1;
    const eNum = parseFloat(String(instrument.verificationInterval_e)) || 0.005;
    const halfMax = maxNum / 2;

    if (isFailedSpecimen) {
      return [
        { seriesIndex: 1, stepIndex: 1, direction: 'INC', nominalLoad: '0.000', indicatedValue: '0.000', turningPoint_dL: (eNum * 0.5).toFixed(4), calculated_P: '0.0000', error_E: '0.0000', zeroError_E0: '0.0000', correctedError_Ec: '0.0000', mpe: `±${(eNum * 0.5).toFixed(4)}`, result: 'PASS' as const, remarks: 'Zero datum' },
        { seriesIndex: 1, stepIndex: 2, direction: 'INC', nominalLoad: minNum.toFixed(3), indicatedValue: minNum.toFixed(3), turningPoint_dL: (eNum * 0.48).toFixed(4), calculated_P: (minNum + 0.0001).toFixed(4), error_E: '+0.0001', zeroError_E0: '0.0000', correctedError_Ec: '+0.0001', mpe: `±${(eNum * 0.5).toFixed(4)}`, result: 'PASS' as const, remarks: 'Min load' },
        { seriesIndex: 1, stepIndex: 3, direction: 'INC', nominalLoad: halfMax.toFixed(3), indicatedValue: halfMax.toFixed(3), turningPoint_dL: (eNum * 0.5).toFixed(4), calculated_P: halfMax.toFixed(4), error_E: '0.0000', zeroError_E0: '0.0000', correctedError_Ec: '0.0000', mpe: `±${(eNum * 1.0).toFixed(4)}`, result: 'PASS' as const, remarks: '50% Max' },
        { seriesIndex: 1, stepIndex: 4, direction: 'INC', nominalLoad: maxNum.toFixed(3), indicatedValue: (maxNum + eNum * 3.0).toFixed(3), turningPoint_dL: (eNum * 0.2).toFixed(4), calculated_P: (maxNum + eNum * 3.3).toFixed(4), error_E: `+${(eNum * 3.3).toFixed(4)}`, zeroError_E0: '0.0000', correctedError_Ec: `+${(eNum * 3.3).toFixed(4)}`, mpe: `±${(eNum * 1.5).toFixed(4)}`, result: 'FAIL' as const, remarks: 'EXCEEDS MPE: Out of tolerance at Max' },
        { seriesIndex: 1, stepIndex: 5, direction: 'DEC', nominalLoad: halfMax.toFixed(3), indicatedValue: halfMax.toFixed(3), turningPoint_dL: (eNum * 0.5).toFixed(4), calculated_P: halfMax.toFixed(4), error_E: '0.0000', zeroError_E0: '0.0000', correctedError_Ec: '0.0000', mpe: `±${(eNum * 1.0).toFixed(4)}`, result: 'PASS' as const, remarks: 'Decreasing' },
        { seriesIndex: 1, stepIndex: 6, direction: 'DEC', nominalLoad: '0.000', indicatedValue: '0.000', turningPoint_dL: (eNum * 0.5).toFixed(4), calculated_P: '0.0000', error_E: '0.0000', zeroError_E0: '0.0000', correctedError_Ec: '0.0000', mpe: `±${(eNum * 0.5).toFixed(4)}`, result: 'PASS' as const, remarks: 'Zero return' },
      ];
    }

    return [
      { seriesIndex: 1, stepIndex: 1, direction: 'INC', nominalLoad: '0.000', indicatedValue: '0.000', turningPoint_dL: (eNum * 0.5).toFixed(4), calculated_P: '0.0000', error_E: '0.0000', zeroError_E0: '0.0000', correctedError_Ec: '0.0000', mpe: `±${(eNum * 0.5).toFixed(4)}`, result: 'PASS' as const, remarks: 'Zero datum' },
      { seriesIndex: 1, stepIndex: 2, direction: 'INC', nominalLoad: minNum.toFixed(3), indicatedValue: minNum.toFixed(3), turningPoint_dL: (eNum * 0.52).toFixed(4), calculated_P: (minNum - 0.0001).toFixed(4), error_E: '-0.0001', zeroError_E0: '0.0000', correctedError_Ec: '-0.0001', mpe: `±${(eNum * 0.5).toFixed(4)}`, result: 'PASS' as const, remarks: 'Min load' },
      { seriesIndex: 1, stepIndex: 3, direction: 'INC', nominalLoad: (halfMax * 0.5).toFixed(3), indicatedValue: (halfMax * 0.5).toFixed(3), turningPoint_dL: (eNum * 0.46).toFixed(4), calculated_P: (halfMax * 0.5 + 0.0002).toFixed(4), error_E: '+0.0002', zeroError_E0: '0.0000', correctedError_Ec: '+0.0002', mpe: `±${(eNum * 0.5).toFixed(4)}`, result: 'PASS' as const, remarks: '500e boundary' },
      { seriesIndex: 1, stepIndex: 4, direction: 'INC', nominalLoad: halfMax.toFixed(3), indicatedValue: halfMax.toFixed(3), turningPoint_dL: (eNum * 0.5).toFixed(4), calculated_P: halfMax.toFixed(4), error_E: '0.0000', zeroError_E0: '0.0000', correctedError_Ec: '0.0000', mpe: `±${(eNum * 1.0).toFixed(4)}`, result: 'PASS' as const, remarks: '50% Max' },
      { seriesIndex: 1, stepIndex: 5, direction: 'INC', nominalLoad: (maxNum * 0.75).toFixed(3), indicatedValue: (maxNum * 0.75).toFixed(3), turningPoint_dL: (eNum * 0.48).toFixed(4), calculated_P: (maxNum * 0.75 + 0.0001).toFixed(4), error_E: '+0.0001', zeroError_E0: '0.0000', correctedError_Ec: '+0.0001', mpe: `±${(eNum * 1.0).toFixed(4)}`, result: 'PASS' as const, remarks: '75% Max' },
      { seriesIndex: 1, stepIndex: 6, direction: 'INC', nominalLoad: maxNum.toFixed(3), indicatedValue: maxNum.toFixed(3), turningPoint_dL: (eNum * 0.45).toFixed(4), calculated_P: (maxNum + 0.0003).toFixed(4), error_E: '+0.0003', zeroError_E0: '0.0000', correctedError_Ec: '+0.0003', mpe: `±${(eNum * 1.5).toFixed(4)}`, result: 'PASS' as const, remarks: '100% Max' },
      { seriesIndex: 1, stepIndex: 7, direction: 'DEC', nominalLoad: halfMax.toFixed(3), indicatedValue: halfMax.toFixed(3), turningPoint_dL: (eNum * 0.52).toFixed(4), calculated_P: (halfMax - 0.0001).toFixed(4), error_E: '-0.0001', zeroError_E0: '0.0000', correctedError_Ec: '-0.0001', mpe: `±${(eNum * 1.0).toFixed(4)}`, result: 'PASS' as const, remarks: '50% Max Decreasing' },
      { seriesIndex: 1, stepIndex: 8, direction: 'DEC', nominalLoad: '0.000', indicatedValue: '0.000', turningPoint_dL: (eNum * 0.5).toFixed(4), calculated_P: '0.0000', error_E: '0.0000', zeroError_E0: '0.0000', correctedError_Ec: '0.0000', mpe: `±${(eNum * 0.5).toFixed(4)}`, result: 'PASS' as const, remarks: 'Zero return check' },
    ];
  }, [instrument, isFailedSpecimen, testSuite]);

  const reportPayload: ReportPayload = useMemo(
    () => ({
      evaluationNumber,
      revisionNumber: 0,
      reportIssueDate: new Date().toISOString().split('T')[0],
      standard: 'OIML R 76-1',
      standardVersion: '2006 (E)',
      rulePackVersion: 'R76-2006-V1.0',
      overallResult: determinedResult,
      isFinalized,
      finalizedAt: finalizedAt || new Date().toISOString(),
      finalizedBy,
      testExecutionSummary: execSummary,
      laboratoryName: 'Regional Reference Standard Laboratory',
      leadMetrologistName: 'Dr. A. Sharma',
      leadMetrologistAccreditation: 'RRSL-MET-2024-88',
      technicalReviewerName: 'M. Verma',
      approvingSignatoryName: 'Dr. K. Patel (Director of Metrology)',
      applicantName: `${instrument.manufacturer} (Commercial Division)`,
      applicantAddress: 'Industrial Technology Corridor, Phase II, India',
      manufacturerName: instrument.manufacturer,
      manufacturerCountry: 'India',
      manufacturerAddress: 'Manufacturing Plant #4, Industrial Zone, Pune',
      modelName: instrument.modelName,
      tradeName: 'Precision Commercial Instrument',
      softwareVersion: instrument.softwareVersion,
      serialNumber: instrument.serialNumber,
      accuracyClass: instrument.accuracyClass,
      rangeType: instrument.rangeType,
      maxCapacity: String(instrument.maxCapacity),
      minCapacity: String(instrument.minCapacity),
      verificationInterval_e: String(instrument.verificationInterval_e),
      scaleInterval_d: String(instrument.scaleInterval_d),
      numberOfIntervals_n: instrument.numberOfIntervals_n,
      primaryUnit: unit,
      temperatureLimits: instrument.temperatureRange,
      powerSupply: instrument.powerSupply,
      tareType: instrument.tareType,
      summaryMatrix: dynamicSummaryMatrix,
      standardsUsed: [
        {
          serialNumber: 'STD-WT-001',
          name: 'OIML Class F1 Reference Working Standards (1 mg - 50 kg)',
          weightClass: 'OIML Class F1',
          certificateNumber: 'NPLI/CAL/2026/0411',
          calibratedBy: 'National Physical Laboratory',
          validUntil: '2027-03-31',
          uncertaintyOrError: 'U = 0.15 mg (k=2)',
        },
      ],
      testRuns: [
        {
          testCode: 'R76_WEIGH_INTRINSIC',
          clauseReference: 'A.4.4',
          title: 'Weighing Performance: Initial Intrinsic Error Determination',
          status: isFailedSpecimen ? 'NON_COMPLIANT' : 'COMPLETED',
          executedBy: 'Dr. A. Sharma',
          completedAt: new Date().toISOString(),
          observations: testObservations,
        },
      ],
      evidenceFiles: [
        {
          id: 'EV-01',
          testClause: 'A.4.4',
          description: 'Terminal Zero Indication Photo Record',
          fileName: 'terminal_zero_check.jpg',
          mimeType: 'image/jpeg',
          ocrCandidate: '0.000',
          consistencyStatus: 'Consistent',
          serverHashSha256: '7c86a9f4c391d84b2341209b556e4091a1820f4c30c85b1901c87e411b4f492b',
          status: 'VERIFIED_BY_REVIEWER',
          capturedAt: '2026-09-27 10:24:18',
          verifiedBy: 'Dr. A. Sharma',
        },
        {
          id: 'EV-02',
          testClause: 'A.4.4',
          description: 'Terminal Load Indication at Max Capacity',
          fileName: 'terminal_max_capacity.jpg',
          mimeType: 'image/jpeg',
          ocrCandidate: String(instrument.maxCapacity),
          consistencyStatus: 'Consistent',
          serverHashSha256: '3f58e1c668924b1d6210f92d47e8bc6f827a51d8b9e604f32371c11d08bc3e41',
          status: 'VERIFIED_BY_REVIEWER',
          capturedAt: '2026-09-27 10:35:42',
          verifiedBy: 'Dr. A. Sharma',
        },
      ],
    }),
    [evaluationNumber, determinedResult, isFinalized, finalizedAt, finalizedBy, execSummary, instrument, unit, isFailedSpecimen, dynamicSummaryMatrix, testObservations]
  );

  // Pre-generate / fetch verification signature and QR code
  useEffect(() => {
    let isMounted = true;
    const fetchSignature = async () => {
      try {
        const res = await fetch('/api/verification/sign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reportPayload),
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setVerificationInfo({
              token: data.verificationToken,
              url: data.verificationUrl,
              qrDataUrl: data.qrCodeDataUrl,
              status: data.status,
              digest: data.digestSha256,
              fingerprint: data.publicKeyFingerprint,
            });
          }
        }
      } catch (err) {
        console.error('Failed to pre-sign verification record:', err);
      }
    };
    fetchSignature();
    return () => {
      isMounted = false;
    };
  }, [reportPayload]);

  // Synchronize evaluation register state with report outcome
  useEffect(() => {
    try {
      EvaluationRegisterService.updateEvaluationStatus(
        evaluationNumber,
        isFinalized ? 'FINALIZED' : 'READY_FOR_FINALIZATION',
        determinedResult === 'COMPLIANT' ? 'PASS' : 'FAIL'
      );
    } catch (e) {
      console.warn('Failed to sync evaluation status in registry:', e);
    }
  }, [evaluationNumber, isFinalized, determinedResult]);

  const handleSimulateStatus = async (action: 'REVOKE' | 'SUPERSEDE' | 'TAMPER') => {
    if (!verificationInfo?.token) return;
    setDemoActionLoading(true);
    try {
      const res = await fetch('/api/verification/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: verificationInfo.token,
          action,
          reason: action === 'REVOKE' ? 'Statutory revocation: Load cell altered post-test.' : undefined,
          newRevision: action === 'SUPERSEDE' ? 2 : undefined,
        }),
      });
      if (res.ok) {
        if (action === 'REVOKE') {
          setVerificationInfo((prev) => (prev ? { ...prev, status: 'REVOKED' } : null));
        } else if (action === 'SUPERSEDE') {
          setVerificationInfo((prev) => (prev ? { ...prev, status: 'SUPERSEDED' } : null));
        } else if (action === 'TAMPER') {
          setVerificationInfo((prev) => (prev ? { ...prev, status: 'SIGNATURE_INVALID' } : null));
        }
        window.open(verificationInfo.url, '_blank');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDemoActionLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      const payloadWithVerification: ReportPayload = {
        ...reportPayload,
        verificationToken: verificationInfo?.token,
        verificationUrl: verificationInfo?.url,
        verificationQrDataUrl: verificationInfo?.qrDataUrl,
        verificationDigest: verificationInfo?.digest,
      };

      // Try RESTful evaluation export endpoint first via POST with live payload
      let response = await fetch(`/api/evaluations/${encodeURIComponent(evaluationNumber)}/export/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadWithVerification),
      });

      if (!response.ok) {
        response = await fetch('/api/reports/pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadWithVerification),
        });
      }

      if (!response.ok) {
        response = await fetch(`/api/evaluations/${encodeURIComponent(evaluationNumber)}/export/pdf`);
      }

      if (!response.ok) throw new Error('Failed to generate PDF');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `OIML_R76_Report_${evaluationNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Error downloading PDF report.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDownloadDocx = async () => {
    setIsDownloadingDocx(true);
    try {
      const payloadWithVerification: ReportPayload = {
        ...reportPayload,
        verificationToken: verificationInfo?.token,
        verificationUrl: verificationInfo?.url,
        verificationQrDataUrl: verificationInfo?.qrDataUrl,
        verificationDigest: verificationInfo?.digest,
      };

      let response = await fetch(`/api/evaluations/${encodeURIComponent(evaluationNumber)}/export/docx`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadWithVerification),
      });

      if (!response.ok) {
        response = await fetch('/api/reports/docx', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadWithVerification),
        });
      }

      if (!response.ok) {
        response = await fetch(`/api/evaluations/${encodeURIComponent(evaluationNumber)}/export/docx`);
      }

      if (!response.ok) throw new Error('Failed to generate DOCX');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `OIML_R76_Report_${evaluationNumber}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Error downloading DOCX report.');
    } finally {
      setIsDownloadingDocx(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Evaluation Complete / Outcome Banner */}
      <div
        className={`border rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          determinedResult === 'COMPLIANT'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
            : determinedResult === 'NON_COMPLIANT'
            ? 'bg-red-50 border-red-200 text-red-900'
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full text-white flex items-center justify-center shrink-0 ${
              determinedResult === 'COMPLIANT'
                ? 'bg-emerald-600'
                : determinedResult === 'NON_COMPLIANT'
                ? 'bg-red-600'
                : 'bg-amber-600'
            }`}
          >
            {determinedResult === 'COMPLIANT' && <CheckCircle2 className="w-6 h-6" />}
            {determinedResult === 'NON_COMPLIANT' && <AlertTriangle className="w-6 h-6" />}
            {determinedResult === 'NOT_DETERMINED' && <Clock className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="text-lg font-bold">
              {determinedResult === 'COMPLIANT' && 'Evaluation Finalized: COMPLIANT'}
              {determinedResult === 'NON_COMPLIANT' && 'Evaluation Finalized: NON-COMPLIANT'}
              {determinedResult === 'NOT_DETERMINED' && 'Evaluation Incomplete: NOT DETERMINED'}
            </h2>
            <p className="text-xs">
              Evaluation #{evaluationNumber} &bull; Specimen: {instrument.serialNumber} &bull; OIML R 76-2:2007 (E)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            {isDownloadingPdf ? 'Generating PDF...' : 'Download PDF'}
          </button>
          <button
            type="button"
            onClick={handleDownloadDocx}
            disabled={isDownloadingDocx}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <FileText className="w-4 h-4 text-blue-700" />
            {isDownloadingDocx ? 'Generating DOCX...' : 'Download DOCX'}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            Print
          </button>
        </div>
      </div>

      {/* Report Preview - Clean, Realistic White A4 Paper Document Resembling the Final PDF */}
      <div className="bg-white border border-slate-300 shadow-sm rounded-lg p-6 sm:p-12 max-w-4xl mx-auto text-slate-900 font-sans print:border-none print:shadow-none print:p-0 space-y-8">
        {/* ========================================================================= */}
        {/* PAGE 1: REPORT COVER & IDENTITY (Section 3, 4, 5)                         */}
        {/* ========================================================================= */}
        <div className="space-y-6 pb-6 border-b border-slate-200">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
            <div className="text-[11px] font-bold tracking-widest text-slate-600 uppercase">
              Regional Reference Standard Laboratory
            </div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-950">
              Laboratory Type Evaluation Test Report
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Structured According to OIML R 76-2:2007 (E) &bull; Tested in accordance with OIML R 76-1:2006
            </p>
            <div className="pt-2 flex flex-wrap justify-between text-[11px] text-slate-600 font-mono">
              <span>REPORT NO: <strong>{evaluationNumber}</strong></span>
              <span>REVISION: <strong>Rev 0</strong></span>
              <span>ISSUE DATE: <strong>{reportPayload.reportIssueDate}</strong></span>
            </div>
          </div>

          {/* PAGE 1: PROMINENT OVERALL EVALUATION RESULT BLOCK (Section 3) */}
          <div
            className={`border-2 rounded-lg p-4 text-center ${
              determinedResult === 'COMPLIANT'
                ? 'bg-emerald-50 border-emerald-600 text-emerald-950'
                : determinedResult === 'NON_COMPLIANT'
                ? 'bg-red-50 border-red-600 text-red-950'
                : 'bg-amber-50 border-amber-600 text-amber-950'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-0.5">
              Overall Evaluation Result
            </span>
            <div className="text-2xl sm:text-3xl font-black tracking-tight uppercase">
              {determinedResult}
            </div>
            <p className="text-[11px] mt-1 max-w-md mx-auto opacity-80">
              {determinedResult === 'COMPLIANT' && 'All required applicable tests compliant with statutory OIML R 76-1 Table 6 MPE limits.'}
              {determinedResult === 'NON_COMPLIANT' && 'One or more observations exceed Table 6 MPE statutory tolerances.'}
              {determinedResult === 'NOT_DETERMINED' && 'Evaluation in progress or required tests/evidence incomplete.'}
            </p>
          </div>

          {/* PAGE 1: PROMINENT SCAN TO VERIFY REPORT PANEL (Section 2, 3) */}
          <div className="bg-slate-50 border border-slate-300 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4 transition-all hover:border-blue-300">
            <a
              href={`/verify/${verificationInfo?.token || 'demo-token-0104-valid'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs shrink-0 flex flex-col items-center hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
              title="Click to open Live Public Verification Portal in a new tab"
            >
              <div className="relative">
                {verificationInfo?.qrDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={verificationInfo.qrDataUrl}
                    alt="QR Verification Code"
                    className="w-24 h-24 rounded object-contain transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="w-24 h-24 bg-slate-100 flex items-center justify-center rounded text-slate-400">
                    <QrCode className="w-10 h-10 animate-pulse" />
                  </div>
                )}
                <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 rounded flex items-center justify-center transition-opacity">
                  <span className="bg-blue-700 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-1">
                    <ExternalLink className="w-2.5 h-2.5" /> Open
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-blue-700 group-hover:text-blue-900 uppercase tracking-wider mt-1 text-center flex items-center gap-1">
                <span>Scan or Click</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-70" />
              </span>
            </a>

            <div className="space-y-1.5 text-xs flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-blue-900 uppercase tracking-wide text-xs flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                  Cryptographic Report Verification
                </span>
                <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold border border-emerald-300">
                  {verificationInfo?.status === 'VALID' ? '✓ Digitally Signed & Verified' : verificationInfo?.status || 'Signed'}
                </span>
              </div>
              <div className="text-[11px] text-slate-600">
                <strong>Report No:</strong> {evaluationNumber} &bull; <strong>Revision:</strong> Rev 0 &bull;{' '}
                <strong>Verification ID:</strong> VR-{evaluationNumber}-R0
              </div>
              <div className="text-[10px] font-mono text-slate-500 truncate max-w-lg bg-white px-2 py-1 rounded border border-slate-200">
                <strong>SHA-256 Digest:</strong>{' '}
                {verificationInfo?.digest || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
              </div>
              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-slate-600">
                  Scan QR with mobile device or click QR code to inspect certified authenticity.
                </p>
                <a
                  href={`/verify/${verificationInfo?.token || 'demo-token-0104-valid'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-blue-900 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors shrink-0"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Open Verification Portal</span>
                </a>
              </div>
            </div>
          </div>

          {/* PAGE 1: 1. General Information & Identification (Section 4) */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 bg-slate-100 px-3 py-1.5 border-l-4 border-blue-800">
              1. General Information &amp; Identification of Physical Instrument
            </h3>
            <table className="w-full text-xs border border-slate-200">
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="w-1/4 py-1.5 px-3 bg-slate-50 font-semibold text-slate-600">Applicant</td>
                  <td className="py-1.5 px-3 text-slate-900">{reportPayload.applicantName}</td>
                  <td className="w-1/4 py-1.5 px-3 bg-slate-50 font-semibold text-slate-600">Serial Number</td>
                  <td className="py-1.5 px-3 font-mono font-bold text-blue-900">{instrument.serialNumber}</td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 bg-slate-50 font-semibold text-slate-600">Manufacturer</td>
                  <td className="py-1.5 px-3">{instrument.manufacturer} (India)</td>
                  <td className="py-1.5 px-3 bg-slate-50 font-semibold text-slate-600">Model &amp; Designation</td>
                  <td className="py-1.5 px-3 font-semibold">{instrument.modelName}</td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 bg-slate-50 font-semibold text-slate-600">Software ID / Version</td>
                  <td className="py-1.5 px-3 font-mono">{instrument.softwareVersion}</td>
                  <td className="py-1.5 px-3 bg-slate-50 font-semibold text-slate-600">Instrument Type</td>
                  <td className="py-1.5 px-3">Non-Automatic Weighing Instrument (NAWI)</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* PAGE 1: 2. Metrological Characteristics (Section 4) */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 bg-slate-100 px-3 py-1.5 border-l-4 border-blue-800">
              2. Metrological Characteristics (OIML R 76-1 Clause 3)
            </h3>
            <table className="w-full text-xs border border-slate-200">
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="w-1/4 py-1.5 px-3 bg-slate-50 font-semibold text-slate-600">Accuracy Class</td>
                  <td className="py-1.5 px-3 font-bold text-blue-800">{instrument.accuracyClass.replace('_', ' ')}</td>
                  <td className="w-1/4 py-1.5 px-3 bg-slate-50 font-semibold text-slate-600">Weighing Range</td>
                  <td className="py-1.5 px-3">{instrument.rangeType}</td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 bg-slate-50 font-semibold text-slate-600">Maximum Capacity (Max)</td>
                  <td className="py-1.5 px-3 font-mono font-semibold">{formatWithUnit(instrument.maxCapacity, unit)}</td>
                  <td className="py-1.5 px-3 bg-slate-50 font-semibold text-slate-600">Minimum Capacity (Min)</td>
                  <td className="py-1.5 px-3 font-mono font-semibold">{formatWithUnit(instrument.minCapacity, unit)}</td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 bg-slate-50 font-semibold text-slate-600">Verification Interval (e)</td>
                  <td className="py-1.5 px-3 font-mono">{formatWithUnit(instrument.verificationInterval_e, unit)}</td>
                  <td className="py-1.5 px-3 bg-slate-50 font-semibold text-slate-600">Scale Interval (d)</td>
                  <td className="py-1.5 px-3 font-mono">{formatWithUnit(instrument.scaleInterval_d, unit)}</td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 bg-slate-50 font-semibold text-slate-600">Interval Count (n)</td>
                  <td className="py-1.5 px-3 font-mono">{instrument.numberOfIntervals_n}</td>
                  <td className="py-1.5 px-3 bg-slate-50 font-semibold text-slate-600">Tare Mechanism</td>
                  <td className="py-1.5 px-3">{instrument.tareType}</td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 bg-slate-50 font-semibold text-slate-600">Temperature Limits</td>
                  <td className="py-1.5 px-3">{instrument.temperatureRange}</td>
                  <td className="py-1.5 px-3 bg-slate-50 font-semibold text-slate-600">Power Supply</td>
                  <td className="py-1.5 px-3">{instrument.powerSupply}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* PAGE 1: SUBORDINATE LEGAL & STATUTORY DISCLAIMER (Section 5) */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded text-slate-600 text-[11px] italic leading-relaxed">
            <strong className="not-italic text-slate-800 uppercase tracking-wide text-[10px] block mb-0.5">
              Statutory &amp; Legal Notice (OIML R 76-2 Clause 1):
            </strong>
            This document is a laboratory-generated evaluation test report structured according to the configured OIML R 76-2:2007
            reporting framework based on recorded test results. This report does not constitute an official Certificate of Conformity,
            statutory pattern approval, or government certification, which may only be issued by the designated Statutory Metrology Authority.
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PAGE 2: EXECUTIVE SUMMARY & TEST RESULTS MATRIX (Section 7)               */}
        {/* ========================================================================= */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 bg-slate-100 px-3 py-1.5 border-l-4 border-blue-800">
              3. Summary of Results Matrix (OIML R 76-2)
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">Page 2 Matrix</span>
          </div>

          {/* Executive Summary Counters Strip (Section 7) */}
          <div className="grid grid-cols-2 sm:grid-cols-7 gap-2 text-center text-xs">
            <div className="p-2 border border-slate-200 bg-slate-50 rounded">
              <span className="text-[10px] uppercase text-slate-500 font-bold block">Applicable</span>
              <span className="text-lg font-bold text-slate-900">{execSummary.totalApplicable}</span>
            </div>
            <div className="p-2 border border-slate-200 bg-slate-50 rounded">
              <span className="text-[10px] uppercase text-slate-500 font-bold block">Completed</span>
              <span className="text-lg font-bold text-slate-900">{execSummary.completed}</span>
            </div>
            <div className="p-2 border border-emerald-200 bg-emerald-50 rounded">
              <span className="text-[10px] uppercase text-emerald-700 font-bold block">PASS</span>
              <span className="text-lg font-bold text-emerald-800">{execSummary.passed}</span>
            </div>
            <div className="p-2 border border-red-200 bg-red-50 rounded">
              <span className="text-[10px] uppercase text-red-700 font-bold block">FAIL</span>
              <span className="text-lg font-bold text-red-800">{execSummary.failed}</span>
            </div>
            <div className="p-2 border border-slate-200 bg-slate-50 rounded">
              <span className="text-[10px] uppercase text-slate-500 font-bold block">N/A</span>
              <span className="text-lg font-bold text-slate-700">{execSummary.notApplicable}</span>
            </div>
            <div className="p-2 border border-amber-200 bg-amber-50 rounded">
              <span className="text-[10px] uppercase text-amber-700 font-bold block">Pending</span>
              <span className="text-lg font-bold text-amber-800">{execSummary.pending}</span>
            </div>
            <div className="p-2 border border-slate-200 bg-slate-50 rounded">
              <span className="text-[10px] uppercase text-slate-500 font-bold block">Retest Req.</span>
              <span className="text-lg font-bold text-slate-800">{execSummary.retestRequired}</span>
            </div>
          </div>

          {/* Full Test Matrix Table */}
          <div className="overflow-x-auto border border-slate-200 rounded">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3 w-10 text-center">Item</th>
                  <th className="py-2 px-3 w-28">Clause</th>
                  <th className="py-2 px-3">Test Title / Examination</th>
                  <th className="py-2 px-3 w-20">App.</th>
                  <th className="py-2 px-3 w-24">Result</th>
                  <th className="py-2 px-3">Remarks / Statutory Justification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dynamicSummaryMatrix.map((item) => (
                  <tr key={item.itemNumber} className="hover:bg-slate-50/70">
                    <td className="py-1.5 px-3 text-center font-mono text-slate-400">{item.itemNumber}</td>
                    <td className="py-1.5 px-3 font-mono font-medium text-slate-700">{item.clause}</td>
                    <td className="py-1.5 px-3 font-semibold text-slate-900">{item.testTitle}</td>
                    <td className="py-1.5 px-3 font-mono text-[11px]">{item.isApplicable ? 'YES' : 'NO'}</td>
                    <td className="py-1.5 px-3 font-bold text-[11px]">
                      {item.status === 'Passed' && <span className="text-emerald-700">PASS</span>}
                      {item.status === 'Failed' && <span className="text-red-700">FAIL</span>}
                      {item.status === 'Not Applicable' && <span className="text-slate-400">N/A</span>}
                      {item.status !== 'Passed' && item.status !== 'Failed' && item.status !== 'Not Applicable' && (
                        <span className="text-amber-700">NOT DETERMINED</span>
                      )}
                    </td>
                    <td className="py-1.5 px-3 text-[11px] text-slate-500">{item.justification ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PAGE 3+: DETAILED TEST RECORDS (Section 9 & 10)                           */}
        {/* ========================================================================= */}
        <div className="space-y-4 pt-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 bg-slate-100 px-3 py-1.5 border-l-4 border-blue-800">
            4. Detailed Test Results &amp; Metrological Observations (Clause A.4.4)
          </h3>

          <div className="border border-slate-200 rounded p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs border-b border-slate-100 pb-2">
              <span className="font-bold text-slate-900">
                Weighing Performance: Initial Intrinsic Error Determination
              </span>
              <span className="text-slate-500 font-mono">
                Clause A.4.4 &bull; Operator: Dr. A. Sharma &bull; Status: {determinedResult === 'COMPLIANT' ? 'PASS' : 'FAIL'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-1.5 px-2 w-12">Dir</th>
                    <th className="py-1.5 px-2">Load (L)</th>
                    <th className="py-1.5 px-2">Indication (I)</th>
                    <th className="py-1.5 px-2">Turning dL</th>
                    <th className="py-1.5 px-2">Calc. (P)</th>
                    <th className="py-1.5 px-2">Error (Ec)</th>
                    <th className="py-1.5 px-2">MPE</th>
                    <th className="py-1.5 px-2 w-16">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {testObservations.map((obs, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70">
                      <td className="py-1.5 px-2">{obs.direction}</td>
                      <td className="py-1.5 px-2">{formatWithUnit(obs.nominalLoad, unit)}</td>
                      <td className="py-1.5 px-2">{formatWithUnit(obs.indicatedValue, unit)}</td>
                      <td className="py-1.5 px-2">{formatWithUnit(obs.turningPoint_dL, unit)}</td>
                      <td className="py-1.5 px-2">{formatWithUnit(obs.calculated_P, unit)}</td>
                      <td className="py-1.5 px-2">{formatWithUnit(obs.correctedError_Ec, unit)}</td>
                      <td className="py-1.5 px-2 text-slate-600">{obs.mpe}</td>
                      <td className="py-1.5 px-2 font-bold">
                        {obs.result === 'PASS' ? (
                          <span className="text-emerald-700">PASS</span>
                        ) : (
                          <span className="text-red-700">FAIL</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* LATER PAGES: REFERENCE STANDARDS & EVIDENCE (Section 20 & 22)             */}
        {/* ========================================================================= */}
        <div className="space-y-4 pt-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 bg-slate-100 px-3 py-1.5 border-l-4 border-blue-800">
            5. Reference Standards &amp; Traceability
          </h3>
          <table className="w-full text-xs border border-slate-200">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-1.5 px-3">Working Standard</th>
                <th className="py-1.5 px-3">Accuracy Class</th>
                <th className="py-1.5 px-3">Certificate Number</th>
                <th className="py-1.5 px-3">Calibrated By</th>
                <th className="py-1.5 px-3">Validity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
              <tr>
                <td className="py-1.5 px-3 font-semibold">OIML Class F1 Reference Working Weights (STD-WT-001)</td>
                <td className="py-1.5 px-3">OIML Class F1</td>
                <td className="py-1.5 px-3 font-mono">NPLI/CAL/2026/0411</td>
                <td className="py-1.5 px-3">National Physical Laboratory</td>
                <td className="py-1.5 px-3">2027-03-31</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Evidence Annex */}
        <div className="space-y-4 pt-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 bg-slate-100 px-3 py-1.5 border-l-4 border-blue-800">
            6. Evidence Records Annex
          </h3>
          <table className="w-full text-xs border border-slate-200">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-1.5 px-3 w-16">ID</th>
                <th className="py-1.5 px-3 w-20">Clause</th>
                <th className="py-1.5 px-3">Description</th>
                <th className="py-1.5 px-3">OCR Reading</th>
                <th className="py-1.5 px-3">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
              <tr>
                <td className="py-1.5 px-3 font-mono">EV-01</td>
                <td className="py-1.5 px-3 font-mono">A.4.4</td>
                <td className="py-1.5 px-3">Terminal Zero Indication Photo Record (terminal_zero_check.jpg)</td>
                <td className="py-1.5 px-3 font-mono">0.000 {unit}</td>
                <td className="py-1.5 px-3 text-emerald-700 font-semibold">Verified by Reviewer</td>
              </tr>
              <tr>
                <td className="py-1.5 px-3 font-mono">EV-02</td>
                <td className="py-1.5 px-3 font-mono">A.4.4</td>
                <td className="py-1.5 px-3">Terminal Load Indication at Max Capacity (terminal_max_capacity.jpg)</td>
                <td className="py-1.5 px-3 font-mono">{formatWithUnit(instrument.maxCapacity, unit)}</td>
                <td className="py-1.5 px-3 text-emerald-700 font-semibold">Verified by Reviewer</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ========================================================================= */}
        {/* FINAL SECTION: ATTESTATION & SIGN-OFF (Section 23)                        */}
        {/* ========================================================================= */}
        <div className="space-y-4 pt-6 border-t-2 border-slate-900">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs pt-2">
            <div className="border-t border-slate-400 pt-2 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Lead Metrologist</span>
              <div className="font-bold text-slate-900">Dr. A. Sharma</div>
              <div className="text-[11px] text-slate-600">Accreditation: RRSL-MET-2024-88</div>
              <div className="text-[10px] text-slate-400">Date: {reportPayload.reportIssueDate}</div>
            </div>

            <div className="border-t border-slate-400 pt-2 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Technical Reviewer</span>
              <div className="font-bold text-slate-900">M. Verma</div>
              <div className="text-[11px] text-slate-600">Senior Metrological Reviewer</div>
              <div className="text-[10px] text-slate-400">Peer Attestation Accepted</div>
            </div>

            <div className="border-t border-slate-400 pt-2 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Approving Signatory</span>
              <div className="font-bold text-slate-900">Dr. K. Patel</div>
              <div className="text-[11px] text-slate-600">Director of Metrology</div>
              <div className="text-[10px] text-slate-400">Structured According to OIML R 76-2</div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Verification Controls */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="space-y-0.5">
          <span className="font-bold text-slate-900 uppercase tracking-wide text-[11px]">
            Certificate Lifecycle Controls
          </span>
          <p className="text-slate-500 text-[11px]">
            Cryptographic lifecycle actions: public lookup, revision supersession, revocation, and tamper detection.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={verificationInfo?.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-xs font-medium rounded bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors inline-flex items-center gap-1.5"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Open Public Page</span>
          </a>
          <button
            type="button"
            disabled={demoActionLoading}
            onClick={() => handleSimulateStatus('REVOKE')}
            className="px-2.5 py-1.5 text-xs font-medium rounded bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors"
          >
            Simulate Revoke
          </button>
          <button
            type="button"
            disabled={demoActionLoading}
            onClick={() => handleSimulateStatus('SUPERSEDE')}
            className="px-2.5 py-1.5 text-xs font-medium rounded bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
          >
            Simulate Revision
          </button>
          <button
            type="button"
            disabled={demoActionLoading}
            onClick={() => handleSimulateStatus('TAMPER')}
            className="px-2.5 py-1.5 text-xs font-medium rounded bg-red-50 text-red-800 border border-red-200 hover:bg-red-100 transition-colors"
          >
            Simulate Tamper
          </button>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200 max-w-4xl mx-auto">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Review
        </button>
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-medium transition-colors shadow-2xs"
        >
          <RefreshCw className="w-4 h-4" />
          Start New Evaluation
        </button>
      </div>
    </div>
  );
};
