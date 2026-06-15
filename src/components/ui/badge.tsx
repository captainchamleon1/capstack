import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-brand/12 text-brand border border-brand/20",
        secondary: "bg-surface-overlay text-muted-foreground border border-border-default",
        destructive: "bg-danger/12 text-danger border border-danger/25",
        outline: "border border-border-default text-muted-foreground",
        warning: "bg-warning/12 text-warning border border-warning/25",
        info: "bg-accent-data/12 text-accent-data border border-accent-data/25",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
