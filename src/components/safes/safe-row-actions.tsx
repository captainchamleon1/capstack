"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/ui/select-field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface SafeData {
  id: string;
  type: string;
  status: string;
  investmentAmount: number;
  valuationCap: number | null;
  discountRate: number | null;
  proRata: boolean;
  issueDate: Date | string;
  notes: string | null;
}

interface SafeRowActionsProps {
  safe: SafeData;
  canWrite?: boolean;
}

function toDateInput(value: Date | string) {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toISOString().split("T")[0];
}

export function SafeRowActions({ safe, canWrite = false }: SafeRowActionsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canWrite) return null;
  if (safe.status === "converted") return null;

  async function handleCancel() {
    if (!confirm("Cancel this SAFE? It will no longer count toward outstanding convertible totals.")) {
      return;
    }
    setCancelling(true);
    try {
      const res = await fetch(`/api/safes/${safe.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to cancel SAFE");
    } finally {
      setCancelling(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch(`/api/safes/${safe.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.get("type"),
          status: form.get("status"),
          investmentAmount: form.get("investmentAmount"),
          valuationCap: form.get("valuationCap") || null,
          discountRate: form.get("discountRate") || null,
          proRata: form.get("proRata") === "on",
          issueDate: form.get("issueDate"),
          notes: form.get("notes") || null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update SAFE");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm">
            <Pencil className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit SAFE</DialogTitle>
            <DialogDescription>Update terms or status for this SAFE.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <SelectField label="Type" name="type" required defaultValue={safe.type}>
              <option value="valuation_cap">Valuation cap</option>
              <option value="discount">Discount</option>
              <option value="mfn">MFN</option>
              <option value="cap_and_discount">Cap and discount</option>
            </SelectField>
            <SelectField label="Status" name="status" required defaultValue={safe.status}>
              <option value="outstanding">Outstanding</option>
              <option value="cancelled">Cancelled</option>
            </SelectField>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor={`amount-${safe.id}`}>Investment amount</Label>
                <Input
                  id={`amount-${safe.id}`}
                  name="investmentAmount"
                  type="number"
                  step="0.01"
                  required
                  defaultValue={safe.investmentAmount}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`cap-${safe.id}`}>Valuation cap</Label>
                <Input
                  id={`cap-${safe.id}`}
                  name="valuationCap"
                  type="number"
                  step="0.01"
                  defaultValue={safe.valuationCap ?? ""}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor={`discount-${safe.id}`}>Discount rate (0–1)</Label>
                <Input
                  id={`discount-${safe.id}`}
                  name="discountRate"
                  type="number"
                  step="0.01"
                  defaultValue={safe.discountRate ?? ""}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`issue-${safe.id}`}>Issue date</Label>
                <Input
                  id={`issue-${safe.id}`}
                  name="issueDate"
                  type="date"
                  required
                  defaultValue={toDateInput(safe.issueDate)}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="proRata" defaultChecked={safe.proRata} />
              Pro rata rights
            </label>
            <div className="space-y-1.5">
              <Label htmlFor={`notes-${safe.id}`}>Notes</Label>
              <Input id={`notes-${safe.id}`} name="notes" defaultValue={safe.notes ?? ""} />
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {safe.status === "outstanding" && (
        <Button variant="ghost" size="sm" onClick={handleCancel} disabled={cancelling}>
          {cancelling ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <XCircle className="h-4 w-4 text-danger" />
          )}
        </Button>
      )}
    </div>
  );
}
