import Link from "next/link";
import { Logo } from "@/components/brand/logo";

const columns = {
  Product: [
    { href: "/pricing", label: "Pricing" },
    { href: "/409a", label: "409A valuations" },
    { href: "/#product", label: "Cap table" },
    { href: "/login", label: "Live demo" },
  ],
  Company: [
    { href: "/security", label: "Trust center" },
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
    { href: "mailto:hello@equitr.app", label: "Contact" },
  ],
};

export function MarketingFooter() {
  return (
    <footer className="border-t border-border-default bg-surface-elevated">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 sm:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo size="sm" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Cap table software for seed and Series A companies. Accurate equity records,
              document workflows, and audit trails — without enterprise overhead.
            </p>
          </div>
          {Object.entries(columns).map(([heading, items]) => (
            <div key={heading}>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-subtle-foreground">
                {heading}
              </p>
              <ul className="mt-4 space-y-2.5">
                {items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-border-subtle pt-8 text-xs text-subtle-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Equitr · Equity infrastructure for early-stage companies</p>
          <p>hello@equitr.app</p>
        </div>
      </div>
    </footer>
  );
}
