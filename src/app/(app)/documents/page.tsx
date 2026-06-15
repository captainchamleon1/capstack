import { ReadOnlyBanner } from "@/components/layout/read-only-banner";
import { Header } from "@/components/layout/header";
import { PageBody } from "@/components/layout/page-body";
import { EmptyState } from "@/components/layout/empty-state";import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCompanyWithCapTable, requireSessionMembership } from "@/lib/db";
import { canWriteCapTable } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";
import { FileText, CheckCircle } from "lucide-react";
import { DocumentRowActions } from "@/components/documents/document-row-actions";
import { DocumentStatusActions } from "@/components/documents/document-status-actions";
import { DOC_TYPE_TO_VARIANT } from "@/lib/documents/constants";

export default async function DocumentsPage() {
  const { company, role } = await requireSessionMembership();
  const data = await getCompanyWithCapTable(company.id);
  if (!data) return null;

  const canWrite = canWriteCapTable(role);
  const grantDocs = data.company.documents.filter(
    (d) => d.equityGrantId && DOC_TYPE_TO_VARIANT[d.type]
  );
  const otherDocs = data.company.documents.filter(
    (d) => !d.equityGrantId || !DOC_TYPE_TO_VARIANT[d.type]
  );

  return (
    <div>
      <Header
        title="Documents"
        description={`${data.company.documents.length} issuance documents on file`}
      />

      <PageBody>
        {!canWrite && <ReadOnlyBanner />}

        <div>
          <h3 className="section-label mb-4">Equity Grant Documents ({grantDocs.length})</h3>
          <div className="space-y-3">
            {grantDocs.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No grant documents yet"
                description="Documents are generated automatically when a new grant is issued."
              />
            ) : (
              grantDocs.map((doc) => (
                <Card key={doc.id} className="hover:border-brand/30 transition-colors">
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-overlay">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{doc.name}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="outline" className="text-[10px]">
                            {doc.type.replace(/_/g, " ")}
                          </Badge>
                          <Badge
                            variant={
                              doc.status === "signed"
                                ? "default"
                                : doc.status === "sent"
                                  ? "info"
                                  : "secondary"
                            }
                          >
                            {doc.status}
                          </Badge>
                          {doc.signedAt && (
                            <span className="text-xs text-subtle-foreground flex items-center gap-1">
                              <CheckCircle className="h-3 w-3 text-brand" />
                              Signed {formatDate(doc.signedAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {doc.equityGrantId ? (
                      <DocumentRowActions
                        documentId={doc.id}
                        status={doc.status}
                        canWrite={canWrite}
                        grantId={doc.equityGrantId}
                        docType={doc.type}
                        docLabel={doc.name}
                      />
                    ) : null}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {otherDocs.length > 0 && (
          <div>
            <h3 className="section-label mb-4">Corporate Documents ({otherDocs.length})</h3>
            <div className="space-y-3">
              {otherDocs.map((doc) => (
                <Card key={doc.id} className="hover:border-brand/30 transition-colors">
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-overlay">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{doc.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px]">
                            {doc.type.replace(/_/g, " ")}
                          </Badge>
                          {doc.signedAt && (
                            <span className="text-xs text-subtle-foreground flex items-center gap-1">
                              <CheckCircle className="h-3 w-3 text-brand" />
                              Signed {formatDate(doc.signedAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DocumentStatusActions
                        documentId={doc.id}
                        status={doc.status}
                        canWrite={canWrite}
                      />
                      <Badge
                        variant={
                          doc.status === "signed"
                            ? "default"
                            : doc.status === "sent"
                              ? "info"
                              : "secondary"
                        }
                      >
                        {doc.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </PageBody>
    </div>
  );
}
