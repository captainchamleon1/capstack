import { Header } from "@/components/layout/header";
import { PageBody } from "@/components/layout/page-body";
import { InfoStrip } from "@/components/layout/info-strip";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OwnershipChart } from "@/components/charts/ownership-chart";
import { ChartLegend } from "@/components/charts/legend";
import { getCompanyWithCapTable, requireSessionCompany } from "@/lib/db";
import { formatNumber, formatPercent } from "@/lib/utils";
import { Users, PieChart, TrendingUp, FileText, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const data = await getCompanyWithCapTable((await requireSessionCompany()).id);
  if (!data) return null;

  const { company, capTable } = data;

  const chartData = capTable.byStakeholderType.map((t) => ({
    name: t.type.charAt(0).toUpperCase() + t.type.slice(1) + "s",
    value: t.shares,
    percent: t.percent,
  }));

  const recentGrants = company.equityGrants
    .filter((g) => g.status === "active")
    .sort((a, b) => new Date(b.grantDate).getTime() - new Date(a.grantDate).getTime())
    .slice(0, 5);

  return (
    <div>
      <Header
        title={company.name}
        description="Cap table overview and key metrics"
        actions={
          <Link href="/modeler">
            <Button size="sm">
              <TrendingUp className="h-4 w-4" />
              Model Fundraise
            </Button>
          </Link>
        }
      />

      <PageBody>
        {(company.currentFmv409A != null && company.currentFmv409A > 0) && (
          <InfoStrip
            items={[
              {
                label: "409A fair market value",
                value: `$${company.currentFmv409A.toFixed(4)} / share`,
                hint: company.fmv409AEffectiveDate
                  ? `Effective ${new Date(company.fmv409AEffectiveDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                  : undefined,
              },
            ]}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Fully Diluted Shares"
            value={formatNumber(capTable.totalFullyDiluted)}
            subtitle={`${formatNumber(capTable.totalOutstanding)} outstanding`}
            icon={PieChart}
          />
          <StatCard
            title="Stakeholders"
            value={formatNumber(company.stakeholders.length)}
            subtitle={`${company.equityGrants.length} equity grants`}
            icon={Users}
          />
          <StatCard
            title="Option Pool"
            value={formatPercent(capTable.optionPoolPercent, 1)}
            subtitle={`${formatNumber(capTable.optionPoolAvailable)} available`}
            icon={TrendingUp}
          />
          <StatCard
            title="Outstanding SAFEs"
            value={formatNumber(company.safes.filter((s) => s.status === "outstanding").length)}
            subtitle={`${company.convertibleNotes.filter((n) => n.status === "outstanding").length} convertible notes`}
            icon={FileText}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Ownership Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <OwnershipChart data={chartData} />
                <ChartLegend items={chartData.map((d) => ({ name: d.name, percent: d.percent }))} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Share Classes</CardTitle>
              <Link href="/cap-table">
                <Button variant="ghost" size="sm">
                  View all <ArrowUpRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {capTable.byShareClass.map((sc) => (
                <div key={sc.name} className="flex items-center justify-between py-2 border-b border-border-default last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{sc.name}</p>
                    <p className="text-xs text-subtle-foreground">{formatNumber(sc.shares)} shares</p>
                  </div>
                  <span className="text-sm font-medium text-brand stat-value">
                    {formatPercent(sc.percent, 1)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Grants</CardTitle>
              <Link href="/grants">
                <Button variant="ghost" size="sm">
                  View all <ArrowUpRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentGrants.map((grant) => (
                  <div key={grant.id} className="flex items-center justify-between py-2 border-b border-border-default last:border-0">
                    <div>
                      <Link href={`/stakeholders/${grant.stakeholderId}`} className="text-sm font-medium text-foreground hover:text-brand transition-colors">
                        {grant.stakeholder.name}
                      </Link>
                      <p className="text-xs text-subtle-foreground">
                        {grant.type.toUpperCase()} · {formatNumber(grant.sharesGranted)} shares
                      </p>
                    </div>
                    <Badge variant={grant.status === "active" ? "default" : "secondary"}>
                      {grant.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Pending Actions</CardTitle>
              <Link href="/board">
                <Button variant="ghost" size="sm">
                  View board <ArrowUpRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {company.boardResolutions
                  .filter((r) => r.status === "pending")
                  .map((res) => (
                    <div key={res.id} className="flex items-center justify-between py-2 border-b border-border-default last:border-0">
                      <div>
                        <p className="text-sm font-medium text-foreground">{res.title}</p>
                        <p className="text-xs text-subtle-foreground">{res.type.replace("_", " ")}</p>
                      </div>
                      <Badge variant="warning">Pending</Badge>
                    </div>
                  ))}
                {company.safes.filter((s) => s.status === "outstanding").length > 0 && (
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">SAFE Conversions</p>
                      <p className="text-xs text-subtle-foreground">
                        {company.safes.filter((s) => s.status === "outstanding").length} SAFEs awaiting conversion
                      </p>
                    </div>
                    <Badge variant="info">At next round</Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </PageBody>
    </div>
  );
}
