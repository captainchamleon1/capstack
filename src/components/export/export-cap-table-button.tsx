"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function ExportCapTableButton() {
  async function download() {
    const res = await fetch("/api/export/cap-table");
    if (!res.ok) return;
    const blob = await res.blob();
    const disposition = res.headers.get("Content-Disposition");
    const match = disposition?.match(/filename="(.+)"/);
    const filename = match?.[1] || "cap_table.csv";
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="outline" size="sm" onClick={download}>
      <Download className="h-4 w-4" />
      Export CSV
    </Button>
  );
}
