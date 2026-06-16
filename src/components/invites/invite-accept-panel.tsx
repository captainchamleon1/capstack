"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SplitMarketingLayout } from "@/components/layout/split-marketing-layout";
import { Loader2, Users } from "lucide-react";

interface InvitePreview {
  email: string;
  role: string;
  companyName: string;
  invitedBy: string;
  expiresAt: string;
}

export function InviteAcceptPanel({ token }: { token: string }) {
  const router = useRouter();
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    fetch(`/api/invites/preview?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setPreview(data);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Invalid invite"))
      .finally(() => setLoading(false));
  }, [token]);

  async function acceptInvite() {
    setAccepting(true);
    setError(null);
    try {
      const res = await fetch("/api/invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept invite");
    } finally {
      setAccepting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen app-canvas flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  if (error && !preview) {
    return (
      <SplitMarketingLayout
        headline="Team access, managed."
        description="Equitr lets founders invite counsel, finance, and operators with role-based permissions — everyone sees what they need, nothing more."
        bullets={["Owner, admin, and viewer roles", "Audit trail of all changes", "Secure invite links"]}
      >
        <div className="rounded-2xl border border-danger/20 bg-danger/5 panel-card p-8 text-center">
          <p className="text-danger font-medium">{error}</p>
          <Link href="/login" className="mt-4 inline-block text-sm text-brand hover:underline">
            Go to login
          </Link>
        </div>
      </SplitMarketingLayout>
    );
  }

  if (!preview) return null;

  const signupUrl = `/signup?email=${encodeURIComponent(preview.email)}&invite=${token}`;
  const loginUrl = `/login?from=${encodeURIComponent(`/invite/${token}`)}`;

  return (
    <SplitMarketingLayout
      headline="You're on the team."
      description="Join your company's cap table workspace with the right level of access from day one."
      bullets={[
        "View grants, stakeholders, and documents",
        "Role-based permissions",
        "Full audit history",
      ]}
    >
      <div className="rounded-2xl border border-border-default panel-card p-8 space-y-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 border border-brand/20">
          <Users className="h-6 w-6 text-brand" />
        </div>

        <div>
          <p className="text-sm text-muted-foreground">You&apos;re invited to join</p>
          <h1 className="mt-2 font-display text-2xl font-semibold text-foreground">
            {preview.companyName}
          </h1>
          <p className="mt-2 text-sm text-subtle-foreground">
            {preview.invitedBy} invited you as{" "}
            <span className="text-brand font-medium">{preview.role}</span>
          </p>
          <p className="mt-1 text-xs text-subtle-foreground">{preview.email}</p>
        </div>

        {error && (
          <p className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="space-y-3">
          <Button className="w-full" onClick={acceptInvite} disabled={accepting}>
            {accepting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Accept invite"}
          </Button>
          <p className="text-xs text-subtle-foreground">
            Sign in with <strong className="text-foreground">{preview.email}</strong> to accept
          </p>
          <div className="flex gap-3 justify-center text-sm">
            <Link href={loginUrl} className="text-brand hover:underline">
              Sign in
            </Link>
            <span className="text-subtle-foreground">·</span>
            <Link href={signupUrl} className="text-brand hover:underline">
              Create account
            </Link>
          </div>
        </div>
      </div>
    </SplitMarketingLayout>
  );
}
