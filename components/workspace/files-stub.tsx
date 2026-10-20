"use client";

import { GitCompareArrows, Lock } from "lucide-react";

import { DiffRegion } from "@/components/workspace/diff-region";
import { Badge } from "@/components/ui/badge";

/**
 * Files & diffs stub.
 *
 * The previous version of this surface drew a sample file tree and a sample
 * diff. Both were invented content that looked like real data, so they are
 * gone: the surface now shows the diff placeholder with its empty state and
 * says what is missing.
 */
export function FilesStub({ agent }: { agent: string }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b bg-muted/15 px-3 py-2 font-mono text-sm">
        <GitCompareArrows className="size-3.5 text-muted-foreground" />
        <span className="font-medium text-foreground">files & diffs</span>
        <Badge variant="warning" className="text-sm">
          stub
        </Badge>
        <span className="ml-auto flex items-center gap-1 text-sm text-muted-foreground">
          <Lock className="size-3" /> read-only placeholder · {agent}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <div className="mx-auto w-full max-w-3xl">
          <DiffRegion path={null} diff={null} />
          <p className="mt-3 text-sm leading-[1.5] text-muted-foreground">
            No file transport exists yet. fleet-base exposes no filesystem endpoint, so this console
            cannot list a workspace, read a file, or show a real patch. Nothing on this surface is
            sample data — it is empty on purpose.
          </p>
        </div>
      </div>
    </div>
  );
}
