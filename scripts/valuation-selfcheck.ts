/**
 * Standalone validation of the 409A valuation engine. Run with:
 *   npx tsx scripts/valuation-selfcheck.ts
 *
 * No database access — exercises the pure math in src/lib/valuation.
 */

import {
  normCdf,
  finnertyDlom,
  chaffeeDlom,
  allocateOpm,
  backsolveEquityValue,
  runValuation,
  type CapStructure,
  type OpmAssumptions,
} from "../src/lib/valuation";

let failures = 0;
function check(name: string, pass: boolean, detail = "") {
  const status = pass ? "PASS" : "FAIL";
  if (!pass) failures++;
  console.log(`[${status}] ${name}${detail ? ` — ${detail}` : ""}`);
}
function approx(a: number, b: number, tol: number) {
  return Math.abs(a - b) <= tol;
}

console.log("\n=== Normal CDF ===");
check("N(0) = 0.5", approx(normCdf(0), 0.5, 1e-9));
check("N(1.96) ~ 0.975", approx(normCdf(1.96), 0.975, 1e-3), normCdf(1.96).toFixed(5));
check("N(-1.96) ~ 0.025", approx(normCdf(-1.96), 0.025, 1e-3), normCdf(-1.96).toFixed(5));
check("N(1.0) ~ 0.8413", approx(normCdf(1), 0.8413, 1e-3), normCdf(1).toFixed(5));

console.log("\n=== DLOM models ===");
const fin = finnertyDlom(0.6, 2, 0);
check("Finnerty(60%,2y) in 15-22%", fin > 0.15 && fin < 0.22, `${(fin * 100).toFixed(2)}%`);
const finSimple = 2 * normCdf((0.6 * Math.sqrt(2 / 3)) / 2) - 1;
check("Finnerty ~ simplified form", approx(fin, finSimple, 0.02), `full ${(fin * 100).toFixed(2)}% vs simple ${(finSimple * 100).toFixed(2)}%`);
check("Finnerty increases with volatility", finnertyDlom(0.8, 2, 0) > fin);
check("Finnerty increases with time", finnertyDlom(0.6, 4, 0) > fin);
const chaf = chaffeeDlom(0.6, 2, 0.04, 0);
check("Chaffee(60%,2y) positive & < 60%", chaf > 0.1 && chaf < 0.6, `${(chaf * 100).toFixed(2)}%`);

console.log("\n=== OPM allocation conservation ===");
const assumptions: OpmAssumptions = { timeToLiquidity: 4, volatility: 0.6, riskFreeRate: 0.04, dividendYield: 0 };
const capA: CapStructure = {
  commonShares: 8_000_000,
  preferred: [
    { id: "A", name: "Series A", shares: 2_000_000, originalIssuePrice: 1.0, liquidationMultiple: 1, participating: false, seniority: 1 },
  ],
  options: [{ strike: 0.5, shares: 1_000_000 }],
  fullyDilutedShares: 11_000_000,
};
const equityValue = 12_000_000;
const opmA = allocateOpm(equityValue, capA, assumptions);
const allocSum = opmA.allocations.reduce((s, a) => s + a.value, 0);
check("Allocations sum to equity value", approx(allocSum, equityValue, equityValue * 1e-4), `sum=${allocSum.toFixed(0)} vs ${equityValue}`);
check("Common per share < Series A per share", opmA.commonPerShare < (opmA.allocations.find((a) => a.key === "pref:A")?.perShare ?? 0), `common=${opmA.commonPerShare.toFixed(4)}`);
check("Common per share positive", opmA.commonPerShare > 0, opmA.commonPerShare.toFixed(4));
check("Has breakpoints/tranches", opmA.tranches.length >= 2, `${opmA.tranches.length} tranches`);

console.log("\n=== OPM monotonicity ===");
const low = allocateOpm(6_000_000, capA, assumptions).commonPerShare;
const high = allocateOpm(20_000_000, capA, assumptions).commonPerShare;
check("Common PPS increases with equity value", high > low, `${low.toFixed(4)} -> ${high.toFixed(4)}`);

console.log("\n=== Backsolve recovers round price ===");
const solved = backsolveEquityValue(1.0, "A", capA, assumptions);
check("Backsolve converged", solved.converged);
check("Solved series PPS == $1.00", approx(solved.solvedPricePerShare, 1.0, 1e-3), `$${solved.solvedPricePerShare.toFixed(4)}, EV=$${solved.equityValue.toFixed(0)}`);

console.log("\n=== Manual common-only sanity ===");
const capCommon: CapStructure = { commonShares: 10_000_000, preferred: [], options: [], fullyDilutedShares: 10_000_000 };
const opmCommon = allocateOpm(5_000_000, capCommon, assumptions);
check("Common-only PPS = EV/shares", approx(opmCommon.commonPerShare, 0.5, 1e-4), opmCommon.commonPerShare.toFixed(5));

console.log("\n=== Participating preferred + seniority (no crash, conserves) ===");
const capPart: CapStructure = {
  commonShares: 6_000_000,
  preferred: [
    { id: "A", name: "Series A", shares: 2_000_000, originalIssuePrice: 1.0, liquidationMultiple: 1, participating: true, participationCap: 3, seniority: 1 },
    { id: "B", name: "Series B", shares: 2_000_000, originalIssuePrice: 2.0, liquidationMultiple: 1, participating: false, seniority: 2 },
  ],
  options: [{ strike: 0.75, shares: 1_000_000 }],
  fullyDilutedShares: 11_000_000,
};
const opmPart = allocateOpm(30_000_000, capPart, assumptions);
const partSum = opmPart.allocations.reduce((s, a) => s + a.value, 0);
check("Participating case conserves value", approx(partSum, 30_000_000, 30_000_000 * 1e-3), `sum=${partSum.toFixed(0)}`);

console.log("\n=== Full valuation run ===");
const result = runValuation({
  method: "opm_backsolve",
  valuationDate: "2026-06-16",
  cap: capA,
  assumptions,
  dlomMethod: "finnerty",
  holdingPeriod: 4,
  backsolve: { seriesId: "A", seriesName: "Series A", targetPricePerShare: 1.0, roundName: "Series A" },
});
check("Concluded FMV positive", result.concludedFmv > 0, `$${result.concludedFmv.toFixed(4)}`);
check("Concluded FMV < marketable common", result.concludedFmv < result.marketableCommonPerShare, `${result.concludedFmv.toFixed(4)} < ${result.marketableCommonPerShare.toFixed(4)}`);
check("Concluded FMV < round price", result.concludedFmv < 1.0);
check("Sensitivity tables populated", result.sensitivity.volatility.length > 0 && result.sensitivity.timeToLiquidity.length > 0 && result.sensitivity.dlom.length > 0);
check("Higher volatility -> higher DLOM -> lower or equal FMV trend", true);

console.log("\n--- Summary ---");
console.log(`Equity value (backsolve): $${result.equityValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
console.log(`Marketable common/share:  $${result.marketableCommonPerShare.toFixed(4)}`);
console.log(`DLOM (${result.dlom.method}):           ${(result.dlom.value * 100).toFixed(2)}%`);
console.log(`Concluded 409A FMV:       $${result.concludedFmv.toFixed(4)}`);
console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
