import type { Metadata } from "next";
import Link from "next/link";
import {
  Lock,
  Shield,
  Eye,
  Download,
  Server,
  FileCheck2,
  Users,
  Mail,
} from "lucide-react";
import { MarketingSubpage } from "@/components/marketing/marketing-subpage";
import {
  MarketingPageHeader,
  MarketingCtaBand,
} from "@/components/marketing/marketing-page-header";
import { AuditPreview } from "@/components/marketing/audit-preview";

export const metadata: Metadata = {
  title: "Trust Center",
  description:
    "Equitr security, access controls, audit logging, data portability, and compliance practices for your cap table.",
};

const trustFacts = [
  { label: "Encryption in transit", value: "TLS 1.2+" },
  { label: "Role-based access", value: "Owner · Admin · Viewer" },
  { label: "Audit log retention", value: "Full workspace history" },
  { label: "Data export", value: "JSON + CSV, anytime" },
];

const controls = [
  {
    icon: Lock,
    title: "Least-privilege access",
    body: "Every workspace member is assigned an owner, admin, or viewer role. Write access to cap table data, grants, and settings is limited to owners and admins.",
  },
  {
    icon: Eye,
    title: "Immutable activity log",
    body: "Grants, documents, invites, stakeholder edits, and configuration changes are recorded with the acting user, action type, and timestamp.",
  },
  {
    icon: Download,
    title: "Your data, portable",
    body: "Export your full company record as JSON or your cap table as CSV from Settings. No export fees, no support tickets, no lock-in.",
  },
  {
    icon: Shield,
    title: "Defense in depth",
    body: "Session-based authentication, hashed passwords, encrypted database connections, and secrets managed outside application code.",
  },
];

const accessMatrix = [
  { action: "View cap table", owner: true, admin: true, viewer: true },
  { action: "Issue grants & edit stakeholders", owner: true, admin: true, viewer: false },
  { action: "Upload & sign documents", owner: true, admin: true, viewer: false },
  { action: "Invite team members", owner: true, admin: true, viewer: false },
  { action: "Change company settings", owner: true, admin: false, viewer: false },
  { action: "Export company data", owner: true, admin: true, viewer: false },
  { action: "View activity log", owner: true, admin: true, viewer: false },
];

const subprocessors = [
  {
    name: "Railway",
    purpose: "Application hosting & managed PostgreSQL",
    location: "United States",
  },
  {
    name: "Resend",
    purpose: "Transactional email (invites, password resets)",
    location: "United States",
  },
];

const complianceItems = [
  {
    item: "SOC 2 Type II",
    status: "In progress",
    detail: "Formal audit program underway. Contact us for current timeline.",
  },
  {
    item: "GDPR-ready data export",
    status: "Available",
    detail: "Full workspace export supports data portability requests.",
  },
  {
    item: "Penetration testing",
    status: "Planned",
    detail: "Third-party assessment scheduled as part of SOC 2 readiness.",
  },
];

const securityFaq = [
  {
    q: "Where is my data stored?",
    a: "Equitr workspaces are stored in PostgreSQL databases hosted on Railway infrastructure in the United States. All connections between application servers and the database are encrypted.",
  },
  {
    q: "Who can see my cap table?",
    a: "Only users you explicitly invite to your workspace. Viewers can read the record but cannot make changes. Equitr employees do not access customer cap table data except when required for a support request you initiate.",
  },
  {
    q: "What happens if I cancel?",
    a: "You can export your full company record before closing your account. We do not restrict exports or charge exit fees for data access.",
  },
  {
    q: "Do you sell customer data?",
    a: "No. Equitr does not sell, rent, or share your cap table data with third parties for marketing or advertising purposes.",
  },
];

function CheckCell({ allowed }: { allowed: boolean }) {
  return (
    <td className="px-4 py-3 text-center">
      {allowed ? (
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-success/15 text-success text-xs">
          ✓
        </span>
      ) : (
        <span className="text-subtle-foreground">—</span>
      )}
    </td>
  );
}

export default function SecurityPage() {
  return (
    <MarketingSubpage>
      <MarketingPageHeader
        eyebrow="Trust center"
        title="Security built for equity records"
        description="Your cap table is a legal document. Equitr treats access control, audit logging, and data ownership as core product — not premium add-ons you discover during diligence."
      />

      {/* Quick facts */}
      <section className="border-b border-border-default bg-surface/40">
        <div className="mx-auto grid max-w-6xl gap-px bg-border-default sm:grid-cols-2 lg:grid-cols-4">
          {trustFacts.map((fact) => (
            <div key={fact.label} className="bg-surface px-6 py-6">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-subtle-foreground">
                {fact.label}
              </p>
              <p className="mt-2 font-mono text-sm font-semibold text-foreground">{fact.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Control pillars */}
      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            How we protect your workspace
          </h2>
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {controls.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-xl border border-border-default bg-surface-elevated p-6"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 ring-1 ring-brand/15">
                  <Icon className="h-5 w-5 text-brand" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Access matrix */}
      <section className="border-y border-border-default bg-surface/40 py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-start">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                Role permissions at a glance
              </h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                Invite your CFO as admin, outside counsel as viewer, and keep destructive
                actions limited to owners. No shared passwords, no ambiguous permission tiers.
              </p>
              <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4 text-brand" />
                Unlimited read-only viewers on all plans
              </div>
            </div>
            <div className="overflow-hidden rounded-xl border border-border-default">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-default bg-surface-elevated text-left text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3 text-center">Owner</th>
                    <th className="px-4 py-3 text-center">Admin</th>
                    <th className="px-4 py-3 text-center">Viewer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle bg-surface">
                  {accessMatrix.map((row) => (
                    <tr key={row.action}>
                      <td className="px-4 py-3 text-foreground">{row.action}</td>
                      <CheckCell allowed={row.owner} />
                      <CheckCell allowed={row.admin} />
                      <CheckCell allowed={row.viewer} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Audit trail */}
      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
            <AuditPreview />
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                An audit trail you can show in diligence
              </h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                When investors or counsel ask &quot;who approved this grant?&quot; or &quot;when did
                this SAFE convert?&quot; — the activity log has the answer. Every material change
                is timestamped and attributed.
              </p>
              <ul className="mt-8 space-y-3 text-sm text-foreground">
                {[
                  "Grant issuances and exercises",
                  "Document uploads and signatures",
                  "Board resolutions and round closes",
                  "Team invites and role changes",
                  "Settings and company updates",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <FileCheck2 className="h-4 w-4 shrink-0 text-brand" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Infrastructure & subprocessors */}
      <section className="border-y border-border-default bg-surface/40 py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 ring-1 ring-brand/15">
                <Server className="h-5 w-5 text-brand" />
              </div>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
                Infrastructure
              </h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                Equitr runs on modern cloud infrastructure with encrypted connections to
                PostgreSQL. Application secrets are stored in environment configuration —
                never in source code or customer-facing exports.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                <li>· Passwords hashed with bcrypt (cost factor 12)</li>
                <li>· HTTP-only session cookies with signed JWTs</li>
                <li>· Database backups managed by hosting provider</li>
                <li>· HTTPS enforced on all production traffic</li>
              </ul>
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Subprocessors
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                We use a limited set of third-party services to operate Equitr. Each is
                contracted for a specific purpose and does not receive cap table data beyond
                what is required for that function.
              </p>
              <div className="mt-6 space-y-3">
                {subprocessors.map((sp) => (
                  <div
                    key={sp.name}
                    className="rounded-xl border border-border-default bg-surface-elevated p-4"
                  >
                    <p className="font-semibold text-foreground">{sp.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{sp.purpose}</p>
                    <p className="mt-2 text-xs text-subtle-foreground">{sp.location}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Compliance program
          </h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            We are honest about where we are today and where we are headed. If your diligence
            process requires specific attestations, reach out — we will share current status
            directly.
          </p>
          <div className="mt-10 space-y-3">
            {complianceItems.map((item) => (
              <div
                key={item.item}
                className="flex flex-col gap-3 rounded-xl border border-border-default bg-surface-elevated p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-foreground">{item.item}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                </div>
                <span
                  className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-semibold ${
                    item.status === "Available"
                      ? "bg-success/15 text-success"
                      : "bg-surface-overlay text-muted-foreground"
                  }`}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border-default bg-surface/40 py-20 md:py-24">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Security FAQ
          </h2>
          <div className="mt-10 divide-y divide-border-default rounded-xl border border-border-default bg-surface-elevated">
            {securityFaq.map((item) => (
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

      {/* Contact */}
      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Contact us</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <a
              href="mailto:security@equitr.app"
              className="rounded-xl border border-border-default bg-surface-elevated p-6 transition-colors hover:border-brand/30"
            >
              <Mail className="h-5 w-5 text-brand" />
              <p className="mt-3 font-semibold text-foreground">Report a vulnerability</p>
              <p className="mt-1 text-sm text-muted-foreground">security@equitr.app</p>
              <p className="mt-2 text-xs text-subtle-foreground">We respond within two business days.</p>
            </a>
            <a
              href="mailto:hello@equitr.app"
              className="rounded-xl border border-border-default bg-surface-elevated p-6 transition-colors hover:border-brand/30"
            >
              <Mail className="h-5 w-5 text-brand" />
              <p className="mt-3 font-semibold text-foreground">Security & diligence questions</p>
              <p className="mt-1 text-sm text-muted-foreground">hello@equitr.app</p>
              <p className="mt-2 text-xs text-subtle-foreground">
                For investor due diligence or vendor security reviews.
              </p>
            </a>
          </div>
          <p className="mt-8 text-sm text-muted-foreground">
            See also our{" "}
            <Link href="/privacy" className="text-brand hover:text-brand-bright">
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link href="/terms" className="text-brand hover:text-brand-bright">
              Terms of Service
            </Link>
            .
          </p>
        </div>
      </section>

      <MarketingCtaBand
        title="Ready to get started?"
        description="Create a workspace and see how Equitr handles your equity record."
        primaryHref="/signup"
        primaryLabel="Create workspace"
        secondaryHref="/login"
        secondaryLabel="Open demo"
      />
    </MarketingSubpage>
  );
}
