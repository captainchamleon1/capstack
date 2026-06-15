import { cn } from "@/lib/utils";

export function PageBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("p-8 space-y-8", className)}>{children}</div>;
}
