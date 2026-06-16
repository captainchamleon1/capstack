import { formatCurrency, formatDate } from "@/lib/utils";
import { parseClientSubmission, STAGE_LABELS } from "@/lib/valuation/client-submission";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border-subtle/60 py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function money(n: number | null) {
  return n != null ? formatCurrency(n) : "—";
}

export function ClientSubmissionSummary({
  clientSubmissionRaw,
  clientNotes,
}: {
  clientSubmissionRaw: string | null;
  clientNotes?: string | null;
}) {
  const data = parseClientSubmission(clientSubmissionRaw);
  if (!data && !clientNotes) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company information provided</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data ? (
          <>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-subtle-foreground">Business</p>
              <p className="mt-2 text-sm text-foreground whitespace-pre-wrap">{data.businessDescription}</p>
            </div>
            <Row label="Industry" value={data.industry} />
            <Row label="Stage" value={STAGE_LABELS[data.stage]} />
            <Row label="Revenue (TTM)" value={money(data.revenueTtm)} />
            <Row label="Revenue (prior year)" value={money(data.revenuePriorYear)} />
            <Row label="Cash & equivalents" value={money(data.cashBalance)} />
            <Row label="Monthly burn" value={money(data.monthlyBurn)} />
            <Row label="Headcount" value={data.headcount != null ? String(data.headcount) : "—"} />
            <Row label="Prior 409A FMV" value={data.priorFmv != null ? `$${data.priorFmv.toFixed(4)}/sh` : "—"} />
            <Row
              label="Prior 409A date"
              value={data.priorFmvDate ? formatDate(data.priorFmvDate) : "—"}
            />
            <Row
              label="Expected liquidity"
              value={data.expectedLiquidityYears != null ? `${data.expectedLiquidityYears} years` : "—"}
            />
            {data.materialEvents && (
              <div>
                <p className="text-xs text-subtle-foreground">Material events</p>
                <p className="mt-1 text-sm whitespace-pre-wrap">{data.materialEvents}</p>
              </div>
            )}
            {data.outstandingSafesNotes && (
              <div>
                <p className="text-xs text-subtle-foreground">SAFEs / notes not on cap table</p>
                <p className="mt-1 text-sm whitespace-pre-wrap">{data.outstandingSafesNotes}</p>
              </div>
            )}
          </>
        ) : null}
        {clientNotes && !data?.materialEvents?.includes(clientNotes) ? (
          <div>
            <p className="text-xs text-subtle-foreground">Additional notes</p>
            <p className="mt-1 text-sm whitespace-pre-wrap">{clientNotes}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
