"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
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

interface StakeholderOption {
  id: string;
  name: string;
}

interface NewNoteDialogProps {
  stakeholders: StakeholderOption[];
}

export function NewNoteDialog({ stakeholders }: NewNoteDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const today = new Date().toISOString().split("T")[0];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/convertible-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stakeholderId: form.get("stakeholderId"),
          principalAmount: form.get("principalAmount"),
          interestRate: form.get("interestRate") || undefined,
          valuationCap: form.get("valuationCap") || undefined,
          discountRate: form.get("discountRate") || undefined,
          issueDate: form.get("issueDate"),
          maturityDate: form.get("maturityDate") || undefined,
          notes: form.get("notes") || undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create note");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4" />
          New Note
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Convertible Note</DialogTitle>
          <DialogDescription>Record a convertible note investment.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <SelectField label="Investor" name="stakeholderId" required defaultValue="">
            <option value="" disabled>
              Select investor…
            </option>
            {stakeholders.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </SelectField>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="principalAmount">Principal ($)</Label>
              <Input id="principalAmount" name="principalAmount" type="number" min={1} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="interestRate">Interest rate (0–1)</Label>
              <Input
                id="interestRate"
                name="interestRate"
                type="number"
                step="0.01"
                min={0}
                max={1}
                placeholder="0.06"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="valuationCap">Valuation cap ($)</Label>
              <Input id="valuationCap" name="valuationCap" type="number" min={0} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="discountRate">Discount (0–1)</Label>
              <Input
                id="discountRate"
                name="discountRate"
                type="number"
                step="0.01"
                min={0}
                max={1}
                placeholder="0.20"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="issueDate">Issue date</Label>
              <Input id="issueDate" name="issueDate" type="date" defaultValue={today} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="maturityDate">Maturity date</Label>
              <Input id="maturityDate" name="maturityDate" type="date" />
            </div>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Note"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
