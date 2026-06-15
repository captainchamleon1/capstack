import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireApiWriteAccess } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

const patchSchema = z.object({
  status: z.enum(["outstanding", "converted", "cancelled"]).optional(),
  principalAmount: z.coerce.number().positive().optional(),
  interestRate: z.coerce.number().min(0).max(1).optional(),
  valuationCap: z.coerce.number().positive().optional().nullable(),
  discountRate: z.coerce.number().min(0).max(1).optional().nullable(),
  issueDate: z.string().optional(),
  maturityDate: z.string().optional().nullable(),
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

    const existing = await prisma.convertibleNote.findFirst({
      where: { id, companyId: auth.company.id },
      include: { stakeholder: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Convertible note not found" }, { status: 404 });
    }

    if (existing.status === "converted" && body.status && body.status !== "converted") {
      return NextResponse.json({ error: "Converted notes cannot change status" }, { status: 400 });
    }

    const updated = await prisma.convertibleNote.update({
      where: { id },
      data: {
        status: body.status,
        principalAmount: body.principalAmount,
        interestRate: body.interestRate,
        valuationCap: body.valuationCap === undefined ? undefined : body.valuationCap,
        discountRate: body.discountRate === undefined ? undefined : body.discountRate,
        issueDate: body.issueDate ? new Date(body.issueDate) : undefined,
        maturityDate:
          body.maturityDate === undefined
            ? undefined
            : body.maturityDate
              ? new Date(body.maturityDate)
              : null,
        notes: body.notes === undefined ? undefined : body.notes,
      },
      include: { stakeholder: true },
    });

    const action =
      body.status === "cancelled" && existing.status !== "cancelled"
        ? "note.cancelled"
        : "note.updated";

    await logAudit({
      companyId: auth.company.id,
      userId: auth.session.userId,
      action,
      entityType: "convertible_note",
      entityId: id,
      summary:
        action === "note.cancelled"
          ? `Cancelled convertible note of $${existing.principalAmount.toLocaleString()} for ${existing.stakeholder.name}`
          : `Updated convertible note for ${existing.stakeholder.name}`,
    });

    revalidatePath("/safes");
    revalidatePath("/activity");
    revalidatePath("/dashboard");
    revalidatePath(`/stakeholders/${existing.stakeholderId}`);

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    console.error("Update convertible note failed:", error);
    return NextResponse.json({ error: "Failed to update convertible note" }, { status: 500 });
  }
}
