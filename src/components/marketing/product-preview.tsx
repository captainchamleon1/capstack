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
      className={`product-frame marketing-product-frame overflow-hidden rounded-2xl border border-[#2a3140] bg-[#06080d] ${className}`}
    >
      {showChrome && (
        <div className="flex items-center gap-2 border-b border-[#232b3a] bg-[#0c1018] px-4 py-2.5">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#c75c5c]/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#c9a04a]/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#4d9a73]/80" />
          </div>
          <div className="mx-auto flex h-7 max-w-xs flex-1 items-center justify-center rounded-full bg-[#131926] px-3 text-[11px] text-[#8b94a8] font-mono">
            equitr.app/cap-table
          </div>
        </div>
      )}

      <div className="p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8b94a8]">
              Cap table
            </p>
            <p className="mt-1 text-lg font-semibold text-[#eceef3]">Acme Robotics</p>
          </div>
          <span className="rounded-full border border-[#232b3a] bg-[#131926] px-3 py-1 text-[11px] font-medium text-[#c9a962]">
            Export CSV
          </span>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: "Authorized", value: "15,000,000" },
            { label: "Outstanding", value: "8,850,000" },
            { label: "Fully diluted", value: "12,325,000" },
            { label: "Option pool", value: "14.0%" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-[#232b3a] bg-[#0c1018] px-3 py-2.5"
            >
              <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#5c6578]">
                {stat.label}
              </p>
              <p className="mt-1 font-mono text-sm font-semibold tabular-nums text-[#eceef3]">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-xl border border-[#232b3a]">
          <table className="w-full text-left text-[11px] sm:text-xs">
            <thead>
              <tr className="border-b border-[#232b3a] bg-[#0c1018] text-[#8b94a8]">
                <th className="px-3 py-2 font-medium">Stakeholder</th>
                <th className="hidden px-3 py-2 font-medium sm:table-cell">Type</th>
                <th className="px-3 py-2 text-right font-medium">Shares (FD)</th>
                <th className="px-3 py-2 text-right font-medium">Ownership</th>
              </tr>
            </thead>
            <tbody>
              {capRows.map((row) => (
                <tr key={row.name} className="border-b border-[#1a2130] last:border-0">
                  <td className="px-3 py-2.5 font-medium text-[#eceef3]">{row.name}</td>
                  <td className="hidden px-3 py-2.5 text-[#8b94a8] sm:table-cell">{row.type}</td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-[#eceef3]">
                    {row.shares}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-[#c9a962]">
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
