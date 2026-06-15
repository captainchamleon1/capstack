import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { userHasCompany } from "@/lib/db";

export default async function Home() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!(await userHasCompany())) redirect("/onboarding");
  redirect("/dashboard");
}
