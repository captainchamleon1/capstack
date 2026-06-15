"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  PieChart,
  TrendingUp,
  FileText,
  Gavel,
  Calculator,
  Layers,
  Settings,
  LogOut,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { roleLabel } from "@/lib/permissions";
import type { SessionPayload } from "@/lib/auth";

const navGroups = [
  {
    label: "Overview",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Cap Table", href: "/cap-table", icon: PieChart },
    ],
  },
  {
    label: "Equity",
    items: [
      { name: "Stakeholders", href: "/stakeholders", icon: Users },
      { name: "Grants", href: "/grants", icon: Layers },
      { name: "SAFEs & Notes", href: "/safes", icon: FileText },
    ],
  },
  {
    label: "Planning",
    items: [
      { name: "Fundraise Modeler", href: "/modeler", icon: TrendingUp },
      { name: "Waterfall", href: "/waterfall", icon: Calculator },
    ],
  },
  {
    label: "Governance",
    items: [
      { name: "Board", href: "/board", icon: Gavel },
      { name: "Documents", href: "/documents", icon: FileText },
      { name: "Activity", href: "/activity", icon: Activity },
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function Sidebar({ user, role }: { user: SessionPayload; role: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[260px] flex-col border-r border-border-default bg-surface/95 backdrop-blur-xl">
      <div className="relative flex h-16 items-center border-b border-border-default px-5">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand/25 to-transparent" />
        <Link href="/dashboard">
          <Logo size="sm" />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-subtle-foreground">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all",
                      isActive
                        ? "bg-brand/10 text-brand border border-brand/20 shadow-sm shadow-brand/5"
                        : "text-muted-foreground hover:bg-surface-overlay hover:text-foreground border border-transparent"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4 shrink-0", isActive && "text-brand")} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-border-default p-4 space-y-3">
        <div className="rounded-lg bg-surface-elevated border border-border-subtle px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
            <span
              className={cn(
                "shrink-0 text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded",
                role === "viewer"
                  ? "bg-surface-overlay text-muted-foreground"
                  : "bg-brand/10 text-brand"
              )}
            >
              {roleLabel(role)}
            </span>
          </div>
          <p className="text-xs text-subtle-foreground truncate">{user.email}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
