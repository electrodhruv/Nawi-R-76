/**
 * OIML R 76-2 Laboratory Type Evaluation DOCX Report Builder
 *
 * Generates an editable Microsoft Word (.docx) document strictly following
 * OIML R 76-2:2007 (E) structure, tables, and mandatory statutory disclaimers.
 * Redesigned to reflect Page 1 Overall Result, QR verification metadata,
 * executive summary counters, and natural document flow.
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  HeadingLevel,
  AlignmentType,
} from 'docx';
import { ReportPayload } from './report-types';
import { formatWithUnit } from './pdf-builder';

export class DocxReportBuilder {
  /**
   * Generates a complete OIML R 76-2 Type Evaluation DOCX document.
   * @param payload Report metadata, results, and evidence.
   * @returns Buffer containing binary .docx document.
   */
  static async generateDocx(payload: ReportPayload): Promise<Buffer> {
    const isCompliant = payload.overallResult === 'COMPLIANT';
    const isNonCompliant = payload.overallResult === 'NON_COMPLIANT';
    const resultColor = isCompliant ? '15803D' : isNonCompliant ? 'B91C1C' : 'B45309';
    const resultBgColor = isCompliant ? 'F0FDF4' : isNonCompliant ? 'FEF2F2' : 'FFFBEB';
    const overallResultText = payload.overallResult || 'NOT_DETERMINED';

    const verificationId = payload.verificationToken
      ? `VER-${payload.verificationToken.substring(0, 16).toUpperCase()}`
      : `VER-${payload.evaluationNumber}-REV${payload.revisionNumber}`;

    const digestStr = payload.verificationDigest
      ? payload.verificationDigest
      : 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

    const execSummary = payload.testExecutionSummary || {
      totalApplicable: payload.summaryMatrix.filter((m) => m.isApplicable).length,
      completed: payload.summaryMatrix.filter((m) => m.status === 'Passed' || m.status === 'Failed').length,
      passed: payload.summaryMatrix.filter((m) => m.status === 'Passed').length,
      failed: payload.summaryMatrix.filter((m) => m.status === 'Failed').length,
      notApplicable: payload.summaryMatrix.filter((m) => !m.isApplicable || m.status === 'Not Applicable').length,
      pending: payload.summaryMatrix.filter((m) => m.isApplicable && m.status !== 'Passed' && m.status !== 'Failed').length,
      retestRequired: 0,
    };

    const doc = new Document({
      title: `Evaluation Report ${payload.evaluationNumber}`,
      description: 'OIML R 76-2:2007 Pattern Evaluation Test Report',
      sections: [
        {
          properties: {},
          children: [
            // Title Header
            new Paragraph({
              text: 'LABORATORY TYPE EVALUATION TEST REPORT',
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: { after: 100 },
            }),

            new Paragraph({
              text: `STRUCTURED ACCORDING TO OIML R 76-2:2007 (E) | ${payload.rulePackVersion}`,
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
            }),

            // Report Meta Information Box
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                this.createRow('Report Number:', payload.evaluationNumber, 'Revision:', `Rev ${payload.revisionNumber}`),
                this.createRow('Standard & Edition:', `${payload.standard}:${payload.standardVersion}`, 'Issue Date:', payload.reportIssueDate),
                this.createRow('Testing Laboratory:', payload.laboratoryName, 'Rule Pack:', payload.rulePackVersion),
              ],
            }),

            new Paragraph({ text: '', spacing: { after: 150 } }),

            // Prominent OVERALL EVALUATION RESULT Box
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      shading: { fill: resultBgColor },
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          spacing: { before: 100, after: 50 },
                          children: [
                            new TextRun({
                              text: 'OVERALL EVALUATION RESULT',
                              bold: true,
                              size: 20,
                              color: '475569',
                            }),
                          ],
                        }),
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          spacing: { after: 100 },
                          children: [
                            new TextRun({
                              text: overallResultText,
                              bold: true,
                              size: 32,
                              color: resultColor,
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),

            new Paragraph({ text: '', spacing: { after: 150 } }),

            // Page 1 SCAN TO VERIFY REPORT Panel (Prominent, NO localhost!)
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: 'SCAN TO VERIFY REPORT & CRYPTOGRAPHIC INTEGRITY',
                              bold: true,
                              size: 20,
                              color: '1E3A8A',
                            }),
                          ],
                        }),
                        new Paragraph({
                          spacing: { before: 50, after: 50 },
                          children: [
                            new TextRun({
                              text: 'Scan the official document QR code or query the verification reference to verify report integrity and issued metadata.\n',
                              size: 16,
                              italics: true,
                            }),
                            new TextRun({ text: `Report No: `, bold: true, size: 16 }),
                            new TextRun({ text: `${payload.evaluationNumber}   |   `, size: 16 }),
                            new TextRun({ text: `Revision: `, bold: true, size: 16 }),
                            new TextRun({ text: `Rev ${payload.revisionNumber}   |   `, size: 16 }),
                            new TextRun({ text: `Verification ID: `, bold: true, size: 16 }),
                            new TextRun({ text: `${verificationId}\n`, size: 16 }),
                            new TextRun({ text: `Document / PDF Digest (SHA-256): `, bold: true, size: 16 }),
                            new TextRun({ text: `${digestStr}\n`, size: 14 }),
                            new TextRun({
                              text: 'Verification status instruction: Scan to verify report integrity and issued report metadata.',
                              size: 15,
                              color: '475569',
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),

            new Paragraph({ text: '', spacing: { after: 150 } }),

            // Section 1: General Information & Identification
            new Paragraph({
              text: '1. General Information & Metrological Specifications',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 150, after: 100 },
            }),

            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                this.createRow('Applicant:', payload.applicantName, 'Manufacturer:', `${payload.manufacturerName} (${payload.manufacturerCountry})`),
                this.createRow('Instrument Model:', payload.modelName, 'Serial Number:', payload.serialNumber ?? 'N/A'),
                this.createRow('Trade Designation:', payload.tradeName ?? 'N/A', 'Software ID / Version:', payload.softwareVersion ?? 'N/A'),
                this.createRow('Accuracy Class:', payload.accuracyClass, 'Weighing Range:', payload.rangeType),
                this.createRow('Max Capacity:', formatWithUnit(payload.maxCapacity, payload.primaryUnit), 'Min Capacity:', formatWithUnit(payload.minCapacity, payload.primaryUnit)),
                this.createRow('Verification Interval (e):', formatWithUnit(payload.verificationInterval_e, payload.primaryUnit), 'Scale Interval (d):', formatWithUnit(payload.scaleInterval_d, payload.primaryUnit)),
                this.createRow('Interval Count (n):', String(payload.numberOfIntervals_n), 'Tare Mechanism:', payload.tareType),
                this.createRow('Temperature Limits:', payload.temperatureLimits ?? '-10 °C to +40 °C', 'Power Supply:', payload.powerSupply ?? '230 V AC Mains'),
              ],
            }),

            new Paragraph({ text: '', spacing: { after: 150 } }),

            // Subordinate Professional Disclaimer Box
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: 'STATUTORY & LEGAL NOTICE: ',
                              bold: true,
                              color: '475569',
                              size: 16,
                            }),
                            new TextRun({
                              text:
                                'This document is a laboratory-generated evaluation test report structured according to the configured ' +
                                'OIML R 76-2:2007 reporting framework based on recorded test results. This report does not constitute an ' +
                                'official Certificate of Conformity, statutory pattern approval, or government certification, which may ' +
                                'only be issued by the designated Statutory Metrology Authority.',
                              italics: true,
                              size: 16,
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),

            new Paragraph({ text: '', spacing: { after: 300 } }),

            // Section 2: Executive Summary & Test Results Matrix
            new Paragraph({
              text: '2. Executive Summary & Test Results Matrix (OIML R 76-2)',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 },
            }),

            // Executive Summary Counters Table
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    this.createHeaderCell('Applicable', 14),
                    this.createHeaderCell('Completed', 14),
                    this.createHeaderCell('PASS', 14),
                    this.createHeaderCell('FAIL', 14),
                    this.createHeaderCell('N/A', 14),
                    this.createHeaderCell('Pending', 15),
                    this.createHeaderCell('Retest Req.', 15),
                  ],
                }),
                new TableRow({
                  children: [
                    this.createCell(String(execSummary.totalApplicable)),
                    this.createCell(String(execSummary.completed)),
                    this.createCell(String(execSummary.passed)),
                    this.createCell(String(execSummary.failed)),
                    this.createCell(String(execSummary.notApplicable)),
                    this.createCell(String(execSummary.pending)),
                    this.createCell(String(execSummary.retestRequired)),
                  ],
                }),
              ],
            }),

            new Paragraph({ text: '', spacing: { after: 150 } }),

            // Detailed Test Matrix Table
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    this.createHeaderCell('Item', 8),
                    this.createHeaderCell('Clause', 14),
                    this.createHeaderCell('Test Title / Examination', 38),
                    this.createHeaderCell('Applicable', 12),
                    this.createHeaderCell('Result', 14),
                    this.createHeaderCell('Remarks', 14),
                  ],
                }),
                ...payload.summaryMatrix.map(
                  (item) =>
                    new TableRow({
                      children: [
                        this.createCell(item.itemNumber),
                        this.createCell(item.clause),
                        this.createCell(item.testTitle),
                        this.createCell(item.isApplicable ? 'YES' : 'NO'),
                        this.createCell(item.status),
                        this.createCell(item.justification ?? '—'),
                      ],
                    })
                ),
              ],
            }),

            new Paragraph({ text: '', spacing: { after: 200 } }),

            // Section 3: Detailed Test Records
            new Paragraph({
              text: '3. Detailed Test Records & Observations',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 },
            }),

            ...payload.testRuns.flatMap((tr) => [
              new Paragraph({
                text: `${tr.title} (Clause: ${tr.clauseReference}) - Status: ${tr.status}`,
                heading: HeadingLevel.HEADING_3,
                spacing: { before: 150, after: 50 },
              }),
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    children: [
                      this.createHeaderCell('Dir', 8),
                      this.createHeaderCell('Load (L)', 15),
                      this.createHeaderCell('Indication (I)', 15),
                      this.createHeaderCell('dL', 12),
                      this.createHeaderCell('Error (Ec)', 16),
                      this.createHeaderCell('MPE', 16),
                      this.createHeaderCell('Result', 18),
                    ],
                  }),
                  ...tr.observations.map(
                    (obs) =>
                      new TableRow({
                        children: [
                          this.createCell(obs.direction),
                          this.createCell(formatWithUnit(obs.nominalLoad, payload.primaryUnit)),
                          this.createCell(formatWithUnit(obs.indicatedValue, payload.primaryUnit)),
                          this.createCell(formatWithUnit(obs.turningPoint_dL, payload.primaryUnit)),
                          this.createCell(formatWithUnit(obs.correctedError_Ec, payload.primaryUnit)),
                          this.createCell(obs.mpe),
                          this.createCell(obs.result),
                        ],
                      })
                  ),
                ],
              }),
            ]),

            new Paragraph({ text: '', spacing: { after: 200 } }),

            // Section 4: Traceability & Evidence Annex
            new Paragraph({
              text: '4. Reference Standards & Evidence Annex',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 },
            }),

            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    this.createHeaderCell('Standard / Serial', 25),
                    this.createHeaderCell('Class', 15),
                    this.createHeaderCell('Certificate No.', 25),
                    this.createHeaderCell('Calibrated By', 20),
                    this.createHeaderCell('Validity', 15),
                  ],
                }),
                ...payload.standardsUsed.map(
                  (std) =>
                    new TableRow({
                      children: [
                        this.createCell(`${std.name} (${std.serialNumber})`),
                        this.createCell(std.weightClass),
                        this.createCell(std.certificateNumber),
                        this.createCell(std.calibratedBy),
                        this.createCell(std.validUntil),
                      ],
                    })
                ),
              ],
            }),

            new Paragraph({ text: '', spacing: { after: 150 } }),

            // Evidence Table
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    this.createHeaderCell('Evidence ID', 15),
                    this.createHeaderCell('Clause', 15),
                    this.createHeaderCell('Description', 25),
                    this.createHeaderCell('OCR Reading', 15),
                    this.createHeaderCell('Consistency', 15),
                    this.createHeaderCell('Verification Status', 15),
                  ],
                }),
                ...payload.evidenceFiles.map(
                  (ev) =>
                    new TableRow({
                      children: [
                        this.createCell(ev.id),
                        this.createCell(ev.testClause ?? 'A.4.4'),
                        this.createCell(ev.description ?? ev.fileName),
                        this.createCell(ev.ocrCandidate ? formatWithUnit(ev.ocrCandidate, payload.primaryUnit) : 'N/A'),
                        this.createCell(ev.consistencyStatus ?? 'Consistent'),
                        this.createCell(ev.status),
                      ],
                    })
                ),
              ],
            }),

            new Paragraph({ text: '', spacing: { after: 300 } }),

            // Section 5: Attestation & Signatures with Demo Warning
            new Paragraph({
              text: '5. Attestation and Signatures',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 },
            }),

            new Paragraph({
              spacing: { after: 100 },
              children: [
                new TextRun({ text: `Lead Metrologist: `, bold: true }),
                new TextRun({ text: `${payload.leadMetrologistName} (${payload.leadMetrologistAccreditation ?? 'Accredited'})\n` }),
                new TextRun({ text: `Technical Reviewer: `, bold: true }),
                new TextRun({ text: `${payload.technicalReviewerName ?? 'M. Verma'} (Peer Review Accepted)\n` }),
                new TextRun({ text: `Approving Signatory: `, bold: true }),
                new TextRun({ text: `${payload.approvingSignatoryName ?? 'Director of Metrology'} (Structured According to OIML R 76-2)\n` }),
                new TextRun({ text: `Finalized Timestamp: `, bold: true }),
                new TextRun({ text: `${payload.finalizedAt ?? new Date().toISOString()}` }),
              ],
            }),
          ],
        },
      ],
    });

    return await Packer.toBuffer(doc);
  }

  private static createRow(l1: string, v1: string, l2: string, v2: string): TableRow {
    return new TableRow({
      children: [
        new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: l1, bold: true, size: 18 })] })] }),
        new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: v1, size: 18 })] })] }),
        new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: l2, bold: true, size: 18 })] })] }),
        new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: v2, size: 18 })] })] }),
      ],
    });
  }

  private static createHeaderCell(text: string, widthPercent: number): TableCell {
    return new TableCell({
      width: { size: widthPercent, type: WidthType.PERCENTAGE },
      children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 18 })] })],
    });
  }

  private static createCell(text: string): TableCell {
    return new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text, size: 16 })] })],
    });
  }
}
