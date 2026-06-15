import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireApiWriteAccess } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  name: z.string().min(1).optional(),
  legalName: z.string().optional(),
  state: z.string().optional(),
  ein: z.string().optional(),
  authorizedShares: z.coerce.number().int().positive().optional(),
  parValue: z.coerce.number().positive().optional(),
  currentFmv409A: z.coerce.number().positive().optional(),
  incorporationDate: z.string().optional(),
});

export async function PATCH(request: NextRequest) {
  const auth = await requireApiWriteAccess();
  if (!auth.success) return auth.error;

  try {
    const body = schema.parse(await request.json());

    const company = await prisma.company.update({
      where: { id: auth.company.id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.legalName !== undefined && { legalName: body.legalName }),
        ...(body.state !== undefined && { state: body.state }),
        ...(body.ein !== undefined && { ein: body.ein }),
        ...(body.authorizedShares !== undefined && { authorizedShares: body.authorizedShares }),
        ...(body.parValue !== undefined && { parValue: body.parValue }),
        ...(body.currentFmv409A !== undefined && {
          currentFmv409A: body.currentFmv409A,
          fmv409AEffectiveDate: new Date(),
        }),
        ...(body.incorporationDate !== undefined && {
          incorporationDate: new Date(body.incorporationDate),
        }),
      },
    });

    await logAudit({
      companyId: auth.company.id,
      userId: auth.session.userId,
      action: "company.updated",
      entityType: "company",
      entityId: auth.company.id,
      summary: `Updated company settings`,
      metadata: body,
    });

    revalidatePath("/settings");
    revalidatePath("/activity");
    revalidatePath("/dashboard");
    revalidatePath("/grants");

    return NextResponse.json(company);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    console.error("Company update failed:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
