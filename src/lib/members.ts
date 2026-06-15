import { prisma } from "@/lib/prisma";

const MEMBER_ROLES = new Set(["admin", "viewer"]);

export async function updateMemberRole(params: {
  membershipId: string;
  companyId: string;
  role: string;
}) {
  if (!MEMBER_ROLES.has(params.role)) {
    throw new Error("Role must be admin or viewer");
  }

  const membership = await prisma.membership.findFirst({
    where: { id: params.membershipId, companyId: params.companyId },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!membership) throw new Error("Member not found");
  if (membership.role === "owner") {
    throw new Error("Cannot change the owner role. Transfer ownership first.");
  }
  if (membership.role === params.role) {
    return membership;
  }

  return prisma.membership.update({
    where: { id: membership.id },
    data: { role: params.role },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
}

export async function removeMember(params: {
  membershipId: string;
  companyId: string;
  actorUserId: string;
}) {
  const membership = await prisma.membership.findFirst({
    where: { id: params.membershipId, companyId: params.companyId },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!membership) throw new Error("Member not found");
  if (membership.role === "owner") {
    throw new Error("Cannot remove the company owner");
  }

  const ownerCount = await prisma.membership.count({
    where: { companyId: params.companyId, role: "owner" },
  });
  if (membership.userId === params.actorUserId && ownerCount === 1) {
    const actorIsOwner = await prisma.membership.findFirst({
      where: { id: membership.id, role: "owner" },
    });
    if (actorIsOwner) {
      throw new Error("You cannot remove yourself as the only owner");
    }
  }

  await prisma.membership.delete({ where: { id: membership.id } });
  return membership;
}

export async function countCompanyOwners(companyId: string) {
  return prisma.membership.count({ where: { companyId, role: "owner" } });
}
