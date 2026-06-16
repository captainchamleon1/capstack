"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/ui/select-field";
import { formatNumber } from "@/lib/utils";
import { STAGE_LABELS, type CompanyStage } from "@/lib/valuation/client-submission";
import { AlertTriangle, ExternalLink } from "lucide-react";

interface CompanyProfile {
  legalName: string;
  state: string | null;
  incorporationDate: string | null;
  ein: string | null;
}

interface CapStructureView {
  commonShares: number;
  fullyDilutedShares: number;
  preferred: { name: string; shares: number }[];
  options: { strike: number; shares: number }[];
}

interface Props {
  companyName: string;
  companyProfile: CompanyProfile;
  priorFmv: number | null;
  priorFmvDate: string | null;
  warnings: string[];
  capStructure: CapStructureView;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

function numInput(value: string, onChange: (v: string) => void, props: React.ComponentProps<typeof Input>) {
  return <Input type="number" value={value} onChange={(e) => onChange(e.target.value)} {...props} />;
}

export function ValuationSubmissionForm({
  companyName,
  companyProfile,
  priorFmv,
  priorFmvDate,
  warnings,
  capStructure,
}: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(`${companyName} 409A — ${new Date().getFullYear()}`);
  const [valuationDate, setValuationDate] = useState(todayISO());

  const [businessDescription, setBusinessDescription] = useState("");
  const [industry, setIndustry] = useState("");
  const [stage, setStage] = useState<CompanyStage>("early_revenue");
  const [revenueTtm, setRevenueTtm] = useState("");
  const [revenuePriorYear, setRevenuePriorYear] = useState("");
  const [cashBalance, setCashBalance] = useState("");
  const [monthlyBurn, setMonthlyBurn] = useState("");
  const [headcount, setHeadcount] = useState("");
  const [priorFmvInput, setPriorFmvInput] = useState(priorFmv != null ? priorFmv.toString() : "");
  const [priorFmvDateInput, setPriorFmvDateInput] = useState(priorFmvDate?.slice(0, 10) ?? "");
  const [expectedLiquidityYears, setExpectedLiquidityYears] = useState("");
  const [materialEvents, setMaterialEvents] = useState("");
  const [outstandingSafesNotes, setOutstandingSafesNotes] = useState("");

  const [capConfirmed, setCapConfirmed] = useState(false);
  const [financialsConfirmed, setFinancialsConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/valuations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          valuationDate,
          capTableConfirmed: capConfirmed,
          financialsConfirmed,
          submission: {
            businessDescription,
            industry,
            stage,
            revenueTtm: revenueTtm || null,
            revenuePriorYear: revenuePriorYear || null,
            cashBalance: cashBalance || null,
            monthlyBurn: monthlyBurn || null,
            headcount: headcount || null,
            priorFmv: priorFmvInput || null,
            priorFmvDate: priorFmvDateInput || null,
            expectedLiquidityYears: expectedLiquidityYears || null,
            materialEvents: materialEvents || null,
            outstandingSafesNotes: outstandingSafesNotes || null,
            companyProfile,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
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
        <Card className="border-brand/20 bg-brand/5">
          <CardContent className="p-5 text-sm text-muted-foreground">
            Provide your company and financial information below. An Equitr valuation analyst will use this
            data — along with your cap table — to prepare your 409A report. You do not need to enter valuation
            model assumptions; that is handled by your analyst.
          </CardContent>
        </Card>

        {warnings.length > 0 && (
          <div className="rounded-xl border border-warning/30 bg-warning/10 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-warning">
              <AlertTriangle className="h-4 w-4" /> Please review before submitting
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
            <CardTitle>Request details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="title">Request name</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              <p className="text-xs text-subtle-foreground">e.g. &quot;Acme Robotics 409A — 2026&quot;</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vdate">Valuation date needed</Label>
              <Input id="vdate" type="date" value={valuationDate} onChange={(e) => setValuationDate(e.target.value)} required />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About your company</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 text-sm">
              <div>
                <p className="text-subtle-foreground">Legal name</p>
                <p className="font-medium">{companyProfile.legalName}</p>
              </div>
              <div>
                <p className="text-subtle-foreground">State of incorporation</p>
                <p className="font-medium">{companyProfile.state || "—"}</p>
              </div>
            </div>
            <p className="text-xs text-subtle-foreground">
              Update in{" "}
              <Link href="/settings" className="text-brand hover:underline">
                company settings
              </Link>{" "}
              if incorrect.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="industry">Industry / sector</Label>
              <Input
                id="industry"
                placeholder="e.g. Warehouse robotics, B2B SaaS, Fintech"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                required
              />
            </div>
            <SelectField label="Company stage" value={stage} onChange={(e) => setStage(e.target.value as CompanyStage)}>
              {Object.entries(STAGE_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </SelectField>
            <div className="space-y-1.5">
              <Label htmlFor="biz">Business description</Label>
              <textarea
                id="biz"
                className="flex min-h-[120px] w-full rounded-lg border border-border-default bg-surface px-3 py-2 text-sm"
                placeholder="What does the company do? Products, customers, business model, competitive position…"
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial overview</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="rev-ttm">Revenue — trailing 12 months (USD)</Label>
              {numInput(revenueTtm, setRevenueTtm, { id: "rev-ttm", min: 0, step: 1000, placeholder: "Optional" })}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rev-prior">Revenue — prior fiscal year (USD)</Label>
              {numInput(revenuePriorYear, setRevenuePriorYear, { id: "rev-prior", min: 0, step: 1000, placeholder: "Optional" })}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cash">Cash &amp; equivalents (USD)</Label>
              {numInput(cashBalance, setCashBalance, { id: "cash", min: 0, step: 1000, placeholder: "As of valuation date" })}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="burn">Net monthly cash burn (USD)</Label>
              {numInput(monthlyBurn, setMonthlyBurn, { id: "burn", min: 0, step: 1000, placeholder: "Optional" })}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hc">Full-time employees</Label>
              {numInput(headcount, setHeadcount, { id: "hc", min: 0, step: 1, placeholder: "Headcount" })}
            </div>
            <p className="sm:col-span-2 text-xs text-subtle-foreground">
              Use management&apos;s best estimate as of the valuation date. Your analyst may request supporting
              financial statements.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prior 409A &amp; outlook</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="prior-fmv">Prior 409A FMV per share (USD)</Label>
              {numInput(priorFmvInput, setPriorFmvInput, { id: "prior-fmv", min: 0, step: 0.0001, placeholder: "If applicable" })}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prior-date">Prior 409A effective date</Label>
              <Input id="prior-date" type="date" value={priorFmvDateInput} onChange={(e) => setPriorFmvDateInput(e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="liquidity">Expected years until liquidity event</Label>
              {numInput(expectedLiquidityYears, setExpectedLiquidityYears, {
                id: "liquidity",
                min: 0.5,
                max: 15,
                step: 0.5,
                placeholder: "e.g. 3 — IPO, acquisition, or other exit",
              })}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="events">Material events since last valuation</Label>
              <textarea
                id="events"
                className="flex min-h-[80px] w-full rounded-lg border border-border-default bg-surface px-3 py-2 text-sm"
                placeholder="New financing, major contracts, leadership changes, product launches…"
                value={materialEvents}
                onChange={(e) => setMaterialEvents(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="safes">Outstanding SAFEs, convertible notes, or warrants not on cap table</Label>
              <textarea
                id="safes"
                className="flex min-h-[80px] w-full rounded-lg border border-border-default bg-surface px-3 py-2 text-sm"
                placeholder="List any instruments not yet reflected in your Equitr cap table…"
                value={outstandingSafesNotes}
                onChange={(e) => setOutstandingSafesNotes(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Confirmations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <label className="flex cursor-pointer items-start gap-3">
              <input type="checkbox" className="mt-1" checked={capConfirmed} onChange={(e) => setCapConfirmed(e.target.checked)} />
              <span>
                <span className="font-medium text-foreground">Cap table is complete and accurate</span>
                <span className="mt-0.5 block text-muted-foreground">
                  Share classes, grants, and closed rounds are up to date.{" "}
                  <Link href="/cap-table" className="text-brand hover:underline">
                    Review cap table
                  </Link>
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                className="mt-1"
                checked={financialsConfirmed}
                onChange={(e) => setFinancialsConfirmed(e.target.checked)}
              />
              <span>
                <span className="font-medium text-foreground">Financial information is accurate to the best of my knowledge</span>
                <span className="mt-0.5 block text-muted-foreground">
                  I am authorized to provide this information on behalf of the company.
                </span>
              </span>
            </label>
          </CardContent>
        </Card>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={submitting || !capConfirmed || !financialsConfirmed}>
            {submitting ? "Submitting…" : "Submit for valuation"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.push("/valuations")}>
            Cancel
          </Button>
        </div>
      </div>

      <div className="lg:col-span-1">
        <Card className="sticky top-24">
          <CardHeader>
            <CardTitle>Cap table snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Common &amp; equivalents</span>
              <span className="font-medium stat-value">{formatNumber(capStructure.commonShares)}</span>
            </div>
            {capStructure.preferred.map((p) => (
              <div key={p.name} className="flex justify-between">
                <span className="text-muted-foreground">{p.name}</span>
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
              <span className="font-medium">Fully diluted</span>
              <span className="font-bold stat-value text-brand">{formatNumber(capStructure.fullyDilutedShares)}</span>
            </div>
            <p className="pt-2 text-xs text-subtle-foreground">
              Managed in Equitr — update before submitting if anything changed.{" "}
              <Link href="/cap-table" className="inline-flex items-center gap-0.5 text-brand hover:underline">
                Cap table <ExternalLink className="h-3 w-3" />
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
