import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireApiAuth } from "@/lib/api-auth";
import { acceptCompanyInvite } from "@/lib/invites";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  token: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth();
  if (!auth.success) return auth.error;

  try {
    const body = schema.parse(await request.json());
    const result = await acceptCompanyInvite(body.token, auth.session.userId, auth.session.email);

    await logAudit({
      companyId: result.company.id,
      userId: auth.session.userId,
      action: "member.joined",
      entityType: "membership",
      summary: `${auth.session.name} joined the team`,
      metadata: { email: auth.session.email },
    });

    await logAudit({
      companyId: result.company.id,
      userId: auth.session.userId,
      action: "invite.accepted",
      entityType: "invite",
      summary: `${auth.session.name} accepted team invite`,
    });

    revalidatePath("/dashboard");
    revalidatePath("/settings");
    revalidatePath("/activity");

    return NextResponse.json({
      company: result.company,
      message: `You joined ${result.company.name}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Accept invite failed:", error);
    return NextResponse.json({ error: "Failed to accept invite" }, { status: 500 });
  }
}
