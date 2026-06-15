import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireApiWriteAccess } from "@/lib/api-auth";
import { handleDocumentStatusChange } from "@/lib/documents/notify";

const schema = z.object({
  status: z.enum(["draft", "sent", "signed"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiWriteAccess();
  if (!auth.success) return auth.error;

  const { id } = await params;

  try {
    const body = schema.parse(await request.json());

    const document = await prisma.document.findFirst({
      where: { id, companyId: auth.company.id },
    });
    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (document.status === "signed" && body.status !== "signed") {
      return NextResponse.json({ error: "Signed documents cannot be reverted" }, { status: 400 });
    }

    if (body.status === document.status) {
      return NextResponse.json(document);
    }

    const updated = await prisma.document.update({
      where: { id },
      data: {
        status: body.status,
        signedAt: body.status === "signed" ? new Date() : null,
      },
    });

    if (body.status === "sent" || body.status === "signed") {
      await handleDocumentStatusChange({
        documentId: id,
        companyId: auth.company.id,
        companyName: auth.company.name,
        userId: auth.session.userId,
        userName: auth.session.name,
        newStatus: body.status,
      });
    }

    revalidatePath("/documents");
    revalidatePath("/activity");
    if (updated.equityGrantId) {
      revalidatePath(`/grants/${updated.equityGrantId}`);
    }

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    console.error("Update document failed:", error);
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 });
  }
}
