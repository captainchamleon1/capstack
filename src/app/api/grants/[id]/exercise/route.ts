import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireApiWriteAccess } from "@/lib/api-auth";
import { calculateVestedShares } from "@/lib/cap-table";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  shares: z.coerce.number().int().positive(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiWriteAccess();
  if (!auth.success) return auth.error;

  const { id } = await params;

  try {
    const body = schema.parse(await request.json());

    const grant = await prisma.equityGrant.findFirst({
      where: { id, companyId: auth.company.id },
      include: { vestingSchedule: true, shareClass: true, stakeholder: true },
    });
    if (!grant) {
      return NextResponse.json({ error: "Grant not found" }, { status: 404 });
    }

    if (!["iso", "nso", "warrant"].includes(grant.type)) {
      return NextResponse.json({ error: "Only options and warrants can be exercised" }, { status: 400 });
    }

    if (grant.status !== "active") {
      return NextResponse.json({ error: "Grant is not active" }, { status: 400 });
    }

    const vested = grant.vestingSchedule
      ? calculateVestedShares({
          sharesGranted: grant.sharesGranted,
          cliffMonths: grant.vestingSchedule.cliffMonths,
          vestingMonths: grant.vestingSchedule.vestingMonths,
          vestingFrequency: grant.vestingSchedule.vestingFrequency,
          startDate: grant.vestingSchedule.startDate,
        })
      : grant.sharesGranted;

    const exercisable = Math.max(0, vested - grant.sharesExercised);
    if (body.shares > exercisable) {
      return NextResponse.json(
        { error: `Only ${exercisable.toLocaleString()} shares are exercisable` },
        { status: 400 }
      );
    }

    const commonClass = await prisma.shareClass.findFirst({
      where: { companyId: auth.company.id, type: "common" },
    });
    if (!commonClass) {
      return NextResponse.json({ error: "Common stock class not found" }, { status: 500 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedGrant = await tx.equityGrant.update({
        where: { id },
        data: {
          sharesExercised: grant.sharesExercised + body.shares,
          status: grant.sharesExercised + body.shares >= grant.sharesGranted ? "exercised" : "active",
        },
      });

      const existingCommon = await tx.equityGrant.findFirst({
        where: {
          companyId: auth.company.id,
          stakeholderId: grant.stakeholderId,
          shareClassId: commonClass.id,
          type: "common_stock",
          status: "active",
        },
      });

      let commonGrant;
      if (existingCommon) {
        commonGrant = await tx.equityGrant.update({
          where: { id: existingCommon.id },
          data: {
            sharesGranted: existingCommon.sharesGranted + body.shares,
            sharesExercised: existingCommon.sharesExercised + body.shares,
          },
        });
      } else {
        commonGrant = await tx.equityGrant.create({
          data: {
            companyId: auth.company.id,
            stakeholderId: grant.stakeholderId,
            shareClassId: commonClass.id,
            type: "common_stock",
            sharesGranted: body.shares,
            sharesExercised: body.shares,
            grantDate: new Date(),
            boardApprovalDate: grant.boardApprovalDate,
          },
        });
      }

      return { grant: updatedGrant, commonGrant };
    });

    await logAudit({
      companyId: auth.company.id,
      userId: auth.session.userId,
      action: "grant.exercised",
      entityType: "grant",
      entityId: id,
      summary: `Exercised ${body.shares.toLocaleString()} shares for ${grant.stakeholder.name}`,
      metadata: { shares: body.shares, grantType: grant.type },
    });

    revalidatePath("/grants");
    revalidatePath("/activity");
    revalidatePath(`/grants/${id}`);
    revalidatePath("/cap-table");
    revalidatePath("/dashboard");
    revalidatePath(`/stakeholders/${grant.stakeholderId}`);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    console.error("Exercise failed:", error);
    return NextResponse.json({ error: "Failed to record exercise" }, { status: 500 });
  }
}
