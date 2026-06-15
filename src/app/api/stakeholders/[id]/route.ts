import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireApiWriteAccess } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal("")).optional(),
  type: z.enum(["founder", "employee", "investor", "advisor", "board"]).optional(),
  relationship: z.string().optional(),
  title: z.string().optional(),
  department: z.string().optional(),
  startDate: z.string().optional().nullable(),
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

    const existing = await prisma.stakeholder.findFirst({
      where: { id, companyId: auth.company.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Stakeholder not found" }, { status: 404 });
    }

    const updated = await prisma.stakeholder.update({
      where: { id },
      data: {
        name: body.name,
        email: body.email === undefined ? undefined : body.email || null,
        type: body.type,
        relationship: body.relationship === undefined ? undefined : body.relationship || null,
        title: body.title === undefined ? undefined : body.title || null,
        department: body.department === undefined ? undefined : body.department || null,
        startDate:
          body.startDate === undefined
            ? undefined
            : body.startDate
              ? new Date(body.startDate)
              : null,
      },
    });

    await logAudit({
      companyId: auth.company.id,
      userId: auth.session.userId,
      action: "stakeholder.updated",
      entityType: "stakeholder",
      entityId: id,
      summary: `Updated stakeholder ${updated.name}`,
    });

    revalidatePath("/stakeholders");
    revalidatePath(`/stakeholders/${id}`);
    revalidatePath("/activity");
    revalidatePath("/dashboard");
    revalidatePath("/cap-table");

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    console.error("Update stakeholder failed:", error);
    return NextResponse.json({ error: "Failed to update stakeholder" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiWriteAccess();
  if (!auth.success) return auth.error;

  const { id } = await params;

  try {
    const existing = await prisma.stakeholder.findFirst({
      where: { id, companyId: auth.company.id },
      include: {
        _count: {
          select: { equityGrants: true, safes: true, convertibleNotes: true },
        },
      },
    });
    if (!existing) {
      return NextResponse.json({ error: "Stakeholder not found" }, { status: 404 });
    }

    const { equityGrants, safes, convertibleNotes } = existing._count;
    if (equityGrants > 0 || safes > 0 || convertibleNotes > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete a stakeholder with equity grants, SAFEs, or convertible notes. Remove or reassign those records first.",
        },
        { status: 400 }
      );
    }

    await prisma.stakeholder.delete({ where: { id } });

    await logAudit({
      companyId: auth.company.id,
      userId: auth.session.userId,
      action: "stakeholder.deleted",
      entityType: "stakeholder",
      entityId: id,
      summary: `Removed stakeholder ${existing.name}`,
    });

    revalidatePath("/stakeholders");
    revalidatePath("/activity");
    revalidatePath("/dashboard");

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete stakeholder failed:", error);
    return NextResponse.json({ error: "Failed to delete stakeholder" }, { status: 500 });
  }
}
