"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditStakeholderDialog } from "./edit-stakeholder-dialog";

interface StakeholderActionsProps {
  stakeholder: {
    id: string;
    name: string;
    email: string | null;
    type: string;
    relationship: string | null;
    title: string | null;
    department: string | null;
    startDate: Date | string | null;
  };
  canDelete: boolean;
  canWrite?: boolean;
}

export function StakeholderActions({
  stakeholder,
  canDelete,
  canWrite = false,
}: StakeholderActionsProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  if (!canWrite) return null;

  async function handleDelete() {
    if (
      !confirm(
        `Delete ${stakeholder.name}? This cannot be undone. Stakeholders with grants or investments cannot be deleted.`
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/stakeholders/${stakeholder.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      router.push("/stakeholders");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete stakeholder");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <EditStakeholderDialog stakeholder={stakeholder} />
      {canDelete && (
        <Button variant="outline" size="sm" onClick={handleDelete} disabled={deleting}>
          {deleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Trash2 className="h-4 w-4" />
              Delete
            </>
          )}
        </Button>
      )}
    </div>
  );
}
