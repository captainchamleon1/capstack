/**
 * Derives the normalized OPM capitalization structure from the company's cap
 * table, share classes, and financing history.
 */

import type { CapTableSummary } from "../cap-table";
import type { CapStructure, OpmAssumptions, PreferredSeriesInput } from "./types";

export interface ShareClassLike {
  id: string;
  name: string;
  type: string;
  liquidationPref: number;
  isParticipating: boolean;
  seniority: number;
}

export interface RoundLike {
  name: string;
  type: string;
  status: string;
  pricePerShare: number | null;
  closeDate: Date | null;
  createdAt: Date;
}

export interface SeriesMeta {
  id: string;
  name: string;
  originalIssuePrice: number;
  round?: { name: string; pricePerShare: number; closeDate: Date | null };
}

export interface DerivedStructure {
  cap: CapStructure;
  series: SeriesMeta[];
  /** Suggested backsolve target: most recent priced preferred series. */
  backsolveTarget?: { seriesId: string; seriesName: string; pricePerShare: number; roundName: string };
  warnings: string[];
}

const PREFERRED_TYPES = (t: string) => t === "preferred" || t.startsWith("series_");
const OPTION_SECURITIES = new Set(["iso", "nso", "warrant"]);

export function deriveCapStructure(params: {
  shareClasses: ShareClassLike[];
  fundraiseRounds: RoundLike[];
  capTable: CapTableSummary;
}): DerivedStructure {
  const { shareClasses, fundraiseRounds, capTable } = params;
  const warnings: string[] = [];

  // Map closed priced rounds to share classes by type, keeping the latest price.
  const closedRounds = fundraiseRounds
    .filter((r) => r.status === "closed" && r.pricePerShare && r.pricePerShare > 0)
    .sort((a, b) => roundTime(a) - roundTime(b));

  const priceByClassId = new Map<string, { price: number; round: RoundLike }>();
  for (const round of closedRounds) {
    for (const sc of shareClasses) {
      if (sc.type === round.type || sc.type.startsWith(round.type)) {
        priceByClassId.set(sc.id, { price: round.pricePerShare!, round });
      }
    }
  }

  // Aggregate fully-diluted shares per share class and per option strike.
  const prefSharesByClass = new Map<string, number>();
  const optionSharesByStrike = new Map<number, number>();
  let commonShares = 0;

  const classById = new Map(shareClasses.map((sc) => [sc.name, sc]));

  for (const e of capTable.entries) {
    const sc = classById.get(e.shareClassName);
    const isPreferred =
      e.securityType === "preferred_stock" || (sc ? PREFERRED_TYPES(sc.type) : false);

    if (isPreferred && sc) {
      prefSharesByClass.set(sc.id, (prefSharesByClass.get(sc.id) ?? 0) + e.fullyDilutedShares);
    } else if (OPTION_SECURITIES.has(e.securityType) && (e.strikePrice ?? 0) > 0) {
      const strike = round4(e.strikePrice!);
      optionSharesByStrike.set(strike, (optionSharesByStrike.get(strike) ?? 0) + e.fullyDilutedShares);
    } else {
      // Common stock, RSAs, RSUs, and zero-strike options behave like common.
      commonShares += e.fullyDilutedShares;
    }
  }

  // Unallocated option pool is treated as common-equivalent at a $0 strike.
  if (capTable.optionPoolAvailable > 0) {
    commonShares += capTable.optionPoolAvailable;
  }

  // Build preferred series inputs.
  const series: SeriesMeta[] = [];
  const preferred: PreferredSeriesInput[] = [];
  for (const sc of shareClasses) {
    const shares = prefSharesByClass.get(sc.id);
    if (!shares || shares <= 0) continue;
    const priced = priceByClassId.get(sc.id);
    const oip = priced?.price ?? 0;
    if (oip <= 0) {
      warnings.push(
        `No original issue price found for ${sc.name}; using $0 (review required). Close the priced round or set a preferred grant strike price.`
      );
    }
    series.push({
      id: sc.id,
      name: sc.name,
      originalIssuePrice: oip,
      round: priced ? { name: priced.round.name, pricePerShare: priced.price, closeDate: priced.round.closeDate } : undefined,
    });
    preferred.push({
      id: sc.id,
      name: sc.name,
      shares,
      originalIssuePrice: oip,
      liquidationMultiple: sc.liquidationPref,
      participating: sc.isParticipating,
      participationCap: null,
      seniority: sc.seniority,
    });
  }

  const optionTranches = [...optionSharesByStrike.entries()]
    .map(([strike, shares]) => ({ strike, shares }))
    .sort((a, b) => a.strike - b.strike);

  const fullyDilutedShares =
    commonShares +
    preferred.reduce((s, p) => s + p.shares, 0) +
    optionTranches.reduce((s, o) => s + o.shares, 0);

  const cap: CapStructure = {
    commonShares,
    preferred,
    options: optionTranches,
    fullyDilutedShares,
  };

  // Choose the most recent priced preferred series as the backsolve target.
  let backsolveTarget: DerivedStructure["backsolveTarget"];
  const latestRound = closedRounds[closedRounds.length - 1];
  if (latestRound) {
    const targetSeries = series.find(
      (s) => s.round && s.round.name === latestRound.name && s.originalIssuePrice > 0
    );
    if (targetSeries && targetSeries.round) {
      backsolveTarget = {
        seriesId: targetSeries.id,
        seriesName: targetSeries.name,
        pricePerShare: targetSeries.round.pricePerShare,
        roundName: targetSeries.round.name,
      };
    }
  }

  if (preferred.length === 0) {
    warnings.push(
      "No preferred stock found. Backsolve requires a priced financing round; use a manual equity value (e.g. asset or market approach) instead."
    );
  }

  return { cap, series, backsolveTarget, warnings };
}

function roundTime(r: RoundLike): number {
  return (r.closeDate ?? r.createdAt).getTime();
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

/** Reasonable defaults for OPM assumptions (analyst overrides on input). */
export function defaultAssumptions(): OpmAssumptions {
  return {
    timeToLiquidity: 3.0,
    volatility: 0.55,
    riskFreeRate: 0.04,
    dividendYield: 0,
  };
}
