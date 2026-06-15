import { NextResponse } from "next/server";
import { requireApiCompany } from "@/lib/api-auth";
import { getCompanyWithCapTable } from "@/lib/db";
import { listAuditEvents } from "@/lib/audit";
import { listCompanyInvites, listCompanyMembers } from "@/lib/invites";

export async function GET() {
  const auth = await requireApiCompany();
  if (!auth.success) return auth.error;

  const [data, members, invites, auditEvents] = await Promise.all([
    getCompanyWithCapTable(auth.company.id),
    listCompanyMembers(auth.company.id),
    listCompanyInvites(auth.company.id),
    listAuditEvents(auth.company.id, 500),
  ]);

  if (!data) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const { company, capTable } = data;

  const exportData = {
    exportedAt: new Date().toISOString(),
    company: {
      id: company.id,
      name: company.name,
      legalName: company.legalName,
      state: company.state,
      ein: company.ein,
      authorizedShares: company.authorizedShares,
      parValue: company.parValue,
      currentFmv409A: company.currentFmv409A,
      fmv409AEffectiveDate: company.fmv409AEffectiveDate,
      incorporationDate: company.incorporationDate,
    },
    memberships: members.map((m) => ({
      id: m.id,
      role: m.role,
      user: m.user,
      createdAt: m.createdAt,
    })),
    pendingInvites: invites,
    shareClasses: company.shareClasses,
    stakeholders: company.stakeholders,
    equityGrants: company.equityGrants,
    safes: company.safes,
    convertibleNotes: company.convertibleNotes,
    fundraiseRounds: company.fundraiseRounds,
    boardResolutions: company.boardResolutions,
    documents: company.documents,
    auditEvents,
    capTable: capTable.entries,
    summary: {
      totalFullyDiluted: capTable.totalFullyDiluted,
      totalOutstanding: capTable.totalOutstanding,
      optionPoolSize: capTable.optionPoolSize,
      optionPoolAvailable: capTable.optionPoolAvailable,
    },
  };

  const filename = `${company.name.replace(/[^a-zA-Z0-9]/g, "_")}_export.json`;

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
