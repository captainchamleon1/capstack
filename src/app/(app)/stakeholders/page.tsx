import Link from "next/link";
import { Header } from "@/components/layout/header";
import { PageBody } from "@/components/layout/page-body";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCompanyWithCapTable, requireSessionMembership } from "@/lib/db";
import { canWriteCapTable } from "@/lib/permissions";
import { ReadOnlyBanner } from "@/components/layout/read-only-banner";
import { formatNumber, formatPercent, formatDate } from "@/lib/utils";
import { Mail, ChevronRight } from "lucide-react";
import { NewStakeholderDialog } from "@/components/stakeholders/new-stakeholder-dialog";

const typeColors: Record<string, "default" | "secondary" | "info" | "warning"> = {
  founder: "default",
  employee: "info",
  investor: "warning",
  advisor: "secondary",
  board: "secondary",
};

export default async function StakeholdersPage() {
  const { company: sessionCompany, role } = await requireSessionMembership();
  const data = await getCompanyWithCapTable(sessionCompany.id);
  if (!data) return null;

  const canWrite = canWriteCapTable(role);
  const { company, capTable } = data;

  const stakeholderOwnership = new Map<string, number>();
  for (const entry of capTable.entries) {
    stakeholderOwnership.set(
      entry.stakeholderId,
      (stakeholderOwnership.get(entry.stakeholderId) || 0) + entry.ownershipPercent
    );
  }

  const grouped = {
    founder: company.stakeholders.filter((s) => s.type === "founder"),
    employee: company.stakeholders.filter((s) => s.type === "employee"),
    investor: company.stakeholders.filter((s) => s.type === "investor"),
    advisor: company.stakeholders.filter((s) => s.type === "advisor"),
    board: company.stakeholders.filter((s) => s.type === "board"),
  };

  return (
    <div>
      <Header
        title="Stakeholders"
        description={`${company.stakeholders.length} stakeholders across your cap table`}
        actions={canWrite ? <NewStakeholderDialog /> : null}
      />

      <PageBody>
        {!canWrite && <ReadOnlyBanner />}
        {Object.entries(grouped).map(([type, stakeholders]) => {
          if (stakeholders.length === 0) return null;
          return (
            <div key={type}>
              <h3 className="section-label mb-4">
                {type}s ({stakeholders.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stakeholders.map((s) => {
                  const ownership = stakeholderOwnership.get(s.id) || 0;
                  const grants = company.equityGrants.filter((g) => g.stakeholderId === s.id);
                  const totalShares = grants.reduce((sum, g) => sum + g.sharesGranted, 0);

                  return (
                    <Link key={s.id} href={`/stakeholders/${s.id}`}>
                    <Card className="hover:border-brand/30 transition-colors cursor-pointer group">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 avatar-initials text-sm">
                              {s.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{s.name}</p>
                              {s.title && <p className="text-xs text-subtle-foreground">{s.title}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={typeColors[s.type] || "secondary"}>{s.type}</Badge>
                            <ChevronRight className="h-4 w-4 text-subtle-foreground group-hover:text-brand transition-colors" />
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-subtle-foreground">Ownership</p>
                            <p className="text-lg font-bold text-brand stat-value">
                              {ownership > 0 ? formatPercent(ownership, 2) : "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-subtle-foreground">Shares</p>
                            <p className="text-lg font-bold text-foreground stat-value">
                              {totalShares > 0 ? formatNumber(totalShares) : "—"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between text-xs text-subtle-foreground">
                          {s.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {s.email}
                            </span>
                          )}
                          {s.startDate && <span>Since {formatDate(s.startDate)}</span>}
                        </div>

                        {grants.length > 0 && (
                          <div className="mt-3 flex gap-1 flex-wrap">
                            {grants.map((g) => (
                              <Badge key={g.id} variant="outline" className="text-[10px]">
                                {g.type.toUpperCase()} · {formatNumber(g.sharesGranted)}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </PageBody>
    </div>
  );
}
