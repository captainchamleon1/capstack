import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireApiAnalyst } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { runValuationForCompany } from "@/lib/valuation/run-for-company";

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  valuationDate: z.string().min(1).optional(),
  status: z.enum(["in_review", "final"]).optional(),
  reviewNotes: z.string().max(8000).optional(),
  method: z.enum(["opm_backsolve", "opm_manual"]).optional(),
  dlomMethod: z.enum(["finnerty", "chaffee"]).optional(),
  volatility: z.coerce.number().min(0.01).max(3).optional(),
  timeToLiquidity: z.coerce.number().min(0.1).max(15).optional(),
  riskFreeRate: z.coerce.number().min(0).max(0.25).optional(),
  dividendYield: z.coerce.number().min(0).max(0.25).optional(),
  holdingPeriod: z.coerce.number().min(0.1).max(15).optional(),
  backsolveSeriesId: z.string().optional(),
  manualEquityValue: z.coerce.number().positive().optional(),
  rerun: z.boolean().optional(),
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiAnalyst();
  if (!auth.success) return auth.error;
  const { id } = await params;

  const valuation = await prisma.valuation.findUnique({
    where: { id },
    include: { company: true },
  });
  if (!valuation) return NextResponse.json({ error: "Valuation not found" }, { status: 404 });

  const ctx = await import("@/lib/valuation/load").then((m) => m.loadValuationContext(valuation.companyId));

  return NextResponse.json({ valuation, context: ctx });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiAnalyst();
  if (!auth.success) return auth.error;
  const { id } = await params;

  const existing = await prisma.valuation.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Valuation not found" }, { status: 404 });

  let body: z.infer<typeof patchSchema>;
  try {
    body = patchSchema.parse(await request.json());
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const assumptionFields = [
    "method",
    "dlomMethod",
    "volatility",
    "timeToLiquidity",
    "riskFreeRate",
    "dividendYield",
    "holdingPeriod",
    "backsolveSeriesId",
    "manualEquityValue",
  ] as const;
  const shouldRerun =
    body.rerun !== false &&
    assumptionFields.some((f) => body[f] !== undefined);

  const method = (body.method ?? existing.method) as "opm_backsolve" | "opm_manual";
  const dlomMethod = (body.dlomMethod ?? existing.dlomMethod) as "finnerty" | "chaffee";
  const valuationDate = body.valuationDate ?? existing.valuationDate.toISOString().slice(0, 10);

  let resultJson = existing.result;
  let inputsJson = existing.inputs;
  let headline = {
    concludedFmv: existing.concludedFmv,
    marketableCommonPerShare: existing.marketableCommonPerShare,
    equityValue: existing.equityValue,
    dlomValue: existing.dlomValue,
    volatility: existing.volatility,
    timeToLiquidity: existing.timeToLiquidity,
    riskFreeRate: existing.riskFreeRate,
    dividendYield: existing.dividendYield,
    holdingPeriod: existing.holdingPeriod,
    method,
    dlomMethod,
  };

  if (shouldRerun) {
    let backsolveSeriesId = body.backsolveSeriesId;
    if (!backsolveSeriesId && existing.inputs) {
      try {
        const snap = JSON.parse(existing.inputs) as { backsolve?: { seriesId: string } };
        backsolveSeriesId = snap.backsolve?.seriesId;
      } catch {
        /* ignore */
      }
    }

    const run = await runValuationForCompany(existing.companyId, valuationDate, {
      method,
      dlomMethod,
      volatility: body.volatility ?? existing.volatility,
      timeToLiquidity: body.timeToLiquidity ?? existing.timeToLiquidity,
      riskFreeRate: body.riskFreeRate ?? existing.riskFreeRate,
      dividendYield: body.dividendYield ?? existing.dividendYield,
      holdingPeriod: body.holdingPeriod ?? existing.holdingPeriod,
      backsolveSeriesId,
      manualEquityValue: body.manualEquityValue,
    });
    if (!run.ok) return NextResponse.json({ error: run.error }, { status: run.status });

    const { result, inputsSnapshot } = run.data;
    resultJson = JSON.stringify(result);
    inputsJson = JSON.stringify(inputsSnapshot);
    headline = {
      concludedFmv: result.concludedFmv,
      marketableCommonPerShare: result.marketableCommonPerShare,
      equityValue: result.equityValue,
      dlomValue: result.dlom.value,
      volatility: body.volatility ?? existing.volatility,
      timeToLiquidity: body.timeToLiquidity ?? existing.timeToLiquidity,
      riskFreeRate: body.riskFreeRate ?? existing.riskFreeRate,
      dividendYield: body.dividendYield ?? existing.dividendYield,
      holdingPeriod: body.holdingPeriod ?? existing.holdingPeriod,
      method,
      dlomMethod,
    };
  }

  const markReviewed = body.status === "final" || body.status === "in_review";
  const now = new Date();

  const updated = await prisma.valuation.update({
    where: { id },
    data: {
      title: body.title ?? existing.title,
      valuationDate: body.valuationDate ? new Date(body.valuationDate) : undefined,
      status: body.status ?? existing.status,
      reviewNotes: body.reviewNotes ?? existing.reviewNotes,
      result: resultJson,
      inputs: inputsJson,
      ...headline,
      ...(markReviewed
        ? {
            reviewedById: auth.session.userId,
            reviewedByName: auth.session.name,
            reviewedAt: now,
          }
        : {}),
    },
  });

  await logAudit({
    companyId: existing.companyId,
    userId: auth.session.userId,
    action: body.status === "final" ? "valuation.reviewed" : "valuation.updated",
    entityType: "valuation",
    entityId: id,
    summary:
      body.status === "final"
        ? `Analyst finalized 409A "${existing.title}" at $${headline.concludedFmv.toFixed(4)}/share`
        : `Analyst updated 409A "${existing.title}"`,
    metadata: { status: updated.status, concludedFmv: headline.concludedFmv },
  });

  revalidatePath("/valuations");
  revalidatePath(`/valuations/${id}`);
  revalidatePath("/analyst/valuations");
  revalidatePath(`/analyst/valuations/${id}`);

  return NextResponse.json(updated);
}
