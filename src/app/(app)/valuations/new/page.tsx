import { redirect } from "next/navigation";
import { Header } from "@/components/layout/header";
import { PageBody } from "@/components/layout/page-body";
import { requireSessionMembership } from "@/lib/db";
import { canWriteCapTable } from "@/lib/permissions";
import { loadValuationContext } from "@/lib/valuation/load";
import { NewValuationForm } from "@/components/valuations/new-valuation-form";

export default async function NewValuationPage() {
  const { company, role } = await requireSessionMembership();
  if (!canWriteCapTable(role)) redirect("/valuations");

  const ctx = await loadValuationContext(company.id);
  if (!ctx) return null;

  const { derived, defaults, capTable } = ctx;

  const series = derived.series.map((s) => ({
    id: s.id,
    name: s.name,
    originalIssuePrice: s.originalIssuePrice,
    roundName: s.round?.name ?? null,
    pricePerShare: s.round?.pricePerShare ?? null,
  }));

  return (
    <div>
      <Header
        title="New 409A Valuation"
        description="Configure assumptions and run the Option Pricing Method"
      />
      <PageBody>
        <NewValuationForm
          companyName={company.name}
          series={series}
          backsolveTargetId={derived.backsolveTarget?.seriesId ?? null}
          defaults={defaults}
          warnings={derived.warnings}
          capStructure={{
            commonShares: derived.cap.commonShares,
            fullyDilutedShares: derived.cap.fullyDilutedShares,
            preferred: derived.cap.preferred.map((p) => ({
              name: p.name,
              shares: p.shares,
              originalIssuePrice: p.originalIssuePrice,
              liquidationMultiple: p.liquidationMultiple,
              participating: p.participating,
            })),
            options: derived.cap.options.map((o) => ({ strike: o.strike, shares: o.shares })),
            optionPoolAvailable: capTable.optionPoolAvailable,
          }}
        />
      </PageBody>
    </div>
  );
}
