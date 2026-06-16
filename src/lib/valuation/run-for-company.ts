import { loadValuationContext } from "./load";
import { runValuation, type ValuationInput } from "./engine";
import type { ValuationMethod, DlomMethod, ValuationResult } from "./types";
import type { DerivedStructure } from "./inputs";

export interface ValuationAssumptionParams {
  method: ValuationMethod;
  dlomMethod: DlomMethod;
  volatility: number;
  timeToLiquidity: number;
  riskFreeRate: number;
  dividendYield: number;
  holdingPeriod: number;
  backsolveSeriesId?: string;
  manualEquityValue?: number;
}

export interface RunValuationForCompanyResult {
  input: ValuationInput;
  result: ValuationResult;
  inputsSnapshot: Record<string, unknown>;
  derived: DerivedStructure;
}

export async function runValuationForCompany(
  companyId: string,
  valuationDate: string,
  params: ValuationAssumptionParams
): Promise<{ ok: true; data: RunValuationForCompanyResult } | { ok: false; error: string; status: number }> {
  const ctx = await loadValuationContext(companyId);
  if (!ctx) return { ok: false, error: "Company not found", status: 404 };

  const { derived } = ctx;
  const warnings = [...derived.warnings];

  let backsolve: ValuationInput["backsolve"];
  let manualEquityValue: number | undefined;

  if (params.method === "opm_backsolve") {
    let target = derived.backsolveTarget;
    if (params.backsolveSeriesId) {
      const series = derived.series.find((s) => s.id === params.backsolveSeriesId);
      if (!series || series.originalIssuePrice <= 0) {
        return { ok: false, error: "Selected series has no priced round to backsolve against.", status: 400 };
      }
      target = {
        seriesId: series.id,
        seriesName: series.name,
        pricePerShare: series.round?.pricePerShare ?? series.originalIssuePrice,
        roundName: series.round?.name ?? series.name,
      };
    }
    if (!target) {
      return {
        ok: false,
        error: "No priced preferred round available to backsolve. Use a manual equity value instead.",
        status: 400,
      };
    }
    backsolve = {
      seriesId: target.seriesId,
      seriesName: target.seriesName,
      targetPricePerShare: target.pricePerShare,
      roundName: target.roundName,
    };
  } else {
    if (!params.manualEquityValue) {
      return { ok: false, error: "A manual equity value is required for this method.", status: 400 };
    }
    manualEquityValue = params.manualEquityValue;
  }

  const input: ValuationInput = {
    method: params.method,
    valuationDate,
    cap: derived.cap,
    assumptions: {
      timeToLiquidity: params.timeToLiquidity,
      volatility: params.volatility,
      riskFreeRate: params.riskFreeRate,
      dividendYield: params.dividendYield,
    },
    dlomMethod: params.dlomMethod,
    holdingPeriod: params.holdingPeriod,
    backsolve,
    manualEquityValue,
    warnings,
  };

  let result: ValuationResult;
  try {
    result = runValuation(input);
  } catch {
    return { ok: false, error: "Valuation computation failed. Review the cap structure and inputs.", status: 422 };
  }

  const inputsSnapshot = {
    method: input.method,
    assumptions: input.assumptions,
    dlomMethod: input.dlomMethod,
    holdingPeriod: input.holdingPeriod,
    backsolve: input.backsolve,
    manualEquityValue: input.manualEquityValue,
    series: derived.series,
  };

  return { ok: true, data: { input, result, inputsSnapshot, derived } };
}

/** Default assumptions for a new client submission (analyst adjusts later). */
export async function defaultSubmissionParams(companyId: string): Promise<ValuationAssumptionParams | null> {
  const ctx = await loadValuationContext(companyId);
  if (!ctx) return null;
  const { defaults, derived } = ctx;
  return {
    method: derived.backsolveTarget ? "opm_backsolve" : "opm_manual",
    dlomMethod: "finnerty",
    volatility: defaults.volatility,
    timeToLiquidity: defaults.timeToLiquidity,
    riskFreeRate: defaults.riskFreeRate,
    dividendYield: defaults.dividendYield,
    holdingPeriod: defaults.holdingPeriod,
    backsolveSeriesId: derived.backsolveTarget?.seriesId,
  };
}
