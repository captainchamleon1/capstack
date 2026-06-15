import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireApiWriteAccess } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  stakeholderId: z.string().min(1),
  type: z.enum(["valuation_cap", "discount", "mfn", "cap_and_discount"]),
  investmentAmount: z.coerce.number().positive(),
  valuationCap: z.coerce.number().positive().optional(),
  discountRate: z.coerce.number().min(0).max(1).optional(),
  proRata: z.boolean().optional(),
  issueDate: z.string().min(1),
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

    const safe = await prisma.safe.create({
      data: {
        companyId: auth.company.id,
        stakeholderId: body.stakeholderId,
        type: body.type,
        investmentAmount: body.investmentAmount,
        valuationCap: body.valuationCap ?? null,
        discountRate: body.discountRate ?? null,
        proRata: body.proRata ?? false,
        issueDate: new Date(body.issueDate),
      },
      include: { stakeholder: true },
    });

    await logAudit({
      companyId: auth.company.id,
      userId: auth.session.userId,
      action: "safe.created",
      entityType: "safe",
      entityId: safe.id,
      summary: `Recorded ${safe.type.replace(/_/g, " ")} SAFE of $${body.investmentAmount.toLocaleString()} for ${stakeholder.name}`,
    });

    revalidatePath("/safes");
    revalidatePath("/activity");
    revalidatePath("/dashboard");
    revalidatePath("/cap-table");

    return NextResponse.json(safe, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    console.error("Create SAFE failed:", error);
    return NextResponse.json({ error: "Failed to create SAFE" }, { status: 500 });
  }
}
