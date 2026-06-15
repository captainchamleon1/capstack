import { Header } from "@/components/layout/header";
import { PageBody } from "@/components/layout/page-body";
import { FundraiseModeler } from "@/components/modeler/fundraise-modeler";
import { getCompanyWithCapTable, requireSessionMembership } from "@/lib/db";
import { canWriteCapTable } from "@/lib/permissions";

export default async function ModelerPage() {
  const { company, role } = await requireSessionMembership();
  const data = await getCompanyWithCapTable(company.id);
  if (!data) return null;

  const canWrite = canWriteCapTable(role);
  const { capTable } = data;
  const companyData = data.company;
  const founderIds = companyData.stakeholders.filter((s) => s.type === "founder").map((s) => s.id);

  return (
    <div>
      <Header
        title="Fundraise Modeler"
        description="Model dilution scenarios and close priced rounds on your cap table"
      />
      <PageBody>
        <FundraiseModeler
          capTable={capTable}
          founderIds={founderIds}
          stakeholders={companyData.stakeholders.map((s) => ({
            id: s.id,
            name: s.name,
            type: s.type,
          }))}
          safes={companyData.safes.map((s) => ({
            id: s.id,
            status: s.status,
            investmentAmount: s.investmentAmount,
            valuationCap: s.valuationCap,
            discountRate: s.discountRate,
            type: s.type,
            stakeholder: { id: s.stakeholderId, name: s.stakeholder.name },
          }))}
          notes={companyData.convertibleNotes.map((n) => ({
            id: n.id,
            status: n.status,
            principalAmount: n.principalAmount,
            interestRate: n.interestRate,
            valuationCap: n.valuationCap,
            discountRate: n.discountRate,
            issueDate: n.issueDate.toISOString(),
            stakeholder: { id: n.stakeholderId, name: n.stakeholder.name },
          }))}
          fundraiseRounds={companyData.fundraiseRounds.map((r) => ({
            id: r.id,
            name: r.name,
            type: r.type,
            status: r.status,
            preMoneyValuation: r.preMoneyValuation,
            investmentAmount: r.investmentAmount,
            pricePerShare: r.pricePerShare,
            closeDate: r.closeDate?.toISOString() ?? null,
          }))}
          canWrite={canWrite}
        />
      </PageBody>
    </div>
  );
}
