/**
 * Option Pricing Method (OPM) allocation.
 *
 * Given a total equity value, the OPM treats each breakpoint as the strike of a
 * call option on the company's equity. The value falling into the tranche between
 * two consecutive breakpoints equals the difference of the two Black-Scholes
 * calls, and is shared among securities according to their marginal participation
 * in that tranche.
 *
 * Breakpoints and the marginal participation fractions depend only on the
 * capitalization structure (not on equity value or volatility), so they are
 * computed once via `buildOpmModel` and reused across the backsolve search and
 * the sensitivity analysis.
 */

import { callValue } from "./black-scholes";
import { buildDistribution, detectBreakpoints, COMMON_KEY, prefKey, optKey } from "./waterfall";
import type {
  CapStructure,
  OpmAssumptions,
  OpmResult,
  AllocationTranche,
  GroupAllocation,
  BreakpointInfo,
} from "./types";

export interface OpmModel {
  keys: string[];
  breakpoints: number[];
  /** Tranche bounds and their (equity-value-independent) marginal fractions. */
  tranches: { from: number; to: number | null; marginalFractions: Record<string, number> }[];
  /** Descriptive metadata for each interior breakpoint. */
  breakpointInfo: BreakpointInfo[];
}

function labelFor(key: string, cap: CapStructure): string {
  if (key === COMMON_KEY) return "Common stock";
  const pref = cap.preferred.find((p) => prefKey(p.id) === key);
  if (pref) return pref.name;
  const opt = cap.options.find((o) => optKey(o.strike) === key);
  if (opt) return `Options @ $${opt.strike.toFixed(4)}`;
  return key;
}

/** Describe the economic event at a breakpoint by comparing marginal fractions. */
function describeEvent(
  prev: Record<string, number>,
  cur: Record<string, number>,
  keys: string[],
  cap: CapStructure
): string {
  const eps = 1e-6;
  const parts: string[] = [];
  for (const k of keys) {
    const p = prev[k] ?? 0;
    const c = cur[k] ?? 0;
    if (p < eps && c >= eps) {
      if (k === COMMON_KEY) parts.push("Common stock begins to participate");
      else if (k.startsWith("opt:")) parts.push(`${labelFor(k, cap)} exercise`);
      else parts.push(`${labelFor(k, cap)} converts to common`);
    } else if (p >= eps && c < eps) {
      if (k.startsWith("pref:")) parts.push(`${labelFor(k, cap)} liquidation preference satisfied`);
    }
  }
  return parts.length > 0 ? parts.join("; ") : "Allocation of proceeds changes";
}

function computeWMax(cap: CapStructure): number {
  const totalPref = cap.preferred.reduce(
    (s, p) => s + p.shares * p.originalIssuePrice * p.liquidationMultiple,
    0
  );
  const maxStrike = cap.options.reduce((m, o) => Math.max(m, o.strike), 0);
  const base = totalPref * 4 + maxStrike * cap.fullyDilutedShares * 4;
  return Math.max(base, 1) + Math.max(totalPref, 1) + 1;
}

export function buildOpmModel(cap: CapStructure): OpmModel {
  const { distribute, keys } = buildDistribution(cap);

  let wMax = computeWMax(cap);
  let breakpoints = detectBreakpoints(distribute, keys, wMax);
  for (let i = 0; i < 4 && breakpoints.length > 0 && breakpoints[breakpoints.length - 1] > wMax * 0.8; i++) {
    wMax *= 2;
    breakpoints = detectBreakpoints(distribute, keys, wMax);
  }

  const bounds = [0, ...breakpoints, null] as (number | null)[];
  const tranches: OpmModel["tranches"] = [];

  for (let i = 0; i < bounds.length - 1; i++) {
    const lo = bounds[i] as number;
    const hi = bounds[i + 1];
    const span = hi == null ? Math.max(wMax - lo, lo + 1) : hi - lo;
    const p1 = lo + span * 0.25;
    const p2 = lo + span * 0.75;
    const d1 = distribute(p1);
    const d2 = distribute(p2);

    const rawFrac: Record<string, number> = {};
    let fracSum = 0;
    for (const k of keys) {
      const f = ((d2[k] ?? 0) - (d1[k] ?? 0)) / (p2 - p1);
      rawFrac[k] = Math.max(0, f);
      fracSum += rawFrac[k];
    }
    const marginalFractions: Record<string, number> = {};
    for (const k of keys) marginalFractions[k] = fracSum > 0 ? rawFrac[k] / fracSum : 0;

    tranches.push({ from: lo, to: hi, marginalFractions });
  }

  // Describe each interior breakpoint (boundary between consecutive tranches).
  const breakpointInfo: BreakpointInfo[] = [];
  for (let i = 1; i < tranches.length; i++) {
    const value = tranches[i].from;
    const d = distribute(value);
    breakpointInfo.push({
      value,
      event: describeEvent(tranches[i - 1].marginalFractions, tranches[i].marginalFractions, keys, cap),
      commonPricePerShare: cap.commonShares > 0 ? (d[COMMON_KEY] ?? 0) / cap.commonShares : 0,
    });
  }

  return { keys, breakpoints, tranches, breakpointInfo };
}

export function allocateWithModel(
  model: OpmModel,
  equityValue: number,
  cap: CapStructure,
  assumptions: OpmAssumptions
): OpmResult {
  const value: Record<string, number> = {};
  for (const k of model.keys) value[k] = 0;

  const call = (strike: number) =>
    callValue({
      spot: equityValue,
      strike,
      time: assumptions.timeToLiquidity,
      rate: assumptions.riskFreeRate,
      volatility: assumptions.volatility,
      dividendYield: assumptions.dividendYield,
    });

  const tranches: AllocationTranche[] = model.tranches.map((t) => {
    const callValueLow = call(t.from);
    const trancheValue = t.to == null ? callValueLow : callValueLow - call(t.to);
    for (const k of model.keys) value[k] += (t.marginalFractions[k] ?? 0) * trancheValue;
    return { from: t.from, to: t.to, trancheValue, callValueLow, marginalFractions: t.marginalFractions };
  });

  const allocations = buildGroupAllocations(cap, value, equityValue);
  const common = allocations.find((a) => a.kind === "common");

  return {
    equityValue,
    allocations,
    commonPerShare: common ? common.perShare : 0,
    tranches,
    breakpointInfo: model.breakpointInfo,
  };
}

export function allocateOpm(
  equityValue: number,
  cap: CapStructure,
  assumptions: OpmAssumptions
): OpmResult {
  return allocateWithModel(buildOpmModel(cap), equityValue, cap, assumptions);
}

function buildGroupAllocations(
  cap: CapStructure,
  value: Record<string, number>,
  equityValue: number
): GroupAllocation[] {
  const out: GroupAllocation[] = [];

  out.push({
    key: COMMON_KEY,
    label: "Common stock",
    kind: "common",
    shares: cap.commonShares,
    value: value[COMMON_KEY] ?? 0,
    perShare: cap.commonShares > 0 ? (value[COMMON_KEY] ?? 0) / cap.commonShares : 0,
    percentOfEquity: equityValue > 0 ? (value[COMMON_KEY] ?? 0) / equityValue : 0,
  });

  for (const p of cap.preferred) {
    const v = value[prefKey(p.id)] ?? 0;
    out.push({
      key: prefKey(p.id),
      label: p.name,
      kind: "preferred",
      shares: p.shares,
      value: v,
      perShare: p.shares > 0 ? v / p.shares : 0,
      percentOfEquity: equityValue > 0 ? v / equityValue : 0,
    });
  }

  for (const o of cap.options) {
    const v = value[optKey(o.strike)] ?? 0;
    out.push({
      key: optKey(o.strike),
      label: `Options @ $${o.strike.toFixed(4)}`,
      kind: "option",
      shares: o.shares,
      value: v,
      perShare: o.shares > 0 ? v / o.shares : 0,
      percentOfEquity: equityValue > 0 ? v / equityValue : 0,
    });
  }

  return out;
}

/** Per-share OPM value for a specific preferred series at a given equity value. */
export function seriesPerShare(
  equityValue: number,
  seriesId: string,
  cap: CapStructure,
  assumptions: OpmAssumptions,
  model?: OpmModel
): number {
  const m = model ?? buildOpmModel(cap);
  const result = allocateWithModel(m, equityValue, cap, assumptions);
  const alloc = result.allocations.find((a) => a.key === prefKey(seriesId));
  return alloc ? alloc.perShare : 0;
}
