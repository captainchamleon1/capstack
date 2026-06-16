import type { Metadata } from "next";
import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { MarketingSubpage } from "@/components/marketing/marketing-subpage";
import {
  MarketingPageHeader,
  MarketingCtaBand,
} from "@/components/marketing/marketing-page-header";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Equitr pricing: $99/month for up to 25 stakeholders. 409A valuations available for $1,500/year.",
};

const platformFeatures = [
  "Up to 25 stakeholders",
  "Live cap table & vesting schedules",
  "ISO, NSO, and RSU grant issuance",
  "SAFE & convertible note tracking",
  "Round modeling & dilution scenarios",
  "Board resolutions & document workflow",
  "Unlimited viewer seats (counsel, board)",
  "Full JSON & CSV export",
  "Immutable activity audit log",
  "Role-based access control",
];

const valuationFeatures = [
  "Independent 409A valuation report",
  "Board-ready FMV documentation",
  "FMV recorded in your Equitr workspace",
  "Strike prices auto-reference current 409A",
  "Annual refresh included",
  "Defensible for ISO/NSO grant pricing",
];

const pricingFaq = [
  {
    q: "What counts as a stakeholder?",
    a: "A stakeholder is any person or entity on your cap table — founders, employees, advisors, investors, and option pool entries. Viewer-only users (like outside counsel) do not count toward the 25-stakeholder limit.",
  },
  {
    q: "What happens if I exceed 25 stakeholders?",
    a: "Contact us at hello@equitr.app and we'll work out a plan that fits your stage. We're focused on seed and Series A companies and will keep pricing straightforward as you grow.",
  },
  {
    q: "Is the 409A valuation required?",
    a: "No. The platform works without it — you can manually enter a 409A FMV in Settings. The $1,500/year add-on is for companies that want an independent valuation report delivered and recorded in Equitr.",
  },
  {
    q: "How does billing work?",
    a: "Platform billing is monthly at $99. The 409A add-on is billed annually at $1,500. Contact us to get started — self-serve billing is coming soon.",
  },
  {
    q: "How does Equitr compare to Carta pricing?",
    a: "Carta charges per stakeholder and per feature tier, which adds up quickly for early-stage companies. Equitr is $99/month flat for up to 25 stakeholders with full platform access — no nickel-and-diming for exports, viewers, or audit logs.",
  },
];

export default function PricingPage() {
  return (
    <MarketingSubpage>
      <MarketingPageHeader
        eyebrow="Pricing"
        title="Straightforward pricing for early-stage teams"
        description="One flat monthly rate for your cap table platform. Add an annual 409A valuation when you need defensible fair market value for option grants."
      />

      {/* Plans */}
      <section className="pb-20 md:pb-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Platform */}
            <div className="relative rounded-2xl border border-brand/30 bg-surface-elevated p-8 shadow-[0_0_0_1px_rgba(201,169,98,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-brand">
                Cap table platform
              </p>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-mono text-5xl font-semibold tabular-nums tracking-tight text-foreground">
                  $99
                </span>
                <span className="text-muted-foreground">/ month</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Up to 25 stakeholders · Billed monthly
              </p>
              <Link
                href="/signup"
                className="mt-8 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand-bright sm:w-auto sm:px-8"
              >
                Start for free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <ul className="mt-8 space-y-3 border-t border-border-subtle pt-8">
                {platformFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" strokeWidth={2.5} />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* 409A add-on */}
            <div className="rounded-2xl border border-border-default bg-surface-elevated p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Add-on
              </p>
              <p className="mt-1 text-lg font-semibold text-foreground">409A Valuation</p>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-mono text-5xl font-semibold tabular-nums tracking-tight text-foreground">
                  $1,500
                </span>
                <span className="text-muted-foreground">/ year</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Independent FMV report · Annual refresh
              </p>
              <Link
                href="/409a"
                className="mt-8 inline-flex h-11 w-full items-center justify-center rounded-lg border border-border-default text-sm font-medium text-foreground transition-colors hover:bg-surface-overlay sm:w-auto sm:px-8"
              >
                Learn about 409A
              </Link>
              <ul className="mt-8 space-y-3 border-t border-border-subtle pt-8">
                {valuationFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" strokeWidth={2.5} />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Need more than 25 stakeholders or have questions?{" "}
            <a href="mailto:hello@equitr.app" className="text-brand hover:text-brand-bright">
              hello@equitr.app
            </a>
          </p>
        </div>
      </section>

      {/* vs legacy */}
      <section className="border-y border-border-default bg-surface/40 py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            What you&apos;re not paying for
          </h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Legacy cap table platforms charge per stakeholder, per admin seat, and per feature.
            Equitr includes the essentials in one price.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: "Per-stakeholder fees", equitr: "Included (up to 25)" },
              { label: "Viewer / counsel seats", equitr: "Unlimited" },
              { label: "Data export", equitr: "Free, anytime" },
              { label: "Audit log access", equitr: "Included" },
              { label: "Round modeling", equitr: "Included" },
              { label: "Document workflow", equitr: "Included" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-border-default bg-surface-elevated px-5 py-4"
              >
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="mt-1 font-semibold text-brand">{item.equitr}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Pricing FAQ
          </h2>
          <div className="mt-10 divide-y divide-border-default rounded-xl border border-border-default bg-surface-elevated">
            {pricingFaq.map((item) => (
              <details key={item.q} className="group px-6 py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span className="text-muted-foreground transition-transform group-open:rotate-45 text-xl leading-none">
                    +
                  </span>
                </summary>
                <p className="mt-3 pr-8 text-sm leading-relaxed text-muted-foreground">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <MarketingCtaBand
        title="Try Equitr with real data"
        description="Explore the Acme Robotics demo workspace before you commit."
        primaryHref="/login"
        primaryLabel="Open demo"
        secondaryHref="/signup"
        secondaryLabel="Create workspace"
      />
    </MarketingSubpage>
  );
}
