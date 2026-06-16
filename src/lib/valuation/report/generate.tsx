import { renderToBuffer } from "@react-pdf/renderer";
import { ValuationPdfDocument } from "./valuation-pdf";
import { expirationFromValuationDate, type ValuationReportData } from "./report-data";
import type { ValuationResult } from "../types";
import type { Valuation, Company } from "@/generated/prisma/client";

export function buildReportData(valuation: Valuation, company: Company): ValuationReportData | null {
  if (!valuation.result) return null;
  let result: ValuationResult;
  try {
    result = JSON.parse(valuation.result) as ValuationResult;
  } catch {
    return null;
  }

  return {
    company: {
      name: company.name,
      legalName: company.legalName || company.name,
      state: company.state || "Delaware",
      incorporationDate: company.incorporationDate ? company.incorporationDate.toISOString() : null,
      authorizedShares: company.authorizedShares,
    },
    meta: {
      title: valuation.title,
      valuationDate: valuation.valuationDate.toISOString(),
      expirationDate: expirationFromValuationDate(valuation.valuationDate.toISOString()),
      reportDate: (valuation.reviewedAt ?? valuation.updatedAt ?? valuation.createdAt).toISOString(),
      status: valuation.status,
      preparedByName: valuation.preparedByName,
      reviewedByName: valuation.reviewedByName,
      reviewedAt: valuation.reviewedAt ? valuation.reviewedAt.toISOString() : null,
    },
    result,
  };
}

export async function generateValuationReportPdf(valuation: Valuation, company: Company): Promise<Buffer | null> {
  const data = buildReportData(valuation, company);
  if (!data) return null;
  const buffer = await renderToBuffer(<ValuationPdfDocument data={data} />);
  return Buffer.from(buffer);
}

export function valuationReportFilename(valuation: Valuation, company: Company): string {
  const prefix = company.name.replace(/[^a-zA-Z0-9]/g, "_");
  const date = valuation.valuationDate.toISOString().slice(0, 10);
  return `${prefix}_409A_Valuation_${date}.pdf`;
}
