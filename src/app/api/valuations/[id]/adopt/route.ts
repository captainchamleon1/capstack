import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireApiWriteAccess } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  createBoardResolution: z.boolean().optional(),
});

/**
 * Adopt a valuation as the company's official 409A fair market value. Marks the
 * valuation final, records the effective date, updates the company FMV used for
 * option strike pricing, and optionally drafts a board resolution.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiWriteAccess();
  if (!auth.success) return auth.error;
  const { id } = await params;

  const valuation = await prisma.valuation.findFirst({ where: { id, companyId: auth.company.id } });
  if (!valuation) return NextResponse.json({ error: "Valuation not found" }, { status: 404 });
  if (valuation.concludedFmv <= 0) {
    return NextResponse.json({ error: "Cannot adopt a valuation with a non-positive FMV." }, { status: 400 });
  }

  let body: z.infer<typeof schema> = {};
  try {
    body = schema.parse(await request.json().catch(() => ({})));
  } catch {
    body = {};
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.valuation.update({
      where: { id },
      data: {
        status: "final",
        adoptedAt: now,
        reviewedById: valuation.reviewedById ?? auth.session.userId,
        reviewedByName: valuation.reviewedByName ?? auth.session.name,
        reviewedAt: valuation.reviewedAt ?? now,
      },
    });

    await tx.company.update({
      where: { id: auth.company.id },
      data: { currentFmv409A: valuation.concludedFmv, fmv409AEffectiveDate: valuation.valuationDate },
    });

    if (body.createBoardResolution) {
      await tx.boardResolution.create({
        data: {
          companyId: auth.company.id,
          title: `Adoption of 409A Fair Market Value — ${valuation.title}`,
          type: "valuation",
          status: "draft",
          description: `Board adoption of common stock fair market value of $${valuation.concludedFmv.toFixed(4)} per share, effective ${valuation.valuationDate.toISOString().slice(0, 10)}, as determined by the independent 409A valuation "${valuation.title}".`,
          meetingDate: null,
        },
      });
    }
  });

  await logAudit({
    companyId: auth.company.id,
    userId: auth.session.userId,
    action: "valuation.adopted",
    entityType: "valuation",
    entityId: id,
    summary: `Adopted 409A FMV of $${valuation.concludedFmv.toFixed(4)}/share from "${valuation.title}"`,
    metadata: { fmv: valuation.concludedFmv, effectiveDate: valuation.valuationDate.toISOString() },
  });

  for (const path of ["/valuations", `/valuations/${id}`, "/dashboard", "/settings", "/grants", "/board", "/activity"]) {
    revalidatePath(path);
  }

  return NextResponse.json({ ok: true, fmv: valuation.concludedFmv });
}
