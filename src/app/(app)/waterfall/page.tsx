import { Header } from "@/components/layout/header";
import { PageBody } from "@/components/layout/page-body";
import { WaterfallAnalyzer } from "@/components/waterfall/waterfall-analyzer";
import { getCompanyWithCapTable, requireSessionCompany } from "@/lib/db";
import type { LiquidationPrefConfig } from "@/lib/cap-table";

export default async function WaterfallPage() {
  const data = await getCompanyWithCapTable((await requireSessionCompany()).id);
  if (!data) return null;

  const { company, capTable } = data;

  const priceByClass = new Map<string, number>();
  for (const round of company.fundraiseRounds) {
    if (!round.pricePerShare || round.status !== "closed") continue;
    for (const sc of company.shareClasses) {
      if (sc.type === round.type || sc.type.startsWith(round.type)) {
        priceByClass.set(sc.name, round.pricePerShare);
      }
    }
  }

  const liquidationPrefs: LiquidationPrefConfig[] = company.shareClasses
    .filter((sc) => sc.type === "preferred" || sc.type.startsWith("series_"))
    .map((sc) => {
      const roundPrice = priceByClass.get(sc.name);
      const grantPrice = company.equityGrants.find(
        (g) => g.shareClassId === sc.id && g.type === "preferred_stock"
      )?.strikePrice;

      return {
        shareClassName: sc.name,
        multiple: sc.liquidationPref,
        participating: sc.isParticipating,
        seniority: sc.seniority,
        originalIssuePrice: roundPrice ?? grantPrice ?? 1,
      };
    });

  return (
    <div>
      <Header
        title="Waterfall Analysis"
        description="Exit proceeds with liquidation preferences, option participation, and conversion analysis"
      />
      <PageBody>
        <WaterfallAnalyzer capTable={capTable} liquidationPrefs={liquidationPrefs} />
      </PageBody>
    </div>
  );
}
