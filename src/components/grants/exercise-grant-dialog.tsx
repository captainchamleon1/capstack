"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ExerciseGrantDialogProps {
  grantId: string;
  exercisableShares: number;
  strikePrice: number | null;
}

export function ExerciseGrantDialog({
  grantId,
  exercisableShares,
  strikePrice,
}: ExerciseGrantDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shares, setShares] = useState(exercisableShares);

  if (exercisableShares <= 0) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/grants/${grantId}/exercise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shares }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Exercise failed");
    } finally {
      setLoading(false);
    }
  }

  const exerciseCost = strikePrice ? shares * strikePrice : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Exercise Options</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Exercise Options</DialogTitle>
          <DialogDescription>
            Record an option exercise and issue common stock to the grantee.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="shares">Shares to exercise</Label>
            <Input
              id="shares"
              type="number"
              min={1}
              max={exercisableShares}
              value={shares}
              onChange={(e) => setShares(Number(e.target.value))}
              required
            />
            <p className="text-xs text-subtle-foreground">
              {exercisableShares.toLocaleString()} exercisable
            </p>
          </div>
          {strikePrice != null && (
            <div className="rounded-lg border border-border-default bg-surface-elevated px-4 py-3 text-sm">
              <p className="text-muted-foreground">Exercise cost</p>
              <p className="mt-1 font-semibold text-foreground stat-value">
                ${exerciseCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-subtle-foreground mt-1">
                {shares.toLocaleString()} × ${strikePrice.toFixed(4)}
              </p>
            </div>
          )}
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Record Exercise"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
