import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingNav } from "./marketing-nav";
import { MarketingFooter } from "./marketing-footer";
import { ProductPreview } from "./product-preview";
import { AuditPreview } from "./audit-preview";
import { ComparisonTable } from "./comparison-table";
import { MarketingFaq } from "./marketing-faq";
import { MarketingAmbient } from "./marketing-ambient";

const workflow = [
  {
    step: "01",
    title: "Set up your company",
    body: "Authorized shares, share classes, and your 409A valuation — the legal baseline your cap table builds on.",
  },
  {
    step: "02",
    title: "Record issuances",
    body: "Founder stock, option grants, and pool reservations with board approval dates attached to each transaction.",
  },
  {
    step: "03",
    title: "Attach documents",
    body: "Stock agreements and board resolutions linked to each grant. Signed copies stored alongside the record.",
  },
  {
    step: "04",
    title: "Export for diligence",
    body: "When investors or counsel ask, pull a point-in-time cap table export or full company JSON in seconds.",
  },
];

const capabilities = [
  "Live fully-diluted cap table with vesting",
  "ISO, NSO, and RSU grants with generated agreements",
  "SAFEs, convertible notes, and round modeling",
  "Board resolutions and document signing workflow",
  "Role-based access for finance, legal, and board",
  "Immutable activity log on every change",
];

export function MarketingHome() {
  return (
    <div className="marketing-site relative isolate min-h-screen overflow-x-hidden">
      <MarketingAmbient />
      <MarketingNav />

      <main className="relative z-10">
        {/* Hero */}
        <section className="border-b border-border-default">
          <div className="marketing-container grid gap-12 py-16 md:grid-cols-2 md:items-center md:gap-14 md:py-20 lg:gap-16 lg:py-24 xl:gap-20 xl:py-28">
            <div className="max-w-xl md:max-w-none">
              <p className="text-sm font-medium text-brand md:text-base">
                Cap table software for seed &amp; Series A
              </p>
              <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.06] tracking-tight text-foreground sm:text-5xl lg:text-[3.35rem] lg:leading-[1.05] xl:text-6xl">
                Your equity record, ready for diligence.
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground md:mt-6 md:text-xl md:leading-relaxed lg:max-w-xl">
                Equitr gives founders a secure system of record for equity, convertible
                notes, and compliance documents — a clear alternative for teams that want
                control, transparency, and software that stays out of the way.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3 md:mt-10">
                <Link href="/signup">
                  <Button size="lg" className="h-12 gap-2 px-6 text-base">
                    Create workspace
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="h-12 px-6 text-base">
                    Explore live demo
                  </Button>
                </Link>
              </div>
              <div className="mt-8 inline-flex rounded-lg border border-border-default bg-surface-elevated px-5 py-3.5 md:mt-10">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.08em] text-subtle-foreground">
                    Demo workspace
                  </p>
                  <p className="mt-1.5 font-mono text-sm text-foreground md:text-base">
                    demo@acmerobotics.com
                    <span className="mx-2 text-muted-foreground">·</span>
                    demo12345
                  </p>
                </div>
              </div>
            </div>
            <div className="w-full md:min-w-0">
              <ProductPreview />
              <p className="mt-4 text-center text-sm text-subtle-foreground">
                From the Acme Robotics demo workspace
              </p>
            </div>
          </div>
        </section>

        {/* Proof strip */}
        <section className="border-b border-border-default bg-surface-elevated">
          <div className="marketing-container flex flex-col gap-4 py-8 md:flex-row md:items-center md:justify-between md:py-10">
            <p className="text-base font-medium text-foreground">
              Built for founders replacing legacy cap table tools
            </p>
            <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted-foreground md:text-base">
              <Link href="/pricing" className="transition-colors hover:text-foreground">
                $99/mo · up to 25 stakeholders
              </Link>
              <span className="hidden text-border-default md:inline">|</span>
              <span>Counsel-ready exports</span>
              <span className="hidden text-border-default md:inline">|</span>
              <Link href="/409a" className="transition-colors hover:text-foreground">
                409A from $1,500/yr
              </Link>
            </div>
          </div>
        </section>

        {/* Workflow */}
        <section id="workflow" className="border-b border-border-default py-20 lg:py-28 xl:py-32">
          <div className="marketing-container">
            <div className="max-w-3xl lg:max-w-4xl">
              <h2 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl xl:text-[2.75rem]">
                From incorporation to investor diligence
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground lg:text-xl lg:leading-relaxed">
                One system for the equity work you do every month — not a bloated admin
                console you fight with once a quarter.
              </p>
            </div>
            <div className="mt-14 grid gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-5">
              {workflow.map((item) => (
                <div
                  key={item.step}
                  className="rounded-xl border border-border-default bg-surface-elevated p-7 lg:p-8"
                >
                  <p className="font-mono text-xs font-semibold tabular-nums text-brand">{item.step}</p>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground md:text-base md:leading-relaxed">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Product */}
        <section id="product" className="border-b border-border-default bg-surface-overlay/40 py-20 lg:py-28 xl:py-32">
          <div className="marketing-container">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16 xl:gap-20">
              <div className="lg:pr-4">
                <h2 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl xl:text-[2.75rem]">
                  Everything on the cap table, reconciled.
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-muted-foreground lg:mt-5 lg:text-xl lg:leading-relaxed">
                  Common stock, preferred rounds, option pools, SAFEs, and convertible notes
                  in one ledger. Ownership percentages stay tied to the underlying grants —
                  not a spreadsheet someone updated last Tuesday.
                </p>
                <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:mt-10 lg:grid-cols-1 xl:grid-cols-2">
                  {capabilities.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-foreground md:text-base">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" strokeWidth={2.5} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <ProductPreview />
            </div>
          </div>
        </section>

        {/* Compare */}
        <section id="compare" className="border-b border-border-default py-20 lg:py-28 xl:py-32">
          <div className="marketing-container">
            <div className="max-w-3xl lg:max-w-4xl">
              <h2 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl xl:text-[2.75rem]">
                How Equitr compares
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground lg:text-xl lg:leading-relaxed">
                Legacy cap table platforms were built for later-stage companies with finance
                teams. If you&apos;re evaluating alternatives to Carta or migrating off Pulley,
                these are the differences that matter at your stage.
              </p>
            </div>
            <div className="mt-12 lg:mt-14">
              <ComparisonTable />
            </div>
          </div>
        </section>

        {/* Security */}
        <section id="security" className="border-b border-border-default bg-surface-overlay/40 py-20 lg:py-28 xl:py-32">
          <div className="marketing-container">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-start lg:gap-16 xl:gap-20">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl xl:text-[2.75rem]">
                  Security your counsel can verify
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-muted-foreground lg:mt-5 lg:text-xl lg:leading-relaxed">
                  Equity is a legal record. Equitr treats permissions, document history, and
                  activity logs as first-class features — because a cap table platform should
                  reduce risk, not introduce it.
                </p>
                <dl className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  {[
                    {
                      term: "Access control",
                      detail:
                        "Owners, admins, and viewers see only what their role allows. Cap table edits require write access.",
                    },
                    {
                      term: "Audit trail",
                      detail:
                        "Every grant, document action, invite, and settings change is logged with who did it and when.",
                    },
                    {
                      term: "Data ownership",
                      detail:
                        "Export your full company record as JSON or CSV at any time. Your data isn't held hostage.",
                    },
                    {
                      term: "Encryption",
                      detail:
                        "TLS in transit, encrypted database connections, and secrets managed outside your codebase.",
                    },
                  ].map((item) => (
                    <div key={item.term}>
                      <dt className="font-semibold text-foreground md:text-lg">{item.term}</dt>
                      <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground md:text-base">
                        {item.detail}
                      </dd>
                    </div>
                  ))}
                </dl>
                <Link
                  href="/security"
                  className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-bright md:text-base"
                >
                  Read our security overview
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="lg:sticky lg:top-24">
                <AuditPreview />
              </div>
            </div>
          </div>
        </section>

        {/* Migration */}
        <section className="border-b border-border-default py-20 lg:py-24 xl:py-28">
          <div className="marketing-container">
            <div className="rounded-2xl border border-border-default bg-surface-elevated p-8 lg:flex lg:items-center lg:justify-between lg:gap-16 lg:p-12 xl:p-14">
              <div className="max-w-2xl">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground lg:text-3xl">
                  Moving from Pulley or another platform?
                </h2>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground lg:text-lg">
                  Export your existing cap table data and import it into Equitr. Full JSON
                  round-trip built in so you&apos;re never locked in, in either direction.
                </p>
              </div>
              <Link href="/signup" className="mt-8 block shrink-0 lg:mt-0">
                <Button size="lg" className="h-12 px-8 text-base">
                  Start migration
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="border-b border-border-default py-20 lg:py-28 xl:py-32">
          <div className="marketing-container">
            <div className="mx-auto max-w-5xl">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">
                Common questions
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                From founders evaluating cap table software.
              </p>
            </div>
            <div className="mt-12">
              <MarketingFaq />
            </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 lg:py-28 xl:py-32">
          <div className="marketing-container text-center">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground lg:text-4xl xl:text-5xl">
              See it with real data
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground lg:text-xl">
              Log into the Acme Robotics demo workspace — a fully populated cap table with
              grants, investors, SAFEs, and signed documents.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link href="/login">
                <Button size="lg" className="h-12 px-8 text-base">
                  Open demo workspace
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                  Create your own
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
