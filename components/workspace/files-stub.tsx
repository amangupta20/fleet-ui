"use client";

import { File, FileCode2, FileJson, Folder, FolderOpen, GitCompareArrows, Lock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export function FilesStub({ agent }: { agent: string }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b bg-muted/15 px-3 py-2 text-[11px]">
        <GitCompareArrows className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="font-medium">files & diffs</span>
        <Badge variant="warning" className="text-[9px]">
          stub
        </Badge>
        <span className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground">
          <Lock className="h-3 w-3" /> read-only placeholder
        </span>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-[132px_1fr]">
        <aside className="min-h-0 border-r bg-muted/10 p-2">
          <p className="meta-label px-1 pb-1.5">workspace</p>
          <ul className="space-y-0.5 font-mono text-[10px] text-muted-foreground">
            <li className="flex items-center gap-1.5 rounded px-1 py-1 text-foreground">
              <FolderOpen className="h-3 w-3 text-amber-500" /> {agent}
            </li>
            <li className="flex items-center gap-1.5 rounded py-1 pl-4 pr-1">
              <Folder className="h-3 w-3 text-amber-500" /> src
            </li>
            <li className="flex items-center gap-1.5 rounded py-1 pl-7 pr-1">
              <FileCode2 className="h-3 w-3 text-sky-500" /> agent.ts
            </li>
            <li className="flex items-center gap-1.5 rounded py-1 pl-7 pr-1">
              <FileCode2 className="h-3 w-3 text-sky-500" /> tools.ts
            </li>
            <li className="flex items-center gap-1.5 rounded py-1 pl-4 pr-1">
              <FileJson className="h-3 w-3 text-amber-500" /> wrangler.jsonc
            </li>
            <li className="flex items-center gap-1.5 rounded py-1 pl-4 pr-1">
              <File className="h-3 w-3 text-muted-foreground" /> README.md
            </li>
          </ul>
        </aside>
        <div className="min-h-0 overflow-y-auto p-3">
          <div className="rounded-lg border bg-card/60 p-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px]">src/agent.ts</span>
              <Badge variant="muted" className="text-[9px]">+12 −4</Badge>
            </div>
            <div className="mt-3 space-y-1.5 font-mono text-[10px]">
              <p className="text-emerald-600 dark:text-emerald-400">+ const answer = await agent.prompt(input, {"{"} operationId {"}"});</p>
              <p className="text-emerald-600 dark:text-emerald-400">+ await persistCheckpoint(agent, answer);</p>
              <p className="text-rose-600 dark:text-rose-400">- // TODO: stream tokens</p>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-3/5" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <p className="mt-4 text-[10px] leading-relaxed text-muted-foreground">
            File browsing is not implemented in v1. This surface is a local mock behind the{" "}
            <code className="font-mono text-foreground">files</code> flag — no Worker endpoint is called.
          </p>
        </div>
      </div>
    </div>
  );
}
