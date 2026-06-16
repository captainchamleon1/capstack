/**
 * OPM backsolve.
 *
 * Solves for the total equity value at which the OPM allocates exactly the
 * observed price per share to the most recent preferred financing. The allocated
 * per-share value of a series is monotonically increasing in total equity value,
 * so a bisection reliably converges.
 */

import { seriesPerShare, buildOpmModel, type OpmModel } from "./opm";
import type { CapStructure, OpmAssumptions } from "./types";

export interface BacksolveResult {
  equityValue: number;
  solvedPricePerShare: number;
  iterations: number;
  converged: boolean;
}

export function backsolveEquityValue(
  targetPricePerShare: number,
  seriesId: string,
  cap: CapStructure,
  assumptions: OpmAssumptions,
  model?: OpmModel
): BacksolveResult {
  const m = model ?? buildOpmModel(cap);
  const f = (v: number) => seriesPerShare(v, seriesId, cap, assumptions, m) - targetPricePerShare;

  // Bracket the root. Upper bound: price the whole company as if every share were
  // worth the round price, scaled up generously.
  let lo = 0;
  let hi = Math.max(targetPricePerShare * cap.fullyDilutedShares * 4, 1);

  // Expand hi until f(hi) > 0 (allocated per share exceeds the target).
  for (let i = 0; i < 60 && f(hi) < 0; i++) hi *= 2;

  let mid = hi;
  let converged = false;
  let iterations = 0;
  const tol = targetPricePerShare * 1e-7;

  for (let i = 0; i < 200; i++) {
    iterations = i + 1;
    mid = (lo + hi) / 2;
    const fm = f(mid);
    if (Math.abs(fm) <= tol || hi - lo < Math.max(hi, 1) * 1e-12) {
      converged = true;
      break;
    }
    if (fm > 0) hi = mid;
    else lo = mid;
  }

  return {
    equityValue: mid,
    solvedPricePerShare: seriesPerShare(mid, seriesId, cap, assumptions, m),
    iterations,
    converged,
  };
}
