import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { PageBody } from "@/components/layout/page-body";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DetailGrid } from "@/components/ui/detail-grid";
import { StakeholderActions } from "@/components/stakeholders/stakeholder-actions";
import { getStakeholderWithDetails, requireSessionMembership } from "@/lib/db";
import { canWriteCapTable } from "@/lib/permissions";
import { calculateVestingProgress } from "@/lib/cap-table";
import {
  getStakeholderMetrics,
  formatTenure,
} from "@/lib/equity-details";
import { formatNumber, formatPercent, formatCurrency, formatDate } from "@/lib/utils";
import { ArrowLeft, Mail, Calendar, Building2, Briefcase, FileText } from "lucide-react";

const typeColors: Record<string, "default" | "secondary" | "info" | "warning"> = {
  founder: "default",
  employee: "info",
  investor: "warning",
  advisor: "secondary",
  board: "secondary",
};

export default async function StakeholderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { role } = await requireSessionMembership();
  const canWrite = canWriteCapTable(role);
  const data = await getStakeholderWithDetails(id);
  if (!data) notFound();

  const {
    stakeholder,
    entries,
    ownershipPercent,
    totalShares,
    totalVested,
    totalOutstanding,
    documents,
  } = data;
  const { company, equityGrants, safes, convertibleNotes } = stakeholder;

  const metrics = getStakeholderMetrics(
    stakeholder,
    entries,
    company.shareClasses,
    documents.length
  );

  const unvestedValue = metrics.totalUnvested * company.currentFmv409A;
  const canDelete =
    equityGrants.length === 0 && safes.length === 0 && convertibleNotes.length === 0;

  return (
    <div>
      <Header
        title={stakeholder.name}
        description={[stakeholder.title, stakeholder.department].filter(Boolean).join(" · ") || stakeholder.type}
        actions={
          <div className="flex items-center gap-2">
            <StakeholderActions
              stakeholder={stakeholder}
              canDelete={canDelete}
              canWrite={canWrite}
            />
            <Link href="/stakeholders">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4" />
                All Stakeholders
              </Button>
            </Link>
          </div>
        }
      />

      <PageBody className="space-y-6">
        <div className="flex items-start gap-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-surface-overlay text-xl font-bold text-muted-foreground">
            {stakeholder.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-foreground">{stakeholder.name}</h2>
              <Badge variant={typeColors[stakeholder.type] || "secondary"}>{stakeholder.type}</Badge>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {stakeholder.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="h-4 w-4" />
                  {stakeholder.email}
                </span>
              )}
              {stakeholder.title && (
                <span className="flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4" />
                  {stakeholder.title}
                </span>
              )}
              {stakeholder.department && (
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4" />
                  {stakeholder.department}
                </span>
              )}
              {stakeholder.startDate && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Since {formatDate(stakeholder.startDate)} ({formatTenure(metrics.tenureMonths)})
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-subtle-foreground">{company.name}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Ownership (FD)", value: ownershipPercent > 0 ? formatPercent(ownershipPercent, 2) : "—", highlight: true },
            { label: "Fully Diluted Shares", value: totalShares > 0 ? formatNumber(totalShares) : "—" },
            { label: "Vested", value: totalVested > 0 ? formatNumber(totalVested) : "—" },
            { label: "Outstanding", value: totalOutstanding > 0 ? formatNumber(totalOutstanding) : "—" },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <p className="text-xs text-subtle-foreground uppercase tracking-wider">{stat.label}</p>
                <p className={`mt-1 text-2xl font-bold stat-value ${stat.highlight ? "text-brand" : "text-foreground"}`}>
                  {stat.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Record</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailGrid
                items={[
                  { label: "Stakeholder Type", value: stakeholder.type },
                  {
                    label: "Relationship",
                    value: stakeholder.relationship ?? stakeholder.type,
                  },
                  {
                    label: "Tenure",
                    value: formatTenure(metrics.tenureMonths),
                  },
                  {
                    label: "Active Grants",
                    value: metrics.activeGrants,
                  },
                  {
                    label: "Documents on File",
                    value: (
                      <span className="flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-subtle-foreground" />
                        {metrics.documentCount}
                      </span>
                    ),
                  },
                  {
                    label: "Last Grant Date",
                    value: metrics.lastGrantDate ? formatDate(metrics.lastGrantDate) : "—",
                  },
                  {
                    label: "Voting Shares",
                    value: metrics.votingShares > 0 ? formatNumber(metrics.votingShares) : "—",
                    highlight: metrics.votingShares > 0,
                  },
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Equity & Investment Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailGrid
                items={[
                  {
                    label: "Unvested Shares",
                    value: metrics.totalUnvested > 0 ? formatNumber(metrics.totalUnvested) : "—",
                  },
                  {
                    label: "Unvested Value (at 409A)",
                    value: unvestedValue > 0 ? formatCurrency(unvestedValue) : "—",
                    highlight: unvestedValue > 0,
                  },
                  {
                    label: "ISO Grants",
                    value: metrics.isoCount || "—",
                  },
                  {
                    label: "NSO Grants",
                    value: metrics.nsoCount || "—",
                  },
                  {
                    label: "Total Invested",
                    value: metrics.totalInvested > 0 ? formatCurrency(metrics.totalInvested) : "—",
                  },
                  {
                    label: "Outstanding SAFEs",
                    value: metrics.outstandingSafes || "—",
                  },
                  {
                    label: "Outstanding Notes",
                    value: metrics.outstandingNotes || "—",
                  },
                ]}
              />
            </CardContent>
          </Card>
        </div>

        {equityGrants.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Equity Grants ({equityGrants.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {equityGrants.map((grant) => {
                const entry = entries.find((e) => e.grantId === grant.id);
                const grantDocs = documents.filter((d) => d.equityGrantId === grant.id);
                const vesting = grant.vestingSchedule;
                const progress = vesting
                  ? calculateVestingProgress({
                      sharesGranted: grant.sharesGranted,
                      cliffMonths: vesting.cliffMonths,
                      vestingMonths: vesting.vestingMonths,
                      vestingFrequency: vesting.vestingFrequency,
                      startDate: vesting.startDate,
                    })
                  : null;
                const unvested = entry
                  ? Math.max(0, grant.sharesGranted - entry.sharesVested)
                  : 0;

                return (
                  <Link
                    key={grant.id}
                    href={`/grants/${grant.id}`}
                    className="block rounded-lg border border-border-default p-4 hover:border-brand/30 hover:bg-surface-overlay/20 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline">{grant.type.toUpperCase()}</Badge>
                          <Badge variant={grant.status === "active" ? "default" : "secondary"}>
                            {grant.status}
                          </Badge>
                          {grantDocs.length > 0 && (
                            <Badge variant="secondary" className="text-[10px]">
                              {grantDocs.length} doc{grantDocs.length !== 1 ? "s" : ""}
                            </Badge>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{grant.shareClass.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold stat-value text-foreground">
                          {formatNumber(grant.sharesGranted)}
                        </p>
                        <p className="text-xs text-subtle-foreground">shares granted</p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-subtle-foreground">Vested</p>
                        <p className="font-medium stat-value text-brand">
                          {entry ? formatNumber(entry.sharesVested) : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-subtle-foreground">Unvested</p>
                        <p className="font-medium stat-value">{unvested > 0 ? formatNumber(unvested) : "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-subtle-foreground">Exercised</p>
                        <p className="font-medium stat-value">{formatNumber(grant.sharesExercised)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-subtle-foreground">Strike</p>
                        <p className="font-medium stat-value">
                          {grant.strikePrice ? formatCurrency(grant.strikePrice) : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-subtle-foreground">Expires</p>
                        <p className="font-medium">
                          {grant.expirationDate ? formatDate(grant.expirationDate) : "—"}
                        </p>
                      </div>
                    </div>

                    {vesting && progress !== null && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs text-subtle-foreground mb-2">
                          <span>
                            {vesting.cliffMonths}mo cliff · {vesting.vestingMonths}mo total
                          </span>
                          <span className="text-brand font-medium">{(progress * 100).toFixed(0)}% vested</span>
                        </div>
                        <Progress value={progress * 100} />
                      </div>
                    )}
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        )}

        {documents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Documents on File ({documents.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-lg border border-border-default px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-4 w-4 text-subtle-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                      <p className="text-xs text-subtle-foreground">{doc.type.replace(/_/g, " ")} · {doc.status}</p>
                    </div>
                  </div>
                  {doc.equityGrantId && (
                    <Link href={`/grants/${doc.equityGrantId}`}>
                      <Button variant="ghost" size="sm">
                        View grant
                      </Button>
                    </Link>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {safes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>SAFEs ({safes.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-default text-muted-foreground">
                    <th className="text-left py-3 px-6 font-medium">Type</th>
                    <th className="text-right py-3 px-6 font-medium">Amount</th>
                    <th className="text-right py-3 px-6 font-medium">Valuation Cap</th>
                    <th className="text-right py-3 px-6 font-medium">Discount</th>
                    <th className="text-left py-3 px-6 font-medium">Issue Date</th>
                    <th className="text-left py-3 px-6 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {safes.map((safe) => (
                    <tr key={safe.id} className="border-b border-border-default/50">
                      <td className="py-3 px-6">
                        <Badge variant="outline">{safe.type.replace(/_/g, " ")}</Badge>
                      </td>
                      <td className="py-3 px-6 text-right stat-value">{formatCurrency(safe.investmentAmount)}</td>
                      <td className="py-3 px-6 text-right stat-value">
                        {safe.valuationCap ? formatCurrency(safe.valuationCap) : "—"}
                      </td>
                      <td className="py-3 px-6 text-right stat-value">
                        {safe.discountRate ? formatPercent(safe.discountRate, 0) : "—"}
                      </td>
                      <td className="py-3 px-6 text-muted-foreground">{formatDate(safe.issueDate)}</td>
                      <td className="py-3 px-6">
                        <Badge variant={safe.status === "outstanding" ? "warning" : "default"}>
                          {safe.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {convertibleNotes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Convertible Notes ({convertibleNotes.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-default text-muted-foreground">
                    <th className="text-right py-3 px-6 font-medium">Principal</th>
                    <th className="text-right py-3 px-6 font-medium">Interest</th>
                    <th className="text-right py-3 px-6 font-medium">Valuation Cap</th>
                    <th className="text-left py-3 px-6 font-medium">Maturity</th>
                    <th className="text-left py-3 px-6 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {convertibleNotes.map((note) => (
                    <tr key={note.id} className="border-b border-border-default/50">
                      <td className="py-3 px-6 text-right stat-value">{formatCurrency(note.principalAmount)}</td>
                      <td className="py-3 px-6 text-right stat-value">{formatPercent(note.interestRate, 1)}</td>
                      <td className="py-3 px-6 text-right stat-value">
                        {note.valuationCap ? formatCurrency(note.valuationCap) : "—"}
                      </td>
                      <td className="py-3 px-6 text-muted-foreground">
                        {note.maturityDate ? formatDate(note.maturityDate) : "—"}
                      </td>
                      <td className="py-3 px-6">
                        <Badge variant={note.status === "outstanding" ? "warning" : "default"}>
                          {note.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {entries.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Cap Table Position</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-default text-muted-foreground">
                    <th className="text-left py-3 px-6 font-medium">Security</th>
                    <th className="text-left py-3 px-6 font-medium">Share Class</th>
                    <th className="text-right py-3 px-6 font-medium">Granted</th>
                    <th className="text-right py-3 px-6 font-medium">Vested</th>
                    <th className="text-right py-3 px-6 font-medium">Outstanding</th>
                    <th className="text-right py-3 px-6 font-medium">FD %</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.grantId} className="border-b border-border-default/50 hover:bg-surface-overlay/20">
                      <td className="py-3 px-6">
                        <Link href={`/grants/${entry.grantId}`} className="inline-flex">
                          <Badge variant="outline" className="hover:border-brand/40 transition-colors">
                            {entry.securityType.toUpperCase()}
                          </Badge>
                        </Link>
                      </td>
                      <td className="py-3 px-6 text-muted-foreground">{entry.shareClassName}</td>
                      <td className="py-3 px-6 text-right stat-value">{formatNumber(entry.sharesGranted)}</td>
                      <td className="py-3 px-6 text-right stat-value">{formatNumber(entry.sharesVested)}</td>
                      <td className="py-3 px-6 text-right stat-value">{formatNumber(entry.sharesOutstanding)}</td>
                      <td className="py-3 px-6 text-right stat-value text-brand">
                        {formatPercent(entry.ownershipPercent, 2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </PageBody>
    </div>
  );
}
