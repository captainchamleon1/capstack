"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/ui/select-field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface StakeholderData {
  id: string;
  name: string;
  email: string | null;
  type: string;
  relationship: string | null;
  title: string | null;
  department: string | null;
  startDate: Date | string | null;
}

interface EditStakeholderDialogProps {
  stakeholder: StakeholderData;
}

function toDateInput(value: Date | string | null) {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toISOString().split("T")[0];
}

export function EditStakeholderDialog({ stakeholder }: EditStakeholderDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch(`/api/stakeholders/${stakeholder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email") || "",
          type: form.get("type"),
          relationship: form.get("relationship") || undefined,
          title: form.get("title") || undefined,
          department: form.get("department") || undefined,
          startDate: form.get("startDate") || null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update stakeholder");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="h-4 w-4" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Stakeholder</DialogTitle>
          <DialogDescription>Update profile details for {stakeholder.name}.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Name</Label>
            <Input id="edit-name" name="name" required defaultValue={stakeholder.name} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <SelectField label="Type" name="type" required defaultValue={stakeholder.type}>
              <option value="founder">Founder</option>
              <option value="employee">Employee</option>
              <option value="investor">Investor</option>
              <option value="advisor">Advisor</option>
              <option value="board">Board</option>
            </SelectField>
            <SelectField
              label="Relationship"
              name="relationship"
              defaultValue={stakeholder.relationship ?? stakeholder.type}
            >
              <option value="employee">Employee</option>
              <option value="contractor">Contractor</option>
              <option value="investor">Investor</option>
            </SelectField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-title">Title</Label>
              <Input id="edit-title" name="title" defaultValue={stakeholder.title ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-department">Department</Label>
              <Input
                id="edit-department"
                name="department"
                defaultValue={stakeholder.department ?? ""}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                name="email"
                type="email"
                defaultValue={stakeholder.email ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-startDate">Start date</Label>
              <Input
                id="edit-startDate"
                name="startDate"
                type="date"
                defaultValue={toDateInput(stakeholder.startDate)}
              />
            </div>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
