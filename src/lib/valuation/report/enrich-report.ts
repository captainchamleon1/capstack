import { runValuation, type ValuationInput } from "../engine";
import type { CapStructure, DlomMethod, ValuationMethod } from "../types";
import type { Valuation } from "@/generated/prisma/client";
import type { FundraiseRoundRow, ShareClassTermRow, SensitivityMatrixCell, ValuationReportData } from "./report-data";
import { buildReportId } from "./report-data";

function roundDec(n: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

export function valuationToInput(valuation: Valuation, cap: CapStructure): ValuationInput {
  let backsolve: ValuationInput["backsolve"];
  let manualEquityValue: number | undefined;
  if (valuation.inputs) {
    try {
      const snap = JSON.parse(valuation.inputs) as {
        backsolve?: ValuationInput["backsolve"];
        manualEquityValue?: number;
      };
      backsolve = snap.backsolve;
      manualEquityValue = snap.manualEquityValue;
    } catch {
      /* use valuation fields only */
    }
  }

  return {
    method: valuation.method as ValuationMethod,
    valuationDate: valuation.valuationDate.toISOString().slice(0, 10),
    cap,
    assumptions: {
      timeToLiquidity: valuation.timeToLiquidity,
      volatility: valuation.volatility,
      riskFreeRate: valuation.riskFreeRate,
      dividendYield: valuation.dividendYield,
    },
    dlomMethod: valuation.dlomMethod as DlomMethod,
    holdingPeriod: valuation.holdingPeriod,
    backsolve,
    manualEquityValue,
  };
}

/** 5×5 grid of vol × time-to-liquidity FMV outcomes for the sensitivity matrix exhibit. */
export function buildSensitivityMatrix(input: ValuationInput): SensitivityMatrixCell[] {
  const { volatility: baseVol, timeToLiquidity: baseTime } = input.assumptions;
  const volDeltas = [-0.15, -0.075, 0, 0.075, 0.15];
  const timeDeltas = [-1, -0.5, 0, 0.5, 1];

  const vols = volDeltas
    .map((d) => roundDec(baseVol + d, 4))
    .filter((v) => v > 0);
  const times = timeDeltas
    .map((d) => roundDec(baseTime + d, 2))
    .filter((t) => t > 0);

  const cells: SensitivityMatrixCell[] = [];
  for (const volatility of vols) {
    for (const timeToLiquidity of times) {
      const result = runValuation({
        ...input,
        assumptions: { ...input.assumptions, volatility, timeToLiquidity },
      });
      cells.push({ volatility, timeToLiquidity, fmv: result.concludedFmv });
    }
  }
  return cells;
}

export function mapFundraiseRounds(
  rounds: {
    name: string;
    type: string;
    status: string;
    closeDate: Date | null;
    preMoneyValuation: number | null;
    investmentAmount: number | null;
    pricePerShare: number | null;
  }[]
): FundraiseRoundRow[] {
  return rounds.map((r) => ({
    name: r.name,
    type: r.type,
    status: r.status,
    closeDate: r.closeDate ? r.closeDate.toISOString() : null,
    preMoneyValuation: r.preMoneyValuation,
    investmentAmount: r.investmentAmount,
    pricePerShare: r.pricePerShare,
  }));
}

export function mapShareClassTerms(
  classes: {
    name: string;
    type: string;
    liquidationPref: number;
    isParticipating: boolean;
    seniority: number;
  }[]
): ShareClassTermRow[] {
  return classes.map((sc) => ({
    name: sc.name,
    type: sc.type,
    liquidationPref: sc.liquidationPref,
    isParticipating: sc.isParticipating,
    seniority: sc.seniority,
  }));
}

export function finalizeReportData(
  base: Omit<ValuationReportData, "meta"> & { meta: Omit<ValuationReportData["meta"], "reportId"> },
  valuationId: string,
  extras?: {
    fundraiseRounds?: FundraiseRoundRow[];
    shareClassTerms?: ShareClassTermRow[];
    sensitivityMatrix?: SensitivityMatrixCell[];
    businessDescription?: string | null;
  }
): ValuationReportData {
  return {
    ...base,
    company: {
      ...base.company,
      businessDescription: extras?.businessDescription ?? base.company.businessDescription,
    },
    meta: {
      ...base.meta,
      reportId: buildReportId(valuationId, base.meta.valuationDate),
    },
    fundraiseRounds: extras?.fundraiseRounds,
    shareClassTerms: extras?.shareClassTerms,
    sensitivityMatrix: extras?.sensitivityMatrix,
  };
}
