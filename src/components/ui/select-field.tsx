import { cn } from "@/lib/utils";

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
}

export function SelectField({ label, className, children, ...props }: SelectFieldProps) {
  return (
    <div className={cn(label ? "space-y-1.5" : "")}>
      {label ? (
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
      ) : null}
      <select
        className={cn(
          "flex h-10 w-full rounded-lg border border-border-default bg-surface-elevated px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/40 disabled:opacity-50",
          className
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
