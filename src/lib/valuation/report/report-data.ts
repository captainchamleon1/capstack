import type { ValuationResult } from "../types";

export interface ValuationReportData {
  company: {
    name: string;
    legalName: string;
    state: string;
    incorporationDate: string | null;
    authorizedShares: number;
  };
  meta: {
    title: string;
    valuationDate: string;
    expirationDate: string;
    reportDate: string;
    status: string;
    preparedByName?: string | null;
    reviewedByName?: string | null;
    reviewedAt?: string | null;
  };
  result: ValuationResult;
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
  // Date-only values are stored at UTC midnight; format in UTC to avoid an
  // off-by-one day shift in negative-offset timezones.
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}
