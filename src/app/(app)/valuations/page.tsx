import Link from "next/link";
import { Scale } from "lucide-react";
import { Header } from "@/components/layout/header";
import { PageBody } from "@/components/layout/page-body";
import { InfoStrip } from "@/components/layout/info-strip";
import { EmptyState } from "@/components/layout/empty-state";
import { ReadOnlyBanner } from "@/components/layout/read-only-banner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireSessionMembership } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { canWriteCapTable } from "@/lib/permissions";
import { formatCurrency, formatDate } from "@/lib/utils";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "warning" | "info"> = {
  draft: "secondary",
  in_review: "warning",
  final: "default",
};

function statusLabel(status: string, adoptedAt: Date | null): string {
  if (adoptedAt) return "Adopted";
  if (status === "in_review") return "In review";
  if (status === "final") return "Final";
  return "Draft";
}

export default async function ValuationsPage() {
  const { company, role } = await requireSessionMembership();
  const canWrite = canWriteCapTable(role);

  const valuations = await prisma.valuation.findMany({
    where: { companyId: company.id },
    orderBy: [{ valuationDate: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <Header
        title="409A Valuations"
        description="Automated common stock fair market value, ready for analyst review"
        actions={
          canWrite ? (
            <Button asChild>
              <Link href="/valuations/new">New valuation</Link>
            </Button>
          ) : null
        }
      />

      <PageBody className="space-y-4">
        {!canWrite && <ReadOnlyBanner />}

        <InfoStrip
          items={[
            { label: "Current 409A FMV", value: formatCurrency(company.currentFmv409A) + " / share" },
            {
              label: "Effective",
              value: company.fmv409AEffectiveDate ? formatDate(company.fmv409AEffectiveDate) : "—",
            },
            { label: "Valuations on file", value: String(valuations.length) },
          ]}
        />

        {valuations.length === 0 ? (
          <EmptyState
            icon={Scale}
            title="No valuations yet"
            description="Run an automated 409A valuation using the Option Pricing Method backsolve. A draft is produced instantly for analyst review and board adoption."
            action={
              canWrite ? (
                <Button asChild>
                  <Link href="/valuations/new">Run a 409A valuation</Link>
                </Button>
              ) : undefined
            }
          />
        ) : (
          valuations.map((v) => (
            <Link key={v.id} href={`/valuations/${v.id}`} className="block">
              <Card className="hover:border-brand/30 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-foreground">{v.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Valuation date {formatDate(v.valuationDate)} ·{" "}
                        {v.method === "opm_backsolve" ? "OPM backsolve" : "OPM (direct)"}
                      </p>
                    </div>
                    <Badge variant={STATUS_VARIANT[v.status] ?? "secondary"}>
                      {statusLabel(v.status, v.adoptedAt)}
                    </Badge>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div>
                      <p className="text-xs text-subtle-foreground">Concluded FMV</p>
                      <p className="text-lg font-bold stat-value text-brand">
                        ${v.concludedFmv.toFixed(4)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-subtle-foreground">Equity value</p>
                      <p className="text-lg font-bold stat-value">{formatCurrency(v.equityValue)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-subtle-foreground">DLOM</p>
                      <p className="text-lg font-bold stat-value">{(v.dlomValue * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-subtle-foreground">Prepared</p>
                      <p className="text-sm font-medium">{formatDate(v.createdAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </PageBody>
    </div>
  );
}
