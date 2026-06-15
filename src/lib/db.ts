import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { buildCapTable } from "./cap-table";
import { getSession } from "./auth";
import type { GrantDocumentData } from "./documents/types";

async function getUserMembership(userId: string, companyId?: string) {
  return prisma.membership.findFirst({
    where: companyId ? { userId, companyId } : { userId },
    include: { company: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function getSessionCompany() {
  const session = await getSession();
  if (!session) return null;
  const membership = await getUserMembership(session.userId);
  return membership?.company ?? null;
}

export async function requireSessionCompany() {
  const company = await getSessionCompany();
  if (!company) redirect("/onboarding");
  return company;
}

export async function getSessionMembership() {
  const session = await getSession();
  if (!session) return null;
  const membership = await getUserMembership(session.userId);
  if (!membership) return null;
  return { session, company: membership.company, role: membership.role };
}

export async function requireSessionMembership() {
  const data = await getSessionMembership();
  if (!data) redirect("/onboarding");
  return data;
}

export async function userHasCompany() {
  const session = await getSession();
  if (!session) return false;
  const count = await prisma.membership.count({ where: { userId: session.userId } });
  return count > 0;
}

/** @deprecated Use getSessionCompany() */
export async function getDefaultCompany() {
  return getSessionCompany();
}

export async function getCompanyWithCapTable(companyId: string) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      shareClasses: true,
      stakeholders: { orderBy: { name: "asc" } },
      equityGrants: {
        include: {
          stakeholder: true,
          shareClass: true,
          vestingSchedule: true,
        },
      },
      safes: { include: { stakeholder: true, shareClass: true } },
      convertibleNotes: { include: { stakeholder: true } },
      fundraiseRounds: { orderBy: { createdAt: "desc" } },
      boardResolutions: { orderBy: { createdAt: "desc" } },
      documents: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!company) return null;

  const capTable = buildCapTable({
    authorizedShares: company.authorizedShares,
    shareClasses: company.shareClasses,
    equityGrants: company.equityGrants,
    safes: company.safes,
  });

  return { company, capTable };
}

export async function getStakeholderWithDetails(stakeholderId: string, userId?: string) {
  const session = userId ? { userId } : await getSession();
  if (!session) return null;

  const stakeholder = await prisma.stakeholder.findUnique({
    where: { id: stakeholderId },
    include: {
      company: {
        include: {
          shareClasses: true,
          equityGrants: {
            include: {
              stakeholder: true,
              shareClass: true,
              vestingSchedule: true,
            },
          },
          safes: { include: { stakeholder: true, shareClass: true } },
        },
      },
      equityGrants: {
        include: {
          shareClass: true,
          vestingSchedule: true,
        },
        orderBy: { grantDate: "desc" },
      },
      safes: { orderBy: { issueDate: "desc" } },
      convertibleNotes: { orderBy: { issueDate: "desc" } },
    },
  });

  if (!stakeholder) return null;

  const membership = await getUserMembership(session.userId, stakeholder.companyId);
  if (!membership) return null;

  const capTable = buildCapTable({
    authorizedShares: stakeholder.company.authorizedShares,
    shareClasses: stakeholder.company.shareClasses,
    equityGrants: stakeholder.company.equityGrants,
    safes: stakeholder.company.safes,
  });

  const entries = capTable.entries.filter((e) => e.stakeholderId === stakeholderId);
  const ownershipPercent = entries.reduce((sum, e) => sum + e.ownershipPercent, 0);
  const totalShares = entries.reduce((sum, e) => sum + e.fullyDilutedShares, 0);
  const totalVested = entries.reduce((sum, e) => sum + e.sharesVested, 0);
  const totalOutstanding = entries.reduce((sum, e) => sum + e.sharesOutstanding, 0);

  const grantIds = stakeholder.equityGrants.map((g) => g.id);
  const documents = grantIds.length
    ? await prisma.document.findMany({
        where: { equityGrantId: { in: grantIds } },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return {
    stakeholder,
    entries,
    ownershipPercent,
    totalShares,
    totalVested,
    totalOutstanding,
    capTable,
    documents,
  };
}

export async function getGrantWithDetails(grantId: string) {
  const session = await getSession();
  if (!session) return null;

  const grant = await prisma.equityGrant.findUnique({
    where: { id: grantId },
    include: {
      company: true,
      stakeholder: true,
      shareClass: true,
      vestingSchedule: true,
    },
  });

  if (!grant) return null;

  const membership = await getUserMembership(session.userId, grant.companyId);
  if (!membership) return null;

  const documents = await prisma.document.findMany({
    where: { equityGrantId: grantId },
    orderBy: { createdAt: "asc" },
  });

  const companyData = await prisma.company.findUnique({
    where: { id: grant.companyId },
    include: {
      shareClasses: true,
      equityGrants: {
        include: {
          stakeholder: true,
          shareClass: true,
          vestingSchedule: true,
        },
      },
      safes: { include: { stakeholder: true, shareClass: true } },
    },
  });

  if (!companyData) return null;

  const capTable = buildCapTable({
    authorizedShares: companyData.authorizedShares,
    shareClasses: companyData.shareClasses,
    equityGrants: companyData.equityGrants,
    safes: companyData.safes,
  });

  const entry = capTable.entries.find((e) => e.grantId === grantId) ?? null;

  return { grant: { ...grant, documents }, entry };
}

export async function getGrantDocumentData(grantId: string): Promise<GrantDocumentData | null> {
  const grant = await prisma.equityGrant.findUnique({
    where: { id: grantId },
    include: {
      company: true,
      stakeholder: true,
      shareClass: true,
      vestingSchedule: true,
    },
  });

  if (!grant) return null;

  const optionTypes = ["iso", "nso", "rsu", "rsa", "warrant"];
  if (!optionTypes.includes(grant.type)) return null;

  return {
    company: {
      name: grant.company.name,
      legalName: grant.company.legalName || grant.company.name,
      state: grant.company.state || "Delaware",
      incorporationDate: grant.company.incorporationDate,
    },
    grant: {
      id: grant.id,
      type: grant.type,
      sharesGranted: grant.sharesGranted,
      strikePrice: grant.strikePrice,
      grantDate: grant.grantDate,
      boardApprovalDate: grant.boardApprovalDate,
      expirationDate: grant.expirationDate,
      shareClassName: grant.shareClass.name,
    },
    stakeholder: {
      name: grant.stakeholder.name,
      email: grant.stakeholder.email,
      title: grant.stakeholder.title,
      type: grant.stakeholder.type,
    },
    vesting: grant.vestingSchedule
      ? {
          cliffMonths: grant.vestingSchedule.cliffMonths,
          vestingMonths: grant.vestingSchedule.vestingMonths,
          vestingFrequency: grant.vestingSchedule.vestingFrequency,
          startDate: grant.vestingSchedule.startDate,
          accelerationType: grant.vestingSchedule.accelerationType,
        }
      : null,
  };
}
