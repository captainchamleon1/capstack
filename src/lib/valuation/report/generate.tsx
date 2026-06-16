import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { ValuationPdfDocument } from "./valuation-pdf";
import { expirationFromValuationDate, type ValuationReportData } from "./report-data";
import {
  buildSensitivityMatrix,
  finalizeReportData,
  mapFundraiseRounds,
  mapShareClassTerms,
  valuationToInput,
} from "./enrich-report";
import type { ValuationResult } from "../types";
import type { Valuation, Company } from "@/generated/prisma/client";
import { parseClientSubmission } from "../client-submission";

export function buildReportData(valuation: Valuation, company: Company): ValuationReportData | null {
  if (!valuation.result) return null;
  let result: ValuationResult;
  try {
    result = JSON.parse(valuation.result) as ValuationResult;
  } catch {
    return null;
  }

  const base = {
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

  let sensitivityMatrix;
  try {
    const input = valuationToInput(valuation, result.capStructure);
    sensitivityMatrix = buildSensitivityMatrix(input);
  } catch {
    sensitivityMatrix = undefined;
  }

  return finalizeReportData(base, valuation.id, { sensitivityMatrix });
}

export async function buildReportDataEnriched(
  valuation: Valuation,
  company: Company
): Promise<ValuationReportData | null> {
  const base = buildReportData(valuation, company);
  if (!base) return null;

  const [rounds, classes] = await Promise.all([
    prisma.fundraiseRound.findMany({
      where: { companyId: company.id },
      orderBy: [{ closeDate: "asc" }, { createdAt: "asc" }],
    }),
    prisma.shareClass.findMany({
      where: { companyId: company.id },
      orderBy: [{ seniority: "asc" }, { name: "asc" }],
    }),
  ]);

  const submission = parseClientSubmission(valuation.clientSubmission);

  return finalizeReportData(
    {
      company: base.company,
      meta: {
        title: base.meta.title,
        valuationDate: base.meta.valuationDate,
        expirationDate: base.meta.expirationDate,
        reportDate: base.meta.reportDate,
        status: base.meta.status,
        preparedByName: base.meta.preparedByName,
        reviewedByName: base.meta.reviewedByName,
        reviewedAt: base.meta.reviewedAt,
      },
      result: base.result,
    },
    valuation.id,
    {
      fundraiseRounds: mapFundraiseRounds(rounds),
      shareClassTerms: mapShareClassTerms(classes),
      sensitivityMatrix: base.sensitivityMatrix,
      businessDescription: submission?.businessDescription ?? null,
    }
  );
}

export async function generateValuationReportPdf(valuation: Valuation, company: Company): Promise<Buffer | null> {
  const data = await buildReportDataEnriched(valuation, company);
  if (!data) return null;
  const buffer = await renderToBuffer(<ValuationPdfDocument data={data} />);
  return Buffer.from(buffer);
}

export function valuationReportFilename(valuation: Valuation, company: Company): string {
  const prefix = company.name.replace(/[^a-zA-Z0-9]/g, "_");
  const date = valuation.valuationDate.toISOString().slice(0, 10);
  return `${prefix}_409A_Valuation_${date}.pdf`;
}
