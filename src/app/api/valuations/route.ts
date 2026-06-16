import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireApiWriteAccess } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { loadValuationContext } from "@/lib/valuation/load";
import { runValuation, type ValuationInput } from "@/lib/valuation";

const schema = z.object({
  title: z.string().min(1).max(200),
  valuationDate: z.string().min(1),
  method: z.enum(["opm_backsolve", "opm_manual"]),
  dlomMethod: z.enum(["finnerty", "chaffee"]).default("finnerty"),
  volatility: z.coerce.number().min(0.01).max(3),
  timeToLiquidity: z.coerce.number().min(0.1).max(15),
  riskFreeRate: z.coerce.number().min(0).max(0.25),
  dividendYield: z.coerce.number().min(0).max(0.25).default(0),
  holdingPeriod: z.coerce.number().min(0.1).max(15),
  backsolveSeriesId: z.string().optional(),
  manualEquityValue: z.coerce.number().positive().optional(),
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

  const ctx = await loadValuationContext(auth.company.id);
  if (!ctx) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  const { derived } = ctx;
  const warnings = [...derived.warnings];

  // Determine total-equity-value source.
  let backsolve: ValuationInput["backsolve"];
  let manualEquityValue: number | undefined;

  if (body.method === "opm_backsolve") {
    let target = derived.backsolveTarget;
    if (body.backsolveSeriesId) {
      const series = derived.series.find((s) => s.id === body.backsolveSeriesId);
      if (!series || series.originalIssuePrice <= 0) {
        return NextResponse.json({ error: "Selected series has no priced round to backsolve against." }, { status: 400 });
      }
      target = {
        seriesId: series.id,
        seriesName: series.name,
        pricePerShare: series.round?.pricePerShare ?? series.originalIssuePrice,
        roundName: series.round?.name ?? series.name,
      };
    }
    if (!target) {
      return NextResponse.json(
        { error: "No priced preferred round available to backsolve. Use a manual equity value instead." },
        { status: 400 }
      );
    }
    backsolve = {
      seriesId: target.seriesId,
      seriesName: target.seriesName,
      targetPricePerShare: target.pricePerShare,
      roundName: target.roundName,
    };
  } else {
    if (!body.manualEquityValue) {
      return NextResponse.json({ error: "A manual equity value is required for this method." }, { status: 400 });
    }
    manualEquityValue = body.manualEquityValue;
  }

  const input: ValuationInput = {
    method: body.method,
    valuationDate: body.valuationDate,
    cap: derived.cap,
    assumptions: {
      timeToLiquidity: body.timeToLiquidity,
      volatility: body.volatility,
      riskFreeRate: body.riskFreeRate,
      dividendYield: body.dividendYield,
    },
    dlomMethod: body.dlomMethod,
    holdingPeriod: body.holdingPeriod,
    backsolve,
    manualEquityValue,
    warnings,
  };

  let result;
  try {
    result = runValuation(input);
  } catch (error) {
    console.error("Valuation run failed:", error);
    return NextResponse.json({ error: "Valuation computation failed. Review the cap structure and inputs." }, { status: 422 });
  }

  const inputsSnapshot = {
    method: input.method,
    assumptions: input.assumptions,
    dlomMethod: input.dlomMethod,
    holdingPeriod: input.holdingPeriod,
    backsolve: input.backsolve,
    manualEquityValue: input.manualEquityValue,
    series: derived.series,
  };

  const valuation = await prisma.valuation.create({
    data: {
      companyId: auth.company.id,
      title: body.title,
      valuationDate: new Date(body.valuationDate),
      status: "draft",
      method: body.method,
      dlomMethod: body.dlomMethod,
      concludedFmv: result.concludedFmv,
      marketableCommonPerShare: result.marketableCommonPerShare,
      equityValue: result.equityValue,
      dlomValue: result.dlom.value,
      volatility: body.volatility,
      timeToLiquidity: body.timeToLiquidity,
      riskFreeRate: body.riskFreeRate,
      dividendYield: body.dividendYield,
      holdingPeriod: body.holdingPeriod,
      inputs: JSON.stringify(inputsSnapshot),
      result: JSON.stringify(result),
      preparedById: auth.session.userId,
      preparedByName: auth.session.name,
    },
  });

  await logAudit({
    companyId: auth.company.id,
    userId: auth.session.userId,
    action: "valuation.created",
    entityType: "valuation",
    entityId: valuation.id,
    summary: `Ran 409A valuation "${body.title}" — concluded FMV ${result.concludedFmv.toFixed(4)}/share`,
    metadata: { method: body.method, equityValue: result.equityValue, dlom: result.dlom.value },
  });

  revalidatePath("/valuations");

  return NextResponse.json({ id: valuation.id }, { status: 201 });
}
