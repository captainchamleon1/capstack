import { CHART_COLORS } from "@/lib/chart-colors";

interface LegendProps {
  items: { name: string; percent: number }[];
}

export function ChartLegend({ items }: LegendProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((item, i) => (
        <div key={item.name} className="flex items-center gap-2 text-sm">
          <div
            className="h-3 w-3 rounded-full shrink-0 ring-1 ring-white/10"
            style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
          />
          <span className="text-muted-foreground truncate">{item.name}</span>
          <span className="text-foreground font-medium ml-auto stat-value">
            {(item.percent * 100).toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  );
}
