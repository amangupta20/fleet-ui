"use client";

import { Badge } from "@/components/ui/badge";
import type { AgentLifecycle } from "@/lib/lifecycle";
import { cn } from "@/lib/utils";

/**
 * Lifecycle chip.
 *
 * The state comes from `deriveAgentLifecycle` (lib/lifecycle.ts), which is the
 * only place that knows how the coarse backend facts map onto these five
 * states. The chip only renders the label.
 */

const CHIP: Record<
  AgentLifecycle,
  { variant: "muted" | "outline" | "brand" | "destructive"; dot: string }
> = {
  initializing: { variant: "muted", dot: "bg-muted-foreground" },
  idle: { variant: "outline", dot: "bg-muted-foreground/60" },
  running: { variant: "brand", dot: "bg-brand" },
  error: { variant: "destructive", dot: "bg-destructive" },
  closed: { variant: "muted", dot: "bg-muted-foreground/40" },
};

export function LifecycleChip({
  lifecycle,
  className,
}: {
  lifecycle: AgentLifecycle;
  className?: string;
}) {
  return (
    <Badge
      variant={CHIP[lifecycle].variant}
      className={cn("gap-1.5 uppercase tracking-[0.08em]", className)}
      title={`lifecycle: ${lifecycle}`}
    >
      <span
        className={cn(
          "size-1.5 rounded-sm",
          CHIP[lifecycle].dot,
          lifecycle === "running" && "animate-pulse-soft",
        )}
        aria-hidden
      />
      {lifecycle}
    </Badge>
  );
}
