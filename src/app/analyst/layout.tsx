import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isAnalystUser } from "@/lib/analyst";
import { AnalystShell } from "@/components/layout/analyst-shell";

export default async function AnalystLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login?from=/analyst/valuations");

  if (!(await isAnalystUser(session.userId))) {
    redirect("/dashboard");
  }

  return <AnalystShell user={session}>{children}</AnalystShell>;
}
