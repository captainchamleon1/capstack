import Link from "next/link";
import { Header } from "@/components/layout/header";
import { PageBody } from "@/components/layout/page-body";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCompanyWithCapTable, requireSessionCompany } from "@/lib/db";
import { formatNumber, formatPercent, formatCurrency } from "@/lib/utils";
import { ExportCapTableButton } from "@/components/export/export-cap-table-button";

export default async function CapTablePage() {
  const data = await getCompanyWithCapTable((await requireSessionCompany()).id);
  if (!data) return null;

  const { capTable } = data;

  const aggregated = new Map<string, typeof capTable.entries[0] & { totalShares: number }>();
  for (const entry of capTable.entries) {
    const key = entry.stakeholderId;
    const existing = aggregated.get(key);
    if (existing) {
      existing.totalShares += entry.fullyDilutedShares;
      existing.ownershipPercent += entry.ownershipPercent;
    } else {
      aggregated.set(key, { ...entry, totalShares: entry.fullyDilutedShares });
    }
  }

  const sorted = Array.from(aggregated.values()).sort((a, b) => b.totalShares - a.totalShares);

  return (
    <div>
      <Header
        title="Cap Table"
        description="Full ownership breakdown — fully diluted basis"
        actions={<ExportCapTableButton />}
      />

      <PageBody className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Authorized", value: formatNumber(capTable.totalAuthorized) },
            { label: "Issued & Outstanding", value: formatNumber(capTable.totalOutstanding) },
            { label: "Fully Diluted", value: formatNumber(capTable.totalFullyDiluted) },
            { label: "Option Pool", value: `${formatPercent(capTable.optionPoolPercent, 1)} (${formatNumber(capTable.optionPoolSize)})` },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <p className="section-label">{stat.label}</p>
                <p className="mt-1 text-xl font-bold text-foreground stat-value font-display">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ownership by Stakeholder</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="text-left py-3 px-6 font-medium">Stakeholder</th>
                    <th className="text-left py-3 px-6 font-medium">Type</th>
                    <th className="text-right py-3 px-6 font-medium">Shares (FD)</th>
                    <th className="text-right py-3 px-6 font-medium">Ownership</th>
                    <th className="text-left py-3 px-6 font-medium">Securities</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((row) => {
                    const securities = capTable.entries
                      .filter((e) => e.stakeholderId === row.stakeholderId)
                      .map((e) => e.securityType.toUpperCase());
                    return (
                      <tr key={row.stakeholderId}>
                        <td className="py-3 px-6">
                          <Link href={`/stakeholders/${row.stakeholderId}`} className="font-medium text-foreground hover:text-brand transition-colors">
                            {row.stakeholderName}
                          </Link>
                        </td>
                        <td className="py-3 px-6">
                          <Badge variant="secondary">{row.stakeholderType}</Badge>
                        </td>
                        <td className="py-3 px-6 text-right stat-value text-foreground">{formatNumber(row.totalShares)}</td>
                        <td className="py-3 px-6 text-right stat-value text-brand font-medium">
                          {formatPercent(row.ownershipPercent, 2)}
                        </td>
                        <td className="py-3 px-6">
                          <div className="flex gap-1 flex-wrap">
                            {[...new Set(securities)].map((s) => (
                              <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-surface-overlay/30 font-medium">
                    <td className="py-3 px-6 text-foreground" colSpan={2}>Total</td>
                    <td className="py-3 px-6 text-right stat-value text-foreground">{formatNumber(capTable.totalFullyDiluted)}</td>
                    <td className="py-3 px-6 text-right stat-value text-brand">100.00%</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detailed Securities</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="text-left py-3 px-6 font-medium">Stakeholder</th>
                    <th className="text-left py-3 px-6 font-medium">Security</th>
                    <th className="text-left py-3 px-6 font-medium">Share Class</th>
                    <th className="text-right py-3 px-6 font-medium">Granted</th>
                    <th className="text-right py-3 px-6 font-medium">Vested</th>
                    <th className="text-right py-3 px-6 font-medium">Outstanding</th>
                    <th className="text-right py-3 px-6 font-medium">Strike</th>
                    <th className="text-right py-3 px-6 font-medium">FD %</th>
                  </tr>
                </thead>
                <tbody>
                  {capTable.entries.map((entry) => (
                    <tr key={entry.grantId}>
                      <td className="py-3 px-6">
                        <Link href={`/stakeholders/${entry.stakeholderId}`} className="text-foreground hover:text-brand transition-colors">
                          {entry.stakeholderName}
                        </Link>
                      </td>
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
                      <td className="py-3 px-6 text-right stat-value">
                        {entry.strikePrice ? formatCurrency(entry.strikePrice) : "—"}
                      </td>
                      <td className="py-3 px-6 text-right stat-value text-brand">
                        {formatPercent(entry.ownershipPercent, 2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </PageBody>
    </div>
  );
}
