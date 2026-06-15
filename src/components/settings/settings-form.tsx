"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface CompanySettings {
  id: string;
  name: string;
  legalName: string | null;
  state: string | null;
  ein: string | null;
  authorizedShares: number;
  parValue: number;
  currentFmv409A: number;
  fmv409AEffectiveDate: Date | null;
  incorporationDate: Date | null;
}

export function SettingsForm({
  company,
  readOnly = false,
}: {
  company: CompanySettings;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          legalName: form.get("legalName"),
          state: form.get("state"),
          ein: form.get("ein"),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setMessage("Profile saved");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  async function saveStructure(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorizedShares: form.get("authorizedShares"),
          parValue: form.get("parValue"),
          currentFmv409A: form.get("currentFmv409A"),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setMessage("Share structure and 409A FMV saved");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  async function download(path: string, filename: string) {
    const res = await fetch(path);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {(message || error) && (
        <p
          className={`text-sm rounded-lg px-3 py-2 border ${
            error
              ? "text-danger bg-danger/10 border-danger/20"
              : "text-brand bg-brand/10 border-brand/20"
          }`}
        >
          {error || message}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Company Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveProfile} className="space-y-4">
            <div>
              <Label htmlFor="name">Company Name</Label>
              <Input id="name" name="name" className="mt-1" defaultValue={company.name} required disabled={readOnly} />
            </div>
            <div>
              <Label htmlFor="legalName">Legal Name</Label>
              <Input id="legalName" name="legalName" className="mt-1" defaultValue={company.legalName || ""} disabled={readOnly} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="state">State of Incorporation</Label>
                <Input id="state" name="state" className="mt-1" defaultValue={company.state || ""} disabled={readOnly} />
              </div>
              <div>
                <Label htmlFor="ein">EIN</Label>
                <Input id="ein" name="ein" className="mt-1" defaultValue={company.ein || ""} disabled={readOnly} />
              </div>
            </div>
            {!readOnly && (
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
            </Button>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Share Structure & 409A</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveStructure} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="authorizedShares">Authorized Shares</Label>
                <Input
                  id="authorizedShares"
                  name="authorizedShares"
                  type="number"
                  className="mt-1"
                  defaultValue={company.authorizedShares}
                  disabled={readOnly}
                />
              </div>
              <div>
                <Label htmlFor="parValue">Par Value</Label>
                <Input
                  id="parValue"
                  name="parValue"
                  type="number"
                  step="0.00001"
                  className="mt-1"
                  defaultValue={company.parValue}
                  disabled={readOnly}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="currentFmv409A">Current 409A Fair Market Value (per share)</Label>
              <Input
                id="currentFmv409A"
                name="currentFmv409A"
                type="number"
                step="0.01"
                min="0"
                className="mt-1"
                defaultValue={company.currentFmv409A}
                disabled={readOnly}
              />
              {company.fmv409AEffectiveDate && (
                <p className="mt-1 text-xs text-subtle-foreground">
                  Last updated {formatDate(company.fmv409AEffectiveDate)}
                </p>
              )}
            </div>
            {company.incorporationDate && (
              <p className="text-sm text-subtle-foreground">Incorporated {formatDate(company.incorporationDate)}</p>
            )}
            {!readOnly && (
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Share Structure"}
            </Button>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Export</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Export your complete cap table data. Your data belongs to you — always.
          </p>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => download("/api/export/cap-table", "cap_table.csv")}
            >
              Export Cap Table (CSV)
            </Button>
            <Button type="button" variant="outline" onClick={() => download("/api/export/json", "export.json")}>
              Export All Data (JSON)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
