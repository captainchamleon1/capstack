import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { loadValuationContext } from "@/lib/valuation/load";
import { AnalystValuationWorkspace } from "@/components/valuations/analyst-valuation-workspace";
import { valuationStatusLabel } from "@/lib/analyst";
import { Badge } from "@/components/ui/badge";

export default async function AnalystValuationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const valuation = await prisma.valuation.findUnique({
    where: { id },
    include: { company: true },
  });
  if (!valuation) notFound();

  const ctx = await loadValuationContext(valuation.companyId);
  if (!ctx) notFound();

  let backsolveSeriesId: string | null = null;
  let manualEquityValue: number | null = null;
  if (valuation.inputs) {
    try {
      const snap = JSON.parse(valuation.inputs) as {
        backsolve?: { seriesId: string };
        manualEquityValue?: number;
      };
      backsolveSeriesId = snap.backsolve?.seriesId ?? null;
      manualEquityValue = snap.manualEquityValue ?? null;
    } catch {
      /* ignore */
    }
  }

  const series = ctx.derived.series.map((s) => ({
    id: s.id,
    name: s.name,
    pricePerShare: s.round?.pricePerShare ?? s.originalIssuePrice,
    roundName: s.round?.name ?? null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/analyst/valuations"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Queue
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">{valuation.title}</h1>
          <p className="text-sm text-muted-foreground">{valuation.company.legalName || valuation.company.name}</p>
        </div>
        <Badge>{valuationStatusLabel(valuation.status, valuation.adoptedAt)}</Badge>
      </div>

      <AnalystValuationWorkspace
        id={valuation.id}
        companyName={valuation.company.name}
        title={valuation.title}
        valuationDate={valuation.valuationDate.toISOString()}
        status={valuation.status}
        reviewNotes={valuation.reviewNotes}
        method={valuation.method as "opm_backsolve" | "opm_manual"}
        dlomMethod={valuation.dlomMethod as "finnerty" | "chaffee"}
        volatility={valuation.volatility}
        timeToLiquidity={valuation.timeToLiquidity}
        riskFreeRate={valuation.riskFreeRate}
        dividendYield={valuation.dividendYield}
        holdingPeriod={valuation.holdingPeriod}
        concludedFmv={valuation.concludedFmv}
        series={series}
        backsolveSeriesId={backsolveSeriesId}
        manualEquityValue={manualEquityValue}
        clientNotes={valuation.clientNotes}
      />
    </div>
  );
}
