"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/ui/select-field";
import { formatNumber, formatCurrency } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

interface SeriesOption {
  id: string;
  name: string;
  originalIssuePrice: number;
  roundName: string | null;
  pricePerShare: number | null;
}

interface CapStructureView {
  commonShares: number;
  fullyDilutedShares: number;
  preferred: { name: string; shares: number; originalIssuePrice: number; liquidationMultiple: number; participating: boolean }[];
  options: { strike: number; shares: number }[];
  optionPoolAvailable: number;
}

interface Props {
  companyName: string;
  series: SeriesOption[];
  backsolveTargetId: string | null;
  defaults: { volatility: number; timeToLiquidity: number; riskFreeRate: number; dividendYield: number; holdingPeriod: number };
  warnings: string[];
  capStructure: CapStructureView;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

export function NewValuationForm({ companyName, series, backsolveTargetId, defaults, warnings, capStructure }: Props) {
  const router = useRouter();
  const pricedSeries = series.filter((s) => s.pricePerShare && s.pricePerShare > 0);
  const canBacksolve = pricedSeries.length > 0;

  const [title, setTitle] = useState(`${companyName} 409A — ${new Date().getFullYear()}`);
  const [valuationDate, setValuationDate] = useState(todayISO());
  const [method, setMethod] = useState<"opm_backsolve" | "opm_manual">(canBacksolve ? "opm_backsolve" : "opm_manual");
  const [seriesId, setSeriesId] = useState(backsolveTargetId ?? pricedSeries[0]?.id ?? "");
  const [manualEquityValue, setManualEquityValue] = useState("");
  const [volatilityPct, setVolatilityPct] = useState((defaults.volatility * 100).toFixed(0));
  const [timeToLiquidity, setTimeToLiquidity] = useState(defaults.timeToLiquidity.toString());
  const [riskFreePct, setRiskFreePct] = useState((defaults.riskFreeRate * 100).toFixed(1));
  const [dividendPct, setDividendPct] = useState((defaults.dividendYield * 100).toFixed(1));
  const [holdingPeriod, setHoldingPeriod] = useState(defaults.holdingPeriod.toString());
  const [dlomMethod, setDlomMethod] = useState<"finnerty" | "chaffee">("finnerty");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        title,
        valuationDate,
        method,
        dlomMethod,
        volatility: Number(volatilityPct) / 100,
        timeToLiquidity: Number(timeToLiquidity),
        riskFreeRate: Number(riskFreePct) / 100,
        dividendYield: Number(dividendPct) / 100,
        holdingPeriod: Number(holdingPeriod),
        backsolveSeriesId: method === "opm_backsolve" ? seriesId : undefined,
        manualEquityValue: method === "opm_manual" ? Number(manualEquityValue) : undefined,
      };
      const res = await fetch("/api/valuations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to run valuation");
      router.push(`/valuations/${data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {warnings.length > 0 && (
          <div className="rounded-xl border border-warning/30 bg-warning/10 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-warning">
              <AlertTriangle className="h-4 w-4" /> Review before finalizing
            </div>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {warnings.map((w, i) => (
                <li key={i}>• {w}</li>
              ))}
            </ul>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Engagement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Report title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vdate">Valuation date</Label>
              <Input id="vdate" type="date" value={valuationDate} onChange={(e) => setValuationDate(e.target.value)} required />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total equity value</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SelectField
              label="Method"
              value={method}
              onChange={(e) => setMethod(e.target.value as "opm_backsolve" | "opm_manual")}
            >
              <option value="opm_backsolve" disabled={!canBacksolve}>
                OPM Backsolve to priced round {canBacksolve ? "" : "(no priced round available)"}
              </option>
              <option value="opm_manual">Manual equity value (asset / market approach)</option>
            </SelectField>

            {method === "opm_backsolve" ? (
              <SelectField label="Backsolve to" value={seriesId} onChange={(e) => setSeriesId(e.target.value)}>
                {pricedSeries.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} @ {formatCurrency(s.pricePerShare ?? s.originalIssuePrice)}/share
                    {s.roundName ? ` (${s.roundName})` : ""}
                  </option>
                ))}
              </SelectField>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="ev">Total equity value (USD)</Label>
                <Input
                  id="ev"
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="e.g. 5000000"
                  value={manualEquityValue}
                  onChange={(e) => setManualEquityValue(e.target.value)}
                  required={method === "opm_manual"}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>OPM &amp; DLOM assumptions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="vol">Equity volatility (%)</Label>
              <Input id="vol" type="number" min="1" max="300" step="1" value={volatilityPct} onChange={(e) => setVolatilityPct(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ttl">Time to liquidity (years)</Label>
              <Input id="ttl" type="number" min="0.1" max="15" step="0.25" value={timeToLiquidity} onChange={(e) => setTimeToLiquidity(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rf">Risk-free rate (%)</Label>
              <Input id="rf" type="number" min="0" max="25" step="0.1" value={riskFreePct} onChange={(e) => setRiskFreePct(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dy">Dividend yield (%)</Label>
              <Input id="dy" type="number" min="0" max="25" step="0.1" value={dividendPct} onChange={(e) => setDividendPct(e.target.value)} required />
            </div>
            <SelectField label="DLOM model" value={dlomMethod} onChange={(e) => setDlomMethod(e.target.value as "finnerty" | "chaffee")}>
              <option value="finnerty">Finnerty (2012) average-strike put</option>
              <option value="chaffee">Chaffee (1993) protective put</option>
            </SelectField>
            <div className="space-y-1.5">
              <Label htmlFor="hp">DLOM holding period (years)</Label>
              <Input id="hp" type="number" min="0.1" max="15" step="0.25" value={holdingPeriod} onChange={(e) => setHoldingPeriod(e.target.value)} required />
            </div>
          </CardContent>
        </Card>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Running…" : "Run valuation"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.push("/valuations")}>
            Cancel
          </Button>
        </div>
      </div>

      <div className="lg:col-span-1">
        <Card className="sticky top-24">
          <CardHeader>
            <CardTitle>Capitalization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Common &amp; equivalents</span>
              <span className="font-medium stat-value">{formatNumber(capStructure.commonShares)}</span>
            </div>
            {capStructure.preferred.map((p) => (
              <div key={p.name} className="flex justify-between">
                <span className="text-muted-foreground">
                  {p.name}
                  <span className="text-subtle-foreground"> · {p.liquidationMultiple}x{p.participating ? " part" : ""}</span>
                </span>
                <span className="font-medium stat-value">{formatNumber(p.shares)}</span>
              </div>
            ))}
            {capStructure.options.map((o) => (
              <div key={o.strike} className="flex justify-between">
                <span className="text-muted-foreground">Options @ ${o.strike.toFixed(4)}</span>
                <span className="font-medium stat-value">{formatNumber(o.shares)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-border-default pt-3">
              <span className="font-medium text-foreground">Fully diluted</span>
              <span className="font-bold stat-value text-brand">{formatNumber(capStructure.fullyDilutedShares)}</span>
            </div>
            <p className="pt-2 text-xs text-subtle-foreground">
              The cap structure is derived automatically from your share classes, closed rounds, and
              grants. Outstanding SAFEs and notes are not modeled — convert them before backsolving.
            </p>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
