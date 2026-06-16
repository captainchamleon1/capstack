/**
 * Economic distribution waterfall and breakpoint detection for the OPM.
 *
 * `distribute(W)` returns the dollars each security group receives if the company
 * achieves total equity proceeds `W`. It models:
 *   - Liquidation preferences paid in seniority order (pari-passu pro-rata).
 *   - Optimal conversion of non-participating preferred to common.
 *   - Participating preferred (with optional participation caps).
 *   - Option/warrant exercise via the treasury (net-settlement) method.
 *
 * The function is piecewise-linear in `W`; `detectBreakpoints` recovers the kink
 * locations (the OPM breakpoints) by recursive subdivision, exploiting that
 * linearity so the OPM allocation can be computed exactly per tranche.
 */

import type { CapStructure } from "./types";

export const COMMON_KEY = "common";
export const prefKey = (id: string) => `pref:${id}`;
export const optKey = (strike: number) => `opt:${strike}`;

export type Distribution = Record<string, number>;

interface PrefState {
  id: string;
  key: string;
  shares: number;
  prefAmount: number; // shares * OIP * multiple
  investment: number; // shares * OIP
  participating: boolean;
  capAmount: number | null; // absolute cap on total proceeds (cap multiple * investment)
  seniority: number;
}

function buildPrefStates(cap: CapStructure): PrefState[] {
  return cap.preferred.map((p) => {
    const investment = p.shares * p.originalIssuePrice;
    return {
      id: p.id,
      key: prefKey(p.id),
      shares: p.shares,
      prefAmount: investment * p.liquidationMultiple,
      investment,
      participating: p.participating,
      capAmount:
        p.participating && p.participationCap != null ? p.participationCap * investment : null,
      seniority: p.seniority,
    };
  });
}

/**
 * Allocate residual proceeds `R` among common, converted/participating preferred,
 * and in-the-money options using the treasury method. `prefPaidByKey` holds the
 * preference already received (used to enforce participation caps on total take).
 */
function allocateResidual(
  R: number,
  participants: {
    key: string;
    shares: number;
    strike: number;
    capAmount: number | null;
    prefPaid: number;
  }[]
): Distribution {
  const result: Distribution = {};
  if (R <= 0) {
    for (const p of participants) result[p.key] = (result[p.key] ?? 0) + 0;
    return result;
  }

  // Active set only shrinks across iterations (options falling out of the money,
  // participating preferred hitting caps), guaranteeing termination.
  const active = new Set(participants.map((p) => p.key));
  const byKey = new Map(participants.map((p) => [p.key, p]));
  let residual = R;
  const capped: Distribution = {};

  for (let iter = 0; iter < participants.length + 2; iter++) {
    const activeList = [...active].map((k) => byKey.get(k)!);
    const exerciseProceeds = activeList
      .filter((p) => p.strike > 0)
      .reduce((s, p) => s + p.strike * p.shares, 0);
    const pot = residual + exerciseProceeds;
    const totalShares = activeList.reduce((s, p) => s + p.shares, 0);
    if (totalShares <= 0) break;
    const pps = pot / totalShares;

    let changed = false;

    // Options that are out of the money drop out.
    for (const p of activeList) {
      if (p.strike > 0 && pps <= p.strike) {
        active.delete(p.key);
        changed = true;
      }
    }
    if (changed) continue;

    // Participating preferred that exceed their cap are fixed at the cap.
    for (const p of activeList) {
      if (p.capAmount != null) {
        const totalTake = p.prefPaid + pps * p.shares;
        if (totalTake > p.capAmount + 1e-6) {
          capped[p.key] = Math.max(0, p.capAmount - p.prefPaid);
          residual -= capped[p.key];
          active.delete(p.key);
          changed = true;
        }
      }
    }
    if (!changed) {
      for (const p of activeList) {
        result[p.key] = (result[p.key] ?? 0) + (p.strike > 0 ? (pps - p.strike) * p.shares : pps * p.shares);
      }
      break;
    }
  }

  for (const [key, amount] of Object.entries(capped)) {
    result[key] = (result[key] ?? 0) + amount;
  }
  return result;
}

/**
 * Build the distribution function for a capitalization structure.
 * Returns a closure `distribute(W)` plus the list of all group keys.
 */
export function buildDistribution(cap: CapStructure) {
  const prefs = buildPrefStates(cap);
  const keys = [COMMON_KEY, ...prefs.map((p) => p.key), ...cap.options.map((o) => optKey(o.strike))];

  function distribute(W: number): Distribution {
    const out: Distribution = {};
    for (const k of keys) out[k] = 0;
    if (W <= 0) return out;

    // 1. Determine optimal conversion of non-participating preferred (fixed point).
    const converted = new Set<string>();
    for (let iter = 0; iter < prefs.length + 2; iter++) {
      const { prefPaid, residual } = payPreferences(W, prefs, converted);
      const participants = residualParticipants(cap, prefs, converted, prefPaid);
      const alloc = allocateResidual(residual, participants);
      const pps = impliedCommonPps(alloc, cap, prefs, converted);

      let changed = false;
      for (const p of prefs) {
        if (p.participating) continue; // participating preferred never convert
        const asConverted = p.shares * pps;
        const takingPref = p.prefAmount; // full preference if funded
        if (!converted.has(p.key) && asConverted > takingPref + 1e-6) {
          converted.add(p.key);
          changed = true;
        }
      }
      if (!changed) break;
    }

    // 2. Final distribution with settled conversions.
    const { prefPaid, residual } = payPreferences(W, prefs, converted);
    for (const p of prefs) {
      if (!converted.has(p.key)) out[p.key] += prefPaid[p.key] ?? 0;
    }
    const participants = residualParticipants(cap, prefs, converted, prefPaid);
    const alloc = allocateResidual(residual, participants);
    for (const [key, amount] of Object.entries(alloc)) {
      out[key] = (out[key] ?? 0) + amount;
    }
    return out;
  }

  return { distribute, keys, prefs };
}

/** Pay liquidation preferences in seniority order to non-converted preferred. */
function payPreferences(
  W: number,
  prefs: PrefState[],
  converted: Set<string>
): { prefPaid: Distribution; residual: number } {
  const prefPaid: Distribution = {};
  let remaining = W;

  const claiming = prefs.filter((p) => !converted.has(p.key) && p.prefAmount > 0);
  const tiers = [...new Set(claiming.map((p) => p.seniority))].sort((a, b) => b - a); // senior first

  for (const tier of tiers) {
    if (remaining <= 0) break;
    const inTier = claiming.filter((p) => p.seniority === tier);
    const tierTotal = inTier.reduce((s, p) => s + p.prefAmount, 0);
    const paid = Math.min(remaining, tierTotal);
    for (const p of inTier) {
      prefPaid[p.key] = tierTotal > 0 ? (p.prefAmount / tierTotal) * paid : 0;
    }
    remaining -= paid;
  }

  return { prefPaid, residual: Math.max(0, remaining) };
}

/** Build the residual participant list (common, converted + participating preferred, options). */
function residualParticipants(
  cap: CapStructure,
  prefs: PrefState[],
  converted: Set<string>,
  prefPaid: Distribution
) {
  const participants: {
    key: string;
    shares: number;
    strike: number;
    capAmount: number | null;
    prefPaid: number;
  }[] = [];

  if (cap.commonShares > 0) {
    participants.push({ key: COMMON_KEY, shares: cap.commonShares, strike: 0, capAmount: null, prefPaid: 0 });
  }
  for (const p of prefs) {
    if (converted.has(p.key)) {
      participants.push({ key: p.key, shares: p.shares, strike: 0, capAmount: null, prefPaid: 0 });
    } else if (p.participating) {
      participants.push({
        key: p.key,
        shares: p.shares,
        strike: 0,
        capAmount: p.capAmount,
        prefPaid: prefPaid[p.key] ?? 0,
      });
    }
  }
  for (const o of cap.options) {
    participants.push({ key: optKey(o.strike), shares: o.shares, strike: o.strike, capAmount: null, prefPaid: 0 });
  }
  return participants;
}

/** Implied common per-share from a residual allocation (for the conversion decision). */
function impliedCommonPps(
  alloc: Distribution,
  cap: CapStructure,
  prefs: PrefState[],
  converted: Set<string>
): number {
  // Common per-share = common value / common shares; if no common, infer from a
  // converted/participating class.
  if (cap.commonShares > 0 && alloc[COMMON_KEY]) {
    return alloc[COMMON_KEY] / cap.commonShares;
  }
  for (const p of prefs) {
    if ((converted.has(p.key) || p.participating) && alloc[p.key] && p.shares > 0) {
      return alloc[p.key] / p.shares;
    }
  }
  return 0;
}

/**
 * Detect breakpoints (kinks) of the piecewise-linear distribution on [0, wMax].
 *
 * The distribution is exactly piecewise-linear in total proceeds, so each kink is
 * a point where the marginal slope changes. We scan with a uniform grid (slopes
 * are scale-invariant, so this is well-conditioned), then locate each kink
 * analytically as the intersection of the clean left/right line segments.
 *
 * Returns sorted, de-duplicated interior breakpoints (> 0).
 */
export function detectBreakpoints(
  distribute: (w: number) => Distribution,
  keys: string[],
  wMax: number
): number[] {
  const N = 1500;
  const step = wMax / N;
  if (step <= 0) return [];

  const ws: number[] = new Array(N + 1);
  const ds: Distribution[] = new Array(N + 1);
  for (let i = 0; i <= N; i++) {
    ws[i] = i * step;
    ds[i] = distribute(ws[i]);
  }

  const slopeOf = (i: number): Distribution => {
    const s: Distribution = {};
    for (const k of keys) s[k] = ((ds[i + 1][k] ?? 0) - (ds[i][k] ?? 0)) / step;
    return s;
  };
  const slopes: Distribution[] = [];
  for (let i = 0; i < N; i++) slopes.push(slopeOf(i));

  const slopeTol = 1e-7;
  const differs = (a: Distribution, b: Distribution) => {
    for (const k of keys) if (Math.abs((a[k] ?? 0) - (b[k] ?? 0)) > slopeTol) return true;
    return false;
  };

  const kinks: number[] = [];
  let i = 1;
  while (i < N) {
    if (!differs(slopes[i], slopes[i - 1])) {
      i++;
      continue;
    }
    // Slope changed between segment (i-1) and i. If segment i is itself a blended
    // segment containing the kink, the clean right slope is slope[i+1].
    const sL = slopes[i - 1];
    let rightIdx = i;
    if (i + 1 <= N - 1 && differs(slopes[i], slopes[i + 1])) rightIdx = i + 1;
    const sR = slopes[rightIdx];

    // Anchor the left line at the start of the clean left segment and the right
    // line at the end of the clean right segment, then intersect on the key with
    // the largest slope change.
    let bestK = keys[0];
    let best = -1;
    for (const k of keys) {
      const d = Math.abs((sL[k] ?? 0) - (sR[k] ?? 0));
      if (d > best) {
        best = d;
        bestK = k;
      }
    }
    const lA = i - 1;
    const rA = Math.min(rightIdx + 1, N);
    const m1 = sL[bestK] ?? 0;
    const m2 = sR[bestK] ?? 0;
    if (Math.abs(m1 - m2) > 1e-12) {
      const x0 = ws[lA];
      const y0 = ds[lA][bestK] ?? 0;
      const x1 = ws[rA];
      const y1 = ds[rA][bestK] ?? 0;
      const c = (y1 - y0 - m2 * x1 + m1 * x0) / (m1 - m2);
      if (c > step * 0.5 && c < wMax) kinks.push(c);
    }
    i = rightIdx + 1;
  }

  // Merge near-duplicate kinks.
  kinks.sort((x, y) => x - y);
  const merged: number[] = [];
  const gap = step * 0.5;
  for (const v of kinks) {
    if (merged.length === 0 || v - merged[merged.length - 1] > gap) merged.push(v);
  }
  return merged;
}
