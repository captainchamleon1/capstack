import { NextResponse } from "next/server";
import { getSession, type SessionPayload } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canWriteCapTable } from "@/lib/permissions";
import { isAnalystUser } from "@/lib/analyst";
import type { Company } from "@/generated/prisma/client";

type AuthFail = { success: false; error: NextResponse };
type AuthOk = { success: true; session: SessionPayload };
type CompanyOk = AuthOk & { company: Company; role: string };

export async function requireApiAuth(): Promise<AuthFail | AuthOk> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { success: true, session };
}

export async function requireApiCompany(companyId?: string): Promise<AuthFail | CompanyOk> {
  const auth = await requireApiAuth();
  if (!auth.success) return auth;

  const membership = companyId
    ? await prisma.membership.findFirst({
        where: { userId: auth.session.userId, companyId },
        include: { company: true },
      })
    : await prisma.membership.findFirst({
        where: { userId: auth.session.userId },
        include: { company: true },
        orderBy: { createdAt: "asc" },
      });

  if (!membership) {
    return { success: false, error: NextResponse.json({ error: "No company found" }, { status: 403 }) };
  }

  return {
    success: true,
    session: auth.session,
    company: membership.company,
    role: membership.role,
  };
}

export async function requireApiWriteAccess(companyId?: string): Promise<AuthFail | CompanyOk> {
  const auth = await requireApiCompany(companyId);
  if (!auth.success) return auth;

  if (!canWriteCapTable(auth.role)) {
    return {
      success: false,
      error: NextResponse.json(
        { error: "You have read-only access. Contact an admin to make changes." },
        { status: 403 }
      ),
    };
  }

  return auth;
}

type AnalystOk = AuthOk & { isAnalyst: true };

export async function requireApiAnalyst(): Promise<AuthFail | AnalystOk> {
  const auth = await requireApiAuth();
  if (!auth.success) return auth;

  if (!(await isAnalystUser(auth.session.userId))) {
    return {
      success: false,
      error: NextResponse.json({ error: "Analyst access required" }, { status: 403 }),
    };
  }

  return { success: true, session: auth.session, isAnalyst: true };
}

export async function verifyGrantAccess(grantId: string, userId: string) {
  const grant = await prisma.equityGrant.findUnique({
    where: { id: grantId },
    include: { company: true },
  });
  if (!grant) return null;

  const membership = await prisma.membership.findFirst({
    where: { userId, companyId: grant.companyId },
  });
  if (!membership) return null;

  return grant;
}
