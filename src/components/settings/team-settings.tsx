"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/ui/select-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, UserPlus, Trash2 } from "lucide-react";
import { canManageMembers, canManageTeam, roleLabel } from "@/lib/permissions";

interface Member {
  id: string;
  role: string;
  user: { id: string; name: string; email: string };
}

interface PendingInvite {
  id: string;
  email: string;
  role: string;
  token: string;
  expiresAt: string;
  invitedBy: { name: string };
}

interface TeamSettingsProps {
  initialMembers: Member[];
  initialInvites: PendingInvite[];
  userRole: string | null;
  currentUserId: string;
  emailConfigWarning?: string | null;
}

export function TeamSettings({
  initialMembers,
  initialInvites,
  userRole,
  currentUserId,
  emailConfigWarning = null,
}: TeamSettingsProps) {
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers);
  const [invites, setInvites] = useState(initialInvites);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);
  const [lastInviteToken, setLastInviteToken] = useState<string | null>(null);
  const [emailWarning, setEmailWarning] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const canInvite = userRole ? canManageTeam(userRole) : false;
  const canEditMembers = userRole ? canManageMembers(userRole) : false;

  async function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setEmailWarning(null);
    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          role: form.get("role"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setLastInviteUrl(data.inviteUrl);
      setLastInviteToken(data.invite.token);
      setInvites((prev) => [data.invite, ...prev]);
      if (data.email && !data.email.sent) {
        setEmailWarning(
          data.email.error
            ? `Invite created, but the email could not be sent (${data.email.provider}): ${data.email.error}. Copy the link below and send it manually.`
            : "Invite created, but the email could not be sent. Copy the link below and send it manually."
        );
      }
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invite");
    } finally {
      setLoading(false);
    }
  }

  async function revokeInvite(id: string) {
    try {
      const res = await fetch(`/api/invites/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      setInvites((prev) => prev.filter((i) => i.id !== id));
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to revoke invite");
    }
  }

  async function changeRole(membershipId: string, role: string) {
    setUpdatingId(membershipId);
    try {
      const res = await fetch(`/api/members/${membershipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMembers((prev) =>
        prev.map((m) => (m.id === membershipId ? { ...m, role: data.membership.role } : m))
      );
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setUpdatingId(null);
    }
  }

  async function removeMember(membershipId: string, name: string) {
    if (!confirm(`Remove ${name} from the team? They will lose access immediately.`)) return;

    setUpdatingId(membershipId);
    try {
      const res = await fetch(`/api/members/${membershipId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMembers((prev) => prev.filter((m) => m.id !== membershipId));
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to remove member");
    } finally {
      setUpdatingId(null);
    }
  }

  function copyInviteUrl(token: string) {
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url);
    setLastInviteUrl(`/invite/${token}`);
  }

  return (
    <div className="space-y-6">
      {emailConfigWarning && canInvite && (
        <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-foreground">
          {emailConfigWarning}
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {members.map((member) => {
            const isSelf = member.user.id === currentUserId;
            const isOwner = member.role === "owner";

            return (
              <div
                key={member.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 border-b border-border-default last:border-0"
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground">
                    {member.user.name}
                    {isSelf && (
                      <span className="ml-2 text-xs text-subtle-foreground">(you)</span>
                    )}
                  </p>
                  <p className="text-sm text-subtle-foreground">{member.user.email}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {canEditMembers && !isOwner ? (
                    <SelectField
                      label=""
                      name={`role-${member.id}`}
                      value={member.role}
                      onChange={(e) => changeRole(member.id, e.target.value)}
                      disabled={updatingId === member.id}
                      className="w-36"
                    >
                      <option value="admin">Admin</option>
                      <option value="viewer">Viewer</option>
                    </SelectField>
                  ) : (
                    <Badge variant={isOwner ? "default" : "secondary"}>
                      {roleLabel(member.role)}
                    </Badge>
                  )}

                  {canEditMembers && !isOwner && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground hover:text-danger"
                      disabled={updatingId === member.id}
                      onClick={() => removeMember(member.id, member.user.name)}
                    >
                      {updatingId === member.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {canInvite && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Invite Teammate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="inviteEmail">Email</Label>
                  <Input id="inviteEmail" name="email" type="email" required placeholder="cfo@company.com" />
                </div>
                <SelectField label="Role" name="role" defaultValue="viewer">
                  <option value="viewer">Viewer — read-only access</option>
                  <option value="admin">Admin — can manage cap table</option>
                </SelectField>
              </div>
              {error && <p className="text-sm text-danger">{error}</p>}
              {emailWarning && (
                <div className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-foreground">
                  {emailWarning}
                </div>
              )}
              {lastInviteUrl && lastInviteToken && (
                <div className="flex items-center gap-2 rounded-lg border border-brand/20 bg-brand/5 px-3 py-2 text-sm">
                  <span className="text-muted-foreground truncate flex-1">Invite link ready</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => copyInviteUrl(lastInviteToken)}
                  >
                    <Copy className="h-3 w-3" />
                    Copy
                  </Button>
                </div>
              )}
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Invite"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {invites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invites</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2 border-b border-border-default last:border-0"
              >
                <div>
                  <p className="font-medium text-foreground">{invite.email}</p>
                  <p className="text-xs text-subtle-foreground">
                    {invite.role} · invited by {invite.invitedBy.name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => copyInviteUrl(invite.token)}>
                    <Copy className="h-3 w-3" />
                    Copy link
                  </Button>
                  {canInvite && (
                    <Button size="sm" variant="ghost" onClick={() => revokeInvite(invite.id)}>
                      Revoke
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
