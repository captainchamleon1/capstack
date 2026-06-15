import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireApiCompany } from "@/lib/api-auth";
import { canManageMembers } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { removeMember, updateMemberRole } from "@/lib/members";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  role: z.enum(["admin", "viewer"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiCompany();
  if (!auth.success) return auth.error;

  if (!canManageMembers(auth.role)) {
    return NextResponse.json({ error: "Only the owner can change member roles" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = patchSchema.parse(await request.json());
    const before = await prisma.membership.findFirst({
      where: { id, companyId: auth.company.id },
      include: { user: { select: { name: true, email: true } } },
    });
    if (!before) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const membership = await updateMemberRole({
      membershipId: id,
      companyId: auth.company.id,
      role: body.role,
    });

    await logAudit({
      companyId: auth.company.id,
      userId: auth.session.userId,
      action: "member.role_changed",
      entityType: "membership",
      entityId: id,
      summary: `Changed ${before.user.name}'s role from ${before.role} to ${body.role}`,
      metadata: { email: before.user.email, from: before.role, to: body.role },
    });

    revalidatePath("/settings");
    revalidatePath("/activity");
    return NextResponse.json({ membership });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update member" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiCompany();
  if (!auth.success) return auth.error;

  if (!canManageMembers(auth.role)) {
    return NextResponse.json({ error: "Only the owner can remove team members" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const removed = await removeMember({
      membershipId: id,
      companyId: auth.company.id,
      actorUserId: auth.session.userId,
    });

    await logAudit({
      companyId: auth.company.id,
      userId: auth.session.userId,
      action: "member.removed",
      entityType: "membership",
      entityId: id,
      summary: `Removed ${removed.user.name} from the team`,
      metadata: { email: removed.user.email, role: removed.role },
    });

    revalidatePath("/settings");
    revalidatePath("/activity");
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}
