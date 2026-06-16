import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Equitr collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <div className="marketing-site min-h-screen">
      <MarketingNav />
      <main className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">Last updated: June 8, 2026</p>

        <div className="mt-12 space-y-8 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-foreground">What we collect</h2>
            <p className="mt-3">
              When you create an account, we collect your name, email address, and password
              (stored as a salted hash). When you use Equitr, we store the company and cap
              table data you enter, including stakeholder names, equity grants, and uploaded
              documents.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">How we use it</h2>
            <p className="mt-3">
              We use your information to provide the Equitr service, authenticate your
              account, send transactional emails (invites, password resets), and maintain an
              audit trail of changes within your workspace. We do not sell your data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Data retention</h2>
            <p className="mt-3">
              Your workspace data is retained for as long as your account is active. You may
              export your data at any time. To request account deletion, contact
              hello@equitr.app.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Contact</h2>
            <p className="mt-3">
              Questions about this policy:{" "}
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
