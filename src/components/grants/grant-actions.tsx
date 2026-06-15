"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExerciseGrantDialog } from "./exercise-grant-dialog";

interface GrantActionsProps {
  grantId: string;
  grantType: string;
  status: string;
  exercisableShares: number;
  strikePrice: number | null;
  canWrite?: boolean;
}

export function GrantActions({
  grantId,
  grantType,
  status,
  exercisableShares,
  strikePrice,
  canWrite = false,
}: GrantActionsProps) {
  const router = useRouter();
  const [cancelling, setCancelling] = useState(false);

  const isOption = ["iso", "nso", "warrant"].includes(grantType);
  const canCancel = status === "active" && grantType !== "pool_reservation";

  async function handleCancel() {
    if (!confirm("Cancel this grant? This cannot be undone.")) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/grants/${grantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to cancel grant");
    } finally {
      setCancelling(false);
    }
  }

  if (!canWrite) return null;
  if (!isOption && !canCancel) return null;

  return (
    <div className="flex items-center gap-2">
      {isOption && status === "active" && (
        <ExerciseGrantDialog
          grantId={grantId}
          exercisableShares={exercisableShares}
          strikePrice={strikePrice}
        />
      )}
      {canCancel && (
        <Button variant="outline" size="sm" onClick={handleCancel} disabled={cancelling}>
          {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cancel Grant"}
        </Button>
      )}
    </div>
  );
}
