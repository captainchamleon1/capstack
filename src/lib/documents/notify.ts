import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import {
  notifyCompanyAdminsDocumentSigned,
  sendDocumentSentEmail,
} from "@/lib/email";

export async function handleDocumentStatusChange(params: {
  documentId: string;
  companyId: string;
  companyName: string;
  userId: string;
  userName: string;
  newStatus: "sent" | "signed";
}) {
  const document = await prisma.document.findUnique({
    where: { id: params.documentId },
    include: {
      equityGrant: {
        include: { stakeholder: true },
      },
    },
  });

  if (!document) return;

  const stakeholderName = document.equityGrant?.stakeholder.name;
  const stakeholderEmail = document.equityGrant?.stakeholder.email;

  if (params.newStatus === "sent") {
    await logAudit({
      companyId: params.companyId,
      userId: params.userId,
      action: "document.sent",
      entityType: "document",
      entityId: document.id,
      summary: `Marked "${document.name}" as sent`,
      metadata: { documentType: document.type, stakeholderName },
    });

    if (stakeholderEmail) {
      await sendDocumentSentEmail({
        to: stakeholderEmail,
        companyName: params.companyName,
        documentName: document.name,
        recipientName: stakeholderName ?? "Stakeholder",
      });
    }
    return;
  }

  if (params.newStatus === "signed") {
    await logAudit({
      companyId: params.companyId,
      userId: params.userId,
      action: "document.signed",
      entityType: "document",
      entityId: document.id,
      summary: `Marked "${document.name}" as signed`,
      metadata: { documentType: document.type, stakeholderName },
    });

    await notifyCompanyAdminsDocumentSigned({
      companyId: params.companyId,
      companyName: params.companyName,
      documentName: document.name,
      signedByName: params.userName,
      stakeholderName,
      excludeUserId: params.userId,
    });
  }
}
