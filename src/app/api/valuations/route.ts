import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireApiWriteAccess } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import type { ClientValuationSubmission, CompanyStage } from "@/lib/valuation/client-submission";
import { defaultSubmissionParams, runValuationForCompany } from "@/lib/valuation/run-for-company";

const optionalNumber = z.union([z.coerce.number(), z.literal(""), z.null()]).optional();

const schema = z.object({
  title: z.string().min(1).max(200),
  valuationDate: z.string().min(1),
  capTableConfirmed: z.boolean().refine((v) => v === true, { message: "Confirm your cap table is current" }),
  financialsConfirmed: z.boolean().refine((v) => v === true, { message: "Confirm financial information is accurate" }),
  submission: z.object({
    businessDescription: z.string().min(20, "Provide a brief business description (at least 20 characters)"),
    industry: z.string().min(2, "Industry is required"),
    stage: z.enum(["pre_revenue", "early_revenue", "growth", "profitable"]),
    revenueTtm: optionalNumber,
    revenuePriorYear: optionalNumber,
    cashBalance: optionalNumber,
    monthlyBurn: optionalNumber,
    headcount: optionalNumber,
    priorFmv: optionalNumber,
    priorFmvDate: z.string().optional(),
    expectedLiquidityYears: optionalNumber,
    materialEvents: z.string().max(4000).optional(),
    outstandingSafesNotes: z.string().max(2000).optional(),
    companyProfile: z.object({
      legalName: z.string().min(1),
      state: z.string().nullable(),
      incorporationDate: z.string().nullable(),
      ein: z.string().nullable(),
    }),
  }),
});

function toNum(v: unknown): number | null {
  if (v === "" || v == null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function POST(request: NextRequest) {
  const auth = await requireApiWriteAccess();
  if (!auth.success) return auth.error;

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const submission: ClientValuationSubmission = {
    businessDescription: body.submission.businessDescription.trim(),
    industry: body.submission.industry.trim(),
    stage: body.submission.stage as CompanyStage,
    revenueTtm: toNum(body.submission.revenueTtm),
    revenuePriorYear: toNum(body.submission.revenuePriorYear),
    cashBalance: toNum(body.submission.cashBalance),
    monthlyBurn: toNum(body.submission.monthlyBurn),
    headcount: toNum(body.submission.headcount),
    priorFmv: toNum(body.submission.priorFmv),
    priorFmvDate: body.submission.priorFmvDate?.trim() || null,
    expectedLiquidityYears: toNum(body.submission.expectedLiquidityYears),
    materialEvents: body.submission.materialEvents?.trim() || null,
    outstandingSafesNotes: body.submission.outstandingSafesNotes?.trim() || null,
    companyProfile: body.submission.companyProfile,
  };

  const defaults = await defaultSubmissionParams(auth.company.id);
  if (!defaults) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  const run = await runValuationForCompany(auth.company.id, body.valuationDate, defaults);
  if (!run.ok) return NextResponse.json({ error: run.error }, { status: run.status });

  const { result, inputsSnapshot } = run.data;
  const now = new Date();

  const valuation = await prisma.valuation.create({
    data: {
      companyId: auth.company.id,
      title: body.title,
      valuationDate: new Date(body.valuationDate),
      status: "submitted",
      method: defaults.method,
      dlomMethod: defaults.dlomMethod,
      concludedFmv: result.concludedFmv,
      marketableCommonPerShare: result.marketableCommonPerShare,
      equityValue: result.equityValue,
      dlomValue: result.dlom.value,
      volatility: defaults.volatility,
      timeToLiquidity: defaults.timeToLiquidity,
      riskFreeRate: defaults.riskFreeRate,
      dividendYield: defaults.dividendYield,
      holdingPeriod: defaults.holdingPeriod,
      inputs: JSON.stringify(inputsSnapshot),
      result: JSON.stringify(result),
      clientSubmission: JSON.stringify(submission),
      submittedAt: now,
      submittedById: auth.session.userId,
      submittedByName: auth.session.name,
      preparedByName: "Equitr Valuations",
    },
  });

  await logAudit({
    companyId: auth.company.id,
    userId: auth.session.userId,
    action: "valuation.submitted",
    entityType: "valuation",
    entityId: valuation.id,
    summary: `Submitted 409A intake "${body.title}" for analyst review`,
    metadata: { valuationDate: body.valuationDate, stage: submission.stage },
  });

  revalidatePath("/valuations");
  revalidatePath("/analyst/valuations");

  return NextResponse.json({ id: valuation.id }, { status: 201 });
}
