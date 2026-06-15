"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { CHART_COLORS, CHART_TOOLTIP_STYLE } from "@/lib/chart-colors";

interface OwnershipChartProps {
  data: { name: string; value: number; percent: number }[];
}

export function OwnershipChart({ data }: OwnershipChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={110}
          paddingAngle={2}
          dataKey="value"
          stroke="none"
        >
          {data.map((_, index) => (
            <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={CHART_TOOLTIP_STYLE}
          formatter={(value, name, item) => {
            const num = Number(value) || 0;
            const percent = (item?.payload as { percent?: number })?.percent || 0;
            return [`${num.toLocaleString()} shares (${(percent * 100).toFixed(1)}%)`, String(name)];
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
