/**
 * Black-Scholes option pricing primitives used by the Option Pricing Method.
 *
 * All functions operate on a single underlying "equity value" and use a
 * continuous dividend yield. The cumulative normal is implemented with a
 * high-accuracy rational approximation (max abs error < 1e-7).
 */

/** Standard normal probability density function. */
export function normPdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

/**
 * Cumulative standard normal distribution.
 * Zelen & Severo (Abramowitz & Stegun 26.2.17) rational approximation.
 */
export function normCdf(x: number): number {
  if (x === 0) return 0.5;
  const negative = x < 0;
  const z = Math.abs(x);
  const t = 1 / (1 + 0.2316419 * z);
  const poly =
    t *
    (0.319381530 +
      t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  const cdf = 1 - normPdf(z) * poly;
  return negative ? 1 - cdf : cdf;
}

export interface BsParams {
  /** Underlying equity value (spot). */
  spot: number;
  /** Strike price (breakpoint). */
  strike: number;
  /** Time to liquidity in years. */
  time: number;
  /** Risk-free rate (continuous). */
  rate: number;
  /** Volatility (annualized). */
  volatility: number;
  /** Dividend yield (continuous). */
  dividendYield: number;
}

/**
 * European call option value on the total equity.
 *
 * A call struck at 0 is worth the full (dividend-discounted) equity value, which
 * is the basis for the OPM breakpoint ladder.
 */
export function callValue({ spot, strike, time, rate, volatility, dividendYield }: BsParams): number {
  if (spot <= 0) return 0;
  if (strike <= 0) return spot * Math.exp(-dividendYield * time);
  if (time <= 0 || volatility <= 0) {
    // Intrinsic value at expiry / zero volatility.
    return Math.max(0, spot * Math.exp(-dividendYield * time) - strike * Math.exp(-rate * time));
  }
  const sigmaSqrtT = volatility * Math.sqrt(time);
  const d1 =
    (Math.log(spot / strike) + (rate - dividendYield + 0.5 * volatility * volatility) * time) /
    sigmaSqrtT;
  const d2 = d1 - sigmaSqrtT;
  return (
    spot * Math.exp(-dividendYield * time) * normCdf(d1) -
    strike * Math.exp(-rate * time) * normCdf(d2)
  );
}

/** European put option value (used by the Chaffee DLOM model). */
export function putValue(params: BsParams): number {
  const { spot, strike, time, rate, dividendYield } = params;
  const call = callValue(params);
  return call - spot * Math.exp(-dividendYield * time) + strike * Math.exp(-rate * time);
}
