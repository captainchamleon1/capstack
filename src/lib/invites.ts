import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

const INVITE_EXPIRY_DAYS = 7;
const INVITE_ROLES = new Set(["admin", "viewer"]);

export async function createCompanyInvite(params: {
  companyId: string;
  email: string;
  role: string;
  invitedById: string;
}) {
  const email = params.email.toLowerCase().trim();
  if (!INVITE_ROLES.has(params.role)) {
    throw new Error("Invalid role. Use admin or viewer.");
  }

  const existingMember = await prisma.user.findUnique({
    where: { email },
    include: { memberships: { where: { companyId: params.companyId } } },
  });
  if (existingMember?.memberships.length) {
    throw new Error("This person is already on your team");
  }

  const pending = await prisma.companyInvite.findFirst({
    where: { companyId: params.companyId, email, acceptedAt: null },
  });
  if (pending) {
    throw new Error("An invite is already pending for this email");
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

  return prisma.companyInvite.create({
    data: {
      companyId: params.companyId,
      email,
      role: params.role,
      token: randomBytes(24).toString("hex"),
      invitedById: params.invitedById,
      expiresAt,
    },
    include: { company: true, invitedBy: { select: { name: true } } },
  });
}

export async function getInviteByToken(token: string) {
  return prisma.companyInvite.findUnique({
    where: { token },
    include: { company: true, invitedBy: { select: { name: true } } },
  });
}

export async function acceptCompanyInvite(token: string, userId: string, userEmail: string) {
  const invite = await getInviteByToken(token);
  if (!invite) throw new Error("Invite not found");
  if (invite.acceptedAt) throw new Error("Invite already accepted");
  if (invite.expiresAt < new Date()) throw new Error("Invite has expired");
  if (invite.email !== userEmail.toLowerCase()) {
    throw new Error("This invite was sent to a different email address");
  }

  const existing = await prisma.membership.findFirst({
    where: { userId, companyId: invite.companyId },
  });
  if (existing) throw new Error("You are already a member of this company");

  return prisma.$transaction(async (tx) => {
    await tx.membership.create({
      data: {
        userId,
        companyId: invite.companyId,
        role: invite.role,
      },
    });

    return tx.companyInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
      include: { company: true },
    });
  });
}

export async function listCompanyInvites(companyId: string) {
  return prisma.companyInvite.findMany({
    where: { companyId, acceptedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    include: { invitedBy: { select: { name: true } } },
  });
}

export async function listCompanyMembers(companyId: string) {
  return prisma.membership.findMany({
    where: { companyId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function revokeCompanyInvite(inviteId: string, companyId: string) {
  const invite = await prisma.companyInvite.findFirst({
    where: { id: inviteId, companyId, acceptedAt: null },
  });
  if (!invite) throw new Error("Invite not found");

  await prisma.companyInvite.delete({ where: { id: inviteId } });
}

export async function getUserMembershipRole(userId: string, companyId: string) {
  const membership = await prisma.membership.findFirst({
    where: { userId, companyId },
  });
  return membership?.role ?? null;
}
