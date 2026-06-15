import { NextRequest, NextResponse } from "next/server";
import { getGrantDocumentData } from "@/lib/db";
import { generateOptionDocument, documentFilename } from "@/lib/documents/generate";
import { VARIANT_TO_DOC_TYPE } from "@/lib/documents/constants";
import { generateOptionDocumentPdf, pdfFilename } from "@/lib/documents/pdf/generate";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { verifyGrantAccess } from "@/lib/api-auth";
import type { OptionDocumentType } from "@/lib/documents/types";

const VALID_TYPES: OptionDocumentType[] = ["agreement", "notice", "board_consent"];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ grantId: string }> }
) {
  const { grantId } = await params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const grant = await verifyGrantAccess(grantId, session.userId);
  if (!grant) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const type = request.nextUrl.searchParams.get("type") as OptionDocumentType | null;
  const format = request.nextUrl.searchParams.get("format") || "docx";
  const inline = request.nextUrl.searchParams.get("inline") === "1";

  if (!type || !VALID_TYPES.includes(type)) {
    return NextResponse.json(
      { error: "Invalid document type. Use: agreement, notice, or board_consent" },
      { status: 400 }
    );
  }

  const issued = await prisma.document.findFirst({
    where: {
      equityGrantId: grantId,
      type: VARIANT_TO_DOC_TYPE[type],
    },
  });

  if (!issued) {
    return NextResponse.json(
      { error: "Document was not issued with this grant" },
      { status: 404 }
    );
  }

  const data = await getGrantDocumentData(grantId);
  if (!data) {
    return NextResponse.json({ error: "Grant not found" }, { status: 404 });
  }

  const disposition = inline ? "inline" : "attachment";

  if (format === "pdf") {
    const buffer = await generateOptionDocumentPdf(data, type);
    const filename = pdfFilename(data, type);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${disposition}; filename="${filename}"`,
      },
    });
  }

  const buffer = await generateOptionDocument(data, type);
  const filename = documentFilename(data, type);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `${disposition}; filename="${filename}"`,
    },
  });
}
