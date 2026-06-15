"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DocumentStatusActionsProps {
  documentId: string;
  status: string;
  canWrite: boolean;
}

export function DocumentStatusActions({ documentId, status, canWrite }: DocumentStatusActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  if (!canWrite || status === "signed") return null;

  async function updateStatus(newStatus: "sent" | "signed") {
    setLoading(newStatus);
    try {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update document");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex items-center gap-1">
      {status === "draft" && (
        <Button
          variant="outline"
          size="sm"
          disabled={!!loading}
          onClick={() => updateStatus("sent")}
        >
          {loading === "sent" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <>
              <Send className="h-3 w-3" />
              Mark Sent
            </>
          )}
        </Button>
      )}
      <Button size="sm" disabled={!!loading} onClick={() => updateStatus("signed")}>
        {loading === "signed" ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <>
            <CheckCircle className="h-3 w-3" />
            Mark Signed
          </>
        )}
      </Button>
    </div>
  );
}
