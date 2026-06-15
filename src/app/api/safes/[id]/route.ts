import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireApiWriteAccess } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

const patchSchema = z.object({
  status: z.enum(["outstanding", "converted", "cancelled"]).optional(),
  type: z.enum(["valuation_cap", "discount", "mfn", "cap_and_discount"]).optional(),
  investmentAmount: z.coerce.number().positive().optional(),
  valuationCap: z.coerce.number().positive().optional().nullable(),
  discountRate: z.coerce.number().min(0).max(1).optional().nullable(),
  proRata: z.boolean().optional(),
  issueDate: z.string().optional(),
  notes: z.string().optional().nullable(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiWriteAccess();
  if (!auth.success) return auth.error;

  const { id } = await params;

  try {
    const body = patchSchema.parse(await request.json());

    const existing = await prisma.safe.findFirst({
      where: { id, companyId: auth.company.id },
      include: { stakeholder: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "SAFE not found" }, { status: 404 });
    }

    if (existing.status === "converted" && body.status && body.status !== "converted") {
      return NextResponse.json({ error: "Converted SAFEs cannot change status" }, { status: 400 });
    }

    const updated = await prisma.safe.update({
      where: { id },
      data: {
        status: body.status,
        type: body.type,
        investmentAmount: body.investmentAmount,
        valuationCap: body.valuationCap === undefined ? undefined : body.valuationCap,
        discountRate: body.discountRate === undefined ? undefined : body.discountRate,
        proRata: body.proRata,
        issueDate: body.issueDate ? new Date(body.issueDate) : undefined,
        notes: body.notes === undefined ? undefined : body.notes,
      },
      include: { stakeholder: true },
    });

    const action =
      body.status === "cancelled" && existing.status !== "cancelled"
        ? "safe.cancelled"
        : "safe.updated";

    await logAudit({
      companyId: auth.company.id,
      userId: auth.session.userId,
      action,
      entityType: "safe",
      entityId: id,
      summary:
        action === "safe.cancelled"
          ? `Cancelled SAFE of $${existing.investmentAmount.toLocaleString()} for ${existing.stakeholder.name}`
          : `Updated SAFE for ${existing.stakeholder.name}`,
    });

    revalidatePath("/safes");
    revalidatePath("/activity");
    revalidatePath("/dashboard");
    revalidatePath("/cap-table");
    revalidatePath(`/stakeholders/${existing.stakeholderId}`);

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    console.error("Update SAFE failed:", error);
    return NextResponse.json({ error: "Failed to update SAFE" }, { status: 500 });
  }
}
