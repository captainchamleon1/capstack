import type { Metadata } from "next";
import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { MarketingSubpage } from "@/components/marketing/marketing-subpage";
import {
  MarketingPageHeader,
  MarketingCtaBand,
} from "@/components/marketing/marketing-page-header";

export const metadata: Metadata = {
  title: "409A Valuations",
  description:
    "Independent 409A fair market value valuations for $1,500/year. Defensible FMV for ISO and NSO grants, recorded directly in your Equitr cap table.",
};

const whenYouNeed = [
  {
    title: "Issuing stock options",
    body: "ISOs require a strike price at or above fair market value. Without a 409A, you risk IRS penalties and compromised option tax treatment for employees.",
  },
  {
    title: "Annual refresh",
    body: "Material events — new financing, significant revenue changes, or 12 months elapsed — typically require an updated valuation. Most startups refresh annually.",
  },
  {
    title: "Board & counsel diligence",
    body: "Your board and outside counsel will ask for documentation supporting grant pricing. A defensible 409A report is the standard answer.",
  },
];

const process = [
  {
    step: "01",
    title: "Run the automated valuation",
    body: "Equitr derives your cap structure from your live cap table, runs an OPM backsolve to your latest priced round, applies a DLOM, and produces a draft report in minutes.",
  },
  {
    step: "02",
    title: "Analyst review & finalize",
    body: "A qualified valuation analyst reviews the draft, adjusts assumptions if needed, and signs off. You get a board-ready PDF with breakpoint analysis and sensitivity tables.",
  },
  {
    step: "03",
    title: "Board adoption",
    body: "Your board adopts the valuation as the company's official FMV. Equitr can draft the board resolution and record the effective date in your workspace.",
  },
  {
    step: "04",
    title: "Grants reference live FMV",
    body: "New option grants automatically reference the current 409A FMV for strike price. Stakeholder pages and grant detail show unvested value at FMV.",
  },
];

const included = [
  "Independent third-party 409A valuation report",
  "Per-share fair market value determination",
  "Board-ready documentation package",
  "FMV recorded in Equitr with effective date",
  "One annual refresh per year",
  "Strike price reference for new option grants",
];

const fmv409aFaq = [
  {
    q: "What is a 409A valuation?",
    a: "A 409A valuation is an independent appraisal of your company's common stock fair market value (FMV), named after IRC Section 409A. It establishes the minimum exercise price for stock options and is required for defensible ISO grants.",
  },
  {
    q: "Do I need a 409A to use Equitr?",
    a: "No. You can use Equitr without a 409A add-on and manually enter an FMV in Settings if you have a valuation from another provider. The add-on is for companies that want Equitr to coordinate the valuation and record it automatically.",
  },
  {
    q: "How often should I refresh?",
    a: "Most private companies refresh annually, or sooner after a material event like a priced round, significant revenue change, or major pivot. Your counsel can advise on timing specific to your situation.",
  },
  {
    q: "What's included in the $1,500/year price?",
    a: "One independent 409A valuation report per year, board-ready documentation, FMV integration into your Equitr workspace, and one annual refresh. Additional interim valuations outside the annual cycle may incur supplemental fees.",
  },
];

export default function Valuation409APage() {
  return (
    <MarketingSubpage>
      <MarketingPageHeader
        eyebrow="409A valuations"
        title="Defensible fair market value for your option grants"
        description="Equitr coordinates an independent 409A valuation, delivers board-ready documentation, and records the FMV directly in your cap table — so every grant references a number your counsel can defend."
      >
        <div className="mt-8 flex flex-wrap items-baseline gap-3">
          <span className="font-mono text-3xl font-semibold tabular-nums text-foreground">
            $1,500
          </span>
          <span className="text-muted-foreground">/ year · includes annual refresh</span>
          <Link
            href="/signup"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand-bright"
          >
            Get started
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </MarketingPageHeader>

      {/* What is 409A */}
      <section className="border-b border-border-default bg-surface/40 py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                Why 409A matters
              </h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                When you grant stock options to employees, the IRS requires that the exercise
                price be at or above the fair market value of your common stock on the grant
                date. A 409A valuation provides that FMV with an independent, documented
                methodology.
              </p>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                Without it, you expose employees to tax penalties and yourself to questions
                from counsel, auditors, and investors during diligence.
              </p>
            </div>
            <div className="rounded-2xl border border-border-default bg-surface-elevated p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-subtle-foreground">
                In your Equitr workspace
              </p>
              <div className="mt-4 space-y-4">
                <div className="rounded-lg border border-border-subtle bg-surface px-4 py-3">
                  <p className="text-xs text-muted-foreground">409A fair market value</p>
                  <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-brand">
                    $0.5500 / share
                  </p>
                  <p className="mt-1 text-xs text-subtle-foreground">Effective Jan 1, 2024</p>
                </div>
                <div className="rounded-lg border border-border-subtle bg-surface px-4 py-3">
                  <p className="text-xs text-muted-foreground">New ISO grant · Sam Rivera</p>
                  <p className="mt-1 text-sm text-foreground">
                    Strike price: <span className="font-mono font-semibold text-brand">$0.55</span>
                    <span className="ml-2 text-xs text-muted-foreground">(at current 409A FMV)</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* When you need it */}
      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            When you need a 409A
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {whenYouNeed.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-border-default bg-surface-elevated p-6"
              >
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="border-y border-border-default bg-surface/40 py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            How it works
          </h2>
          <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-border-default bg-border-default md:grid-cols-4">
            {process.map((item) => (
              <div key={item.step} className="bg-surface-elevated p-6 md:p-7">
                <p className="font-mono text-xs font-semibold tabular-nums text-brand">
                  {item.step}
                </p>
                <h3 className="mt-4 font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's included */}
      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                What&apos;s included at $1,500/year
              </h2>
              <p className="mt-4 text-muted-foreground">
                Platform access is separate at{" "}
                <Link href="/pricing" className="text-brand hover:text-brand-bright">
                  $99/month
                </Link>
                . The 409A add-on covers valuation services only.
              </p>
              <ul className="mt-8 space-y-3">
                {included.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" strokeWidth={2.5} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-brand/25 bg-surface-elevated p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-brand">
                409A add-on
              </p>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-mono text-4xl font-semibold tabular-nums text-foreground">
                  $1,500
                </span>
                <span className="text-muted-foreground">/ year</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Independent valuation + annual refresh + Equitr FMV integration
              </p>
              <Link
                href="/signup"
                className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-lg bg-brand text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand-bright"
              >
                Get started with Equitr
              </Link>
              <p className="mt-4 text-center text-xs text-subtle-foreground">
                Already on Equitr? Email hello@equitr.app to add 409A to your workspace.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border-default bg-surface/40 py-20 md:py-24">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">409A FAQ</h2>
          <div className="mt-10 divide-y divide-border-default rounded-xl border border-border-default bg-surface-elevated">
            {fmv409aFaq.map((item) => (
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
        title="Need the platform too?"
        description="Equitr is $99/month for up to 25 stakeholders — cap table, grants, SAFEs, and round modeling included."
        primaryHref="/pricing"
        primaryLabel="View pricing"
        secondaryHref="/signup"
        secondaryLabel="Start for free"
      />
    </MarketingSubpage>
  );
}
