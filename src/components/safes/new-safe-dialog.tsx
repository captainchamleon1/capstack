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

interface NewSafeDialogProps {
  stakeholders: StakeholderOption[];
}

export function NewSafeDialog({ stakeholders }: NewSafeDialogProps) {
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
      const res = await fetch("/api/safes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stakeholderId: form.get("stakeholderId"),
          type: form.get("type"),
          investmentAmount: form.get("investmentAmount"),
          valuationCap: form.get("valuationCap") || undefined,
          discountRate: form.get("discountRate") || undefined,
          proRata: form.get("proRata") === "on",
          issueDate: form.get("issueDate"),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create SAFE");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          New SAFE
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New SAFE</DialogTitle>
          <DialogDescription>Record a Simple Agreement for Future Equity.</DialogDescription>
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
          <SelectField label="SAFE Type" name="type" defaultValue="valuation_cap">
            <option value="valuation_cap">Valuation cap</option>
            <option value="discount">Discount</option>
            <option value="cap_and_discount">Cap + discount</option>
            <option value="mfn">MFN</option>
          </SelectField>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="investmentAmount">Investment ($)</Label>
              <Input id="investmentAmount" name="investmentAmount" type="number" min={1} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="valuationCap">Valuation cap ($)</Label>
              <Input id="valuationCap" name="valuationCap" type="number" min={0} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="discountRate">Discount (0–1)</Label>
              <Input id="discountRate" name="discountRate" type="number" step="0.01" min={0} max={1} placeholder="0.20" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="issueDate">Issue date</Label>
              <Input id="issueDate" name="issueDate" type="date" defaultValue={today} required />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" name="proRata" className="rounded border-border-default accent-brand" />
            Pro-rata rights
          </label>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create SAFE"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
