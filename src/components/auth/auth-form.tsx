"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SplitMarketingLayout } from "@/components/layout/split-marketing-layout";
import { Loader2 } from "lucide-react";

interface AuthFormProps {
  mode: "login" | "signup";
  defaultEmail?: string;
  inviteToken?: string;
  redirectTo?: string;
}

export function AuthForm({ mode, defaultEmail, inviteToken, redirectTo }: AuthFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const body =
      mode === "signup"
        ? {
            name: form.get("name"),
            email: form.get("email"),
            password: form.get("password"),
          }
        : {
            email: form.get("email"),
            password: form.get("password"),
          };

    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");

      if (inviteToken) {
        const acceptRes = await fetch("/api/invites/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: inviteToken }),
        });
        if (!acceptRes.ok) throw new Error((await acceptRes.json()).error);
        router.push("/dashboard");
      } else if (redirectTo) {
        router.push(redirectTo);
      } else if (mode === "login") {
        router.push(data.hasCompany ? "/dashboard" : "/onboarding");
      } else {
        router.push("/onboarding");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SplitMarketingLayout
      headline="Ownership, modeled with precision."
      description="CapStack gives founders a single source of truth for cap tables, equity grants, SAFEs, and board approvals — without the spreadsheet chaos."
      bullets={[
        "Live cap table & vesting",
        "Issuance documents at grant",
        "Fundraise & waterfall modeling",
      ]}
    >
      <div>
        <h2 className="font-display text-2xl font-semibold text-foreground">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {inviteToken
            ? "Create your account to accept the team invite."
            : mode === "signup"
              ? "Start managing your cap table in minutes."
              : "Sign in to your equity workspace."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signup" && (
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" name="name" required placeholder="Alex Chen" />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@company.com"
            defaultValue={defaultEmail}
            readOnly={!!defaultEmail}
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            {mode === "login" && (
              <Link href="/forgot-password" className="text-xs text-brand hover:underline">
                Forgot password?
              </Link>
            )}
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="Minimum 8 characters"
          />
        </div>

        {error && (
          <p className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : mode === "signup" ? (
            "Create account"
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="text-brand hover:underline">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New to CapStack?{" "}
            <Link href="/signup" className="text-brand hover:underline">
              Create an account
            </Link>
          </>
        )}
      </p>
    </SplitMarketingLayout>
  );
}
