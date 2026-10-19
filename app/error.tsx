"use client";

import { useEffect } from "react";
import { RotateCcw, TriangleAlert } from "lucide-react";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Fleet UI error boundary:", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border bg-card p-6 text-center shadow-xl">
        <Logo className="mx-auto mb-4 h-12 w-12 rounded-xl" />
        <TriangleAlert className="mx-auto h-5 w-5 text-destructive" />
        <h1 className="mt-2 text-lg font-semibold">The console hit an error</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Your fleet itself is unaffected. Retry the view; if it persists, check the browser console and the Fleet UI
          server logs.
        </p>
        {error.digest ? <p className="mt-2 font-mono text-[10px] text-muted-foreground">digest {error.digest}</p> : null}
        <Button className="mt-5" onClick={reset}>
          <RotateCcw className="h-4 w-4" /> Try again
        </Button>
      </div>
    </div>
  );
}
