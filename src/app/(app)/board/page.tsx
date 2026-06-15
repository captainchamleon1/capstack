import { Header } from "@/components/layout/header";
import { PageBody } from "@/components/layout/page-body";
import { EmptyState } from "@/components/layout/empty-state";
import { Card, CardContent } from "@/components/ui/card";import { Badge } from "@/components/ui/badge";
import { getCompanyWithCapTable, requireSessionMembership } from "@/lib/db";
import { canWriteCapTable } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";
import { CheckCircle, Clock, XCircle, Gavel } from "lucide-react";
import { NewBoardResolutionDialog } from "@/components/board/new-board-resolution-dialog";
import { BoardResolutionActions } from "@/components/board/board-resolution-actions";
import { ReadOnlyBanner } from "@/components/layout/read-only-banner";

const statusConfig: Record<string, { variant: "default" | "warning" | "destructive" | "secondary"; icon: typeof CheckCircle }> = {
  approved: { variant: "default", icon: CheckCircle },
  pending: { variant: "warning", icon: Clock },
  rejected: { variant: "destructive", icon: XCircle },
  draft: { variant: "secondary", icon: Clock },
};

export default async function BoardPage() {
  const { company: sessionCompany, role } = await requireSessionMembership();
  const data = await getCompanyWithCapTable(sessionCompany.id);
  if (!data) return null;

  const canWrite = canWriteCapTable(role);
  const { company } = data;

  return (
    <div>
      <Header
        title="Board Resolutions"
        description="Track board approvals for grants, fundraises, and governance"
        actions={canWrite ? <NewBoardResolutionDialog /> : null}
      />

      <PageBody className="space-y-4">
        {!canWrite && <ReadOnlyBanner />}
        {company.boardResolutions.length === 0 ? (
          <EmptyState
            icon={Gavel}
            title="No board resolutions yet"
            description="Record grant approvals, pool increases, and fundraise authorizations."
          />
        ) : (
          company.boardResolutions.map((res) => {
            const config = statusConfig[res.status] || statusConfig.draft;
            const StatusIcon = config.icon;

            return (
              <Card key={res.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-overlay">
                        <StatusIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">{res.title}</p>
                        {res.description && (
                          <p className="mt-1 text-sm text-muted-foreground">{res.description}</p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-subtle-foreground">
                          <Badge variant="outline">{res.type.replace(/_/g, " ")}</Badge>
                          {res.meetingDate && <span>Meeting: {formatDate(res.meetingDate)}</span>}
                          {res.approvedAt && <span>Approved: {formatDate(res.approvedAt)}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Badge variant={config.variant}>{res.status}</Badge>
                      <BoardResolutionActions
                        resolutionId={res.id}
                        status={res.status}
                        canWrite={canWrite}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </PageBody>
    </div>
  );
}
