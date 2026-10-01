import { NextRequest, NextResponse } from 'next/server';
import { DocxReportBuilder } from '@/services/reports/docx-builder';
import { ReportPayload } from '@/services/reports/report-types';

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as ReportPayload;
    const docxBuffer = await DocxReportBuilder.generateDocx(payload);

    return new Response(docxBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="OIML_R76_Report_${payload.evaluationNumber || 'Evaluation'}.docx"`,
      },
    });
  } catch (error) {
    console.error('Error generating DOCX report:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
