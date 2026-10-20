"use client";

import { useState } from "react";
import { Columns2, Columns3, Grid2X2, Plus, Square } from "lucide-react";

import { AddAgentDialog } from "@/components/add-agent-dialog";
import { AgentAvatar } from "@/components/agent-avatar";
import { AgentPane } from "@/components/workspace/agent-pane";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAgentDirectory, useModels } from "@/hooks/use-fleet";
import { cn } from "@/lib/utils";
import { useFleetStore, type Layout } from "@/stores/fleet-store";

const LAYOUTS: ReadonlyArray<{ value: Layout; label: string; icon: typeof Square }> = [
  { value: 1, label: "Single pane", icon: Square },
  { value: 2, label: "Two panes", icon: Columns2 },
  { value: 3, label: "Three panes", icon: Columns3 },
  { value: 4, label: "Four panes", icon: Grid2X2 },
];

function PaneSwitcher() {
  const layout = useFleetStore((state) => state.layout);
  const activePane = useFleetStore((state) => state.activePane);
  const panes = useFleetStore((state) => state.panes);
  const setActivePane = useFleetStore((state) => state.setActivePane);

  if (layout === 1) return null;

  return (
    <div className="flex gap-1.5 overflow-x-auto border-b px-2 py-2 no-scrollbar lg:hidden">
      {Array.from({ length: layout }, (_, index) => {
        const pane = panes[index];
        return (
          <button
            key={index}
            type="button"
            onClick={() => setActivePane(index)}
            className={cn(
              "flex min-w-0 flex-1 items-center gap-2 rounded-md border px-2 py-1.5 text-left text-xs transition-colors",
              activePane === index
                ? "border-primary/30 bg-primary/5 text-foreground"
                : "bg-card text-muted-foreground",
            )}
          >
            <span className="font-mono text-[10px] text-muted-foreground">{index + 1}</span>
            {pane ? (
              <>
                <AgentAvatar name={pane} size="sm" />
                <span className="truncate font-medium">{pane}</span>
              </>
            ) : (
              <span className="truncate">Empty</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function EmptyFleet() {
  const [addOpen, setAddOpen] = useState(false);
  return (
    <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-6">
      <div className="pointer-events-none absolute inset-0 fleet-grid-bg opacity-50" aria-hidden />
      <div className="relative z-10 w-full max-w-md rounded-xl border bg-card/95 p-8 text-center shadow-2xl">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/5">
          <span className="grid grid-cols-2 gap-1">
            {Array.from({ length: 4 }, (_, index) => (
              <span key={index} className="h-1.5 w-1.5 rounded-full bg-primary/70" />
            ))}
          </span>
        </div>
        <h2 className="text-lg font-semibold tracking-tight">Start your fleet</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Add any Durable Object name you want to address. Each name is a persistent Pi agent with its own
          transcript, model pin, and idempotent runs.
        </p>
        <Button className="mt-6" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> Add your first agent
        </Button>
        <p className="mt-4 font-mono text-[11px] text-muted-foreground">
          POST /agent/&lt;name&gt;/prompt → celld
        </p>
      </div>
      <AddAgentDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}

export function Workspace() {
  const directory = useAgentDirectory();
  const layout = useFleetStore((state) => state.layout);
  const setLayout = useFleetStore((state) => state.setLayout);
  const activePane = useFleetStore((state) => state.activePane);
  const panes = useFleetStore((state) => state.panes);
  const models = useModels();
  const [addOpen, setAddOpen] = useState(false);

  const gridClass =
    layout === 2
      ? "lg:grid-cols-2 lg:grid-rows-1"
      : layout === 3
        ? "lg:grid-cols-3 lg:grid-rows-1"
        : layout === 4
          ? "lg:grid-cols-2 lg:grid-rows-2"
          : "lg:grid-cols-1 lg:grid-rows-1";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b bg-background/70 px-3 py-2 md:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {directory.rows.length} agent{directory.rows.length === 1 ? "" : "s"}
          </span>
          <span className="h-3 w-px bg-border" />
          <span className="text-xs text-muted-foreground">
            {layout} pane{layout === 1 ? "" : "s"}
          </span>
          {models.data?.default ? (
            <>
              <span className="hidden h-3 w-px bg-border sm:block" />
              <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
                default
                <code className="max-w-[180px] truncate rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-foreground">
                  {models.data.default.provider}/{models.data.default.id}
                </code>
              </span>
            </>
          ) : null}
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 px-2 text-xs"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" /> Agent
          </Button>
          <div className="flex items-center rounded-md border bg-card p-0.5">
            {LAYOUTS.map((item) => {
              const Icon = item.icon;
              return (
                <Tooltip key={item.value}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={layout === item.value ? "secondary" : "ghost"}
                      size="icon-sm"
                      className={cn(
                        "h-6 w-7 rounded-sm",
                        layout === item.value && "bg-primary/10 text-primary hover:bg-primary/15",
                      )}
                      onClick={() => setLayout(item.value)}
                      aria-label={item.label}
                      aria-pressed={layout === item.value}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{item.label}</TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
      </div>

      {directory.rows.length === 0 ? (
        <EmptyFleet />
      ) : (
        <>
          <PaneSwitcher />
          <div className={cn("grid min-h-0 flex-1 gap-2 p-2", gridClass)}>
            {[0, 1, 2, 3].map((index) => {
              const withinLayout = index < layout;
              return (
                <div
                  key={index}
                  className={cn(
                    "min-h-0 min-w-0",
                    withinLayout
                      ? index === activePane
                        ? "flex"
                        : "hidden lg:flex"
                      : "hidden",
                  )}
                >
                  <AgentPane
                    index={index}
                    agentName={panes[index] ?? null}
                    isActive={index === activePane}
                  />
                </div>
              );
            })}
          </div>
        </>
      )}

      <AddAgentDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
