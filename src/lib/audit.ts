import { prisma } from "@/lib/prisma";

export type AuditAction =
  | "grant.created"
  | "grant.cancelled"
  | "grant.exercised"
  | "stakeholder.created"
  | "stakeholder.updated"
  | "stakeholder.deleted"
  | "safe.created"
  | "safe.updated"
  | "safe.cancelled"
  | "note.created"
  | "note.updated"
  | "note.cancelled"
  | "board_resolution.created"
  | "board_resolution.updated"
  | "company.updated"
  | "round.closed"
  | "valuation.created"
  | "valuation.updated"
  | "valuation.reviewed"
  | "valuation.adopted"
  | "valuation.deleted"
  | "document.sent"
  | "document.signed"
  | "invite.sent"
  | "invite.accepted"
  | "invite.revoked"
  | "member.joined"
  | "member.role_changed"
  | "member.removed";

export interface LogAuditInput {
  companyId: string;
  userId?: string | null;
  action: AuditAction | string;
  entityType?: string;
  entityId?: string;
  summary: string;
  metadata?: Record<string, unknown>;
}

export async function logAudit(input: LogAuditInput) {
  try {
    await prisma.auditEvent.create({
      data: {
        companyId: input.companyId,
        userId: input.userId ?? null,
        action: input.action,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        summary: input.summary,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      },
    });
  } catch (error) {
    console.error("[audit] Failed to log event:", error);
  }
}

export async function listAuditEvents(companyId: string, limit = 50) {
  return prisma.auditEvent.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
}

export function formatAuditAction(action: string): string {
  return action.replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
