"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { calculateWaterfall } from "@/lib/cap-table";
import { CHART_COLORS } from "@/lib/chart-colors";
import type { CapTableSummary, LiquidationPrefConfig } from "@/lib/cap-table";
import { formatCurrency, formatPercent, formatNumber, cn } from "@/lib/utils";

interface WaterfallAnalyzerProps {
  capTable: CapTableSummary;
  liquidationPrefs: LiquidationPrefConfig[];
}

type PayoutView = "stakeholder" | "shareClass";

const CLASS_TYPE_LABELS: Record<string, string> = {
  common: "Common",
  preferred: "Preferred",
  series_a: "Series A",
  series_b: "Series B",
  option_pool: "Option Pool",
};

const CLASS_COLORS = CHART_COLORS;

export function WaterfallAnalyzer({ capTable, liquidationPrefs }: WaterfallAnalyzerProps) {
  const [exitValue, setExitValue] = useState(100000000);
  const [payoutView, setPayoutView] = useState<PayoutView>("stakeholder");

  const result = useMemo(
    () => calculateWaterfall(exitValue, capTable, liquidationPrefs),
    [exitValue, capTable, liquidationPrefs]
  );

  const { tiers, stakeholderPayouts, shareClassPayouts, summary } = result;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <label className="text-xs text-subtle-foreground uppercase tracking-wider">Exit Valuation</label>
          <Input
            type="number"
            value={exitValue}
            onChange={(e) => setExitValue(Number(e.target.value))}
            className="mt-2 text-2xl font-bold max-w-md"
          />
          <div className="mt-4 flex flex-wrap gap-3">
            {[30_000_000, 50_000_000, 100_000_000, 250_000_000, 500_000_000].map((v) => (
              <button
                key={v}
                onClick={() => setExitValue(v)}
                className="px-3 py-1 rounded-md text-xs border border-border-subtle text-muted-foreground hover:border-brand/40 hover:text-brand transition-colors"
              >
                {formatCurrency(v)}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Price / Share", value: formatCurrency(summary.pricePerShare) },
          { label: "Participating Shares", value: formatNumber(summary.participatingShares) },
          { label: "Total Distributed", value: formatCurrency(summary.totalDistributed) },
          {
            label: "Preferred Decision",
            value:
              summary.preferredConverted > 0
                ? `${summary.preferredConverted} converted`
                : summary.preferredTookPreference > 0
                  ? `${summary.preferredTookPreference} took pref`
                  : "—",
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <p className="text-xs text-subtle-foreground uppercase">{stat.label}</p>
              <p className="mt-1 text-lg font-bold text-foreground stat-value">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Share class summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {shareClassPayouts.map((sc, i) => (
          <Card key={sc.name} className="overflow-hidden">
            <div className="h-1" style={{ background: CLASS_COLORS[i % CLASS_COLORS.length] }} />
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-foreground">{sc.name}</p>
                  <Badge variant="outline" className="mt-1 text-[10px]">
                    {CLASS_TYPE_LABELS[sc.type] || sc.type}
                  </Badge>
                </div>
                <p className="text-lg font-bold text-brand stat-value">
                  {formatPercent(sc.percent, 1)}
                </p>
              </div>
              <p className="mt-3 text-2xl font-bold text-foreground stat-value">
                {formatCurrency(sc.amount)}
              </p>
              <p className="mt-1 text-xs text-subtle-foreground">
                {formatNumber(sc.shares)} shares · {sc.holders.length} holder{sc.holders.length !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Total Payout</CardTitle>
          <div className="flex gap-1 p-1 rounded-lg bg-surface-elevated">
            {(
              [
                { id: "stakeholder" as const, label: "By Stakeholder" },
                { id: "shareClass" as const, label: "By Share Class" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setPayoutView(tab.id)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                  payoutView === tab.id
                    ? "bg-brand/12 text-brand border border-brand/20"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {payoutView === "stakeholder" ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-default text-muted-foreground">
                  <th className="text-left py-3 px-6 font-medium">Stakeholder</th>
                  <th className="text-left py-3 px-6 font-medium">Share Class</th>
                  <th className="text-right py-3 px-6 font-medium">Payout</th>
                  <th className="text-right py-3 px-6 font-medium">% of Exit</th>
                  <th className="text-left py-3 px-6 font-medium">Breakdown</th>
                </tr>
              </thead>
              <tbody>
                {stakeholderPayouts.map((p) => (
                  <tr key={p.name} className="border-b border-border-default/50 hover:bg-surface-overlay/50">
                    <td className="py-3 px-6 font-medium text-foreground">{p.name}</td>
                    <td className="py-3 px-6">
                      <Badge variant="outline" className="text-[10px]">
                        {p.shareClassName}
                      </Badge>
                    </td>
                    <td className="py-3 px-6 text-right stat-value text-brand font-medium">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="py-3 px-6 text-right stat-value">{formatPercent(p.percent, 2)}</td>
                    <td className="py-3 px-6 text-xs text-subtle-foreground">{p.breakdown}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-default text-muted-foreground">
                  <th className="text-left py-3 px-6 font-medium">Share Class</th>
                  <th className="text-left py-3 px-6 font-medium">Type</th>
                  <th className="text-right py-3 px-6 font-medium">Shares</th>
                  <th className="text-right py-3 px-6 font-medium">Payout</th>
                  <th className="text-right py-3 px-6 font-medium">% of Exit</th>
                  <th className="text-left py-3 px-6 font-medium">Holders</th>
                </tr>
              </thead>
              <tbody>
                {shareClassPayouts.map((sc) => (
                  <tr key={sc.name} className="border-b border-border-default/50 hover:bg-surface-overlay/50">
                    <td className="py-3 px-6 font-medium text-foreground">{sc.name}</td>
                    <td className="py-3 px-6">
                      <Badge variant="secondary" className="text-[10px]">
                        {CLASS_TYPE_LABELS[sc.type] || sc.type}
                      </Badge>
                    </td>
                    <td className="py-3 px-6 text-right stat-value">{formatNumber(sc.shares)}</td>
                    <td className="py-3 px-6 text-right stat-value text-brand font-medium">
                      {formatCurrency(sc.amount)}
                    </td>
                    <td className="py-3 px-6 text-right stat-value">{formatPercent(sc.percent, 2)}</td>
                    <td className="py-3 px-6 text-xs text-muted-foreground">{sc.holders.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {tiers.map((tier, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{tier.name}</CardTitle>
              <span className="text-lg font-bold text-brand stat-value">
                {formatCurrency(tier.amount)}
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-default text-muted-foreground">
                  <th className="text-left py-3 px-6 font-medium">Recipient</th>
                  <th className="text-right py-3 px-6 font-medium">Payout</th>
                  <th className="text-right py-3 px-6 font-medium">% of Exit</th>
                  <th className="text-left py-3 px-6 font-medium">Detail</th>
                </tr>
              </thead>
              <tbody>
                {tier.recipients
                  .sort((a, b) => b.amount - a.amount)
                  .map((r, j) => (
                    <tr key={j} className="border-b border-border-default/50">
                      <td className="py-3 px-6 font-medium text-foreground">{r.name}</td>
                      <td className="py-3 px-6 text-right stat-value text-brand">
                        {formatCurrency(r.amount)}
                      </td>
                      <td className="py-3 px-6 text-right stat-value">
                        {formatPercent(r.percent, 2)}
                      </td>
                      <td className="py-3 px-6">
                        {r.detail && (
                          <Badge variant="outline" className="text-[10px] font-normal">
                            {r.detail}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ))}

      <Card className="border-border-default">
        <CardContent className="p-4">
          <p className="text-xs text-subtle-foreground leading-relaxed">
            Waterfall assumes all vested options are exercised if in-the-money. Non-participating preferred
            holders choose the greater of liquidation preference (shares × original issue price × multiple) or
            conversion to common. Unallocated option pool shares are excluded. Option holders participate
            pro-rata on vested, in-the-money grants.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
