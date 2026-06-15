import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireApiWriteAccess } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  stakeholderId: z.string().min(1),
  principalAmount: z.coerce.number().positive(),
  interestRate: z.coerce.number().min(0).max(1).optional(),
  valuationCap: z.coerce.number().positive().optional(),
  discountRate: z.coerce.number().min(0).max(1).optional(),
  issueDate: z.string().min(1),
  maturityDate: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const auth = await requireApiWriteAccess();
  if (!auth.success) return auth.error;

  try {
    const body = schema.parse(await request.json());

    const stakeholder = await prisma.stakeholder.findFirst({
      where: { id: body.stakeholderId, companyId: auth.company.id },
    });
    if (!stakeholder) {
      return NextResponse.json({ error: "Stakeholder not found" }, { status: 404 });
    }

    const note = await prisma.convertibleNote.create({
      data: {
        companyId: auth.company.id,
        stakeholderId: body.stakeholderId,
        principalAmount: body.principalAmount,
        interestRate: body.interestRate ?? 0,
        valuationCap: body.valuationCap ?? null,
        discountRate: body.discountRate ?? null,
        issueDate: new Date(body.issueDate),
        maturityDate: body.maturityDate ? new Date(body.maturityDate) : null,
        notes: body.notes ?? null,
      },
      include: { stakeholder: true },
    });

    await logAudit({
      companyId: auth.company.id,
      userId: auth.session.userId,
      action: "note.created",
      entityType: "convertible_note",
      entityId: note.id,
      summary: `Recorded convertible note of $${body.principalAmount.toLocaleString()} for ${stakeholder.name}`,
    });

    revalidatePath("/safes");
    revalidatePath("/activity");
    revalidatePath("/dashboard");

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    console.error("Create note failed:", error);
    return NextResponse.json({ error: "Failed to create convertible note" }, { status: 500 });
  }
}
