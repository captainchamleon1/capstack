/**
 * Server-side helpers that load a company's authoritative capitalization data and
 * derive the OPM cap structure used by the valuation engine. Kept separate from
 * the pure engine modules so the engine has no database dependency.
 */

import { getCompanyWithCapTable } from "@/lib/db";
import { deriveCapStructure, defaultAssumptions } from "./inputs";
import type { DerivedStructure } from "./inputs";
import type { OpmAssumptions } from "./types";

type CompanyWithCapTable = NonNullable<Awaited<ReturnType<typeof getCompanyWithCapTable>>>;

export interface ValuationContext {
  company: CompanyWithCapTable["company"];
  capTable: CompanyWithCapTable["capTable"];
  derived: DerivedStructure;
  defaults: OpmAssumptions & { holdingPeriod: number };
}

export async function loadValuationContext(companyId: string): Promise<ValuationContext | null> {
  const data = await getCompanyWithCapTable(companyId);
  if (!data) return null;

  const { company, capTable } = data;

  const derived = deriveCapStructure({
    shareClasses: company.shareClasses,
    fundraiseRounds: company.fundraiseRounds.map((r) => ({
      name: r.name,
      type: r.type,
      status: r.status,
      pricePerShare: r.pricePerShare,
      closeDate: r.closeDate,
      createdAt: r.createdAt,
    })),
    capTable,
  });

  const base = defaultAssumptions();

  return {
    company,
    capTable,
    derived,
    defaults: { ...base, holdingPeriod: base.timeToLiquidity },
  };
}
