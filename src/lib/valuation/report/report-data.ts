import type { ValuationResult } from "../types";

export interface FundraiseRoundRow {
  name: string;
  type: string;
  status: string;
  closeDate: string | null;
  preMoneyValuation: number | null;
  investmentAmount: number | null;
  pricePerShare: number | null;
}

export interface ShareClassTermRow {
  name: string;
  type: string;
  liquidationPref: number;
  isParticipating: boolean;
  seniority: number;
}

export interface SensitivityMatrixCell {
  volatility: number;
  timeToLiquidity: number;
  fmv: number;
}

export interface ValuationReportData {
  company: {
    name: string;
    legalName: string;
    state: string;
    incorporationDate: string | null;
    authorizedShares: number;
    /** Optional one-paragraph business description from management. */
    businessDescription?: string | null;
  };
  meta: {
    title: string;
    reportId: string;
    valuationDate: string;
    expirationDate: string;
    reportDate: string;
    status: string;
    preparedByName?: string | null;
    reviewedByName?: string | null;
    reviewedAt?: string | null;
  };
  result: ValuationResult;
  fundraiseRounds?: FundraiseRoundRow[];
  shareClassTerms?: ShareClassTermRow[];
  sensitivityMatrix?: SensitivityMatrixCell[];
}

/** Valuation date plus 12 months (the 409A safe-harbor validity window). */
export function expirationFromValuationDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const e = new Date(d);
  e.setUTCFullYear(e.getUTCFullYear() + 1);
  return e.toISOString();
}

export function fmtMoney(n: number, decimals = 0): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function fmtShare(n: number): string {
  return `$${n.toFixed(4)}`;
}

export function fmtShares(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

export function fmtPct(n: number, decimals = 1): string {
  return `${(n * 100).toFixed(decimals)}%`;
}

export function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

/** Report reference number, e.g. EQTR-409A-2026-A1B2C3 */
export function buildReportId(valuationId: string, valuationDateIso: string): string {
  const year = valuationDateIso.slice(0, 4);
  const suffix = valuationId.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase() || "000000";
  return `EQTR-409A-${year}-${suffix}`;
}
