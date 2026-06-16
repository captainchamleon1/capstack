import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms governing your use of the Equitr platform.",
};

export default function TermsPage() {
  return (
    <div className="marketing-site min-h-screen">
      <MarketingNav />
      <main className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">
          Terms of Service
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">Last updated: June 8, 2026</p>

        <div className="mt-12 space-y-8 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-foreground">Service</h2>
            <p className="mt-3">
              Equitr provides cap table management software for private companies. The
              service is provided &quot;as is&quot; and is not a substitute for legal, tax, or
              financial advice. You are responsible for the accuracy of data you enter.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Your account</h2>
            <p className="mt-3">
              You are responsible for maintaining the security of your account credentials
              and for all activity under your workspace. Do not share login credentials —
              use role-based invites instead.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Acceptable use</h2>
            <p className="mt-3">
              You may not use Equitr to store unlawful content, attempt unauthorized access
              to other workspaces, or interfere with the operation of the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Limitation of liability</h2>
            <p className="mt-3">
              To the maximum extent permitted by law, Equitr is not liable for indirect,
              incidental, or consequential damages arising from your use of the service.
              Cap table software is a record-keeping tool — verify all equity transactions
              with qualified counsel.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Contact</h2>
            <p className="mt-3">
              Questions about these terms:{" "}
              <a href="mailto:hello@equitr.app" className="text-brand hover:text-brand-bright">
                hello@equitr.app
              </a>
            </p>
          </section>
        </div>

        <Link
          href="/"
          className="mt-12 inline-block text-sm font-medium text-brand hover:text-brand-bright"
        >
          ← Back to home
        </Link>
      </main>
      <MarketingFooter />
    </div>
  );
}
