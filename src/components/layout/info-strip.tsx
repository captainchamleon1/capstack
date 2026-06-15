import { cn } from "@/lib/utils";

interface InfoStripItem {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
}

export function InfoStrip({
  items,
  className,
}: {
  items: InfoStripItem[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-border-default bg-surface/60 backdrop-blur-sm px-5 py-3.5 text-sm info-strip",
        className
      )}
    >
      {items.map((item, i) => (
        <div key={i} className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-muted-foreground">{item.label}</span>
          <span className="font-medium text-foreground stat-value">{item.value}</span>
          {item.hint && <span className="text-subtle-foreground">{item.hint}</span>}
        </div>
      ))}
    </div>
  );
}
