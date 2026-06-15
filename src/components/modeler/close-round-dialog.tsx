"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
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
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { ConversionResult } from "@/lib/cap-table";

interface StakeholderOption {
  id: string;
  name: string;
  type: string;
}

interface CloseRoundDialogProps {
  preMoney: number;
  investment: number;
  poolTarget: number;
  pricePerShare: number;
  newShares: number;
  poolIncrease: number;
  safeConversions: ConversionResult[];
  noteConversions: (ConversionResult & { accruedInterest?: number })[];
  investors: StakeholderOption[];
  outstandingSafes: number;
  outstandingNotes: number;
}

export function CloseRoundDialog({
  preMoney,
  investment,
  poolTarget,
  pricePerShare,
  newShares,
  poolIncrease,
  safeConversions,
  noteConversions,
  investors,
  outstandingSafes,
  outstandingNotes,
}: CloseRoundDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const today = new Date().toISOString().split("T")[0];

  const defaultInvestor = investors[0]?.id ?? "";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/fundraise-rounds/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          type: form.get("type"),
          preMoneyValuation: preMoney,
          investmentAmount: investment,
          optionPoolTarget: poolTarget,
          investorStakeholderId: form.get("investorStakeholderId"),
          closeDate: form.get("closeDate"),
          convertSafes: form.get("convertSafes") === "on",
          convertNotes: form.get("convertNotes") === "on",
          liquidationPref: form.get("liquidationPref") || 1,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to close round");
    } finally {
      setLoading(false);
    }
  }

  const totalConversionShares =
    safeConversions.reduce((s, c) => s + c.shares, 0) +
    noteConversions.reduce((s, c) => s + c.shares, 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Lock className="h-4 w-4" />
          Close Round on Cap Table
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Close Priced Round</DialogTitle>
          <DialogDescription>
            Record this round on your cap table — issue preferred shares, convert instruments, and
            update the option pool.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border-default bg-surface-elevated p-4 text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Price per share</span>
            <span className="font-medium stat-value">{formatCurrency(pricePerShare)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">New investor shares</span>
            <span className="font-medium stat-value">{formatNumber(newShares)}</span>
          </div>
          {poolIncrease > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pool increase</span>
              <span className="font-medium stat-value">{formatNumber(poolIncrease)}</span>
            </div>
          )}
          {totalConversionShares > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Conversion shares</span>
              <span className="font-medium stat-value">{formatNumber(totalConversionShares)}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Round name</Label>
              <Input id="name" name="name" required defaultValue="Series A" placeholder="Series A" />
            </div>
            <SelectField label="Round type" name="type" defaultValue="series_a">
              <option value="seed">Seed</option>
              <option value="series_a">Series A</option>
              <option value="series_b">Series B</option>
              <option value="series_c">Series C</option>
              <option value="bridge">Bridge</option>
              <option value="other">Other</option>
            </SelectField>
          </div>

          <SelectField
            label="Lead investor (receives round shares)"
            name="investorStakeholderId"
            required
            defaultValue={defaultInvestor}
          >
            {investors.length === 0 ? (
              <option value="" disabled>
                Add an investor stakeholder first
              </option>
            ) : (
              investors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))
            )}
          </SelectField>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="closeDate">Close date</Label>
              <Input id="closeDate" name="closeDate" type="date" defaultValue={today} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="liquidationPref">Liquidation preference</Label>
              <Input
                id="liquidationPref"
                name="liquidationPref"
                type="number"
                step="0.1"
                min={0}
                defaultValue={1}
              />
            </div>
          </div>

          <div className="space-y-2 rounded-lg border border-border-default p-4">
            <p className="text-sm font-medium text-foreground">Conversions</p>
            {outstandingSafes > 0 && (
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  name="convertSafes"
                  defaultChecked
                  className="rounded border-border-default accent-brand"
                />
                Convert {outstandingSafes} outstanding SAFE{outstandingSafes !== 1 ? "s" : ""} (
                {formatNumber(safeConversions.reduce((s, c) => s + c.shares, 0))} shares)
              </label>
            )}
            {outstandingNotes > 0 && (
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  name="convertNotes"
                  defaultChecked
                  className="rounded border-border-default accent-brand"
                />
                Convert {outstandingNotes} outstanding note{outstandingNotes !== 1 ? "s" : ""} (
                {formatNumber(noteConversions.reduce((s, c) => s + c.shares, 0))} shares)
              </label>
            )}
            {outstandingSafes === 0 && outstandingNotes === 0 && (
              <p className="text-sm text-subtle-foreground">No outstanding SAFEs or notes to convert.</p>
            )}
          </div>

          {investors.length === 0 && (
            <p className="text-sm text-warning bg-warning/10 border border-warning/20 rounded-lg px-3 py-2">
              Add an investor stakeholder before closing a round.
            </p>
          )}

          {error && (
            <p className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || investors.length === 0}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Closing…
                </>
              ) : (
                "Close Round"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
