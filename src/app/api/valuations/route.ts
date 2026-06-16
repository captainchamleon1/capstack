import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireApiWriteAccess } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { defaultSubmissionParams, runValuationForCompany } from "@/lib/valuation/run-for-company";

const schema = z.object({
  title: z.string().min(1).max(200),
  valuationDate: z.string().min(1),
  clientNotes: z.string().max(4000).optional(),
  capTableConfirmed: z.boolean().refine((v) => v === true, { message: "Confirm your cap table is current" }),
  companyInfoConfirmed: z.boolean().refine((v) => v === true, { message: "Confirm company information is current" }),
});

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
      clientNotes: body.clientNotes ?? null,
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
    summary: `Submitted 409A valuation request "${body.title}" for analyst review`,
    metadata: { valuationDate: body.valuationDate },
  });

  revalidatePath("/valuations");
  revalidatePath("/analyst/valuations");

  return NextResponse.json({ id: valuation.id }, { status: 201 });
}
