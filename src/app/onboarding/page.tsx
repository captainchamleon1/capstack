import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { getSession } from "@/lib/auth";
import { userHasCompany } from "@/lib/db";

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session) redirect("/login?from=/onboarding");

  if (await userHasCompany()) redirect("/dashboard");

  return <OnboardingForm userEmail={session.email} />;
}
