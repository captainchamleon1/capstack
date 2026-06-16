/**
 * Discount for Lack of Marketability (DLOM) models.
 *
 * Two industry-standard option-based models are implemented:
 *
 *  - Finnerty (2012) average-strike (Asian) put option model. This is the most
 *    widely used model in 409A practice. Full variance-adjusted closed form:
 *
 *      v^2 = sigma^2 * T + ln( 2 * (e^{sigma^2 T} - sigma^2 T - 1) ) - 2 ln( e^{sigma^2 T} - 1 )
 *      DLOM = e^{-qT} * ( 2 * N(v/2) - 1 )
 *
 *    (Reduces to the common simplified form DLOM = 2*N(sigma*sqrt(T/3)/2) - 1
 *     for small sigma^2 * T.)
 *
 *  - Chaffee (1993) protective put: an at-the-money European put as a fraction
 *    of value, DLOM = Put(S=K) / S.
 */

import { normCdf, putValue } from "./black-scholes";
import type { DlomMethod, DlomResult } from "./types";

/** Finnerty (2012) average-strike put option DLOM (decimal). */
export function finnertyDlom(volatility: number, time: number, dividendYield = 0): number {
  if (volatility <= 0 || time <= 0) return 0;
  const varT = volatility * volatility * time;
  const expVarT = Math.exp(varT);
  // Guard the logs against tiny inputs.
  const inner = 2 * (expVarT - varT - 1);
  const denom = expVarT - 1;
  if (inner <= 0 || denom <= 0) {
    // Low-variance limit: v^2 -> sigma^2 T / 3.
    const v = volatility * Math.sqrt(time / 3);
    return Math.max(0, Math.exp(-dividendYield * time) * (2 * normCdf(v / 2) - 1));
  }
  const vSquared = varT + Math.log(inner) - 2 * Math.log(denom);
  const v = Math.sqrt(Math.max(0, vSquared));
  return Math.max(0, Math.exp(-dividendYield * time) * (2 * normCdf(v / 2) - 1));
}

/** Chaffee (1993) at-the-money protective put DLOM (decimal). */
export function chaffeeDlom(
  volatility: number,
  time: number,
  riskFreeRate: number,
  dividendYield = 0
): number {
  if (volatility <= 0 || time <= 0) return 0;
  // At-the-money: S = K = 1, discount is the put value as a fraction of S.
  const put = putValue({
    spot: 1,
    strike: 1,
    time,
    rate: riskFreeRate,
    volatility,
    dividendYield,
  });
  return Math.max(0, Math.min(1, put));
}

export function computeDlom(
  method: DlomMethod,
  volatility: number,
  holdingPeriod: number,
  riskFreeRate: number,
  dividendYield = 0
): DlomResult {
  const finnerty = finnertyDlom(volatility, holdingPeriod, dividendYield);
  const chaffee = chaffeeDlom(volatility, holdingPeriod, riskFreeRate, dividendYield);
  return {
    method,
    holdingPeriod,
    volatility,
    value: method === "finnerty" ? finnerty : chaffee,
    finnerty,
    chaffee,
  };
}
