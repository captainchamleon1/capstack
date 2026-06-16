import { prisma } from "@/lib/prisma";

function analystEmailsFromEnv(): string[] {
  return (process.env.ANALYST_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function isAnalystUser(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAnalyst: true, email: true },
  });
  if (!user) return false;
  if (user.isAnalyst) return true;
  return analystEmailsFromEnv().includes(user.email.toLowerCase());
}

export function clientCanViewValuationResults(status: string, adoptedAt: Date | null): boolean {
  return status === "final" || !!adoptedAt;
}

export function clientCanDownloadReport(status: string): boolean {
  return status === "final";
}

export function valuationStatusLabel(status: string, adoptedAt: Date | null): string {
  if (adoptedAt) return "Adopted";
  switch (status) {
    case "submitted":
      return "Submitted";
    case "in_review":
      return "In review";
    case "final":
      return "Final";
    case "draft":
      return "Draft";
    default:
      return status;
  }
}
