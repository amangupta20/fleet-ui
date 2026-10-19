"use client";

import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

import { useHealth } from "@/hooks/use-fleet";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function WorkerStatus({ compact = false }: { compact?: boolean }) {
  const health = useHealth();
  const online = health.isSuccess && health.data?.trim() === "ok";
  const checking = health.isPending;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-medium",
            online
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : checking
                ? "border-border bg-muted text-muted-foreground"
                : "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400",
          )}
        >
          {checking ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : online ? (
            <CheckCircle2 className="h-3 w-3" />
          ) : (
            <AlertCircle className="h-3 w-3" />
          )}
          <span className={compact ? "hidden sm:inline" : ""}>
            {checking ? "Checking worker" : online ? "Worker online" : "Worker offline"}
          </span>
          {online ? <span className="hidden font-mono text-[10px] opacity-70 md:inline">/health ok</span> : null}
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">
        {online ? (
          <span>celld answered <code className="font-mono">GET /health</code> through the same-origin proxy.</span>
        ) : checking ? (
          <span>Contacting the fleet Worker through <code className="font-mono">/api/health</code>…</span>
        ) : (
          <span>
            {health.error instanceof Error ? health.error.message : "Worker unreachable."} Verify FLEET_URL and run{" "}
            <code className="font-mono">celld dev</code>.
          </span>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
