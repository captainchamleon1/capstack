import { prisma } from "@/lib/prisma";
import { OPTION_DOC_SPECS } from "./constants";

const OPTION_GRANT_TYPES = new Set(["iso", "nso", "rsu", "rsa", "warrant"]);
const STOCK_GRANT_TYPES = new Set(["common_stock", "preferred_stock"]);

interface IssueOptions {
  status?: "draft" | "sent" | "signed";
  signedAt?: Date | null;
}

export async function issueSecurityDocuments(grantId: string, options: IssueOptions = {}) {
  const grant = await prisma.equityGrant.findUnique({
    where: { id: grantId },
    include: { stakeholder: true, shareClass: true },
  });

  if (!grant) return [];

  const status = options.status ?? "draft";
  const signedAt = status === "signed" ? (options.signedAt ?? grant.grantDate) : null;

  if (OPTION_GRANT_TYPES.has(grant.type)) {
    return prisma.$transaction(
      OPTION_DOC_SPECS.map((spec) =>
        prisma.document.create({
          data: {
            companyId: grant.companyId,
            equityGrantId: grant.id,
            name: `${grant.stakeholder.name} - ${spec.label}`,
            type: spec.type,
            status,
            signedAt,
          },
        })
      )
    );
  }

  if (STOCK_GRANT_TYPES.has(grant.type)) {
    const label =
      grant.type === "preferred_stock"
        ? `${grant.shareClass.name} Stock Certificate`
        : "Stock Certificate";

    return [
      await prisma.document.create({
        data: {
          companyId: grant.companyId,
          equityGrantId: grant.id,
          name: `${grant.stakeholder.name} - ${label}`,
          type: "certificate",
          status,
          signedAt,
        },
      }),
    ];
  }

  return [];
}
