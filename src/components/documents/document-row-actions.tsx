"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Eye, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DOC_TYPE_TO_VARIANT } from "@/lib/documents/constants";
import type { OptionDocumentType } from "@/lib/documents/types";
import { DocumentStatusActions } from "./document-status-actions";

const DocumentPreviewDialog = dynamic(
  () => import("./document-preview-dialog").then((m) => m.DocumentPreviewDialog),
  { ssr: false }
);

interface DocumentRowActionsProps {
  documentId: string;
  status: string;
  canWrite: boolean;
  grantId: string;
  docType: string;
  docLabel: string;
}

export function DocumentRowActions({
  documentId,
  status,
  canWrite,
  grantId,
  docType,
  docLabel,
}: DocumentRowActionsProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const variant = DOC_TYPE_TO_VARIANT[docType] as OptionDocumentType | undefined;

  if (!variant) return null;

  async function download(format: "docx" | "pdf") {
    const res = await fetch(
      `/api/documents/option-grant/${grantId}?type=${variant}&format=${format}`
    );
    if (!res.ok) return;
    const blob = await res.blob();
    const disposition = res.headers.get("Content-Disposition");
    const match = disposition?.match(/filename="(.+)"/);
    const filename = match?.[1] || `document.${format}`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <DocumentStatusActions documentId={documentId} status={status} canWrite={canWrite} />
        <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
          <Eye className="h-4 w-4" />
          View
        </Button>
        <Button variant="ghost" size="sm" onClick={() => download("docx")}>
          <FileDown className="h-4 w-4" />
          .docx
        </Button>
        <Button variant="ghost" size="sm" onClick={() => download("pdf")}>
          <FileDown className="h-4 w-4" />
          .pdf
        </Button>
      </div>

      {previewOpen ? (
        <DocumentPreviewDialog
          grantId={grantId}
          docType={variant}
          docLabel={docLabel}
          open
          onOpenChange={setPreviewOpen}
        />
      ) : null}
    </>
  );
}
