import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { valuationStatusLabel } from "@/lib/analyst";
import { formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const VARIANT: Record<string, "default" | "secondary" | "warning" | "info"> = {
  submitted: "info",
  draft: "secondary",
  in_review: "warning",
};

export default async function AnalystValuationsPage() {
  const valuations = await prisma.valuation.findMany({
    where: { status: { in: ["submitted", "draft", "in_review"] } },
    include: { company: { select: { name: true, legalName: true } } },
    orderBy: [{ submittedAt: "asc" }, { createdAt: "asc" }],
  });

  const finalized = await prisma.valuation.count({ where: { status: "final" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Valuation queue</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {valuations.length} open engagement{valuations.length === 1 ? "" : "s"} · {finalized} finalized total
        </p>
      </div>

      {valuations.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            No pending submissions. Client requests appear here when companies submit from their portal.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {valuations.map((v) => (
            <Link key={v.id} href={`/analyst/valuations/${v.id}`} className="block">
              <Card className="transition-colors hover:border-brand/30">
                <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                  <div>
                    <p className="font-medium">{v.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {v.company.legalName || v.company.name} · Valuation date {formatDate(v.valuationDate)}
                    </p>
                    {v.submittedAt && (
                      <p className="mt-1 text-xs text-subtle-foreground">
                        Submitted {formatDate(v.submittedAt)}
                        {v.submittedByName ? ` by ${v.submittedByName}` : ""}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-subtle-foreground">Working FMV</p>
                      <p className="font-mono font-semibold tabular-nums">${v.concludedFmv.toFixed(4)}</p>
                    </div>
                    <Badge variant={VARIANT[v.status] ?? "secondary"}>
                      {valuationStatusLabel(v.status, v.adoptedAt)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
