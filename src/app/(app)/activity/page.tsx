import { Header } from "@/components/layout/header";
import { PageBody } from "@/components/layout/page-body";
import { EmptyState } from "@/components/layout/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireSessionMembership } from "@/lib/db";
import { listAuditEvents, formatAuditAction } from "@/lib/audit";
import { formatDate } from "@/lib/utils";
import { Activity } from "lucide-react";

export default async function ActivityPage() {
  const { company } = await requireSessionMembership();
  const events = await listAuditEvents(company.id, 100);

  return (
    <div>
      <Header
        title="Activity Log"
        description="Audit trail of changes across your cap table and documents"
      />

      <PageBody className="space-y-0">
        {events.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No activity recorded yet"
            description="Changes to grants, documents, rounds, and team access will appear here."
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border-default">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 px-6 py-4 hover:bg-surface-overlay/30 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{event.summary}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-subtle-foreground">
                        <Badge variant="outline" className="text-[10px]">
                          {formatAuditAction(event.action)}
                        </Badge>
                        {event.user && (
                          <span>
                            {event.user.name} · {event.user.email}
                          </span>
                        )}
                        {event.entityType && (
                          <span className="text-muted-foreground">
                            {event.entityType}
                            {event.entityId ? ` · ${event.entityId.slice(0, 8)}…` : ""}
                          </span>
                        )}
                      </div>
                    </div>
                    <time className="text-xs text-subtle-foreground shrink-0 tabular-nums">
                      {formatDate(event.createdAt)}
                    </time>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </PageBody>
    </div>
  );
}
