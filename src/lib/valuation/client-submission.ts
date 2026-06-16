/** Structured intake data provided by the company at 409A submission. */

export type CompanyStage =
  | "pre_revenue"
  | "early_revenue"
  | "growth"
  | "profitable";

export interface ClientValuationSubmission {
  businessDescription: string;
  industry: string;
  stage: CompanyStage;
  revenueTtm: number | null;
  revenuePriorYear: number | null;
  cashBalance: number | null;
  monthlyBurn: number | null;
  headcount: number | null;
  priorFmv: number | null;
  priorFmvDate: string | null;
  /** Client's estimate of years until IPO, sale, or similar — not the analyst model input. */
  expectedLiquidityYears: number | null;
  materialEvents: string | null;
  outstandingSafesNotes: string | null;
  companyProfile: {
    legalName: string;
    state: string | null;
    incorporationDate: string | null;
    ein: string | null;
  };
}

export const STAGE_LABELS: Record<CompanyStage, string> = {
  pre_revenue: "Pre-revenue (product development)",
  early_revenue: "Early revenue",
  growth: "Growth stage",
  profitable: "Profitable / cash-flow positive",
};

export function parseClientSubmission(raw: string | null | undefined): ClientValuationSubmission | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ClientValuationSubmission;
  } catch {
    return null;
  }
}
