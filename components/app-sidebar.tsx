"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Download,
  FlaskConical,
  Github,
  LayoutDashboard,
  MoreHorizontal,
  Plus,
  Search,
  Server,
  Settings2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { AddAgentDialog } from "@/components/add-agent-dialog";
import { AgentAvatar } from "@/components/agent-avatar";
import { Brand } from "@/components/logo";
import { LockButton } from "@/components/lock-button";
import { SettingsDialog } from "@/components/settings-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAgentStates, useModels } from "@/hooks/use-fleet";
import { cn, copyText, truncate } from "@/lib/utils";
import { useFleetStore } from "@/stores/fleet-store";

const NAV_ITEMS = [
  { href: "/", label: "Workspace", icon: LayoutDashboard },
  { href: "/providers", label: "Providers", icon: Server },
  { href: "/labs", label: "Labs", icon: FlaskConical },
] as const;

export function SidebarContent({
  authEnabled,
  onNavigate,
}: {
  authEnabled: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const agents = useFleetStore((state) => state.agents);
  const layout = useFleetStore((state) => state.layout);
  const panes = useFleetStore((state) => state.panes);
  const activePane = useFleetStore((state) => state.activePane);
  const removeAgent = useFleetStore((state) => state.removeAgent);
  const openAgentInActivePane = useFleetStore((state) => state.openAgentInActivePane);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);

  const stateQueries = useAgentStates(agents.map((agent) => agent.name));
  const models = useModels();

  const statusByName = useMemo(() => {
    const map = new Map<string, "online" | "offline" | "checking">();
    agents.forEach((agent, index) => {
      const query = stateQueries[index];
      if (!query || query.isPending) map.set(agent.name, "checking");
      else if (query.isSuccess) map.set(agent.name, "online");
      else map.set(agent.name, "offline");
    });
    return map;
  }, [agents, stateQueries]);

  const filteredAgents = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return agents;
    return agents.filter((agent) => agent.name.toLowerCase().includes(needle));
  }, [agents, search]);

  const paneIndexByName = useMemo(() => {
    const map = new Map<string, number>();
    panes.forEach((pane, index) => {
      if (pane && index < layout) map.set(pane, index);
    });
    return map;
  }, [panes, layout]);

  const openSettings = () => {
    setSettingsOpen(true);
  };

  const selectAgent = (name: string) => {
    openAgentInActivePane(name);
    if (pathname !== "/") router.push("/");
    onNavigate?.();
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-sidebar-border px-4 pr-11 lg:pr-4">
        <Brand onClick={() => { router.push("/"); onNavigate?.(); }} />
        <span className="rounded border border-sidebar-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          v0.1
        </span>
      </div>

      <nav className="shrink-0 space-y-0.5 p-2.5" aria-label="Console">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-foreground shadow-[inset_0_0_0_1px_hsl(var(--primary)/.16)]"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className={cn("h-4 w-4", active && "text-primary")} />
              {item.label}
              {item.href === "/labs" ? (
                <span className="ml-auto rounded-full border border-border px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
                  stubs
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mx-4 h-px bg-sidebar-border" />

      <div className="flex min-h-0 flex-1 flex-col pt-3">
        <div className="flex items-center justify-between px-4 pb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Agents</span>
            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
              {agents.length}
            </span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setAddOpen(true)}
                className="h-6 w-6"
                aria-label="Add agent"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add agent</TooltipContent>
          </Tooltip>
        </div>

        <div className="px-2.5 pb-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Filter agents…"
              className="h-8 border-sidebar-border bg-background/50 pl-8 text-xs"
              aria-label="Filter agents"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2.5 pb-2">
          {filteredAgents.length === 0 ? (
            <div className="rounded-lg border border-dashed border-sidebar-border p-3 text-center">
              <p className="text-xs text-muted-foreground">
                {agents.length === 0 ? "No agents yet." : "No matches."}
              </p>
              {agents.length === 0 ? (
                <Button variant="outline" size="sm" className="mt-2 h-7 text-xs" onClick={() => setAddOpen(true)}>
                  <Plus className="h-3 w-3" /> Add your first agent
                </Button>
              ) : null}
            </div>
          ) : (
            <ul className="space-y-0.5">
              {filteredAgents.map((agent) => {
                const status = statusByName.get(agent.name) ?? "checking";
                const paneIndex = paneIndexByName.get(agent.name);
                const selected = panes[activePane] === agent.name;
                const modelLabel =
                  agent.modelOverride ??
                  (models.data?.default ? `${models.data.default.provider}/${models.data.default.id}` : null);
                return (
                  <li key={agent.name} className="group/agent relative">
                    <div
                      className={cn(
                        "flex items-center gap-2 rounded-md border border-transparent px-1.5 py-1.5 transition-colors",
                        selected
                          ? "border-primary/15 bg-sidebar-accent"
                          : "hover:bg-sidebar-accent/55",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => selectAgent(agent.name)}
                        className="flex min-w-0 flex-1 items-center gap-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        title={agent.name}
                      >
                        <span className="relative">
                          <AgentAvatar name={agent.name} size="md" />
                          <span
                            className={cn(
                              "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-sidebar",
                              status === "online"
                                ? "bg-emerald-500"
                                : status === "offline"
                                  ? "bg-rose-500"
                                  : "bg-muted-foreground/50",
                            )}
                            aria-label={status === "online" ? "Reachable" : status === "offline" ? "Unreachable" : "Checking"}
                          />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5">
                            <span className="block truncate text-[13px] font-medium leading-tight">{agent.name}</span>
                            {paneIndex !== undefined ? (
                              <span className="rounded-sm bg-primary/10 px-1 font-mono text-[9px] leading-4 text-primary">
                                {paneIndex + 1}
                              </span>
                            ) : null}
                          </span>
                          <span className="block truncate font-mono text-[10px] leading-tight text-muted-foreground">
                            {modelLabel ? truncate(modelLabel.split("/")[1] ?? modelLabel, 22) : "no model yet"}
                          </span>
                        </span>
                      </button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="h-6 w-6 opacity-0 transition-opacity group-hover/agent:opacity-100 data-[state=open]:opacity-100"
                            aria-label={`Actions for ${agent.name}`}
                          >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel className="truncate">{agent.name}</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => selectAgent(agent.name)}>
                            <LayoutDashboard className="h-3.5 w-3.5" /> Open in active pane
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              void copyText(agent.name).then((ok) =>
                                ok ? toast.success("Agent name copied") : toast.error("Copy failed"),
                              );
                            }}
                          >
                            <Download className="h-3.5 w-3.5 rotate-180" /> Copy name
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setRemoveTarget(agent.name)}
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Remove from fleet
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="shrink-0 px-2.5 pb-1">
          <p className="px-1.5 text-[10px] leading-relaxed text-muted-foreground/80">
            Any <code className="font-mono">:name</code> is a durable cell. List is browser-local.
          </p>
        </div>
      </div>

      <div className="shrink-0 border-t border-sidebar-border p-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 flex-1 justify-start gap-2 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={openSettings}
          >
            <Settings2 className="h-3.5 w-3.5" /> Settings
          </Button>
          <ThemeToggle />
          {authEnabled ? <LockButton /> : null}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" asChild aria-label="Fleet UI on GitHub">
                <a href="https://github.com/amangupta20/fleet-ui" target="_blank" rel="noreferrer">
                  <Github className="h-4 w-4" />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Source on GitHub</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <AddAgentDialog open={addOpen} onOpenChange={setAddOpen} />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} authEnabled={authEnabled} />

      <AlertDialog open={Boolean(removeTarget)} onOpenChange={(open) => { if (!open) setRemoveTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove “{removeTarget}” from this browser?</AlertDialogTitle>
            <AlertDialogDescription>
              This only removes the shortcut. The Durable Object, its transcript, and any pinned model remain on the
              fleet. You can add the same name again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!removeTarget) return;
                const name = removeTarget;
                removeAgent(name);
                setRemoveTarget(null);
                toast.success("Agent removed", { description: `${name} is no longer pinned in the rail.` });
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
