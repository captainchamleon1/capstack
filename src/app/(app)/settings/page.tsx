import { Header } from "@/components/layout/header";
import { PageBody } from "@/components/layout/page-body";
import { SettingsForm } from "@/components/settings/settings-form";
import { TeamSettings } from "@/components/settings/team-settings";
import { ReadOnlyBanner } from "@/components/layout/read-only-banner";
import { requireSessionMembership } from "@/lib/db";
import { canEditCompanySettings } from "@/lib/permissions";
import { getProductionEmailConfigError } from "@/lib/email";
import { listCompanyInvites, listCompanyMembers } from "@/lib/invites";

export default async function SettingsPage() {
  const { company, role, session } = await requireSessionMembership();

  const [members, invites] = await Promise.all([
    listCompanyMembers(company.id),
    listCompanyInvites(company.id),
  ]);

  const readOnly = !canEditCompanySettings(role);
  const emailConfigWarning = getProductionEmailConfigError();

  return (
    <div>
      <Header title="Settings" description="Company profile, team access, and cap table configuration" />
      <PageBody className="max-w-2xl space-y-10">
        {readOnly && <ReadOnlyBanner />}
        <SettingsForm company={company} readOnly={readOnly} />
        <TeamSettings
          initialMembers={members}
          initialInvites={invites.map((i) => ({
            ...i,
            expiresAt: i.expiresAt.toISOString(),
          }))}
          userRole={role}
          currentUserId={session.userId}
          emailConfigWarning={emailConfigWarning}
        />
      </PageBody>
    </div>
  );
}
