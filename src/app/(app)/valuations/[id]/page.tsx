import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, FileCheck } from "lucide-react";
import { Header } from "@/components/layout/header";
import { PageBody } from "@/components/layout/page-body";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireSessionMembership } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { canWriteCapTable } from "@/lib/permissions";
import { clientCanViewValuationResults, valuationStatusLabel } from "@/lib/analyst";
import { formatCurrency, formatNumber, formatDate } from "@/lib/utils";
import type { ValuationResult } from "@/lib/valuation/types";
import { ValuationActions } from "@/components/valuations/valuation-actions";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "warning" | "info"> = {
  submitted: "info",
  draft: "secondary",
  in_review: "warning",
  final: "default",
};

const money = (n: number) => formatCurrency(n);
const share = (n: number) => `$${n.toFixed(4)}`;
const pct = (n: number, d = 1) => `${(n * 100).toFixed(d)}%`;

export default async function ValuationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { company, role } = await requireSessionMembership();
  const canWrite = canWriteCapTable(role);

  const valuation = await prisma.valuation.findFirst({ where: { id, companyId: company.id } });
  if (!valuation) notFound();

  const showResults = clientCanViewValuationResults(valuation.status, valuation.adoptedAt);
  const statusText = valuationStatusLabel(valuation.status, valuation.adoptedAt);

  let result: ValuationResult | null = null;
  if (valuation.result && showResults) {
    try {
      result = JSON.parse(valuation.result) as ValuationResult;
    } catch {
      notFound();
    }
  }

  return (
    <div>
      <Header
        title={valuation.title}
        description={`409A engagement · ${formatDate(valuation.valuationDate)}`}
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

        {!showResults ? (
          <Card className="border-brand/20">
            <CardContent className="p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-xl">
                  <div className="flex items-center gap-2 text-brand">
                    <Clock className="h-5 w-5" />
                    <p className="text-sm font-semibold uppercase tracking-wider">With your analyst</p>
                  </div>
                  <h2 className="mt-3 text-2xl font-semibold text-foreground">{statusText}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Your submission has been received. An Equitr valuation analyst is reviewing your cap table,
                    modeling assumptions, and preparing the 409A report. You&apos;ll be notified when the
                    valuation is finalized and ready to download.
                  </p>
                  {valuation.submittedAt && (
                    <p className="mt-4 text-xs text-subtle-foreground">
                      Submitted {formatDate(valuation.submittedAt)}
                      {valuation.submittedByName ? ` by ${valuation.submittedByName}` : ""}
                    </p>
                  )}
                </div>
                <Badge variant={STATUS_VARIANT[valuation.status] ?? "secondary"}>{statusText}</Badge>
              </div>

              {valuation.clientNotes && (
                <div className="mt-8 rounded-lg border border-border-default bg-surface/50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Your notes</p>
                  <p className="mt-2 text-sm text-foreground whitespace-pre-wrap">{valuation.clientNotes}</p>
                </div>
              )}

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <Step done label="Data submitted" />
                <Step
                  done={valuation.status === "in_review"}
                  active={valuation.status === "submitted" || valuation.status === "draft"}
                  label="Analyst review"
                />
                <Step done={false} active={false} label="Report delivered" />
              </div>
            </CardContent>
          </Card>
        ) : result ? (
          <>
            <Card className="border-brand/30">
              <CardContent className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-brand">
                      Concluded common stock FMV
                    </p>
                    <p className="mt-2 font-mono text-4xl font-bold tabular-nums text-foreground">
                      {share(result.concludedFmv)}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      per share, as of {formatDate(valuation.valuationDate)}
                    </p>
                  </div>
                  <Badge variant={STATUS_VARIANT[valuation.status] ?? "default"}>{statusText}</Badge>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                  <Stat label="Total equity value" value={money(result.equityValue)} />
                  <Stat label="Marketable common" value={share(result.marketableCommonPerShare)} />
                  <Stat label={`DLOM (${result.dlom.method})`} value={pct(result.dlom.value)} />
                  <Stat
                    label="Method"
                    value={result.method === "opm_backsolve" ? "OPM backsolve" : "OPM direct"}
                  />
                </div>
              </CardContent>
            </Card>

            {valuation.status === "final" && !valuation.adoptedAt && (
              <div className="flex items-center gap-3 rounded-xl border border-brand/30 bg-brand/5 p-4 text-sm">
                <FileCheck className="h-5 w-5 text-brand shrink-0" />
                <p>
                  Your valuation is finalized. Download the report and adopt the concluded FMV to update option grant
                  strike prices.
                </p>
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <KV label="Total equity value" value={money(result.equityValue)} highlight />
                  <KV label="Marketable common / share" value={share(result.marketableCommonPerShare)} />
                  <KV label="DLOM" value={pct(result.dlom.value)} />
                  <KV label="Concluded FMV / share" value={share(result.concludedFmv)} highlight />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Review</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <KV label="Prepared by" value={valuation.preparedByName ?? "Equitr Valuations"} />
                  <KV
                    label="Reviewed by"
                    value={
                      valuation.reviewedByName
                        ? `${valuation.reviewedByName}${valuation.reviewedAt ? ` · ${formatDate(valuation.reviewedAt)}` : ""}`
                        : "—"
                    }
                  />
                  {valuation.reviewNotes && <KV label="Analyst notes" value={valuation.reviewNotes} />}
                  {valuation.adoptedAt && <KV label="Adopted" value={formatDate(valuation.adoptedAt)} />}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Allocation summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="data-table w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-left">Security</th>
                        <th className="text-right">Shares</th>
                        <th className="text-right">Value</th>
                        <th className="text-right">Per share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.opm.allocations.map((al) => (
                        <tr key={al.key}>
                          <td>{al.label}</td>
                          <td className="text-right stat-value">{formatNumber(al.shares)}</td>
                          <td className="text-right stat-value">{money(al.value)}</td>
                          <td className="text-right stat-value">{share(al.perShare)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </PageBody>
    </div>
  );
}

function Step({ label, done, active }: { label: string; done?: boolean; active?: boolean }) {
  return (
    <div
      className={`rounded-lg border p-4 text-sm ${
        done ? "border-brand/40 bg-brand/5" : active ? "border-warning/40 bg-warning/5" : "border-border-default"
      }`}
    >
      <p className="font-medium">{label}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {done ? "Complete" : active ? "In progress" : "Pending"}
      </p>
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
