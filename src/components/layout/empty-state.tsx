import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <Card className={cn("panel-card", className)}>
      <CardContent className="py-16 px-8 text-center">
        {Icon && (
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 border border-brand/20">
            <Icon className="h-5 w-5 text-brand" />
          </div>
        )}
        <p className="font-display text-lg font-semibold text-foreground">{title}</p>
        {description && (
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
            {description}
          </p>
        )}
        {action && <div className="mt-6">{action}</div>}
      </CardContent>
    </Card>
  );
}
