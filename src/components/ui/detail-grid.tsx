interface DetailItem {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}

interface DetailGridProps {
  items: DetailItem[];
  columns?: 2 | 3 | 4;
}

export function DetailGrid({ items, columns = 3 }: DetailGridProps) {
  const colClass =
    columns === 4
      ? "md:grid-cols-4"
      : columns === 2
        ? "md:grid-cols-2"
        : "md:grid-cols-3";

  return (
    <div className={`grid grid-cols-1 ${colClass} gap-x-6 gap-y-4`}>
      {items.map((item) => (
        <div key={item.label}>
          <p className="text-xs text-subtle-foreground uppercase tracking-wider">{item.label}</p>
          <p
            className={`mt-1 text-sm font-medium ${
              item.highlight ? "text-brand stat-value" : "text-foreground"
            }`}
          >
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
