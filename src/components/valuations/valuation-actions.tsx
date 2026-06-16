"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Gavel, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clientCanDownloadReport } from "@/lib/analyst";

interface Props {
  id: string;
  status: string;
  adopted: boolean;
  canWrite: boolean;
  concludedFmv: number;
}

export function ValuationActions({ id, status, adopted, canWrite, concludedFmv }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canDownload = clientCanDownloadReport(status);
  const canAdopt = canWrite && status === "final" && !adopted;
  const canWithdraw = canWrite && status === "submitted";

  async function adopt() {
    if (!confirm(`Adopt $${concludedFmv.toFixed(4)}/share as the company's official 409A FMV? This updates the strike price used for new option grants.`)) return;
    setBusy("adopt");
    setError(null);
    try {
      const res = await fetch(`/api/valuations/${id}/adopt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ createBoardResolution: true }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  async function withdraw() {
    if (!confirm("Withdraw this submission? You can submit a new request later.")) return;
    setBusy("delete");
    try {
      const res = await fetch(`/api/valuations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      router.push("/valuations");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {error && <span className="text-xs text-danger">{error}</span>}

      {canDownload ? (
        <Button asChild variant="secondary" size="sm">
          <a href={`/api/valuations/${id}/report`} target="_blank" rel="noopener noreferrer">
            <Download className="h-4 w-4" /> Download report
          </a>
        </Button>
      ) : (
        <Button variant="secondary" size="sm" disabled>
          <Clock className="h-4 w-4" /> Report pending
        </Button>
      )}

      {canAdopt && (
        <Button size="sm" disabled={busy !== null} onClick={adopt}>
          <Gavel className="h-4 w-4" /> {busy === "adopt" ? "…" : "Adopt as FMV"}
        </Button>
      )}

      {canWithdraw && (
        <Button variant="ghost" size="sm" disabled={busy !== null} onClick={withdraw}>
          <Trash2 className="h-4 w-4" /> {busy === "delete" ? "…" : "Withdraw"}
        </Button>
      )}
    </div>
  );
}
