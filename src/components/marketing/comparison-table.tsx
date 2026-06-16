const rows = [
  {
    topic: "Pricing model",
    legacy: "Per-seat and per-stakeholder fees that scale with headcount",
    equitr: "Flat workspace pricing — no charge per investor or employee on the cap table",
  },
  {
    topic: "Data portability",
    legacy: "Exports often limited or require support requests",
    equitr: "Full JSON and CSV export from Settings, anytime",
  },
  {
    topic: "Audit trail",
    legacy: "Varies by plan; not always visible to admins",
    equitr: "Every change logged with actor, timestamp, and entity",
  },
  {
    topic: "Role access",
    legacy: "Complex permission tiers tied to pricing",
    equitr: "Owner, admin, and viewer roles included",
  },
  {
    topic: "SAFEs & notes",
    legacy: "Often add-on modules or separate workflows",
    equitr: "Convertible instruments and round modeling in the same product",
  },
  {
    topic: "Stage fit",
    legacy: "Built for companies with dedicated finance teams",
    equitr: "Designed for seed through Series A — founder-operable",
  },
];

export function ComparisonTable() {
  return (
    <div className="overflow-hidden rounded-xl border border-border-default bg-surface-elevated">
      <div className="grid grid-cols-[1fr_1fr_1fr] border-b border-border-default bg-surface-overlay/50 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        <div className="px-4 py-3 sm:px-6">Topic</div>
        <div className="border-l border-border-default px-4 py-3 sm:px-6">Typical legacy platform</div>
        <div className="border-l border-border-default px-4 py-3 text-foreground sm:px-6">Equitr</div>
      </div>
      {rows.map((row, i) => (
        <div
          key={row.topic}
          className={`grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr] ${
            i < rows.length - 1 ? "border-b border-border-subtle" : ""
          }`}
        >
          <div className="px-4 py-4 font-medium text-foreground sm:px-6">{row.topic}</div>
          <div className="border-t border-border-subtle px-4 py-4 text-sm leading-relaxed text-muted-foreground sm:border-l sm:border-t-0 sm:px-6">
            {row.legacy}
          </div>
          <div className="border-t border-border-subtle px-4 py-4 text-sm leading-relaxed text-foreground sm:border-l sm:border-t-0 sm:px-6">
            {row.equitr}
          </div>
        </div>
      ))}
    </div>
  );
}
