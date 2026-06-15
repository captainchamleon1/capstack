import Link from "next/link";
import { Header } from "@/components/layout/header";
import { PageBody } from "@/components/layout/page-body";
import { InfoStrip } from "@/components/layout/info-strip";
import { EmptyState } from "@/components/layout/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getCompanyWithCapTable, requireSessionMembership } from "@/lib/db";
import { canWriteCapTable } from "@/lib/permissions";
import { calculateVestingProgress } from "@/lib/cap-table";
import { formatNumber, formatCurrency, formatDate } from "@/lib/utils";
import { ReadOnlyBanner } from "@/components/layout/read-only-banner";
import { NewGrantDialog } from "@/components/grants/new-grant-dialog";
import { Layers } from "lucide-react";

export default async function GrantsPage() {
  const { company, role } = await requireSessionMembership();
  const data = await getCompanyWithCapTable(company.id);
  if (!data) return null;

  const canWrite = canWriteCapTable(role);
  const { company: companyData, capTable } = data;
  const activeGrants = companyData.equityGrants
    .filter((g) => ["iso", "nso", "rsu", "rsa", "warrant", "common_stock", "preferred_stock"].includes(g.type))
    .sort((a, b) => new Date(b.grantDate).getTime() - new Date(a.grantDate).getTime());

  return (
    <div>
      <Header
        title="Equity Grants"
        description={`${activeGrants.length} active grants with vesting schedules`}
        actions={
          canWrite ? (
          <NewGrantDialog
            companyId={companyData.id}
            stakeholders={companyData.stakeholders.map((s) => ({
              id: s.id,
              name: s.name,
              type: s.type,
              title: s.title,
            }))}
            shareClasses={companyData.shareClasses.map((sc) => ({
              id: sc.id,
              name: sc.name,
              type: sc.type,
            }))}
            defaultStrikePrice={companyData.currentFmv409A}
          />
          ) : null
        }
      />

      <PageBody className="space-y-4">
        {!canWrite && <ReadOnlyBanner />}
        <InfoStrip
          items={[
            { label: "Option pool", value: formatNumber(capTable.optionPoolAvailable) + " available" },
            { label: "Reserved", value: formatNumber(capTable.optionPoolSize), hint: "total pool" },
          ]}
        />

        {activeGrants.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No equity grants yet"
            description="Issue options or stock to employees, advisors, and founders."
          />
        ) : (
        activeGrants.map((grant) => {
          const vesting = grant.vestingSchedule;
          const progress = vesting
            ? calculateVestingProgress({
                sharesGranted: grant.sharesGranted,
                cliffMonths: vesting.cliffMonths,
                vestingMonths: vesting.vestingMonths,
                vestingFrequency: vesting.vestingFrequency,
                startDate: vesting.startDate,
              })
            : 1;

          const vestedShares = Math.floor(grant.sharesGranted * progress);

          return (
            <Link key={grant.id} href={`/grants/${grant.id}`} className="block">
            <Card className="hover:border-brand/30 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 avatar-initials text-sm">
                      {grant.stakeholder.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{grant.stakeholder.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {grant.type.toUpperCase()} · {grant.shareClass.name}
                        {grant.strikePrice ? ` · Strike ${formatCurrency(grant.strikePrice)}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={grant.status === "active" ? "default" : "secondary"}>
                      {grant.status}
                    </Badge>
                    <Badge variant="outline">{grant.stakeholder.type}</Badge>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <p className="text-xs text-subtle-foreground">Granted</p>
                    <p className="text-lg font-bold stat-value">{formatNumber(grant.sharesGranted)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-subtle-foreground">Vested</p>
                    <p className="text-lg font-bold stat-value text-brand">{formatNumber(vestedShares)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-subtle-foreground">Exercised</p>
                    <p className="text-lg font-bold stat-value">{formatNumber(grant.sharesExercised)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-subtle-foreground">Grant Date</p>
                    <p className="text-sm font-medium">{formatDate(grant.grantDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-subtle-foreground">Expires</p>
                    <p className="text-sm font-medium">
                      {grant.expirationDate ? formatDate(grant.expirationDate) : "—"}
                    </p>
                  </div>
                </div>

                {vesting && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-subtle-foreground mb-2">
                      <span>
                        Vesting: {vesting.cliffMonths}mo cliff · {vesting.vestingMonths}mo total
                      </span>
                      <span className="text-brand font-medium">{(progress * 100).toFixed(0)}% vested</span>
                    </div>
                    <Progress value={progress * 100} />
                  </div>
                )}
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
