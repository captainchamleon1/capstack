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

interface NoteData {
  id: string;
  status: string;
  principalAmount: number;
  interestRate: number;
  valuationCap: number | null;
  discountRate: number | null;
  issueDate: Date | string;
  maturityDate: Date | string | null;
  notes: string | null;
}

interface NoteRowActionsProps {
  note: NoteData;
  canWrite?: boolean;
}

function toDateInput(value: Date | string | null) {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toISOString().split("T")[0];
}

export function NoteRowActions({ note, canWrite = false }: NoteRowActionsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canWrite) return null;
  if (note.status === "converted") return null;

  async function handleCancel() {
    if (!confirm("Cancel this convertible note?")) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/convertible-notes/${note.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to cancel note");
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
      const res = await fetch(`/api/convertible-notes/${note.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: form.get("status"),
          principalAmount: form.get("principalAmount"),
          interestRate: form.get("interestRate"),
          valuationCap: form.get("valuationCap") || null,
          discountRate: form.get("discountRate") || null,
          issueDate: form.get("issueDate"),
          maturityDate: form.get("maturityDate") || null,
          notes: form.get("notes") || null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update note");
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
            <DialogTitle>Edit Convertible Note</DialogTitle>
            <DialogDescription>Update terms or status for this note.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <SelectField label="Status" name="status" required defaultValue={note.status}>
              <option value="outstanding">Outstanding</option>
              <option value="cancelled">Cancelled</option>
            </SelectField>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor={`principal-${note.id}`}>Principal</Label>
                <Input
                  id={`principal-${note.id}`}
                  name="principalAmount"
                  type="number"
                  step="0.01"
                  required
                  defaultValue={note.principalAmount}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`interest-${note.id}`}>Interest rate (0–1)</Label>
                <Input
                  id={`interest-${note.id}`}
                  name="interestRate"
                  type="number"
                  step="0.01"
                  required
                  defaultValue={note.interestRate}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor={`note-cap-${note.id}`}>Valuation cap</Label>
                <Input
                  id={`note-cap-${note.id}`}
                  name="valuationCap"
                  type="number"
                  step="0.01"
                  defaultValue={note.valuationCap ?? ""}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`note-discount-${note.id}`}>Discount rate (0–1)</Label>
                <Input
                  id={`note-discount-${note.id}`}
                  name="discountRate"
                  type="number"
                  step="0.01"
                  defaultValue={note.discountRate ?? ""}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor={`note-issue-${note.id}`}>Issue date</Label>
                <Input
                  id={`note-issue-${note.id}`}
                  name="issueDate"
                  type="date"
                  required
                  defaultValue={toDateInput(note.issueDate)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`note-maturity-${note.id}`}>Maturity date</Label>
                <Input
                  id={`note-maturity-${note.id}`}
                  name="maturityDate"
                  type="date"
                  defaultValue={toDateInput(note.maturityDate)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`note-notes-${note.id}`}>Notes</Label>
              <Input id={`note-notes-${note.id}`} name="notes" defaultValue={note.notes ?? ""} />
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
      {note.status === "outstanding" && (
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
