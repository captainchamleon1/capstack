import Link from "next/link";
import { Scale, Clock, CheckCircle2 } from "lucide-react";
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
import { valuationStatusLabel } from "@/lib/analyst";
import { formatCurrency, formatDate } from "@/lib/utils";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "warning" | "info"> = {
  submitted: "info",
  draft: "secondary",
  in_review: "warning",
  final: "default",
};

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
        description="Submit data for independent appraisal and track your valuation engagements"
        actions={
          canWrite ? (
            <Button asChild>
              <Link href="/valuations/new">Submit valuation</Link>
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
            { label: "Engagements", value: String(valuations.length) },
          ]}
        />

        {valuations.length === 0 ? (
          <EmptyState
            icon={Scale}
            title="No valuation requests yet"
            description="Submit your cap table and company information. An Equitr analyst will model the valuation, review assumptions, and deliver a finalized 409A report."
            action={
              canWrite ? (
                <Button asChild>
                  <Link href="/valuations/new">Submit valuation request</Link>
                </Button>
              ) : undefined
            }
          />
        ) : (
          valuations.map((v) => {
            const showFmv = v.status === "final" || !!v.adoptedAt;
            return (
              <Link key={v.id} href={`/valuations/${v.id}`} className="block">
                <Card className="hover:border-brand/30 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-foreground">{v.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Valuation date {formatDate(v.valuationDate)}
                          {v.submittedAt ? ` · Submitted ${formatDate(v.submittedAt)}` : ""}
                        </p>
                      </div>
                      <Badge variant={STATUS_VARIANT[v.status] ?? "secondary"}>
                        {valuationStatusLabel(v.status, v.adoptedAt)}
                      </Badge>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
                      {showFmv ? (
                        <div>
                          <p className="text-xs text-subtle-foreground">Concluded FMV</p>
                          <p className="text-lg font-bold stat-value text-brand">${v.concludedFmv.toFixed(4)}</p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 text-warning" />
                          Awaiting analyst review
                        </div>
                      )}
                      {showFmv && (
                        <>
                          <div>
                            <p className="text-xs text-subtle-foreground">Equity value</p>
                            <p className="text-lg font-bold stat-value">{formatCurrency(v.equityValue)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-subtle-foreground">DLOM</p>
                            <p className="text-lg font-bold stat-value">{(v.dlomValue * 100).toFixed(1)}%</p>
                          </div>
                        </>
                      )}
                      {v.status === "final" && !v.adoptedAt && (
                        <div className="flex items-center gap-2 text-sm text-brand">
                          <CheckCircle2 className="h-4 w-4" /> Ready to adopt
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })
        )}
      </PageBody>
    </div>
  );
}
