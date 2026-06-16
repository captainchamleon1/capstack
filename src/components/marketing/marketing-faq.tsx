const faqs = [
  {
    q: "When do I actually need cap table software?",
    a: "As soon as you have more than one shareholder, an option pool, or outside investors. Spreadsheets break down quickly once you add vesting, SAFEs, or preferred stock. Equitr is built for the point where counsel and investors expect a system of record.",
  },
  {
    q: "How does Equitr compare to Carta?",
    a: "Carta is built for later-stage companies with dedicated finance teams and per-seat pricing that scales with headcount. Equitr focuses on seed through Series A with flat workspace pricing, full data export, and workflows founders can run without a full-time equity admin.",
  },
  {
    q: "Can I migrate from Pulley or another platform?",
    a: "Yes. Export your data from your current provider, create an Equitr workspace, and import via JSON or enter stakeholders manually. We built export round-trip into the product so you're never locked in.",
  },
  {
    q: "What happens to my data if I leave?",
    a: "You own your data. Export your full company record as JSON or your cap table as CSV at any time from Settings — no support ticket required.",
  },
  {
    q: "Does Equitr support SAFEs, notes, and option grants?",
    a: "Yes. Track SAFEs and convertible notes, issue ISOs/NSOs/RSUs with generated agreements, model round dilution, and attach board resolutions — all in one ledger tied to your cap table.",
  },
];

export function MarketingFaq() {
  return (
    <div className="divide-y divide-border-default rounded-2xl border border-border-default bg-surface-elevated">
      {faqs.map((item) => (
        <details key={item.q} className="group px-6 py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-semibold text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
            {item.q}
            <span className="text-muted-foreground transition-transform group-open:rotate-45 text-xl leading-none">
              +
            </span>
          </summary>
          <p className="mt-3 pr-8 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
