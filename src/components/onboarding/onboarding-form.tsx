"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/ui/select-field";
import { SplitMarketingLayout } from "@/components/layout/split-marketing-layout";
import { Loader2 } from "lucide-react";

interface OnboardingFormProps {
  userEmail?: string;
}

export function OnboardingForm({ userEmail }: OnboardingFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          legalName: form.get("legalName") || undefined,
          state: form.get("state"),
          incorporationDate: form.get("incorporationDate") || undefined,
          authorizedShares: form.get("authorizedShares"),
          optionPoolPercent: form.get("optionPoolPercent"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create company");

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <SplitMarketingLayout
      headline="Your cap table, from day one."
      description="We'll set up common stock, an option pool, and your founder record — structured correctly so every grant and round builds on a solid foundation."
      bullets={[
        "Founder common stock issuance",
        "Option pool reservation",
        "Ready for your first hires",
      ]}
    >
      <div className="rounded-2xl border border-border-default panel-card p-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold text-foreground">Set up your company</h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            A few details and your workspace is ready.
          </p>
          {userEmail && (
            <p className="mt-3 text-xs text-subtle-foreground">
              Signed in as <span className="text-foreground">{userEmail}</span>
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Company name</Label>
            <Input id="name" name="name" required placeholder="Acme Robotics" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="legalName">Legal name (optional)</Label>
            <Input id="legalName" name="legalName" placeholder="Acme Robotics, Inc." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="state">State</Label>
              <Input id="state" name="state" defaultValue="Delaware" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="incorporationDate">Incorporation date</Label>
              <Input id="incorporationDate" name="incorporationDate" type="date" defaultValue={today} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="authorizedShares">Authorized shares</Label>
              <Input id="authorizedShares" name="authorizedShares" type="number" defaultValue={10000000} />
            </div>
            <SelectField label="Option pool %" name="optionPoolPercent" defaultValue="0.15">
              <option value="0.10">10%</option>
              <option value="0.15">15%</option>
              <option value="0.20">20%</option>
            </SelectField>
          </div>

          {error && (
            <p className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating company…
              </>
            ) : (
              "Create company & continue"
            )}
          </Button>
        </form>

        <div className="mt-6 space-y-3 border-t border-border-default pt-6 text-center text-sm text-muted-foreground">
          <p>
            Exploring the demo?{" "}
            <button type="button" onClick={handleSignOut} className="text-brand hover:underline">
              Sign out
            </button>{" "}
            and log in with{" "}
            <span className="text-foreground">demo@acmerobotics.com</span> /{" "}
            <span className="text-foreground">demo12345</span>
          </p>
          <p>
            Already have a company?{" "}
            <Link href="/login" className="text-brand hover:underline">
              Try a different account
            </Link>
          </p>
        </div>
      </div>
    </SplitMarketingLayout>
  );
}
