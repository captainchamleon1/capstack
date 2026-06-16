"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Eye, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DOC_TYPE_TO_VARIANT } from "@/lib/documents/constants";
import type { OptionDocumentType } from "@/lib/documents/types";

const DocumentPreviewDialog = dynamic(
  () => import("./document-preview-dialog").then((m) => m.DocumentPreviewDialog),
  { ssr: false }
);

interface IssuedDocument {
  id: string;
  name: string;
  type: string;
}

interface IssuedDocumentsPanelProps {
  grantId: string;
  documents: IssuedDocument[];
}

export function IssuedDocumentsPanel({ grantId, documents }: IssuedDocumentsPanelProps) {
  const [preview, setPreview] = useState<{ type: OptionDocumentType; label: string } | null>(null);

  async function download(docType: string, format: "docx" | "pdf") {
    const variant = DOC_TYPE_TO_VARIANT[docType];
    if (!variant) return;

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
    <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
      <p className="text-sm font-medium text-emerald-400">
        Issuance documents generated ({documents.length})
      </p>
      <p className="text-xs text-zinc-500">
        Documents are created at grant issuance and cannot be regenerated later.
      </p>
      <div className="space-y-2">
        {documents.map((doc) => {
          const variant = DOC_TYPE_TO_VARIANT[doc.type];
          return (
            <div
              key={doc.id}
              className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2"
            >
              <span className="text-sm text-zinc-200">{doc.name}</span>
              {variant ? (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreview({ type: variant, label: doc.name })}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => download(doc.type, "docx")}>
                    <FileDown className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {preview ? (
        <DocumentPreviewDialog
          grantId={grantId}
          docType={preview.type}
          docLabel={preview.label}
          open
          onOpenChange={(v) => !v && setPreview(null)}
        />
      ) : null}
    </div>
  );
}
