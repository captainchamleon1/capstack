/**
 * Valuation engine orchestration.
 *
 * Runs the full 409A pipeline: determine total equity value (OPM backsolve to a
 * priced round, or a manual equity value), allocate to common via the OPM, apply
 * a DLOM, and produce the concluded common FMV per share plus sensitivity tables.
 */

import { allocateWithModel, buildOpmModel, type OpmModel } from "./opm";
import { backsolveEquityValue } from "./backsolve";
import { computeDlom } from "./dlom";
import type {
  CapStructure,
  DlomMethod,
  OpmAssumptions,
  ValuationMethod,
  ValuationResult,
  SensitivityPoint,
} from "./types";

export interface ValuationInput {
  method: ValuationMethod;
  valuationDate: string;
  cap: CapStructure;
  assumptions: OpmAssumptions;
  dlomMethod: DlomMethod;
  /** Marketability / holding period for the DLOM, in years. */
  holdingPeriod: number;
  /** Backsolve target (required when method === "opm_backsolve"). */
  backsolve?: { seriesId: string; seriesName: string; targetPricePerShare: number; roundName?: string };
  /** Manual total equity value (required when method === "opm_manual"). */
  manualEquityValue?: number;
  warnings?: string[];
}

interface PipelineOutput {
  equityValue: number;
  marketableCommonPerShare: number;
  concludedFmv: number;
  dlomValue: number;
  solvedPricePerShare?: number;
}

function runPipeline(
  input: ValuationInput,
  assumptions: OpmAssumptions,
  holdingPeriod: number,
  model: OpmModel
): PipelineOutput {
  let equityValue: number;
  let solvedPricePerShare: number | undefined;

  if (input.method === "opm_backsolve") {
    if (!input.backsolve) throw new Error("Backsolve target is required for opm_backsolve");
    const solved = backsolveEquityValue(
      input.backsolve.targetPricePerShare,
      input.backsolve.seriesId,
      input.cap,
      assumptions,
      model
    );
    equityValue = solved.equityValue;
    solvedPricePerShare = solved.solvedPricePerShare;
  } else {
    equityValue = input.manualEquityValue ?? 0;
  }

  const opm = allocateWithModel(model, equityValue, input.cap, assumptions);
  const dlom = computeDlom(
    input.dlomMethod,
    assumptions.volatility,
    holdingPeriod,
    assumptions.riskFreeRate,
    assumptions.dividendYield
  );
  const marketableCommonPerShare = opm.commonPerShare;
  const concludedFmv = marketableCommonPerShare * (1 - dlom.value);

  return {
    equityValue,
    marketableCommonPerShare,
    concludedFmv,
    dlomValue: dlom.value,
    solvedPricePerShare,
  };
}

export function runValuation(input: ValuationInput): ValuationResult {
  const warnings = [...(input.warnings ?? [])];
  const { assumptions, holdingPeriod } = input;

  // Breakpoints/fractions depend only on the cap structure: build once, reuse.
  const model = buildOpmModel(input.cap);

  const base = runPipeline(input, assumptions, holdingPeriod, model);

  // Full OPM + DLOM detail at the base assumptions.
  const opm = allocateWithModel(model, base.equityValue, input.cap, assumptions);
  const dlom = computeDlom(
    input.dlomMethod,
    assumptions.volatility,
    holdingPeriod,
    assumptions.riskFreeRate,
    assumptions.dividendYield
  );

  // Sensitivity: re-run the whole pipeline (backsolve included) for each variation.
  const volPoints: SensitivityPoint[] = [-0.15, -0.075, 0, 0.075, 0.15]
    .map((delta) => roundDec(assumptions.volatility + delta, 4))
    .filter((v) => v > 0)
    .map((v) => ({
      input: v,
      fmv: runPipeline(input, { ...assumptions, volatility: v }, holdingPeriod, model).concludedFmv,
    }));

  const timePoints: SensitivityPoint[] = [-1, -0.5, 0, 0.5, 1]
    .map((delta) => roundDec(assumptions.timeToLiquidity + delta, 2))
    .filter((t) => t > 0)
    .map((t) => ({
      input: t,
      fmv: runPipeline(input, { ...assumptions, timeToLiquidity: t }, t, model).concludedFmv,
    }));

  const dlomPoints: SensitivityPoint[] = [-1, -0.5, 0, 0.5, 1]
    .map((delta) => roundDec(holdingPeriod + delta, 2))
    .filter((h) => h > 0)
    .map((h) => ({
      input: h,
      fmv: runPipeline(input, assumptions, h, model).concludedFmv,
    }));

  if (base.concludedFmv <= 0) {
    warnings.push("Concluded common FMV is zero or negative; review the cap structure and assumptions.");
  }

  return {
    method: input.method,
    valuationDate: input.valuationDate,
    assumptions,
    equityValue: base.equityValue,
    backsolve: input.backsolve
      ? {
          seriesName: input.backsolve.seriesName,
          targetPricePerShare: input.backsolve.targetPricePerShare,
          solvedPricePerShare: base.solvedPricePerShare ?? 0,
          roundName: input.backsolve.roundName,
        }
      : undefined,
    opm,
    dlom,
    marketableCommonPerShare: base.marketableCommonPerShare,
    concludedFmv: base.concludedFmv,
    sensitivity: { volatility: volPoints, timeToLiquidity: timePoints, dlom: dlomPoints },
    capStructure: input.cap,
    warnings,
  };
}

function roundDec(n: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}
