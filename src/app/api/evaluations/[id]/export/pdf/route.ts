import { NextRequest, NextResponse } from 'next/server';
import { compileEvaluationPdf } from '@/lib/reports/compiler';
import { ReportPayload } from '@/services/reports/report-types';
import { EvaluationRegisterService } from '@/services/operations/evaluation-register-service';
import { SYNTHETIC_INSTRUMENTS } from '@/lib/synthetic-instruments';
import { buildCompleteEvaluationSuite } from '@/core/test-engine/record-factory';
import { buildCanonicalReportPayload } from '@/services/verification/canonical-payload';

interface RouteContext {
  params: Promise<{ id: string }>;
}

function extractObservationsForReport(t: any, unit: string = 'kg') {
  const calcVals = t.calculatedValues || {};

  // 1. Processed rows from weighing intrinsic test
  if (Array.isArray(calcVals.processedRows) && calcVals.processedRows.length > 0) {
    return calcVals.processedRows.map((r: any, idx: number) => ({
      seriesIndex: 1,
      stepIndex: r.step ?? (idx + 1),
      direction: r.direction || 'INC',
      nominalLoad: `${Number(r.load ?? 0).toFixed(3)} ${unit}`,
      indicatedValue: `${Number(r.indication ?? 0).toFixed(3)} ${unit}`,
      turningPoint_dL: `${Number(r.deltaL ?? 0).toFixed(4)} ${unit}`,
      calculated_P: `${Number(r.calculated_P ?? r.indication ?? 0).toFixed(4)} ${unit}`,
      error_E: `${Number(r.error_E ?? 0) >= 0 ? '+' : ''}${Number(r.error_E ?? 0).toFixed(4)} ${unit}`,
      zeroError_E0: `${Number(r.zeroError_E0 ?? 0).toFixed(4)} ${unit}`,
      correctedError_Ec: `${Number(r.correctedError_Ec ?? 0) >= 0 ? '+' : ''}${Number(r.correctedError_Ec ?? 0).toFixed(4)} ${unit}`,
      mpe: `±${Number(r.mpe ?? 0).toFixed(4)} ${unit}`,
      result: (r.result === 'PASS' || r.isPass !== false) ? 'PASS' : 'FAIL',
      remarks: r.result === 'FAIL' || r.isPass === false ? 'Exceeds Table 6 MPE' : (idx === 0 ? 'Zero datum' : 'Compliant'),
    }));
  }

  // 2. Observations from eccentricity test
  if (Array.isArray(calcVals.observations) && calcVals.observations.length > 0) {
    return calcVals.observations.map((r: any, idx: number) => ({
      seriesIndex: 1,
      stepIndex: idx + 1,
      direction: 'INC',
      nominalLoad: `${Number(r.load ?? 0).toFixed(3)} ${unit}`,
      indicatedValue: `${Number(r.indication ?? 0).toFixed(3)} ${unit}`,
      turningPoint_dL: `${Number(r.deltaL ?? 0).toFixed(4)} ${unit}`,
      calculated_P: `${Number(r.calculated_P ?? r.indication ?? 0).toFixed(4)} ${unit}`,
      error_E: `${Number(r.error_E ?? 0) >= 0 ? '+' : ''}${Number(r.error_E ?? 0).toFixed(4)} ${unit}`,
      zeroError_E0: '0.0000 ' + unit,
      correctedError_Ec: `${Number(r.diffFromCenter ?? r.error_E ?? 0).toFixed(4)} ${unit}`,
      mpe: `±${Number(r.allowableDiff ?? 0).toFixed(4)} ${unit}`,
      result: (r.isPass !== false) ? 'PASS' : 'FAIL',
      remarks: r.position || (r.isPass ? 'Compliant' : 'Exceeds eccentricity limit'),
    }));
  }

  // 3. Fallback: Parse t.rawObservations with fallback to property names
  if (Array.isArray(t.rawObservations) && t.rawObservations.length > 0) {
    // Check if it's a checklist test (e.g. markings or construction)
    if (t.rawObservations[0]?.requirement) {
      return []; // Checklist tests don't have numerical load-table observations
    }

    return t.rawObservations.map((o: any, idx: number) => {
      const loadVal = o.load ?? o.nominalLoad ?? o.nominalLoad_L ?? o.baseLoad ?? 0;
      const indVal = o.indication ?? o.indicatedValue ?? o.indicatedValue_I ?? o.initialIndication ?? 0;
      const dLVal = o.deltaL ?? o.turningPoint_dL ?? o.turningPointLoad_dL ?? o.additionalLoad ?? 0;
      const pVal = o.calculated_P ?? indVal;
      const errVal = o.error_E ?? (typeof pVal === 'number' && typeof loadVal === 'number' ? pVal - loadVal : 0);
      const ecVal = o.correctedError_Ec ?? errVal;
      const mpeVal = o.mpe ?? o.applicableMpe ?? (o.allowableDiff ?? 0);
      const isPass = (o.result === 'PASS' || o.isPass === true || o.status === 'PASS' || (t.status === 'PASS' && o.result !== 'FAIL'));

      return {
        seriesIndex: o.seriesIndex ?? 1,
        stepIndex: idx + 1,
        direction: (o.direction || 'INC').substring(0, 3).toUpperCase(),
        nominalLoad: typeof loadVal === 'number' ? `${loadVal.toFixed(3)} ${unit}` : String(loadVal),
        indicatedValue: typeof indVal === 'number' ? `${indVal.toFixed(3)} ${unit}` : String(indVal),
        turningPoint_dL: typeof dLVal === 'number' ? `${dLVal.toFixed(4)} ${unit}` : String(dLVal),
        calculated_P: typeof pVal === 'number' ? `${pVal.toFixed(4)} ${unit}` : String(pVal),
        error_E: typeof errVal === 'number' ? `${errVal >= 0 ? '+' : ''}${errVal.toFixed(4)} ${unit}` : String(errVal),
        zeroError_E0: `0.0000 ${unit}`,
        correctedError_Ec: typeof ecVal === 'number' ? `${ecVal >= 0 ? '+' : ''}${ecVal.toFixed(4)} ${unit}` : String(ecVal),
        mpe: typeof mpeVal === 'number' && mpeVal > 0 ? `±${mpeVal.toFixed(4)} ${unit}` : String(mpeVal || '-'),
        result: isPass ? 'PASS' : 'FAIL',
        remarks: o.remarks ?? o.position ?? (isPass ? 'Compliant' : 'Exceeds MPE'),
      };
    });
  }

  return [];
}

/**
 * GET & POST /api/evaluations/[id]/export/pdf
 * Streams canonical vector PDF test report conforming to OIML R 76-2:2007 (E).
 */
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = `${protocol}://${host}`;

    // Synthesize report payload from registered evaluation or defaults
    const evalRecord = EvaluationRegisterService.getEvaluationByNumber(id) || EvaluationRegisterService.getAllEvaluations()[0];
    const instrument = SYNTHETIC_INSTRUMENTS.find((i) => i.serialNumber === evalRecord.serialNumber) || SYNTHETIC_INSTRUMENTS[0];

    const testRuns = buildCompleteEvaluationSuite(
      {
        evaluationNumber: evalRecord.evaluationNumber,
        laboratoryName: 'Regional Reference Standard Laboratory, Ahmedabad',
        operatorName: evalRecord.assignedOperator,
        operatorRole: 'LEAD_METROLOGIST',
        standardVersion: 'OIML R 76-1:2006 (E)',
        instrument,
        environmentalSnapshot: {
          temperatureC: 20.5,
          humidityPercent: 50.0,
          pressureHpa: 1013.2,
          recordedAt: new Date().toISOString(),
        },
        equipmentUsed: [],
      },
      true
    );

    const hasAnyFailure =
      evalRecord.overallResult === 'FAIL' ||
      instrument.hasFailedSample ||
      testRuns.some((t) => t.isApplicable && (t.status !== 'PASS' || t.complianceResult?.verdict === 'FAIL'));

    const overallVerdict: 'COMPLIANT' | 'NON_COMPLIANT' = hasAnyFailure ? 'NON_COMPLIANT' : 'COMPLIANT';

    const payload: ReportPayload = {
      evaluationNumber: evalRecord.evaluationNumber,
      revisionNumber: evalRecord.configurationRevision || 1,
      reportIssueDate: new Date().toISOString().split('T')[0],
      standard: 'OIML R 76-1',
      standardVersion: '2006 (E)',
      rulePackVersion: 'R76-2006-v1',
      overallResult: overallVerdict,
      isFinalized: evalRecord.status === 'FINALIZED',
      laboratoryName: 'Regional Reference Standard Laboratory, Ahmedabad',
      leadMetrologistName: evalRecord.assignedOperator,
      applicantName: evalRecord.manufacturer,
      applicantAddress: 'Industrial Zone, Phase II, Ahmedabad, Gujarat, India',
      manufacturerName: evalRecord.manufacturer,
      manufacturerCountry: 'India',
      manufacturerAddress: 'Industrial Zone, Phase II, Ahmedabad, Gujarat, India',
      modelName: evalRecord.modelName,
      tradeName: evalRecord.tradeName || evalRecord.modelName,
      serialNumber: evalRecord.serialNumber,
      accuracyClass: evalRecord.accuracyClass,
      maxCapacity: String(evalRecord.maxCapacity),
      minCapacity: String(evalRecord.verificationInterval_e * 20),
      verificationInterval_e: String(evalRecord.verificationInterval_e),
      scaleInterval_d: String(evalRecord.verificationInterval_e),
      numberOfIntervals_n: Math.round(evalRecord.maxCapacity / evalRecord.verificationInterval_e),
      rangeType: 'SINGLE',
      primaryUnit: evalRecord.primaryUnit,
      powerSupply: 'Mains 230V AC 50Hz',
      temperatureLimits: '-10 °C to +40 °C',
      tareType: 'Subtractive',
      softwareVersion: 'v2.4.1 (CheckSum: 0x8F4A)',
      summaryMatrix: testRuns.map((t, idx) => ({
        itemNumber: String(idx + 1),
        clause: t.clause,
        testTitle: t.name,
        isApplicable: t.isApplicable,
        status: (!t.isApplicable ? 'Not Applicable' : (t.status !== 'PASS' || t.complianceResult?.verdict === 'FAIL' ? 'Failed' : 'Passed')) as any,
        justification: t.isApplicable ? null : (t.exclusionJustification || 'Not applicable to instrument receptor configuration'),
      })),
      testRuns: testRuns
        .filter((t) => t.isApplicable)
        .map((t) => ({
          testCode: t.testCode,
          clauseReference: t.clause,
          title: t.name,
          status: t.status,
          observations: extractObservationsForReport(t, evalRecord.primaryUnit),
        }))
        .filter((t) => t.observations.length > 0),
      standardsUsed: [
        {
          serialNumber: 'STD-WT-001',
          name: 'Primary Precision Mass Set E2 (1mg - 10kg)',
          weightClass: 'E2',
          certificateNumber: 'NABL-CAL-2026-0891',
          calibratedBy: 'National Physical Laboratory (NPL), New Delhi',
          validUntil: '2027-03-31',
          uncertaintyOrError: 'U <= 0.05 mg (k = 2)',
        },
      ],
      evidenceFiles: [],
    };

    const compiled = await compileEvaluationPdf(payload, baseUrl);

    return new Response(compiled.pdfBytes as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="OIML_R76_Report_${id}.pdf"`,
        'X-Document-Sha256': compiled.documentSha256,
        'X-Verification-Token': compiled.verificationToken,
      },
    });
  } catch (error) {
    console.error('Error generating PDF export for evaluation:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const payload = (await req.json()) as ReportPayload;

    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = `${protocol}://${host}`;

    const compiled = await compileEvaluationPdf(payload, baseUrl);

    return new Response(compiled.pdfBytes as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="OIML_R76_Report_${id}.pdf"`,
        'X-Document-Sha256': compiled.documentSha256,
        'X-Verification-Token': compiled.verificationToken,
      },
    });
  } catch (error) {
    console.error('Error generating PDF export for evaluation:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
