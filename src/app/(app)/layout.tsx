import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getSession } from "@/lib/auth";
import { getSessionMembership, userHasCompany } from "@/lib/db";
import { isAnalystUser } from "@/lib/analyst";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const hasCompany = await userHasCompany();
  if (!hasCompany) {
    if (await isAnalystUser(session.userId)) redirect("/analyst/valuations");
    redirect("/onboarding");
  }

  const membership = await getSessionMembership();
  if (!membership) redirect("/onboarding");

  const analyst = await isAnalystUser(session.userId);

  return (
    <AppShell user={session} role={membership.role} isAnalyst={analyst}>
      {children}
    </AppShell>
  );
}
