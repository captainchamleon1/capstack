import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  className?: string;
}

const sizes = {
  sm: { mark: "h-8 w-8", text: "text-base", sub: "text-[9px]" },
  md: { mark: "h-9 w-9", text: "text-lg", sub: "text-[10px]" },
  lg: { mark: "h-11 w-11", text: "text-xl", sub: "text-[11px]" },
};

export function Logo({ size = "md", showWordmark = true, className }: LogoProps) {
  const s = sizes[size];

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "relative flex shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-brand/20 to-brand/5 ring-1 ring-brand/25",
          s.mark
        )}
      >
        <svg viewBox="0 0 32 32" className="h-[55%] w-[55%]" fill="none" aria-hidden>
          <rect x="4" y="18" width="18" height="10" rx="2" fill="#c9a962" fillOpacity="0.35" />
          <rect x="7" y="11" width="18" height="10" rx="2" fill="#c9a962" fillOpacity="0.65" />
          <rect x="10" y="4" width="18" height="10" rx="2" fill="#c9a962" />
        </svg>
      </div>
      {showWordmark && (
        <div className="min-w-0">
          <p className={cn("font-display font-semibold tracking-tight text-foreground", s.text)}>
            CapStack
          </p>
          <p className={cn("font-medium uppercase tracking-[0.14em] text-muted-foreground", s.sub)}>
            Equity Platform
          </p>
        </div>
      )}
    </div>
  );
}
