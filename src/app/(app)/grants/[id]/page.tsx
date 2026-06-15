import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { PageBody } from "@/components/layout/page-body";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DetailGrid } from "@/components/ui/detail-grid";
import { GrantDocumentsList } from "@/components/documents/grant-documents-list";
import { GrantActions } from "@/components/grants/grant-actions";
import { getGrantWithDetails, requireSessionMembership } from "@/lib/db";
import { canWriteCapTable } from "@/lib/permissions";
import { calculateVestingProgress, getNextVestingDate } from "@/lib/cap-table";
import {
  getGrantMetrics,
  formatDaysRemaining,
} from "@/lib/equity-details";
import { formatNumber, formatCurrency, formatDate, formatPercent } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export default async function GrantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { role } = await requireSessionMembership();
  const canWrite = canWriteCapTable(role);
  const data = await getGrantWithDetails(id);
  if (!data) notFound();

  const { grant, entry } = data;
  const vesting = grant.vestingSchedule;
  const metrics = getGrantMetrics(grant, entry, grant.company.currentFmv409A);

  const progress = vesting
    ? calculateVestingProgress({
        sharesGranted: grant.sharesGranted,
        cliffMonths: vesting.cliffMonths,
        vestingMonths: vesting.vestingMonths,
        vestingFrequency: vesting.vestingFrequency,
        startDate: vesting.startDate,
      })
    : null;

  const nextVestDate = vesting
    ? getNextVestingDate({
        sharesGranted: grant.sharesGranted,
        cliffMonths: vesting.cliffMonths,
        vestingMonths: vesting.vestingMonths,
        vestingFrequency: vesting.vestingFrequency,
        startDate: vesting.startDate,
      })
    : null;

  return (
    <div>
      <Header
        title={`${grant.type.toUpperCase()} — ${formatNumber(grant.sharesGranted)} shares`}
        description={`${grant.stakeholder.name} · ${grant.shareClass.name}`}
        actions={
          <div className="flex items-center gap-2">
            <GrantActions
              grantId={grant.id}
              grantType={grant.type}
              status={grant.status}
              exercisableShares={metrics.exercisableShares}
              strikePrice={grant.strikePrice}
              canWrite={canWrite}
            />
            <Link href={`/stakeholders/${grant.stakeholderId}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4" />
                {grant.stakeholder.name}
              </Button>
            </Link>
            <Link href="/grants">
              <Button variant="ghost" size="sm">
                All Grants
              </Button>
            </Link>
          </div>
        }
      />

      <PageBody className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline">{grant.type.toUpperCase()}</Badge>
          <Badge variant={grant.status === "active" ? "default" : "secondary"}>{grant.status}</Badge>
          <span className="text-sm text-subtle-foreground">{metrics.securityLabel}</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Shares Granted", value: formatNumber(grant.sharesGranted) },
            { label: "Vested", value: formatNumber(metrics.vestedShares), highlight: true },
            { label: "Unvested", value: formatNumber(metrics.unvestedShares) },
            { label: "Exercisable", value: formatNumber(metrics.exercisableShares) },
            {
              label: "FD Ownership",
              value: entry ? formatPercent(entry.ownershipPercent, 2) : "—",
            },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <p className="text-xs text-subtle-foreground uppercase tracking-wider">{stat.label}</p>
                <p
                  className={`mt-1 text-2xl font-bold stat-value ${
                    stat.highlight ? "text-brand" : "text-foreground"
                  }`}
                >
                  {stat.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Grant Details</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailGrid
                items={[
                  { label: "Grantee", value: grant.stakeholder.name },
                  { label: "Security Type", value: metrics.securityLabel },
                  { label: "Share Class", value: grant.shareClass.name },
                  { label: "Grant Date", value: formatDate(grant.grantDate) },
                  {
                    label: "Board Approval",
                    value: grant.boardApprovalDate ? formatDate(grant.boardApprovalDate) : "—",
                  },
                  {
                    label: "Expiration",
                    value: grant.expirationDate
                      ? `${formatDate(grant.expirationDate)} (${formatDaysRemaining(metrics.daysToExpiration)})`
                      : "—",
                  },
                  { label: "Exercised", value: formatNumber(grant.sharesExercised) },
                  {
                    label: "Outstanding",
                    value: entry ? formatNumber(entry.sharesOutstanding) : "—",
                  },
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Economics</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailGrid
                items={[
                  {
                    label: "Strike Price",
                    value: grant.strikePrice ? formatCurrency(grant.strikePrice) : "—",
                  },
                  {
                    label: "Current 409A FMV",
                    value: formatCurrency(grant.company.currentFmv409A),
                  },
                  {
                    label: "Spread per Share",
                    value: metrics.isOption ? formatCurrency(metrics.spread) : "—",
                    highlight: metrics.spread > 0,
                  },
                  {
                    label: "Vested Spread Value",
                    value: metrics.isOption ? formatCurrency(metrics.vestedSpreadValue) : "—",
                  },
                  {
                    label: "Unvested Spread Value",
                    value: metrics.isOption ? formatCurrency(metrics.unvestedSpreadValue) : "—",
                  },
                  {
                    label: "Cost to Exercise (exercisable)",
                    value:
                      metrics.exercisableShares > 0 && grant.strikePrice
                        ? formatCurrency(metrics.exerciseCost)
                        : "—",
                  },
                ]}
              />
            </CardContent>
          </Card>
        </div>

        {vesting && progress !== null && (
          <Card>
            <CardHeader>
              <CardTitle>Vesting Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {vesting.cliffMonths}mo cliff · {vesting.vestingMonths}mo total ·{" "}
                  {vesting.vestingFrequency}
                </span>
                <span className="text-brand font-medium">{(progress * 100).toFixed(0)}% vested</span>
              </div>
              <Progress value={progress * 100} />
              <DetailGrid
                columns={4}
                items={[
                  { label: "Vesting Start", value: formatDate(vesting.startDate) },
                  {
                    label: "Cliff End",
                    value: metrics.cliffEndDate ? formatDate(metrics.cliffEndDate) : "—",
                  },
                  {
                    label: "Next Vest Date",
                    value: nextVestDate ? formatDate(nextVestDate) : "Fully vested",
                  },
                  {
                    label: "Acceleration",
                    value: vesting.accelerationType
                      ? vesting.accelerationType.replace(/_/g, " ")
                      : "None",
                  },
                  { label: "Schedule Type", value: vesting.type.replace(/_/g, " ") },
                  { label: "Shares Vesting", value: formatNumber(metrics.unvestedShares) },
                ]}
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Share Class Terms</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailGrid
              columns={4}
              items={[
                { label: "Class Type", value: grant.shareClass.type.replace(/_/g, " ") },
                { label: "Votes per Share", value: grant.shareClass.votesPerShare },
                {
                  label: "Liquidation Preference",
                  value:
                    grant.shareClass.type !== "common" && grant.shareClass.type !== "option_pool"
                      ? `${grant.shareClass.liquidationPref}x`
                      : "—",
                },
                {
                  label: "Participating",
                  value:
                    grant.shareClass.type !== "common" && grant.shareClass.type !== "option_pool"
                      ? grant.shareClass.isParticipating
                        ? "Yes"
                        : "No"
                      : "—",
                },
                { label: "Seniority", value: grant.shareClass.seniority },
              ]}
            />
          </CardContent>
        </Card>

        {grant.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">{grant.notes}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Issuance Documents ({grant.documents.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <GrantDocumentsList
              grantId={grant.id}
              documents={grant.documents}
              canWrite={canWrite}
            />
          </CardContent>
        </Card>
      </PageBody>
    </div>
  );
}
