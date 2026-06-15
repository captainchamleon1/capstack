import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen app-canvas flex items-center justify-center p-6">
      <div className="text-center max-w-md space-y-6">
        <div className="flex justify-center">
          <Logo size="md" />
        </div>
        <div>
          <p className="text-sm font-medium text-brand uppercase tracking-widest">404</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-foreground">Page not found</h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            This page doesn&apos;t exist or you may not have access to it.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
