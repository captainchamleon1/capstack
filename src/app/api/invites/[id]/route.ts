import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireApiCompany } from "@/lib/api-auth";
import { canManageTeam } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { revokeCompanyInvite } from "@/lib/invites";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiCompany();
  if (!auth.success) return auth.error;

  if (!canManageTeam(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const invite = await prisma.companyInvite.findFirst({
      where: { id, companyId: auth.company.id },
    });

    await revokeCompanyInvite(id, auth.company.id);

    if (invite) {
      await logAudit({
        companyId: auth.company.id,
        userId: auth.session.userId,
        action: "invite.revoked",
        entityType: "invite",
        entityId: id,
        summary: `Revoked invite for ${invite.email}`,
      });
    }

    revalidatePath("/settings");
    revalidatePath("/activity");
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to revoke invite" }, { status: 500 });
  }
}
