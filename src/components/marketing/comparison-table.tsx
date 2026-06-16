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
      <div className="hidden border-b border-border-default bg-surface-overlay/50 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground md:grid md:grid-cols-[1fr_1fr_1fr] lg:text-sm">
        <div className="px-6 py-4 lg:px-8">Topic</div>
        <div className="border-l border-border-default px-6 py-4 lg:px-8">Typical legacy platform</div>
        <div className="border-l border-border-default px-6 py-4 text-foreground lg:px-8">Equitr</div>
      </div>
      {rows.map((row, i) => (
        <div
          key={row.topic}
          className={`grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr] ${
            i < rows.length - 1 ? "border-b border-border-subtle" : ""
          }`}
        >
          <div className="px-5 py-4 font-medium text-foreground md:px-6 md:py-5 md:text-base lg:px-8">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground md:hidden">
              Topic
            </span>
            {row.topic}
          </div>
          <div className="border-t border-border-subtle px-5 py-4 text-sm leading-relaxed text-muted-foreground md:border-l md:border-t-0 md:px-6 md:py-5 md:text-base lg:px-8">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground md:hidden">
              Legacy
            </span>
            {row.legacy}
          </div>
          <div className="border-t border-border-subtle px-5 py-4 text-sm leading-relaxed text-foreground md:border-l md:border-t-0 md:px-6 md:py-5 md:text-base lg:px-8">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-brand md:hidden">
              Equitr
            </span>
            {row.equitr}
          </div>
        </div>
      ))}
    </div>
  );
}
