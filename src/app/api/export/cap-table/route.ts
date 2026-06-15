import { NextResponse } from "next/server";
import { requireApiCompany } from "@/lib/api-auth";
import { getCompanyWithCapTable } from "@/lib/db";

function escapeCsv(value: string | number): string {
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET() {
  const auth = await requireApiCompany();
  if (!auth.success) return auth.error;

  const data = await getCompanyWithCapTable(auth.company.id);
  if (!data) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const { capTable } = data;
  const headers = [
    "Stakeholder",
    "Type",
    "Security",
    "Share Class",
    "Granted",
    "Vested",
    "Outstanding",
    "Strike",
    "FD %",
  ];

  const rows = capTable.entries.map((e) =>
    [
      e.stakeholderName,
      e.stakeholderType,
      e.securityType,
      e.shareClassName,
      e.sharesGranted,
      e.sharesVested,
      e.sharesOutstanding,
      e.strikePrice ?? "",
      (e.ownershipPercent * 100).toFixed(4),
    ].map(escapeCsv).join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");
  const filename = `${auth.company.name.replace(/[^a-zA-Z0-9]/g, "_")}_cap_table.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
