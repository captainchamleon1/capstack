import { NextRequest, NextResponse } from "next/server";
import { requireApiCompany, requireApiAnalyst } from "@/lib/api-auth";
import { isAnalystUser, clientCanDownloadReport } from "@/lib/analyst";
import { prisma } from "@/lib/prisma";
import { generateValuationReportPdf, valuationReportFilename } from "@/lib/valuation/report/generate";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const analystAuth = await requireApiAnalyst();
  if (analystAuth.success) {
    const valuation = await prisma.valuation.findUnique({
      where: { id },
      include: { company: true },
    });
    if (!valuation) return NextResponse.json({ error: "Valuation not found" }, { status: 404 });

    const buffer = await generateValuationReportPdf(valuation, valuation.company);
    if (!buffer) return NextResponse.json({ error: "Report could not be generated" }, { status: 422 });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${valuationReportFilename(valuation, valuation.company)}"`,
      },
    });
  }

  const auth = await requireApiCompany();
  if (!auth.success) return auth.error;

  const valuation = await prisma.valuation.findFirst({ where: { id, companyId: auth.company.id } });
  if (!valuation) return NextResponse.json({ error: "Valuation not found" }, { status: 404 });

  const analyst = await isAnalystUser(auth.session.userId);
  if (!analyst && !clientCanDownloadReport(valuation.status)) {
    return NextResponse.json(
      { error: "The report is available once your analyst finalizes the valuation." },
      { status: 403 }
    );
  }

  const buffer = await generateValuationReportPdf(valuation, auth.company);
  if (!buffer) return NextResponse.json({ error: "Report could not be generated" }, { status: 422 });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${valuationReportFilename(valuation, auth.company)}"`,
    },
  });
}
