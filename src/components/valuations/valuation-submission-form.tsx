"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatNumber } from "@/lib/utils";
import { AlertTriangle, ExternalLink } from "lucide-react";

interface CapStructureView {
  commonShares: number;
  fullyDilutedShares: number;
  preferred: { name: string; shares: number }[];
  options: { strike: number; shares: number }[];
}

interface Props {
  companyName: string;
  warnings: string[];
  capStructure: CapStructureView;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

export function ValuationSubmissionForm({ companyName, warnings, capStructure }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(`${companyName} 409A — ${new Date().getFullYear()}`);
  const [valuationDate, setValuationDate] = useState(todayISO());
  const [clientNotes, setClientNotes] = useState("");
  const [capConfirmed, setCapConfirmed] = useState(false);
  const [companyConfirmed, setCompanyConfirmed] = useState(false);
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
          clientNotes: clientNotes.trim() || undefined,
          capTableConfirmed: capConfirmed,
          companyInfoConfirmed: companyConfirmed,
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
            Submit your cap table and company data for an independent 409A valuation. An Equitr analyst
            will model assumptions, review the allocation, and deliver a finalized report — typically within
            2–3 business days.
          </CardContent>
        </Card>

        {warnings.length > 0 && (
          <div className="rounded-xl border border-warning/30 bg-warning/10 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-warning">
              <AlertTriangle className="h-4 w-4" /> Resolve before submitting
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
            <CardTitle>Engagement details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Engagement name</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vdate">Requested valuation date</Label>
              <Input id="vdate" type="date" value={valuationDate} onChange={(e) => setValuationDate(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes for your analyst (optional)</Label>
              <textarea
                id="notes"
                className="flex min-h-[100px] w-full rounded-lg border border-border-default bg-surface px-3 py-2 text-sm"
                placeholder="Recent financing, material events, expected liquidity timeline, industry context…"
                value={clientNotes}
                onChange={(e) => setClientNotes(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                className="mt-1"
                checked={capConfirmed}
                onChange={(e) => setCapConfirmed(e.target.checked)}
              />
              <span>
                <span className="font-medium text-foreground">Cap table is current</span>
                <span className="mt-0.5 block text-muted-foreground">
                  Share classes, grants, closed rounds, and option pool reflect the capitalization as of the
                  valuation date.{" "}
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
                checked={companyConfirmed}
                onChange={(e) => setCompanyConfirmed(e.target.checked)}
              />
              <span>
                <span className="font-medium text-foreground">Company profile is accurate</span>
                <span className="mt-0.5 block text-muted-foreground">
                  Legal name, state of incorporation, and authorized shares are up to date.{" "}
                  <Link href="/settings" className="inline-flex items-center gap-0.5 text-brand hover:underline">
                    Company settings <ExternalLink className="h-3 w-3" />
                  </Link>
                </span>
              </span>
            </label>
          </CardContent>
        </Card>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={submitting || !capConfirmed || !companyConfirmed}>
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
            <CardTitle>Data we&apos;ll use</CardTitle>
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
              Outstanding SAFEs and convertible notes are not included until converted. Close or convert
              financings before submission when they affect the cap table.
            </p>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
