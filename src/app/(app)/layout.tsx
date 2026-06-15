import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getSession } from "@/lib/auth";
import { getSessionMembership, userHasCompany } from "@/lib/db";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!(await userHasCompany())) redirect("/onboarding");

  const membership = await getSessionMembership();
  if (!membership) redirect("/onboarding");

  return (
    <AppShell user={session} role={membership.role}>
      {children}
    </AppShell>
  );
}