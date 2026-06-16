"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Scale, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import type { SessionPayload } from "@/lib/auth";

export function AnalystShell({ user, children }: { user: SessionPayload; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border-default bg-surface/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Link href="/analyst/valuations">
              <Logo size="sm" />
            </Link>
            <nav className="flex items-center gap-1">
              <Link
                href="/analyst/valuations"
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname.startsWith("/analyst/valuations")
                    ? "bg-brand/10 text-brand"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Scale className="h-4 w-4" />
                Valuation queue
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-muted-foreground sm:inline">{user.name}</span>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
