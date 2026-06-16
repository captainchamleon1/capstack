import { NextResponse } from "next/server";
import { requireApiAnalyst } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireApiAnalyst();
  if (!auth.success) return auth.error;

  const valuations = await prisma.valuation.findMany({
    where: { status: { in: ["submitted", "draft", "in_review"] } },
    include: {
      company: { select: { id: true, name: true, legalName: true } },
    },
    orderBy: [{ submittedAt: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(valuations);
}
