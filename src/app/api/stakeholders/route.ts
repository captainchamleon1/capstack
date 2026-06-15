import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireApiWriteAccess } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  type: z.enum(["founder", "employee", "investor", "advisor", "board"]),
  relationship: z.string().optional(),
  title: z.string().optional(),
  department: z.string().optional(),
  startDate: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const auth = await requireApiWriteAccess();
  if (!auth.success) return auth.error;

  try {
    const body = schema.parse(await request.json());

    const stakeholder = await prisma.stakeholder.create({
      data: {
        companyId: auth.company.id,
        name: body.name,
        email: body.email || null,
        type: body.type,
        relationship: body.relationship || null,
        title: body.title || null,
        department: body.department || null,
        startDate: body.startDate ? new Date(body.startDate) : null,
      },
    });

    await logAudit({
      companyId: auth.company.id,
      userId: auth.session.userId,
      action: "stakeholder.created",
      entityType: "stakeholder",
      entityId: stakeholder.id,
      summary: `Added stakeholder ${stakeholder.name} (${body.type})`,
    });

    revalidatePath("/stakeholders");
    revalidatePath("/activity");
    revalidatePath("/dashboard");
    revalidatePath("/cap-table");

    return NextResponse.json(stakeholder, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    console.error("Create stakeholder failed:", error);
    return NextResponse.json({ error: "Failed to create stakeholder" }, { status: 500 });
  }
}
