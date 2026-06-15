import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle } from "lucide-react";
import { DocumentRowActions } from "@/components/documents/document-row-actions";
import { DocumentStatusActions } from "@/components/documents/document-status-actions";
import { DOC_TYPE_TO_VARIANT } from "@/lib/documents/constants";
import { formatDate } from "@/lib/utils";

interface GrantDocument {
  id: string;
  name: string;
  type: string;
  status: string;
  signedAt: Date | null;
}

interface GrantDocumentsListProps {
  grantId: string;
  documents: GrantDocument[];
  canWrite?: boolean;
}

export function GrantDocumentsList({
  grantId,
  documents,
  canWrite = false,
}: GrantDocumentsListProps) {
  if (documents.length === 0) {
    return (
      <p className="text-sm text-subtle-foreground">
        No issuance documents on file for this security.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => {
        const isPreviewable = !!DOC_TYPE_TO_VARIANT[doc.type];

        return (
          <div
            key={doc.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-border-default px-4 py-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-overlay">
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="outline" className="text-[10px]">
                    {doc.type.replace(/_/g, " ")}
                  </Badge>
                  <Badge
                    variant={
                      doc.status === "signed" ? "default" : doc.status === "sent" ? "info" : "secondary"
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

            {isPreviewable ? (
              <DocumentRowActions
                documentId={doc.id}
                status={doc.status}
                canWrite={canWrite}
                grantId={grantId}
                docType={doc.type}
                docLabel={doc.name}
              />
            ) : (
              <DocumentStatusActions
                documentId={doc.id}
                status={doc.status}
                canWrite={canWrite}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
