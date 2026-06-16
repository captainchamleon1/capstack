const events = [
  {
    summary: "Issued 150,000 ISO options to Sam Rivera",
    action: "grant.created",
    user: "Demo User",
    time: "Jan 10, 2023 · 2:14 PM",
  },
  {
    summary: "Board resolution approved for Series A financing",
    action: "board_resolution.created",
    user: "Demo User",
    time: "Aug 22, 2023 · 11:02 AM",
  },
  {
    summary: "Signed stock purchase agreement uploaded",
    action: "document.signed",
    user: "Demo User",
    time: "Aug 22, 2023 · 11:18 AM",
  },
  {
    summary: "Exported full cap table (CSV)",
    action: "export.cap_table",
    user: "Demo User",
    time: "Mar 4, 2024 · 4:51 PM",
  },
];

export function AuditPreview() {
  return (
    <div className="product-frame marketing-product-frame overflow-hidden rounded-2xl border border-[#2a3140] bg-[#06080d]">
      <div className="border-b border-[#232b3a] bg-[#0c1018] px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8b94a8]">
          Activity log
        </p>
        <p className="mt-0.5 text-sm font-medium text-[#eceef3]">Audit trail · Acme Robotics</p>
      </div>
      <div className="divide-y divide-[#1a2130]">
        {events.map((event) => (
          <div key={event.summary} className="px-4 py-3.5">
            <p className="text-sm font-medium leading-snug text-[#eceef3]">{event.summary}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[#5c6578]">
              <span className="rounded border border-[#232b3a] bg-[#131926] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-[#8b94a8]">
                {event.action}
              </span>
              <span>
                {event.user} · {event.time}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
