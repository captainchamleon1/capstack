import { redirect } from "next/navigation";
import { Header } from "@/components/layout/header";
import { PageBody } from "@/components/layout/page-body";
import { requireSessionMembership } from "@/lib/db";
import { canWriteCapTable } from "@/lib/permissions";
import { loadValuationContext } from "@/lib/valuation/load";
import { ValuationSubmissionForm } from "@/components/valuations/valuation-submission-form";

export default async function NewValuationPage() {
  const { company, role } = await requireSessionMembership();
  if (!canWriteCapTable(role)) redirect("/valuations");

  const ctx = await loadValuationContext(company.id);
  if (!ctx) return null;

  const { derived } = ctx;

  return (
    <div>
      <Header
        title="Submit 409A Valuation"
        description="Send your cap table and company data to Equitr for independent appraisal"
      />
      <PageBody>
        <ValuationSubmissionForm
          companyName={company.name}
          warnings={derived.warnings}
          capStructure={{
            commonShares: derived.cap.commonShares,
            fullyDilutedShares: derived.cap.fullyDilutedShares,
            preferred: derived.cap.preferred.map((p) => ({ name: p.name, shares: p.shares })),
            options: derived.cap.options.map((o) => ({ strike: o.strike, shares: o.shares })),
          }}
        />
      </PageBody>
    </div>
  );
}
