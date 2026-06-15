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
import { IssuedDocumentsPanel } from "@/components/documents/issued-documents-panel";

interface StakeholderOption {
  id: string;
  name: string;
  type: string;
  title: string | null;
}

interface ShareClassOption {
  id: string;
  name: string;
  type: string;
}

interface NewGrantDialogProps {
  companyId: string;
  stakeholders: StakeholderOption[];
  shareClasses: ShareClassOption[];
  defaultStrikePrice?: number;
}

const GRANT_TYPES = [
  { value: "iso", label: "ISO — Incentive Stock Option" },
  { value: "nso", label: "NSO — Non-Qualified Stock Option" },
  { value: "rsu", label: "RSU — Restricted Stock Unit" },
  { value: "rsa", label: "RSA — Restricted Stock Award" },
  { value: "warrant", label: "Warrant" },
];

export function NewGrantDialog({
  companyId,
  stakeholders,
  shareClasses,
  defaultStrikePrice,
}: NewGrantDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<{
    grantId: string;
    documents: { id: string; name: string; type: string }[];
  } | null>(null);

  const optionPool = shareClasses.find((sc) => sc.type === "option_pool");
  const today = new Date().toISOString().split("T")[0];
  const defaultExpiration = new Date();
  defaultExpiration.setFullYear(defaultExpiration.getFullYear() + 10);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/grants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stakeholderId: form.get("stakeholderId"),
          shareClassId: form.get("shareClassId"),
          type: form.get("type"),
          sharesGranted: form.get("sharesGranted"),
          strikePrice: form.get("strikePrice") || null,
          grantDate: form.get("grantDate"),
          expirationDate: form.get("expirationDate") || null,
          cliffMonths: form.get("cliffMonths"),
          vestingMonths: form.get("vestingMonths"),
          vestingFrequency: form.get("vestingFrequency"),
          vestingStartDate: form.get("vestingStartDate"),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create grant");
      }

      const data = await res.json();
      setIssued({
        grantId: data.grant.id,
        documents: data.documents ?? [],
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setIssued(null);
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          New Grant
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{issued ? "Grant Issued" : "New Equity Grant"}</DialogTitle>
          <DialogDescription>
            {issued
              ? "Issuance documents have been generated. Review and download below."
              : "Issue stock options or equity to a stakeholder. Documents are generated at issuance."}
          </DialogDescription>
        </DialogHeader>

        {issued ? (
          <div className="space-y-4">
            <IssuedDocumentsPanel grantId={issued.grantId} documents={issued.documents} />
            <div className="flex justify-end">
              <Button onClick={() => setOpen(false)}>Done</Button>
            </div>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <SelectField label="Stakeholder" name="stakeholderId" required defaultValue="">
            <option value="" disabled>
              Select stakeholder…
            </option>
            {stakeholders.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.type}){s.title ? ` — ${s.title}` : ""}
              </option>
            ))}
          </SelectField>

          <div className="grid grid-cols-2 gap-4">
            <SelectField label="Grant Type" name="type" required defaultValue="iso">
              {GRANT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </SelectField>

            <SelectField
              label="Share Class"
              name="shareClassId"
              required
              defaultValue={optionPool?.id || shareClasses[0]?.id}
            >
              {shareClasses.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.name}
                </option>
              ))}
            </SelectField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="sharesGranted">Shares Granted</Label>
              <Input
                id="sharesGranted"
                name="sharesGranted"
                type="number"
                min={1}
                required
                placeholder="50000"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="strikePrice">Strike Price ($)</Label>
              <Input
                id="strikePrice"
                name="strikePrice"
                type="number"
                step="0.01"
                min={0}
                placeholder={defaultStrikePrice?.toString() || "0.55"}
                defaultValue={defaultStrikePrice}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="grantDate">Grant Date</Label>
              <Input id="grantDate" name="grantDate" type="date" required defaultValue={today} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expirationDate">Expiration Date</Label>
              <Input
                id="expirationDate"
                name="expirationDate"
                type="date"
                defaultValue={defaultExpiration.toISOString().split("T")[0]}
              />
            </div>
          </div>

          <div className="rounded-lg border border-border-default p-4 space-y-4">
            <p className="text-sm font-medium text-muted-foreground">Vesting Schedule</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cliffMonths">Cliff (months)</Label>
                <Input id="cliffMonths" name="cliffMonths" type="number" min={0} defaultValue={12} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vestingMonths">Total (months)</Label>
                <Input id="vestingMonths" name="vestingMonths" type="number" min={1} defaultValue={48} />
              </div>
              <SelectField label="Frequency" name="vestingFrequency" defaultValue="monthly">
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </SelectField>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vestingStartDate">Vesting Start Date</Label>
              <Input id="vestingStartDate" name="vestingStartDate" type="date" defaultValue={today} />
            </div>
          </div>

          {error && (
            <p className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : (
                "Create Grant"
              )}
            </Button>
          </div>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
