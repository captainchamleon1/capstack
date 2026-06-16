import { NextRequest, NextResponse } from "next/server";
import { requireApiCompany } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { generateValuationReportPdf, valuationReportFilename } from "@/lib/valuation/report/generate";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiCompany();
  if (!auth.success) return auth.error;
  const { id } = await params;

  const valuation = await prisma.valuation.findFirst({ where: { id, companyId: auth.company.id } });
  if (!valuation) return NextResponse.json({ error: "Valuation not found" }, { status: 404 });

  const buffer = await generateValuationReportPdf(valuation, auth.company);
  if (!buffer) return NextResponse.json({ error: "Report could not be generated" }, { status: 422 });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${valuationReportFilename(valuation, auth.company)}"`,
    },
  });
}
