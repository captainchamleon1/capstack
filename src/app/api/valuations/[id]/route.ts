import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireApiWriteAccess } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  status: z.enum(["draft", "in_review", "final"]).optional(),
  reviewNotes: z.string().max(4000).optional(),
  markReviewed: z.boolean().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiWriteAccess();
  if (!auth.success) return auth.error;
  const { id } = await params;

  const existing = await prisma.valuation.findFirst({ where: { id, companyId: auth.company.id } });
  if (!existing) return NextResponse.json({ error: "Valuation not found" }, { status: 404 });

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const markReviewed = body.markReviewed || body.status === "final" || body.status === "in_review";

  const updated = await prisma.valuation.update({
    where: { id },
    data: {
      status: body.status ?? existing.status,
      reviewNotes: body.reviewNotes ?? existing.reviewNotes,
      ...(markReviewed
        ? { reviewedById: auth.session.userId, reviewedByName: auth.session.name, reviewedAt: new Date() }
        : {}),
    },
  });

  await logAudit({
    companyId: auth.company.id,
    userId: auth.session.userId,
    action: body.status === "final" ? "valuation.reviewed" : "valuation.updated",
    entityType: "valuation",
    entityId: id,
    summary:
      body.status === "final"
        ? `Finalized 409A valuation "${existing.title}"`
        : `Updated 409A valuation "${existing.title}"${body.status ? ` (status: ${body.status})` : ""}`,
  });

  revalidatePath("/valuations");
  revalidatePath(`/valuations/${id}`);
  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiWriteAccess();
  if (!auth.success) return auth.error;
  const { id } = await params;

  const existing = await prisma.valuation.findFirst({ where: { id, companyId: auth.company.id } });
  if (!existing) return NextResponse.json({ error: "Valuation not found" }, { status: 404 });

  await prisma.valuation.delete({ where: { id } });

  await logAudit({
    companyId: auth.company.id,
    userId: auth.session.userId,
    action: "valuation.deleted",
    entityType: "valuation",
    entityId: id,
    summary: `Deleted 409A valuation "${existing.title}"`,
  });

  revalidatePath("/valuations");
  return NextResponse.json({ ok: true });
}
