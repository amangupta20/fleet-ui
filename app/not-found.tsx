import Link from "next/link";
import { Compass } from "lucide-react";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute inset-0 fleet-grid-bg opacity-50" aria-hidden />
      <div className="relative z-10 flex max-w-sm flex-col items-center text-center">
        <Logo className="mb-5 size-12 rounded" />
        <p className="font-mono text-sm uppercase tracking-[0.2em] text-muted-foreground">404 · no cell here</p>
        <h1 className="mt-2 text-base font-bold leading-[1.5]">This route drifted out of the fleet</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          The page you asked for does not exist. Agent names are addressed from the workspace rail, not from URLs.
        </p>
        <Button asChild className="mt-6">
          <Link href="/">
            <Compass className="size-4" /> Back to workspace
          </Link>
        </Button>
      </div>
    </div>
  );
}
