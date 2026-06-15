import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireApiWriteAccess } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  status: z.enum(["draft", "pending", "approved", "rejected"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiWriteAccess();
  if (!auth.success) return auth.error;

  const { id } = await params;

  try {
    const body = schema.parse(await request.json());

    const resolution = await prisma.boardResolution.findFirst({
      where: { id, companyId: auth.company.id },
    });
    if (!resolution) {
      return NextResponse.json({ error: "Resolution not found" }, { status: 404 });
    }

    const updated = await prisma.boardResolution.update({
      where: { id },
      data: {
        status: body.status,
        approvedAt: body.status === "approved" ? new Date() : null,
      },
    });

    await logAudit({
      companyId: auth.company.id,
      userId: auth.session.userId,
      action: "board_resolution.updated",
      entityType: "board_resolution",
      entityId: id,
      summary: `Board resolution "${resolution.title}" marked ${body.status}`,
    });

    revalidatePath("/board");
    revalidatePath("/activity");
    revalidatePath("/dashboard");

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    console.error("Update resolution failed:", error);
    return NextResponse.json({ error: "Failed to update resolution" }, { status: 500 });
  }
}
