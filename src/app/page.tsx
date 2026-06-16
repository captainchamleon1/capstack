import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MarketingHome } from "@/components/marketing/marketing-home";
import { getSession } from "@/lib/auth";
import { userHasCompany } from "@/lib/db";

export const metadata: Metadata = {
  title: "Equitr — Cap table software for startups",
  description:
    "Secure cap table management for seed and Series A companies. Live ownership, equity grants, SAFEs, audit trails, and full data export.",
  openGraph: {
    title: "Equitr — Cap table software for startups",
    description:
      "Your equity record, ready for diligence. A professional alternative to legacy cap table platforms.",
  },
};

export default async function Home() {
  const session = await getSession();
  if (session) {
    if (!(await userHasCompany())) redirect("/onboarding");
    redirect("/dashboard");
  }

  return <MarketingHome />;
}
