"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen app-canvas flex items-center justify-center p-6">
      <div className="text-center max-w-md space-y-6">
        <div className="flex justify-center">
          <Logo size="md" />
        </div>
        <div>
          <p className="text-sm font-medium text-danger uppercase tracking-widest">Error</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-foreground">
            Something went wrong
          </h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            An unexpected error occurred. You can try again or return to the dashboard.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset}>Try again</Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
