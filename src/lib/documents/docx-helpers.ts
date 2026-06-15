import {
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  HeadingLevel,
  ShadingType,
} from "docx";
import type { GrantDocumentData } from "./types";

export function docTitle(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.TITLE,
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text, bold: true, size: 28 })],
  });
}

export function docHeading(
  text: string,
  level: typeof HeadingLevel.HEADING_1 | typeof HeadingLevel.HEADING_2 = HeadingLevel.HEADING_1
): Paragraph {
  return new Paragraph({
    heading: level,
    spacing: { before: 300, after: 120 },
    children: [new TextRun({ text, bold: true })],
  });
}

export function docParagraph(
  text: string,
  options?: { bold?: boolean; italic?: boolean; spacingAfter?: number }
): Paragraph {
  return new Paragraph({
    spacing: { after: options?.spacingAfter ?? 160 },
    children: [
      new TextRun({
        text,
        bold: options?.bold,
        italics: options?.italic,
        size: 22,
      }),
    ],
  });
}

export function docBullet(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 80 },
    bullet: { level: 0 },
    children: [new TextRun({ text, size: 22 })],
  });
}

export function docBlank(): Paragraph {
  return new Paragraph({ spacing: { after: 120 }, children: [] });
}

export function docSignatureBlock(label: string, name?: string): Paragraph[] {
  return [
    docBlank(),
    docParagraph(label, { bold: true }),
    docBlank(),
    docParagraph("_________________________________"),
    docParagraph(name || "", { spacingAfter: 240 }),
    docParagraph("Date: _____________________________"),
  ];
}

export function docKeyValueTable(rows: { label: string; value: string }[]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(
      (row) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 35, type: WidthType.PERCENTAGE },
              borders: cellBorders(),
              children: [
                new Paragraph({
                  children: [new TextRun({ text: row.label, bold: true, size: 20 })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 65, type: WidthType.PERCENTAGE },
              borders: cellBorders(),
              children: [
                new Paragraph({
                  children: [new TextRun({ text: row.value, size: 20 })],
                }),
              ],
            }),
          ],
        })
    ),
  });
}

function cellBorders() {
  return {
    top: { style: BorderStyle.SINGLE, size: 1 },
    bottom: { style: BorderStyle.SINGLE, size: 1 },
    left: { style: BorderStyle.SINGLE, size: 1 },
    right: { style: BorderStyle.SINGLE, size: 1 },
  };
}

export function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatShares(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

export function formatMoney(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(n);
}

export function vestingDescription(data: GrantDocumentData): string {
  const v = data.vesting;
  if (!v) return "100% of the Option Shares vest immediately upon the Grant Date.";

  const cliffYears = v.cliffMonths / 12;
  const totalYears = v.vestingMonths / 12;
  const freq =
    v.vestingFrequency === "monthly"
      ? "monthly"
      : v.vestingFrequency === "quarterly"
        ? "quarterly"
        : "annually";

  if (v.cliffMonths === 0) {
    return `The Option Shares shall vest ${freq} over ${totalYears} year(s) commencing on ${formatLongDate(v.startDate)}, with no cliff period.`;
  }

  return `Twenty-five percent (25%) of the Option Shares shall vest on the ${cliffYears}-year anniversary of ${formatLongDate(v.startDate)} (the "Cliff Date"), and the remaining Option Shares shall vest in equal ${freq} installments over the following ${totalYears - cliffYears} year(s), subject to the Optionee's Continuous Service (as defined in the Plan) through each vesting date.`;
}

export function isISO(type: string): boolean {
  return type.toLowerCase() === "iso";
}

export function optionLabel(type: string): string {
  return isISO(type) ? "Incentive Stock Option" : "Non-Qualified Stock Option";
}

export function optionLabelShort(type: string): string {
  return isISO(type) ? "ISO" : "NSO";
}
