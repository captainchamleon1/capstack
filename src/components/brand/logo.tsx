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
          <path
            d="M9 8h14a1.5 1.5 0 0 1 0 3H12v4h9.5a1.5 1.5 0 0 1 0 3H12v4h11a1.5 1.5 0 0 1 0 3H9a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2Z"
            fill="#c9a962"
          />
        </svg>
      </div>
      {showWordmark && (
        <div className="min-w-0">
          <p className={cn("font-display font-semibold tracking-tight text-foreground", s.text)}>
            Equitr
          </p>
          <p className={cn("font-medium uppercase tracking-[0.14em] text-muted-foreground", s.sub)}>
            Equity Platform
          </p>
        </div>
      )}
    </div>
  );
}
