"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/ui/select-field";
import { formatCurrency } from "@/lib/utils";
import { Download, CheckCircle2, Eye, Save } from "lucide-react";

interface SeriesOption {
  id: string;
  name: string;
  pricePerShare: number | null;
  roundName: string | null;
}

interface Props {
  id: string;
  companyName: string;
  title: string;
  valuationDate: string;
  status: string;
  reviewNotes: string | null;
  method: "opm_backsolve" | "opm_manual";
  dlomMethod: "finnerty" | "chaffee";
  volatility: number;
  timeToLiquidity: number;
  riskFreeRate: number;
  dividendYield: number;
  holdingPeriod: number;
  concludedFmv: number;
  series: SeriesOption[];
  backsolveSeriesId: string | null;
  manualEquityValue: number | null;
}

export function AnalystValuationWorkspace(props: Props) {
  const router = useRouter();
  const pricedSeries = props.series.filter((s) => s.pricePerShare && s.pricePerShare > 0);

  const [title, setTitle] = useState(props.title);
  const [valuationDate, setValuationDate] = useState(props.valuationDate.slice(0, 10));
  const [reviewNotes, setReviewNotes] = useState(props.reviewNotes ?? "");
  const [method, setMethod] = useState(props.method);
  const [seriesId, setSeriesId] = useState(props.backsolveSeriesId ?? pricedSeries[0]?.id ?? "");
  const [manualEquityValue, setManualEquityValue] = useState(props.manualEquityValue?.toString() ?? "");
  const [volatilityPct, setVolatilityPct] = useState((props.volatility * 100).toFixed(0));
  const [timeToLiquidity, setTimeToLiquidity] = useState(props.timeToLiquidity.toString());
  const [riskFreePct, setRiskFreePct] = useState((props.riskFreeRate * 100).toFixed(1));
  const [dividendPct, setDividendPct] = useState((props.dividendYield * 100).toFixed(1));
  const [holdingPeriod, setHoldingPeriod] = useState(props.holdingPeriod.toString());
  const [dlomMethod, setDlomMethod] = useState(props.dlomMethod);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fmv, setFmv] = useState(props.concludedFmv);

  function payload(status?: "in_review" | "final") {
    return {
      title,
      valuationDate,
      reviewNotes: reviewNotes.trim() || undefined,
      status,
      method,
      dlomMethod,
      volatility: Number(volatilityPct) / 100,
      timeToLiquidity: Number(timeToLiquidity),
      riskFreeRate: Number(riskFreePct) / 100,
      dividendYield: Number(dividendPct) / 100,
      holdingPeriod: Number(holdingPeriod),
      backsolveSeriesId: method === "opm_backsolve" ? seriesId : undefined,
      manualEquityValue: method === "opm_manual" ? Number(manualEquityValue) : undefined,
      rerun: true,
    };
  }

  async function save(status?: "in_review" | "final") {
    setBusy(status ?? "save");
    setError(null);
    try {
      const res = await fetch(`/api/analyst/valuations/${props.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload(status)),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setFmv(data.concludedFmv);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card className="border-border-default">
          <CardContent className="p-4 text-sm text-muted-foreground">
            Valuation modeling — adjust assumptions and recalculate. Client-provided company data is shown above.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Engagement</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Company</Label>
              <Input value={props.companyName} disabled />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="atitle">Report title</Label>
              <Input id="atitle" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="avdate">Valuation date</Label>
              <Input id="avdate" type="date" value={valuationDate} onChange={(e) => setValuationDate(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total equity value</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SelectField label="Method" value={method} onChange={(e) => setMethod(e.target.value as typeof method)}>
              <option value="opm_backsolve" disabled={pricedSeries.length === 0}>
                OPM backsolve to priced round
              </option>
              <option value="opm_manual">Manual equity value</option>
            </SelectField>
            {method === "opm_backsolve" ? (
              <SelectField label="Backsolve to" value={seriesId} onChange={(e) => setSeriesId(e.target.value)}>
                {pricedSeries.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} @ {formatCurrency(s.pricePerShare ?? 0)}
                    {s.roundName ? ` (${s.roundName})` : ""}
                  </option>
                ))}
              </SelectField>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="aev">Total equity value (USD)</Label>
                <Input id="aev" type="number" value={manualEquityValue} onChange={(e) => setManualEquityValue(e.target.value)} />
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
              <Label>Volatility (%)</Label>
              <Input type="number" value={volatilityPct} onChange={(e) => setVolatilityPct(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Time to liquidity (years)</Label>
              <Input type="number" step="0.25" value={timeToLiquidity} onChange={(e) => setTimeToLiquidity(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Risk-free rate (%)</Label>
              <Input type="number" step="0.1" value={riskFreePct} onChange={(e) => setRiskFreePct(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Dividend yield (%)</Label>
              <Input type="number" step="0.1" value={dividendPct} onChange={(e) => setDividendPct(e.target.value)} />
            </div>
            <SelectField label="DLOM model" value={dlomMethod} onChange={(e) => setDlomMethod(e.target.value as typeof dlomMethod)}>
              <option value="finnerty">Finnerty (2012)</option>
              <option value="chaffee">Chaffee (1993)</option>
            </SelectField>
            <div className="space-y-1.5">
              <Label>DLOM holding period (years)</Label>
              <Input type="number" step="0.25" value={holdingPeriod} onChange={(e) => setHoldingPeriod(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Analyst review notes</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              className="flex min-h-[120px] w-full rounded-lg border border-border-default bg-surface px-3 py-2 text-sm"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Internal notes and conclusions for the report…"
            />
          </CardContent>
        </Card>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex flex-wrap gap-2">
          <Button disabled={busy !== null} onClick={() => save()}>
            <Save className="h-4 w-4" /> {busy === "save" ? "Running…" : "Recalculate"}
          </Button>
          <Button variant="outline" disabled={busy !== null} onClick={() => save("in_review")}>
            <Eye className="h-4 w-4" /> {busy === "in_review" ? "…" : "Save & mark in review"}
          </Button>
          <Button variant="default" disabled={busy !== null} onClick={() => save("final")}>
            <CheckCircle2 className="h-4 w-4" /> {busy === "final" ? "…" : "Finalize for client"}
          </Button>
          <Button asChild variant="secondary">
            <a href={`/api/valuations/${props.id}/report`} target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4" /> Preview report
            </a>
          </Button>
        </div>
      </div>

      <div>
        <Card className="sticky top-24 border-brand/30">
          <CardContent className="p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand">Concluded FMV</p>
            <p className="mt-2 font-mono text-3xl font-bold tabular-nums">${fmv.toFixed(4)}</p>
            <p className="mt-1 text-sm text-muted-foreground">per common share</p>
            <p className="mt-4 text-xs text-subtle-foreground">
              Status: <span className="font-medium text-foreground">{props.status}</span>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
