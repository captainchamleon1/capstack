import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireApiWriteAccess } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

const patchSchema = z.object({
  status: z.enum(["active", "cancelled", "expired"]).optional(),
  boardApprovalDate: z.string().optional(),
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

    const grant = await prisma.equityGrant.findFirst({
      where: { id, companyId: auth.company.id },
    });
    if (!grant) {
      return NextResponse.json({ error: "Grant not found" }, { status: 404 });
    }

    if (grant.type === "pool_reservation") {
      return NextResponse.json({ error: "Pool reservations cannot be modified" }, { status: 400 });
    }

    const updated = await prisma.equityGrant.update({
      where: { id },
      data: {
        status: body.status,
        boardApprovalDate: body.boardApprovalDate ? new Date(body.boardApprovalDate) : undefined,
      },
      include: { stakeholder: true, shareClass: true, vestingSchedule: true },
    });

    if (body.status === "cancelled") {
      await logAudit({
        companyId: auth.company.id,
        userId: auth.session.userId,
        action: "grant.cancelled",
        entityType: "grant",
        entityId: id,
        summary: `Cancelled ${updated.type.toUpperCase()} grant for ${updated.stakeholder.name}`,
      });
    }

    revalidatePath("/grants");
    revalidatePath("/activity");
    revalidatePath(`/grants/${id}`);
    revalidatePath("/cap-table");
    revalidatePath("/dashboard");
    revalidatePath(`/stakeholders/${grant.stakeholderId}`);

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    console.error("Update grant failed:", error);
    return NextResponse.json({ error: "Failed to update grant" }, { status: 500 });
  }
}
