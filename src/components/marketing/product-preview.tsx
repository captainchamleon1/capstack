const capRows = [
  { name: "Alex Chen", type: "Founder", shares: "3,500,000", pct: "28.4%", sec: "COMMON" },
  { name: "Jordan Park", type: "Founder", shares: "3,000,000", pct: "24.3%", sec: "COMMON" },
  { name: "Sequoia Capital", type: "Investor", shares: "2,200,000", pct: "17.9%", sec: "SERIES A" },
  { name: "Sam Rivera", type: "Employee", shares: "150,000", pct: "1.2%", sec: "ISO" },
  { name: "Option pool (unallocated)", type: "Pool", shares: "1,725,000", pct: "14.0%", sec: "RESERVED" },
];

interface ProductPreviewProps {
  className?: string;
  showChrome?: boolean;
}

export function ProductPreview({ className = "", showChrome = true }: ProductPreviewProps) {
  return (
    <div
      className={`product-frame marketing-product-frame w-full overflow-hidden rounded-2xl border border-[#2a3140] bg-[#06080d] ${className}`}
    >
      {showChrome && (
        <div className="flex items-center gap-3 border-b border-[#232b3a] bg-[#0c1018] px-5 py-3 md:px-6">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#c75c5c]/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#c9a04a]/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#4d9a73]/80" />
          </div>
          <div className="mx-auto flex h-8 min-w-0 flex-1 items-center justify-center rounded-full bg-[#131926] px-4 font-mono text-xs text-[#8b94a8] md:max-w-md md:text-sm">
            equitr.app/cap-table
          </div>
        </div>
      )}

      <div className="p-5 md:p-6 lg:p-7">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b94a8] md:text-xs">
              Cap table
            </p>
            <p className="mt-1 text-xl font-semibold text-[#eceef3] md:text-2xl">Acme Robotics</p>
          </div>
          <span className="rounded-full border border-[#232b3a] bg-[#131926] px-3.5 py-1.5 text-xs font-medium text-[#c9a962] md:text-sm">
            Export CSV
          </span>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Authorized", value: "15,000,000" },
            { label: "Outstanding", value: "8,850,000" },
            { label: "Fully diluted", value: "12,325,000" },
            { label: "Option pool", value: "14.0%" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-[#232b3a] bg-[#0c1018] px-3.5 py-3 md:px-4"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#5c6578] md:text-[11px]">
                {stat.label}
              </p>
              <p className="mt-1.5 font-mono text-sm font-semibold tabular-nums text-[#eceef3] md:text-base">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-xl border border-[#232b3a]">
          <table className="w-full text-left text-xs md:text-sm">
            <thead>
              <tr className="border-b border-[#232b3a] bg-[#0c1018] text-[#8b94a8]">
                <th className="px-4 py-2.5 font-medium md:px-5 md:py-3">Stakeholder</th>
                <th className="hidden px-4 py-2.5 font-medium md:table-cell md:px-5 md:py-3">Type</th>
                <th className="px-4 py-2.5 text-right font-medium md:px-5 md:py-3">Shares (FD)</th>
                <th className="px-4 py-2.5 text-right font-medium md:px-5 md:py-3">Ownership</th>
              </tr>
            </thead>
            <tbody>
              {capRows.map((row) => (
                <tr key={row.name} className="border-b border-[#1a2130] last:border-0">
                  <td className="px-4 py-3 font-medium text-[#eceef3] md:px-5">{row.name}</td>
                  <td className="hidden px-4 py-3 text-[#8b94a8] md:table-cell md:px-5">{row.type}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-[#eceef3] md:px-5">
                    {row.shares}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-[#c9a962] md:px-5">
                    {row.pct}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
