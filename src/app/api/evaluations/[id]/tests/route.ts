import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OimlMetrologyEngine, PartialRangeDef } from '@/lib/metrology/engine';
import { LoadDirection, ComplianceStatus } from '@prisma/client';
import Decimal from 'decimal.js';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/evaluations/[id]/tests
 * Records or updates observation records for a given test run.
 * Executes server-side deterministic metrology engine (turning-point, MPE resolver, compliance).
 */
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = await req.json();

    const {
      testRunId,
      testCode,
      observations,
      zeroDatum_E0 = 0,
      accuracyClass = 'CLASS_III',
      verificationInterval_e = 0.001,
      partialRanges,
    } = body;

    if (!Array.isArray(observations) || observations.length === 0) {
      return NextResponse.json(
        { success: false, error: 'observations array is required and must not be empty' },
        { status: 400 }
      );
    }

    // 1. Process each observation through OimlMetrologyEngine
    const processedObservations = observations.map((obs: any, index: number) => {
      const stepIndex = obs.stepIndex ?? index + 1;
      const seriesIndex = obs.seriesIndex ?? 1;
      const direction: LoadDirection = obs.direction === 'DECREASING' ? 'DECREASING' : 'INCREASING';

      const calculated = OimlMetrologyEngine.processObservation({
        load: obs.nominalLoad_L ?? obs.load,
        indication: obs.indicatedValue_I ?? obs.indication,
        subWeight_dL: obs.turningPointLoad_dL ?? obs.subWeight_dL ?? 0,
        zeroDatum_E0: obs.zeroDatum_E0 ?? zeroDatum_E0,
        accuracyClass,
        e: obs.applicable_e ?? verificationInterval_e,
        partialRanges: partialRanges as PartialRangeDef[],
      });

      return {
        seriesIndex,
        stepIndex,
        direction,
        nominalLoad_L: calculated.load_L.toNumber(),
        indicatedValue_I: calculated.indication_I.toNumber(),
        turningPointLoad_dL: calculated.subWeight_dL.toNumber(),
        calculated_P: calculated.calculated_P.toNumber(),
        error_E: calculated.error_E.toNumber(),
        zeroError_E0: calculated.zeroDatum_E0.toNumber(),
        correctedError_Ec: calculated.correctedError_Ec.toNumber(),
        applicableMpe: calculated.applicable_mpe.toNumber(),
        complianceResult: (calculated.isCompliant ? 'PASS' : 'FAIL') as ComplianceStatus,
        remarks: obs.remarks || null,
        isZeroCheck: Boolean(obs.isZeroCheck || calculated.load_L.isZero()),
      };
    });

    const isAllCompliant = processedObservations.every((o) => o.complianceResult === 'PASS');

    // 2. Persist to database if database connection is available
    let persistedCount = 0;
    try {
      const evaluation = await prisma.typeEvaluation.findFirst({
        where: { OR: [{ id }, { evaluationNumber: id }] },
      });

      if (evaluation) {
        // Resolve test run
        let targetRun = testRunId
          ? await prisma.evaluationTestRun.findUnique({ where: { id: testRunId } })
          : null;

        if (!targetRun && testCode) {
          const testDef = await prisma.testDefinition.findUnique({ where: { testCode } });
          if (testDef) {
            targetRun = await prisma.evaluationTestRun.findUnique({
              where: {
                evaluationId_testDefinitionId: {
                  evaluationId: evaluation.id,
                  testDefinitionId: testDef.id,
                },
              },
            });
          }
        }

        if (targetRun) {
          await prisma.$transaction(async (tx) => {
            // Delete existing observations for this run to replace with updated batch
            await tx.observationPoint.deleteMany({
              where: { testRunId: targetRun!.id },
            });

            // Create new calculated observations
            for (const p of processedObservations) {
              await tx.observationPoint.create({
                data: {
                  testRunId: targetRun!.id,
                  seriesIndex: p.seriesIndex,
                  stepIndex: p.stepIndex,
                  direction: p.direction,
                  nominalLoad_L: new Decimal(p.nominalLoad_L),
                  indicatedValue_I: new Decimal(p.indicatedValue_I),
                  turningPointLoad_dL: new Decimal(p.turningPointLoad_dL),
                  calculated_P: new Decimal(p.calculated_P),
                  error_E: new Decimal(p.error_E),
                  zeroError_E0: new Decimal(p.zeroError_E0),
                  correctedError_Ec: new Decimal(p.correctedError_Ec),
                  applicableMpe: new Decimal(p.applicableMpe),
                  complianceResult: p.complianceResult,
                  remarks: p.remarks,
                  isZeroCheck: p.isZeroCheck,
                },
              });
              persistedCount++;
            }

            // Update test run status
            await tx.evaluationTestRun.update({
              where: { id: targetRun!.id },
              data: {
                status: isAllCompliant ? 'PASS' : 'FAIL',
                completedAt: new Date(),
              },
            });
          });
        }
      }
    } catch (dbErr) {
      console.warn('Database persistence skipped (development fallback):', (dbErr as Error).message);
    }

    return NextResponse.json({
      success: true,
      persistedToDatabase: persistedCount > 0,
      totalObservations: processedObservations.length,
      allCompliant: isAllCompliant,
      runStatus: isAllCompliant ? 'PASS' : 'FAIL',
      observations: processedObservations,
    });
  } catch (error) {
    console.error('Error in /api/evaluations/[id]/tests:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
