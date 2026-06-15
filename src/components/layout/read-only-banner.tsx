import { Eye } from "lucide-react";

export function ReadOnlyBanner() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-brand/15 bg-brand/5 px-4 py-3 text-sm backdrop-blur-sm">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 border border-brand/20">
        <Eye className="h-4 w-4 text-brand" />
      </div>
      <p className="text-muted-foreground">
        You have <span className="text-foreground font-medium">viewer</span> access — you can
        browse and export, but cannot make changes.
      </p>
    </div>
  );
}
