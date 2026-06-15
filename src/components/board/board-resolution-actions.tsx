"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BoardResolutionActionsProps {
  resolutionId: string;
  status: string;
  canWrite?: boolean;
}

export function BoardResolutionActions({
  resolutionId,
  status,
  canWrite = false,
}: BoardResolutionActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  if (!canWrite || status === "approved" || status === "rejected") return null;

  async function updateStatus(newStatus: "approved" | "rejected" | "pending") {
    setLoading(newStatus);
    try {
      const res = await fetch(`/api/board-resolutions/${resolutionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update resolution");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {status === "draft" && (
        <Button
          size="sm"
          variant="outline"
          disabled={!!loading}
          onClick={() => updateStatus("pending")}
        >
          {loading === "pending" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit"}
        </Button>
      )}
      {(status === "draft" || status === "pending") && (
        <>
          <Button size="sm" disabled={!!loading} onClick={() => updateStatus("approved")}>
            {loading === "approved" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!!loading}
            onClick={() => updateStatus("rejected")}
          >
            {loading === "rejected" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reject"}
          </Button>
        </>
      )}
    </div>
  );
}
