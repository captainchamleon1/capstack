import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireApiWriteAccess } from "@/lib/api-auth";
import { closeFundraiseRound, CloseRoundError } from "@/lib/fundraise/close-round";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  name: z.string().min(1),
  type: z.enum(["seed", "series_a", "series_b", "series_c", "bridge", "other"]),
  preMoneyValuation: z.coerce.number().positive(),
  investmentAmount: z.coerce.number().positive(),
  optionPoolTarget: z.coerce.number().min(0).max(1),
  investorStakeholderId: z.string().min(1),
  closeDate: z.string().optional(),
  convertSafes: z.boolean().optional(),
  convertNotes: z.boolean().optional(),
  liquidationPref: z.coerce.number().positive().optional(),
});

export async function POST(request: NextRequest) {
  const auth = await requireApiWriteAccess();
  if (!auth.success) return auth.error;

  try {
    const body = schema.parse(await request.json());

    const result = await closeFundraiseRound({
      companyId: auth.company.id,
      name: body.name,
      type: body.type,
      preMoneyValuation: body.preMoneyValuation,
      investmentAmount: body.investmentAmount,
      optionPoolTarget: body.optionPoolTarget,
      investorStakeholderId: body.investorStakeholderId,
      closeDate: body.closeDate ? new Date(body.closeDate) : undefined,
      convertSafes: body.convertSafes,
      convertNotes: body.convertNotes,
      liquidationPref: body.liquidationPref,
    });

    await logAudit({
      companyId: auth.company.id,
      userId: auth.session.userId,
      action: "round.closed",
      entityType: "fundraise_round",
      entityId: result.fundraiseRound.id,
      summary: `Closed ${body.name} round at $${body.preMoneyValuation.toLocaleString()} pre-money`,
      metadata: {
        investmentAmount: body.investmentAmount,
        safesConverted: result.safeConversions.length,
        notesConverted: result.noteConversions.length,
      },
    });

    revalidatePath("/modeler");
    revalidatePath("/activity");
    revalidatePath("/cap-table");
    revalidatePath("/dashboard");
    revalidatePath("/safes");
    revalidatePath("/grants");
    revalidatePath("/stakeholders");
    revalidatePath("/waterfall");
    revalidatePath("/settings");

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    if (error instanceof CloseRoundError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Close round failed:", error);
    return NextResponse.json({ error: "Failed to close round" }, { status: 500 });
  }
}
