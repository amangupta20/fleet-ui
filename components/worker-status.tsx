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
            "inline-flex items-center gap-1.5 rounded border px-2 py-1 font-mono text-sm font-medium",
            online
              ? "border-success/30 bg-success/10 text-success"
              : checking
                ? "border-border bg-muted text-muted-foreground"
                : "border-destructive/30 bg-destructive/10 text-destructive",
          )}
        >
          {checking ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : online ? (
            <CheckCircle2 className="size-3.5" />
          ) : (
            <AlertCircle className="size-3.5" />
          )}
          <span className={compact ? "hidden sm:inline" : ""}>
            {checking ? "Checking worker" : online ? "Worker online" : "Worker offline"}
          </span>
          {online ? <span className="hidden font-mono text-sm opacity-70 md:inline">/health ok</span> : null}
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
