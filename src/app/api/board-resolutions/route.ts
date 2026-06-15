import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireApiWriteAccess } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  title: z.string().min(1),
  type: z.enum(["option_pool", "grant_approval", "fundraise", "governance", "other"]),
  description: z.string().optional(),
  meetingDate: z.string().optional(),
  status: z.enum(["draft", "pending", "approved", "rejected"]).optional(),
});

export async function POST(request: NextRequest) {
  const auth = await requireApiWriteAccess();
  if (!auth.success) return auth.error;

  try {
    const body = schema.parse(await request.json());
    const status = body.status ?? "draft";

    const resolution = await prisma.boardResolution.create({
      data: {
        companyId: auth.company.id,
        title: body.title,
        type: body.type,
        description: body.description || null,
        meetingDate: body.meetingDate ? new Date(body.meetingDate) : null,
        status,
        approvedAt: status === "approved" ? new Date() : null,
      },
    });

    await logAudit({
      companyId: auth.company.id,
      userId: auth.session.userId,
      action: "board_resolution.created",
      entityType: "board_resolution",
      entityId: resolution.id,
      summary: `Created board resolution: ${body.title}`,
      metadata: { type: body.type, status },
    });

    revalidatePath("/board");
    revalidatePath("/activity");
    revalidatePath("/dashboard");

    return NextResponse.json(resolution, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    console.error("Create resolution failed:", error);
    return NextResponse.json({ error: "Failed to create resolution" }, { status: 500 });
  }
}
