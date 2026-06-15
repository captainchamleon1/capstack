import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { issueSecurityDocuments } from "@/lib/documents/issue";
import { requireApiWriteAccess } from "@/lib/api-auth";
import { getOptionPoolStats } from "@/lib/cap-table";
import { logAudit } from "@/lib/audit";
const schema = z.object({
  stakeholderId: z.string().min(1),
  shareClassId: z.string().min(1),
  type: z.string().min(1),
  sharesGranted: z.coerce.number().int().positive(),
  strikePrice: z.coerce.number().optional().nullable(),
  grantDate: z.string().min(1),
  expirationDate: z.string().optional().nullable(),
  cliffMonths: z.coerce.number().int().min(0).optional(),
  vestingMonths: z.coerce.number().int().positive().optional(),
  vestingFrequency: z.string().optional(),
  vestingStartDate: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const auth = await requireApiWriteAccess();
  if (!auth.success) return auth.error;

  try {
    const body = schema.parse(await request.json());

    const stakeholder = await prisma.stakeholder.findFirst({
      where: { id: body.stakeholderId, companyId: auth.company.id },
    });
    if (!stakeholder) {
      return NextResponse.json({ error: "Stakeholder not found" }, { status: 404 });
    }

    const shareClass = await prisma.shareClass.findFirst({
      where: { id: body.shareClassId, companyId: auth.company.id },
    });
    if (!shareClass) {
      return NextResponse.json({ error: "Share class not found" }, { status: 404 });
    }

    if (body.type === "pool_reservation") {
      return NextResponse.json({ error: "Pool reservations are created at onboarding only" }, { status: 400 });
    }

    if (shareClass.type === "option_pool" && ["iso", "nso", "rsu", "rsa", "warrant"].includes(body.type)) {
      const allGrants = await prisma.equityGrant.findMany({
        where: { companyId: auth.company.id },
        include: { shareClass: true },
      });
      const pool = getOptionPoolStats(allGrants);
      if (body.sharesGranted > pool.available) {
        return NextResponse.json(
          { error: `Insufficient option pool. ${pool.available.toLocaleString()} shares available.` },
          { status: 400 }
        );
      }
    }

    const grant = await prisma.equityGrant.create({
      data: {
        companyId: auth.company.id,
        stakeholderId: body.stakeholderId,
        shareClassId: body.shareClassId,
        type: body.type,
        sharesGranted: body.sharesGranted,
        strikePrice: body.strikePrice ?? null,
        grantDate: new Date(body.grantDate),
        expirationDate: body.expirationDate ? new Date(body.expirationDate) : null,
        status: "active",
        vestingSchedule:
          body.vestingMonths !== undefined
            ? {
                create: {
                  cliffMonths: body.cliffMonths ?? 12,
                  vestingMonths: body.vestingMonths ?? 48,
                  vestingFrequency: body.vestingFrequency || "monthly",
                  startDate: new Date(body.vestingStartDate || body.grantDate),
                },
              }
            : undefined,
      },
      include: {
        stakeholder: true,
        shareClass: true,
        vestingSchedule: true,
      },
    });

    const documents = await issueSecurityDocuments(grant.id);

    await logAudit({
      companyId: auth.company.id,
      userId: auth.session.userId,
      action: "grant.created",
      entityType: "grant",
      entityId: grant.id,
      summary: `Issued ${body.type.toUpperCase()} grant of ${body.sharesGranted.toLocaleString()} shares to ${grant.stakeholder.name}`,
      metadata: { type: body.type, sharesGranted: body.sharesGranted },
    });

    revalidatePath("/grants");
    revalidatePath("/activity");
    revalidatePath("/dashboard");
    revalidatePath("/cap-table");
    revalidatePath("/stakeholders");
    revalidatePath("/documents");
    revalidatePath(`/stakeholders/${body.stakeholderId}`);

    return NextResponse.json({ grant, documents }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    console.error("Failed to create grant:", error);
    return NextResponse.json({ error: "Failed to create grant" }, { status: 500 });
  }
}
