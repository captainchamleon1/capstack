import { Sidebar } from "./sidebar";
import type { SessionPayload } from "@/lib/auth";

export function AppShell({
  children,
  user,
  role,
}: {
  children: React.ReactNode;
  user: SessionPayload;
  role: string;
}) {
  return (
    <div className="min-h-screen app-canvas">
      <Sidebar user={user} role={role} />
      <main className="ml-[260px] min-h-screen relative">
        <div className="app-subtle-grid absolute inset-0 pointer-events-none opacity-60" />
        <div className="relative">{children}</div>
      </main>
    </div>
  );
}
