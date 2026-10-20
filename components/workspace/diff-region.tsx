"use client";

import { FileDiff } from "lucide-react";

import type { TimelineDiff } from "@/lib/timeline";
import { cn } from "@/lib/utils";

/**
 * Diff region.
 *
 * Renders a real before/after pair when the backend ships one. Until then it
 * renders the empty state: the region, the file path when the backend knows
 * it, and the reason the panels are empty. No invented diff content.
 */
export function DiffRegion({
  path,
  diff,
  className,
}: {
  path: string | null;
  diff: TimelineDiff | null;
  className?: string;
}) {
  return (
    <div className={cn("rounded border border-dashed border-border bg-muted/20 p-2", className)}>
      <div className="flex items-center gap-1.5">
        <FileDiff className="size-3.5 text-muted-foreground" />
        <span className="font-mono text-sm text-foreground">
          {path ?? "file path unknown"}
        </span>
        {!diff ? (
          <span className="ml-auto font-mono text-sm text-muted-foreground">
            no diff data
          </span>
        ) : null}
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <div className="rounded border bg-background/40 p-2">
          <div className="font-mono text-sm uppercase tracking-[0.1em] text-muted-foreground">
            before
          </div>
          <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-words font-mono text-sm leading-[1.5] text-foreground/80">
            {diff ? diff.before : "—"}
          </pre>
        </div>
        <div className="rounded border bg-background/40 p-2">
          <div className="font-mono text-sm uppercase tracking-[0.1em] text-muted-foreground">
            after
          </div>
          <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-words font-mono text-sm leading-[1.5] text-foreground/80">
            {diff ? diff.after : "—"}
          </pre>
        </div>
      </div>

      {!diff ? (
        <p className="mt-2 text-sm leading-[1.5] text-muted-foreground">
          The Worker does not return file contents or patches, so this region stays empty until a
          backend checkpoint ships them.
        </p>
      ) : null}
    </div>
  );
}
