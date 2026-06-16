import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarketingPageHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
  className?: string;
  children?: React.ReactNode;
}

export function MarketingPageHeader({
  eyebrow,
  title,
  description,
  className,
  children,
}: MarketingPageHeaderProps) {
  return (
    <div className={cn("border-b border-border-default", className)}>
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        {eyebrow && (
          <p className="text-sm font-medium text-brand">{eyebrow}</p>
        )}
        <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-tight tracking-tight text-foreground md:text-5xl">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          {description}
        </p>
        {children}
      </div>
    </div>
  );
}

interface MarketingCtaBandProps {
  title: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}

export function MarketingCtaBand({
  title,
  description,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: MarketingCtaBandProps) {
  return (
    <section className="border-t border-border-default bg-surface/40">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 py-14 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
          <p className="mt-2 max-w-xl text-muted-foreground">{description}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={primaryHref}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand-bright"
          >
            {primaryLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
          {secondaryHref && secondaryLabel && (
            <Link
              href={secondaryHref}
              className="inline-flex h-11 items-center rounded-lg border border-border-default px-5 text-sm font-medium text-foreground transition-colors hover:bg-surface-overlay"
            >
              {secondaryLabel}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
