"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { renderAsync } from "docx-preview";
import { FileDown, Loader2, FileText, FileType } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { OptionDocumentType } from "@/lib/documents/types";
import { cn } from "@/lib/utils";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type PreviewTab = "word" | "pdf";

interface DocumentPreviewDialogProps {
  grantId: string;
  docType: OptionDocumentType;
  docLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentPreviewDialog({
  grantId,
  docType,
  docLabel,
  open,
  onOpenChange,
}: DocumentPreviewDialogProps) {
  const [tab, setTab] = useState<PreviewTab>("word");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);
  const docxContainerRef = useRef<HTMLDivElement>(null);
  const pdfUrlRef = useRef<string | null>(null);

  const releaseResources = useCallback(() => {
    if (pdfUrlRef.current) {
      URL.revokeObjectURL(pdfUrlRef.current);
      pdfUrlRef.current = null;
    }
    if (docxContainerRef.current) docxContainerRef.current.innerHTML = "";
  }, []);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        releaseResources();
        setPdfUrl(null);
        setNumPages(0);
        setError(null);
        setLoading(false);
      }
      onOpenChange(next);
    },
    [onOpenChange, releaseResources]
  );

  const loadWord = useCallback(async () => {
    if (!docxContainerRef.current) return;
    const res = await fetch(
      `/api/documents/option-grant/${grantId}?type=${docType}&format=docx&inline=1`
    );
    if (!res.ok) throw new Error("Failed to load document");
    const blob = await res.blob();
    docxContainerRef.current.innerHTML = "";
    await renderAsync(blob, docxContainerRef.current, undefined, {
      className: "docx-preview-content",
      inWrapper: true,
      ignoreWidth: false,
      ignoreHeight: false,
    });
  }, [grantId, docType]);

  const loadPdf = useCallback(async () => {
    if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current);
    const res = await fetch(
      `/api/documents/option-grant/${grantId}?type=${docType}&format=pdf&inline=1`
    );
    if (!res.ok) throw new Error("Failed to load PDF");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    pdfUrlRef.current = url;
    setPdfUrl(url);
  }, [grantId, docType]);

  const runLoad = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (tab === "word") {
        await loadWord();
      } else {
        await loadPdf();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [tab, loadWord, loadPdf]);

  useEffect(() => {
    if (!open) return;
    void runLoad();
  }, [open, tab, runLoad]);

  useEffect(() => {
    return () => releaseResources();
  }, [releaseResources]);

  async function download(format: "docx" | "pdf") {
    const res = await fetch(
      `/api/documents/option-grant/${grantId}?type=${docType}&format=${format}`
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 gap-0" aria-describedby="doc-preview-desc">
        <DialogTitle className="sr-only">{docLabel} — Document Preview</DialogTitle>
        <DialogDescription id="doc-preview-desc" className="sr-only">
          Preview and download Word or PDF versions of this equity document
        </DialogDescription>
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border-default shrink-0">
          <div className="flex items-start justify-between pr-8">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{docLabel}</h2>
              <p className="text-sm text-muted-foreground">Preview and download Word or PDF</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => download("docx")}>
                <FileType className="h-4 w-4" />
                .docx
              </Button>
              <Button variant="outline" size="sm" onClick={() => download("pdf")}>
                <FileDown className="h-4 w-4" />
                .pdf
              </Button>
            </div>
          </div>

          <div className="flex gap-1 mt-4 p-1 rounded-lg bg-surface-elevated w-fit">
            {(
              [
                { id: "word" as const, label: "Word", icon: FileText },
                { id: "pdf" as const, label: "PDF", icon: FileDown },
              ] as const
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                  tab === id
                    ? "bg-brand/12 text-brand border border-brand/20"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden relative bg-surface-elevated/80">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-ink/80 z-10">
              <Loader2 className="h-8 w-8 animate-spin text-brand" />
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full p-8">
              <p className="text-danger">{error}</p>
            </div>
          )}

          {!error && tab === "word" && (
            <div className="h-full overflow-y-auto p-6">
              <div
                ref={docxContainerRef}
                className="mx-auto bg-white rounded-lg shadow-lg min-h-[600px] [&_.docx-wrapper]:!bg-white [&_.docx-wrapper]:!p-8"
              />
            </div>
          )}

          {!error && tab === "pdf" && pdfUrl && (
            <div className="h-full overflow-y-auto flex flex-col items-center py-6 gap-4">
              <Document
                file={pdfUrl}
                onLoadSuccess={({ numPages: n }) => setNumPages(n)}
                loading={
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-brand" />
                  </div>
                }
                error={<p className="text-danger p-8">Failed to render PDF</p>}
              >
                {Array.from({ length: numPages }, (_, i) => (
                  <Page
                    key={i + 1}
                    pageNumber={i + 1}
                    className="mb-4 shadow-lg"
                    width={Math.min(720, typeof window !== "undefined" ? window.innerWidth - 120 : 720)}
                    renderTextLayer
                    renderAnnotationLayer
                  />
                ))}
              </Document>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
