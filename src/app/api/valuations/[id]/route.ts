import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireApiWriteAccess } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

export async function PATCH(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return NextResponse.json(
    { error: "Valuation updates are handled by your Equitr analyst. Contact support if you need changes." },
    { status: 403 }
  );
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiWriteAccess();
  if (!auth.success) return auth.error;
  const { id } = await params;

  const existing = await prisma.valuation.findFirst({ where: { id, companyId: auth.company.id } });
  if (!existing) return NextResponse.json({ error: "Valuation not found" }, { status: 404 });

  if (existing.status !== "submitted") {
    return NextResponse.json(
      { error: "Only pending submissions can be withdrawn. Contact your analyst for in-progress valuations." },
      { status: 400 }
    );
  }

  await prisma.valuation.delete({ where: { id } });

  await logAudit({
    companyId: auth.company.id,
    userId: auth.session.userId,
    action: "valuation.deleted",
    entityType: "valuation",
    entityId: id,
    summary: `Withdrew 409A submission "${existing.title}"`,
  });

  revalidatePath("/valuations");
  revalidatePath("/analyst/valuations");
  return NextResponse.json({ ok: true });
}
