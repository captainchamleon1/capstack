"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, CheckCircle2, Gavel, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  async function patch(body: Record<string, unknown>, label: string) {
    setBusy(label);
    setError(null);
    try {
      const res = await fetch(`/api/valuations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

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

  async function remove() {
    if (!confirm("Delete this valuation? This cannot be undone.")) return;
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

      <Button asChild variant="secondary" size="sm">
        <a href={`/api/valuations/${id}/report`} target="_blank" rel="noopener noreferrer">
          <Download className="h-4 w-4" /> Report
        </a>
      </Button>

      {canWrite && status === "draft" && (
        <Button variant="outline" size="sm" disabled={busy !== null} onClick={() => patch({ status: "in_review" }, "review")}>
          <Eye className="h-4 w-4" /> {busy === "review" ? "…" : "Mark in review"}
        </Button>
      )}

      {canWrite && status !== "final" && (
        <Button variant="outline" size="sm" disabled={busy !== null} onClick={() => patch({ status: "final" }, "final")}>
          <CheckCircle2 className="h-4 w-4" /> {busy === "final" ? "…" : "Finalize"}
        </Button>
      )}

      {canWrite && !adopted && (
        <Button size="sm" disabled={busy !== null} onClick={adopt}>
          <Gavel className="h-4 w-4" /> {busy === "adopt" ? "…" : "Adopt as FMV"}
        </Button>
      )}

      {canWrite && (
        <Button variant="ghost" size="sm" disabled={busy !== null} onClick={remove}>
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
