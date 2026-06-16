import { Logo } from "@/components/brand/logo";

interface SplitMarketingLayoutProps {
  children: React.ReactNode;
  headline: string;
  description: string;
  bullets?: string[];
  footer?: string;
}

export function SplitMarketingLayout({
  children,
  headline,
  description,
  bullets,
  footer = "© Equitr · Built for founders",
}: SplitMarketingLayoutProps) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-ink">
      <div className="hidden lg:flex flex-col justify-between auth-panel border-r border-border-default p-12 relative overflow-hidden">
        <div className="auth-grid absolute inset-0 pointer-events-none" />
        <Logo size="lg" />
        <div className="relative space-y-6 max-w-md">
          <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-foreground">
            {headline}
          </h1>
          <p className="text-muted-foreground leading-relaxed">{description}</p>
          {bullets && bullets.length > 0 && (
            <ul className="space-y-3 text-sm text-muted-foreground">
              {bullets.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
        <p className="relative text-xs text-subtle-foreground">{footer}</p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12 relative">
        <div className="app-subtle-grid absolute inset-0 pointer-events-none lg:hidden" />
        <div className="w-full max-w-md space-y-8 relative">
          <div className="lg:hidden">
            <Logo size="md" />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
