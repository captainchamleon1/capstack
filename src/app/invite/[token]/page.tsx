import { InviteAcceptPanel } from "@/components/invites/invite-accept-panel";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <InviteAcceptPanel token={token} />;
}
