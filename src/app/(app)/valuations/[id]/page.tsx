import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/header";
import { PageBody } from "@/components/layout/page-body";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireSessionMembership } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { canWriteCapTable } from "@/lib/permissions";
import { formatCurrency, formatNumber, formatDate } from "@/lib/utils";
import type { ValuationResult } from "@/lib/valuation/types";
import { ValuationActions } from "@/components/valuations/valuation-actions";

const money = (n: number) => formatCurrency(n);
const share = (n: number) => `$${n.toFixed(4)}`;
const pct = (n: number, d = 1) => `${(n * 100).toFixed(d)}%`;

const STATUS_VARIANT: Record<string, "default" | "secondary" | "warning"> = {
  draft: "secondary",
  in_review: "warning",
  final: "default",
};

export default async function ValuationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { company, role } = await requireSessionMembership();
  const canWrite = canWriteCapTable(role);

  const valuation = await prisma.valuation.findFirst({ where: { id, companyId: company.id } });
  if (!valuation || !valuation.result) notFound();

  let result: ValuationResult;
  try {
    result = JSON.parse(valuation.result) as ValuationResult;
  } catch {
    notFound();
  }

  const r = result;
  const a = r.assumptions;
  const statusText = valuation.adoptedAt
    ? "Adopted"
    : valuation.status === "final"
      ? "Final"
      : valuation.status === "in_review"
        ? "In review"
        : "Draft";

  return (
    <div>
      <Header
        title={valuation.title}
        description={`409A valuation · ${formatDate(valuation.valuationDate)}`}
        actions={
          <ValuationActions
            id={valuation.id}
            status={valuation.status}
            adopted={!!valuation.adoptedAt}
            canWrite={canWrite}
            concludedFmv={valuation.concludedFmv}
          />
        }
      />

      <PageBody className="space-y-6">
        <Link href="/valuations" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> All valuations
        </Link>

        {/* Conclusion hero */}
        <Card className="border-brand/30">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-brand">
                  Concluded common stock FMV
                </p>
                <p className="mt-2 font-mono text-4xl font-bold tabular-nums text-foreground">
                  {share(r.concludedFmv)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  per share, as of {formatDate(valuation.valuationDate)}
                </p>
              </div>
              <Badge variant={STATUS_VARIANT[valuation.status] ?? "secondary"}>{statusText}</Badge>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              <Stat label="Total equity value" value={money(r.equityValue)} />
              <Stat label="Marketable common" value={share(r.marketableCommonPerShare)} />
              <Stat label={`DLOM (${r.dlom.method})`} value={pct(r.dlom.value)} />
              <Stat
                label="Method"
                value={r.method === "opm_backsolve" ? "OPM backsolve" : "OPM direct"}
              />
            </div>
          </CardContent>
        </Card>

        {r.warnings.length > 0 && (
          <div className="rounded-xl border border-warning/30 bg-warning/10 p-4">
            <p className="text-sm font-medium text-warning">Analyst review notes</p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {r.warnings.map((w, i) => (
                <li key={i}>• {w}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Equity value source */}
          <Card>
            <CardHeader>
              <CardTitle>Total equity value</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {r.backsolve ? (
                <>
                  <KV label="Reference security" value={r.backsolve.seriesName} />
                  <KV label="Issuance price" value={share(r.backsolve.targetPricePerShare)} />
                  <KV label="Solved price (check)" value={share(r.backsolve.solvedPricePerShare)} />
                  {r.backsolve.roundName && <KV label="Round" value={r.backsolve.roundName} />}
                </>
              ) : (
                <KV label="Source" value="Manual equity value" />
              )}
              <KV label="Implied total equity value" value={money(r.equityValue)} highlight />
            </CardContent>
          </Card>

          {/* Assumptions */}
          <Card>
            <CardHeader>
              <CardTitle>OPM &amp; DLOM assumptions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <KV label="Time to liquidity" value={`${a.timeToLiquidity.toFixed(2)} years`} />
              <KV label="Volatility" value={pct(a.volatility)} />
              <KV label="Risk-free rate" value={pct(a.riskFreeRate, 2)} />
              <KV label="Dividend yield" value={pct(a.dividendYield, 2)} />
              <KV label="DLOM model" value={r.dlom.method === "finnerty" ? "Finnerty (2012)" : "Chaffee (1993)"} />
              <KV label="DLOM holding period" value={`${r.dlom.holdingPeriod.toFixed(2)} years`} />
            </CardContent>
          </Card>
        </div>

        {/* Allocation */}
        <Card>
          <CardHeader>
            <CardTitle>Allocation of equity value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="data-table w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left">Security</th>
                    <th className="text-right">Shares</th>
                    <th className="text-right">Allocated value</th>
                    <th className="text-right">Per share</th>
                    <th className="text-right">% of equity</th>
                  </tr>
                </thead>
                <tbody>
                  {r.opm.allocations.map((al) => (
                    <tr key={al.key}>
                      <td className="text-left">{al.label}</td>
                      <td className="text-right stat-value">{formatNumber(al.shares)}</td>
                      <td className="text-right stat-value">{money(al.value)}</td>
                      <td className="text-right stat-value">{share(al.perShare)}</td>
                      <td className="text-right stat-value">{pct(al.percentOfEquity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Breakpoints */}
        <Card>
          <CardHeader>
            <CardTitle>Breakpoint analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="data-table w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left">Tranche</th>
                    <th className="text-right">From</th>
                    <th className="text-right">To</th>
                    <th className="text-right">Value (Black-Scholes)</th>
                  </tr>
                </thead>
                <tbody>
                  {r.opm.tranches.map((t, i) => (
                    <tr key={i}>
                      <td className="text-left">{i + 1}</td>
                      <td className="text-right stat-value">{money(t.from)}</td>
                      <td className="text-right stat-value">{t.to == null ? "and above" : money(t.to)}</td>
                      <td className="text-right stat-value">{money(t.trancheValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* DLOM */}
        <Card>
          <CardHeader>
            <CardTitle>Discount for lack of marketability</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
            <KV label="Finnerty (2012) average-strike put" value={pct(r.dlom.finnerty)} />
            <KV label="Chaffee (1993) protective put" value={pct(r.dlom.chaffee)} />
            <KV label="Holding period" value={`${r.dlom.holdingPeriod.toFixed(2)} years`} />
            <KV label="Concluded DLOM" value={pct(r.dlom.value)} highlight />
          </CardContent>
        </Card>

        {/* Sensitivity */}
        <div className="grid gap-6 lg:grid-cols-3">
          <SensCard title="Volatility" rows={r.sensitivity.volatility} fmt={(v) => pct(v)} base={a.volatility} />
          <SensCard title="Time to liquidity" rows={r.sensitivity.timeToLiquidity} fmt={(v) => `${v.toFixed(2)} yr`} base={a.timeToLiquidity} />
          <SensCard title="DLOM holding period" rows={r.sensitivity.dlom} fmt={(v) => `${v.toFixed(2)} yr`} base={r.dlom.holdingPeriod} />
        </div>

        {(valuation.preparedByName || valuation.reviewedByName) && (
          <Card>
            <CardHeader>
              <CardTitle>Preparation &amp; review</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
              <KV label="Prepared by" value={valuation.preparedByName ?? "—"} />
              <KV
                label="Reviewed by"
                value={
                  valuation.reviewedByName
                    ? `${valuation.reviewedByName}${valuation.reviewedAt ? ` · ${formatDate(valuation.reviewedAt)}` : ""}`
                    : "Pending review"
                }
              />
              {valuation.adoptedAt && (
                <KV label="Adopted as company FMV" value={formatDate(valuation.adoptedAt)} />
              )}
            </CardContent>
          </Card>
        )}
      </PageBody>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-subtle-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-bold stat-value">{value}</p>
    </div>
  );
}

function KV({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border-subtle/60 py-1.5 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={highlight ? "font-bold stat-value text-brand" : "font-medium stat-value"}>{value}</span>
    </div>
  );
}

function SensCard({
  title,
  rows,
  fmt,
  base,
}: {
  title: string;
  rows: { input: number; fmv: number }[];
  fmt: (v: number) => string;
  base: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <table className="data-table w-full text-sm">
          <thead>
            <tr>
              <th className="text-left">{title}</th>
              <th className="text-right">FMV</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const isBase = Math.abs(row.input - base) < 1e-9;
              return (
                <tr key={i} className={isBase ? "text-brand" : ""}>
                  <td className="text-left">
                    {fmt(row.input)}
                    {isBase ? " ·" : ""}
                  </td>
                  <td className="text-right stat-value">{`$${row.fmv.toFixed(4)}`}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
