/**
 * Type definitions for the 409A valuation engine.
 *
 * The engine follows the AICPA Practice Aid "Valuation of Privately-Held-Company
 * Equity Securities Issued as Compensation" using the Option Pricing Method (OPM)
 * with a backsolve to the most recent priced financing, plus a Discount for Lack
 * of Marketability (DLOM).
 */

export type DlomMethod = "finnerty" | "chaffee";
export type ValuationMethod = "opm_backsolve" | "opm_manual";
export type ValuationStatus = "submitted" | "draft" | "in_review" | "final";

/** A class of preferred stock with its economic rights. */
export interface PreferredSeriesInput {
  /** Share class id (for traceability). */
  id: string;
  name: string;
  shares: number;
  /** Original issue price per share. */
  originalIssuePrice: number;
  /** Liquidation preference multiple (e.g. 1 for 1x). */
  liquidationMultiple: number;
  /** Whether the series participates with common after its preference. */
  participating: boolean;
  /**
   * Participation cap as a multiple of original investment (e.g. 3 => 3x cap).
   * Null/undefined means uncapped participation. Ignored when not participating.
   */
  participationCap?: number | null;
  /**
   * Seniority rank. Higher numbers are more senior (paid first). Series sharing
   * the same rank are pari passu and paid pro-rata if proceeds are insufficient.
   */
  seniority: number;
}

/** Options/warrants grouped by exercise (strike) price. */
export interface OptionTrancheInput {
  strike: number;
  shares: number;
}

/** Normalized capitalization structure used by the OPM. */
export interface CapStructure {
  /** Common-equivalent shares participating at $0 strike (common stock, RSAs, RSUs, available pool). */
  commonShares: number;
  preferred: PreferredSeriesInput[];
  /** Option/warrant tranches with strike > 0, grouped by strike. */
  options: OptionTrancheInput[];
  /** Fully diluted shares (common + all preferred as-converted + all option shares). */
  fullyDilutedShares: number;
}

export interface OpmAssumptions {
  /** Expected time to a liquidity event, in years. */
  timeToLiquidity: number;
  /** Annualized equity volatility (decimal, e.g. 0.55). */
  volatility: number;
  /** Continuously-compounded risk-free rate (decimal). */
  riskFreeRate: number;
  /** Continuously-compounded dividend yield (decimal, usually 0). */
  dividendYield: number;
}

/** A single tranche of the breakpoint waterfall and its marginal allocation. */
export interface AllocationTranche {
  from: number;
  /** Upper bound of the tranche; null means infinity (residual). */
  to: number | null;
  /** Black-Scholes option value attributable to this tranche. */
  trancheValue: number;
  /** Black-Scholes call value of an option struck at `from` (the lower bound). */
  callValueLow: number;
  /** Fraction of each marginal dollar in this tranche flowing to each group key. */
  marginalFractions: Record<string, number>;
}

/** Descriptive metadata for an interior breakpoint (kink) in the waterfall. */
export interface BreakpointInfo {
  /** Equity-value threshold at which the allocation changes. */
  value: number;
  /** Human-readable description of the economic event at this threshold. */
  event: string;
  /** Cumulative common value per share at this threshold (liquidation basis). */
  commonPricePerShare: number;
}

export interface GroupAllocation {
  key: string;
  label: string;
  kind: "common" | "preferred" | "option";
  shares: number;
  /** OPM-allocated aggregate value (marketable, pre-DLOM). */
  value: number;
  /** value / shares. */
  perShare: number;
  /** Share of total equity value (decimal). */
  percentOfEquity: number;
}

export interface OpmResult {
  equityValue: number;
  allocations: GroupAllocation[];
  /** Marketable (pre-DLOM) common value per share. */
  commonPerShare: number;
  tranches: AllocationTranche[];
  /** Interior breakpoints with descriptive events. */
  breakpointInfo: BreakpointInfo[];
}

export interface DlomResult {
  method: DlomMethod;
  /** Marketability / holding period in years. */
  holdingPeriod: number;
  volatility: number;
  /** Discount as a decimal (e.g. 0.24 = 24%). */
  value: number;
  /** Cross-check values from both models for transparency. */
  finnerty: number;
  chaffee: number;
}

export interface SensitivityPoint {
  input: number;
  fmv: number;
}

export interface ValuationResult {
  method: ValuationMethod;
  valuationDate: string;
  assumptions: OpmAssumptions;
  equityValue: number;
  backsolve?: {
    seriesName: string;
    targetPricePerShare: number;
    solvedPricePerShare: number;
    roundName?: string;
  };
  opm: OpmResult;
  dlom: DlomResult;
  /** Marketable common per share (pre-DLOM). */
  marketableCommonPerShare: number;
  /** Concluded common FMV per share (post-DLOM). The headline 409A number. */
  concludedFmv: number;
  sensitivity: {
    volatility: SensitivityPoint[];
    timeToLiquidity: SensitivityPoint[];
    dlom: SensitivityPoint[];
  };
  capStructure: CapStructure;
  warnings: string[];
}
