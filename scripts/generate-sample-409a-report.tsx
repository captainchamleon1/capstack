import { writeFileSync } from "fs";
import { renderToBuffer } from "@react-pdf/renderer";
import { runValuation, type CapStructure, type OpmAssumptions } from "../src/lib/valuation";
import { finalizeReportData, buildSensitivityMatrix } from "../src/lib/valuation/report/enrich-report";
import { ValuationPdfDocument } from "../src/lib/valuation/report/valuation-pdf";
import { expirationFromValuationDate } from "../src/lib/valuation/report/report-data";
import type { ValuationInput } from "../src/lib/valuation/engine";

const assumptions: OpmAssumptions = { timeToLiquidity: 4, volatility: 0.6, riskFreeRate: 0.04, dividendYield: 0 };
const cap: CapStructure = {
  commonShares: 8_000_000,
  preferred: [
    { id: "A", name: "Series A Preferred", shares: 2_000_000, originalIssuePrice: 1.0, liquidationMultiple: 1, participating: false, seniority: 1 },
  ],
  options: [{ strike: 0.5, shares: 1_000_000 }],
  fullyDilutedShares: 11_000_000,
};

const valuationInput: ValuationInput = {
  method: "opm_backsolve",
  valuationDate: "2026-06-16",
  cap,
  assumptions,
  dlomMethod: "finnerty",
  holdingPeriod: 4,
  backsolve: { seriesId: "A", seriesName: "Series A Preferred", targetPricePerShare: 1.0, roundName: "Series A" },
};

const result = runValuation(valuationInput);
const sensitivityMatrix = buildSensitivityMatrix(valuationInput);

const data = finalizeReportData(
  {
    company: {
      name: "Acme Robotics",
      legalName: "Acme Robotics, Inc.",
      state: "Delaware",
      incorporationDate: new Date("2023-02-01").toISOString(),
      authorizedShares: 15_000_000,
      businessDescription:
        "Acme Robotics, Inc. develops autonomous mobile robots and software for warehouse logistics and manufacturing automation. The Company sells hardware units and recurring software subscriptions to enterprise customers in North America.",
    },
    meta: {
      title: "Acme Robotics 409A — 2026",
      valuationDate: new Date("2026-06-16").toISOString(),
      expirationDate: expirationFromValuationDate(new Date("2026-06-16").toISOString()),
      reportDate: new Date().toISOString(),
      status: "draft",
      preparedByName: "Equitr Valuations",
      reviewedByName: null,
      reviewedAt: null,
    },
    result,
  },
  "sample-valuation-id",
  {
    sensitivityMatrix,
    fundraiseRounds: [
      {
        name: "Seed",
        type: "seed",
        status: "closed",
        closeDate: new Date("2023-08-15").toISOString(),
        preMoneyValuation: 6_000_000,
        investmentAmount: 1_500_000,
        pricePerShare: 0.35,
      },
      {
        name: "Series A",
        type: "series_a",
        status: "closed",
        closeDate: new Date("2025-11-01").toISOString(),
        preMoneyValuation: 18_000_000,
        investmentAmount: 6_000_000,
        pricePerShare: 1.0,
      },
    ],
    shareClassTerms: [
      { name: "Common Stock", type: "common", liquidationPref: 0, isParticipating: false, seniority: 0 },
      { name: "Series A Preferred", type: "series_a", liquidationPref: 1, isParticipating: false, seniority: 1 },
    ],
  }
);

(async () => {
  const buffer = await renderToBuffer(<ValuationPdfDocument data={data} />);
  const out = "scripts/sample-409a-report.pdf";
  writeFileSync(out, Buffer.from(buffer));
  console.log(`Wrote ${out} (${buffer.byteLength} bytes)`);
  console.log(`Concluded FMV: $${result.concludedFmv.toFixed(4)}/share`);
})();
