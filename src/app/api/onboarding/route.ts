import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/api-auth";

const schema = z.object({
  name: z.string().min(1),
  legalName: z.string().optional(),
  state: z.string().optional(),
  incorporationDate: z.string().optional(),
  authorizedShares: z.coerce.number().int().positive().optional(),
  optionPoolPercent: z.coerce.number().min(0).max(1).optional(),
});

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth();
  if (!auth.success) return auth.error;

  const existing = await prisma.membership.findFirst({
    where: { userId: auth.session.userId },
  });
  if (existing) {
    return NextResponse.json({ error: "Company already exists" }, { status: 409 });
  }

  try {
    const body = schema.parse(await request.json());
    const authorized = body.authorizedShares ?? 10_000_000;
    const poolPercent = body.optionPoolPercent ?? 0.15;
    const poolShares = Math.floor(authorized * poolPercent);

    const company = await prisma.$transaction(async (tx) => {
      const co = await tx.company.create({
        data: {
          name: body.name,
          legalName: body.legalName || `${body.name}, Inc.`,
          state: body.state || "Delaware",
          incorporationDate: body.incorporationDate ? new Date(body.incorporationDate) : new Date(),
          authorizedShares: authorized,
          currentFmv409A: 0.01,
          fmv409AEffectiveDate: new Date(),
        },
      });

      const common = await tx.shareClass.create({
        data: { companyId: co.id, name: "Common Stock", type: "common", votesPerShare: 1 },
      });

      const optionPool = await tx.shareClass.create({
        data: { companyId: co.id, name: "Option Pool", type: "option_pool", votesPerShare: 0 },
      });

      const founder = await tx.stakeholder.create({
        data: {
          companyId: co.id,
          name: auth.session.name,
          email: auth.session.email,
          type: "founder",
          title: "Founder",
          relationship: "employee",
        },
      });

      const founderShares = authorized - poolShares;

      await tx.equityGrant.create({
        data: {
          companyId: co.id,
          stakeholderId: founder.id,
          shareClassId: common.id,
          type: "common_stock",
          sharesGranted: founderShares,
          sharesExercised: founderShares,
          grantDate: new Date(),
          boardApprovalDate: new Date(),
        },
      });

      await tx.equityGrant.create({
        data: {
          companyId: co.id,
          stakeholderId: founder.id,
          shareClassId: optionPool.id,
          type: "pool_reservation",
          sharesGranted: poolShares,
          grantDate: new Date(),
          boardApprovalDate: new Date(),
        },
      });

      await tx.membership.create({
        data: { userId: auth.session.userId, companyId: co.id, role: "owner" },
      });

      return co;
    });

    revalidatePath("/dashboard");
    return NextResponse.json({ company }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    console.error("Onboarding failed:", error);
    return NextResponse.json({ error: "Failed to create company" }, { status: 500 });
  }
}
