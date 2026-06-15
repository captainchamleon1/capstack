import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireApiCompany } from "@/lib/api-auth";
import { canManageTeam } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { sendInviteEmail, EmailNotConfiguredError } from "@/lib/email";
import {
  createCompanyInvite,
  listCompanyInvites,
  listCompanyMembers,
} from "@/lib/invites";

const createSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "viewer"]),
});

export async function GET() {
  const auth = await requireApiCompany();
  if (!auth.success) return auth.error;

  const [members, invites] = await Promise.all([
    listCompanyMembers(auth.company.id),
    listCompanyInvites(auth.company.id),
  ]);

  return NextResponse.json({ members, invites, role: auth.role });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiCompany();
  if (!auth.success) return auth.error;

  if (!canManageTeam(auth.role)) {
    return NextResponse.json({ error: "Only owners and admins can invite teammates" }, { status: 403 });
  }

  try {
    const body = createSchema.parse(await request.json());
    const invite = await createCompanyInvite({
      companyId: auth.company.id,
      email: body.email,
      role: body.role,
      invitedById: auth.session.userId,
    });

    await logAudit({
      companyId: auth.company.id,
      userId: auth.session.userId,
      action: "invite.sent",
      entityType: "invite",
      entityId: invite.id,
      summary: `Invited ${body.email} as ${body.role}`,
    });

    let emailResult;
    try {
      emailResult = await sendInviteEmail({
        to: body.email,
        companyName: auth.company.name,
        inviterName: auth.session.name,
        role: body.role,
        token: invite.token,
      });
    } catch (error) {
      if (error instanceof EmailNotConfiguredError) {
        return NextResponse.json({ error: error.message }, { status: 503 });
      }
      throw error;
    }

    revalidatePath("/settings");
    revalidatePath("/activity");

    return NextResponse.json(
      {
        invite,
        inviteUrl: `/invite/${invite.token}`,
        email: {
          sent: emailResult.ok,
          provider: emailResult.provider,
          error: emailResult.error ?? null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Create invite failed:", error);
    return NextResponse.json({ error: "Failed to create invite" }, { status: 500 });
  }
}
