"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Boxes,
  Download,
  FlaskConical,
  Github,
  HardDrive,
  LayoutDashboard,
  MoreHorizontal,
  Paperclip,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Server,
  Settings2,
  Star,
  StarOff,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { AddAgentDialog } from "@/components/add-agent-dialog";
import { AgentAvatar } from "@/components/agent-avatar";
import { LifecycleChip } from "@/components/workspace/lifecycle-chip";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useAgentDirectory, useAgentStates, useModels } from "@/hooks/use-fleet";
import { decodeAgentName } from "@/lib/agent-name";
import { deriveAgentLifecycle, type AgentLifecycle } from "@/lib/lifecycle";
import type { MergedAgent } from "@/lib/agent-merge";
import type { AgentSource } from "@/lib/fleet-types";
import { cn, copyText, formatRelativeTime, pluralize } from "@/lib/utils";
import { useChatStore } from "@/stores/chat-store";
import { useFleetStore } from "@/stores/fleet-store";

const NAV_ITEMS = [
  { href: "/", label: "Workspace", icon: LayoutDashboard },
  { href: "/providers", label: "Providers", icon: Server },
  { href: "/labs", label: "Labs", icon: FlaskConical },
] as const;

const SOURCE_LABEL: Record<AgentSource, string> = {
  fleet: "Fleet",
  paperclip: "Paperclip",
  local: "Local",
};

const SOURCE_BADGE: Record<AgentSource, string> = {
  fleet: "border-success/30 bg-success/10 text-success",
  paperclip: "border-brand/30 bg-brand/10 text-brand",
  local: "border-border bg-muted text-muted-foreground",
};

function displayNameFor(row: MergedAgent): string {
  const label = row.local?.label?.trim();
  return label || decodeAgentName(row.name);
}

function SectionHeading({
  icon: Icon,
  title,
  count,
}: {
  icon: LucideIcon;
  title: string;
  count: number;
}) {
  return (
    <div className="mb-1 flex items-center gap-1.5 px-1.5">
      <Icon className="size-3 text-muted-foreground" />
      <span className="label-caps">
        {title}
      </span>
      <span className="rounded bg-muted px-1 font-mono text-sm text-muted-foreground">
        {count}
      </span>
    </div>
  );
}

export function SidebarContent({
  authEnabled,
  onNavigate,
}: {
  authEnabled: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const directory = useAgentDirectory();
  const agents = directory.rows;
  const layout = useFleetStore((state) => state.layout);
  const panes = useFleetStore((state) => state.panes);
  const activePane = useFleetStore((state) => state.activePane);
  const removeAgent = useFleetStore((state) => state.removeAgent);
  const renameAgent = useFleetStore((state) => state.renameAgent);
  const toggleAgentStar = useFleetStore((state) => state.toggleAgentStar);
  const openAgentInActivePane = useFleetStore((state) => state.openAgentInActivePane);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<MergedAgent | null>(null);
  const [renameTarget, setRenameTarget] = useState<{ name: string; label: string } | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const fleetAgents = useMemo(
    () => agents.filter((agent) => agent.source === "fleet"),
    [agents],
  );
  const stateQueries = useAgentStates(fleetAgents.map((agent) => agent.name));
  const runsByAgent = useChatStore((state) => state.runsByAgent);
  const inflightByAgent = useChatStore((state) => state.inflightByAgent);
  const models = useModels();
  const defaultModelLabel = models.data?.default
    ? `${models.data.default.provider}/${models.data.default.id}`
    : null;

  const lifecycleByName = useMemo(() => {
    const map = new Map<string, AgentLifecycle>();
    fleetAgents.forEach((agent, index) => {
      const query = stateQueries[index];
      const runs = runsByAgent[agent.name] ?? [];
      map.set(
        agent.name,
        deriveAgentLifecycle({
          probe: query ?? { isPending: true, isError: false },
          promptInFlight: Boolean(inflightByAgent[agent.name]),
          lastRun: runs.length > 0 ? runs[runs.length - 1] : null,
        }),
      );
    });
    return map;
  }, [fleetAgents, stateQueries, runsByAgent, inflightByAgent]);

  const filteredAgents = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return agents;
    return agents.filter((agent) => {
      const display = displayNameFor(agent).toLowerCase();
      return agent.name.toLowerCase().includes(needle) || display.includes(needle);
    });
  }, [agents, search]);

  const groups = useMemo(
    () => ({
      fleet: filteredAgents.filter((agent) => agent.source === "fleet"),
      paperclip: filteredAgents.filter((agent) => agent.source === "paperclip"),
      local: filteredAgents.filter((agent) => agent.source === "local"),
    }),
    [filteredAgents],
  );

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

  const openRename = (row: MergedAgent) => {
    setRenameTarget({ name: row.name, label: row.local?.label?.trim() ?? "" });
    setRenameValue(row.local?.label?.trim() ?? "");
  };

  const commitRename = () => {
    if (!renameTarget) return;
    renameAgent(renameTarget.name, renameValue);
    toast.success(renameValue.trim() ? "Rail label updated" : "Rail label cleared", {
      description: renameValue.trim()
        ? `${renameTarget.name} stays the API name.`
        : `Showing the canonical name for ${renameTarget.name}.`,
    });
    setRenameTarget(null);
  };

  const confirmRemove = () => {
    if (!removeTarget) return;
    const { name, source } = removeTarget;
    removeAgent(name);
    setRemoveTarget(null);
    toast.success("Local shortcut removed", {
      description:
        source === "local"
          ? `${name} is no longer pinned in this browser.`
          : `${name} still appears from ${SOURCE_LABEL[source]}.`,
    });
  };

  const toggleStar = (row: MergedAgent) => {
    const wasStarred = row.local?.starred === true;
    toggleAgentStar(row.name);
    toast.success(wasStarred ? "Star removed" : "Starred locally", {
      description: wasStarred
        ? `${row.name} is no longer starred in this browser.`
        : `${row.name} is starred in this browser only.`,
    });
  };

  const renderAgentRow = (row: MergedAgent) => {
    const displayName = displayNameFor(row);
    const lifecycle = row.source === "fleet" ? lifecycleByName.get(row.name) ?? "initializing" : null;
    const paneIndex = paneIndexByName.get(row.name);
    const selected = panes[activePane] === row.name;
    const starred = row.local?.starred === true;
    const modelLabel = row.local?.modelOverride ?? defaultModelLabel;
    const meta =
      row.source === "fleet"
        ? `${formatRelativeTime(row.lastActive)} · ${pluralize(row.prompts ?? 0, "prompt")}`
        : row.source === "paperclip"
          ? row.lastActive
            ? `active ${formatRelativeTime(row.lastActive)}`
            : "Paperclip directory"
          : `local · added ${formatRelativeTime(row.addedAt)}`;

    return (
      <li key={row.name} className="group/agent relative">
        <div
          className={cn(
            "flex items-center gap-2 rounded border border-transparent px-1.5 py-1.5 transition-colors",
            selected ? "border-brand/15 bg-sidebar-accent" : "hover:bg-sidebar-accent-hover",
          )}
        >
          <button
            type="button"
            onClick={() => selectAgent(row.name)}
            className="flex min-w-0 flex-1 items-center gap-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
            title={`${row.name}${modelLabel ? ` · ${modelLabel}` : ""}`}
          >
            <AgentAvatar name={displayName} size="md" />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <span className="block truncate text-sm font-medium leading-tight">
                  {displayName}
                </span>
                {starred ? (
                  <Star className="size-3 shrink-0 fill-warning text-warning" aria-label="Starred" />
                ) : null}
                <span
                  className={cn(
                    "shrink-0 rounded border px-1 font-mono text-sm uppercase leading-4 tracking-wide",
                    SOURCE_BADGE[row.source],
                  )}
                >
                  {SOURCE_LABEL[row.source]}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                {paneIndex !== undefined ? (
                  <span className="shrink-0 rounded-sm bg-brand/10 px-1 font-mono text-sm leading-4 text-brand">
                    {paneIndex + 1}
                  </span>
                ) : null}
                {lifecycle ? <LifecycleChip lifecycle={lifecycle} className="shrink-0" /> : null}
                <span className="block truncate font-mono text-sm leading-tight text-muted-foreground">
                  {meta}
                </span>
              </span>
            </span>
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-6 opacity-0 transition-opacity group-hover/agent:opacity-100 data-[state=open]:opacity-100"
                aria-label={`Actions for ${displayName}`}
              >
                <MoreHorizontal className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="truncate">
                {displayName}
                {displayName !== row.name ? (
                  <span className="block truncate font-mono text-sm font-normal text-muted-foreground">
                    {row.name}
                  </span>
                ) : null}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => selectAgent(row.name)}>
                <LayoutDashboard /> Open in active pane
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  void copyText(row.name).then((ok) =>
                    ok ? toast.success("Agent name copied") : toast.error("Copy failed"),
                  );
                }}
              >
                <Download className="rotate-180" /> Copy API name
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openRename(row)}>
                <Pencil /> Rename rail label
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleStar(row)}>
                {starred ? (
                  <>
                    <StarOff /> Remove star
                  </>
                ) : (
                  <>
                    <Star /> Star locally
                  </>
                )}
              </DropdownMenuItem>
              {row.local ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setRemoveTarget(row)}
                  >
                    <Trash2 /> Remove local shortcut
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </li>
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-sidebar-border px-4 pr-11 lg:pr-4">
        <Brand onClick={() => { router.push("/"); onNavigate?.(); }} />
        <span className="rounded border border-sidebar-border px-1.5 py-0.5 font-mono text-sm text-muted-foreground">
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
                "flex items-center gap-2.5 rounded px-2.5 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-foreground ring-1 ring-brand/35"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className={cn("size-4", active && "text-brand")} />
              {item.label}
              {item.href === "/labs" ? (
                <span className="ml-auto rounded border border-border px-1.5 py-0.5 font-mono text-sm text-muted-foreground">
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
            <span className="label-caps">Agents</span>
            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm text-muted-foreground">
              {agents.length}
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => {
                    void directory.server.refetch();
                    void directory.paperclip.refetch();
                  }}
                  className="size-6"
                  aria-label="Refresh agent lists"
                >
                  <RefreshCw
                    className={cn(
                      "size-3.5",
                      (directory.server.isFetching || directory.paperclip.isFetching) && "animate-spin",
                    )}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh server lists</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setAddOpen(true)}
                  className="size-6"
                  aria-label="Add agent"
                >
                  <Plus />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add agent</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="px-2.5 pb-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Filter agents…"
              className="h-8 border-sidebar-border bg-background/50 pl-8 text-sm"
              aria-label="Filter agents"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2.5 pb-2">
          {filteredAgents.length === 0 ? (
            <div className="rounded border border-dashed border-sidebar-border p-3 text-center">
              <p className="text-sm text-muted-foreground">
                {agents.length === 0 ? "No agents yet." : "No matches."}
              </p>
              {agents.length === 0 ? (
                <Button variant="outline" size="sm" className="mt-2 h-7 text-sm" onClick={() => setAddOpen(true)}>
                  <Plus className="size-3" /> Add your first agent
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="space-y-2">
              {groups.fleet.length > 0 ? (
                <section aria-label="Fleet agents">
                  <SectionHeading icon={Boxes} title="Fleet" count={groups.fleet.length} />
                  <ul className="space-y-0.5">{groups.fleet.map(renderAgentRow)}</ul>
                </section>
              ) : null}

              {directory.paperclipEnabled && groups.paperclip.length > 0 ? (
                <section aria-label="Paperclip agents">
                  <SectionHeading icon={Paperclip} title="Paperclip" count={groups.paperclip.length} />
                  <ul className="space-y-0.5">{groups.paperclip.map(renderAgentRow)}</ul>
                </section>
              ) : null}

              {groups.local.length > 0 ? (
                <section aria-label="Local agents">
                  <SectionHeading icon={HardDrive} title="Local" count={groups.local.length} />
                  <ul className="space-y-0.5">{groups.local.map(renderAgentRow)}</ul>
                </section>
              ) : null}
            </div>
          )}
        </div>

        <div className="shrink-0 px-2.5 pb-1">
          <p className="px-1.5 font-mono text-sm leading-[1.5] text-muted-foreground/80">
            {directory.paperclipEnabled
              ? "Fleet + Paperclip are server lists. Local shortcuts are the offline fallback."
              : "Fleet is server-side. Local shortcuts are the offline fallback."}
          </p>
        </div>
      </div>

      <div className="shrink-0 border-t border-sidebar-border p-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 flex-1 justify-start gap-2 px-2 text-sm text-muted-foreground hover:text-foreground"
            onClick={openSettings}
          >
            <Settings2 /> Settings
          </Button>
          <ThemeToggle />
          {authEnabled ? <LockButton /> : null}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" asChild aria-label="Fleet UI on GitHub">
                <a href="https://github.com/amangupta20/fleet-ui" target="_blank" rel="noreferrer">
                  <Github className="size-4" />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Source on GitHub</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <AddAgentDialog open={addOpen} onOpenChange={setAddOpen} />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} authEnabled={authEnabled} />

      <Dialog
        open={Boolean(renameTarget)}
        onOpenChange={(open) => {
          if (!open) setRenameTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              commitRename();
            }}
          >
            <DialogHeader>
              <DialogTitle>Rename rail label</DialogTitle>
              <DialogDescription>
                A browser-only label for <code className="font-mono text-foreground">{renameTarget?.name}</code>.
                API calls and the durable agent name do not change.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-5 space-y-2">
              <Input
                value={renameValue}
                onChange={(event) => setRenameValue(event.target.value)}
                placeholder={renameTarget?.name ?? "Label"}
                maxLength={64}
                autoComplete="off"
                aria-label="Rail label"
              />
              <p className="text-sm text-muted-foreground">
                Leave empty to show the canonical name again.
              </p>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="ghost" onClick={() => setRenameTarget(null)}>
                Cancel
              </Button>
              <Button type="submit">Save label</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(removeTarget)} onOpenChange={(open) => { if (!open) setRemoveTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove local shortcut for “{removeTarget ? displayNameFor(removeTarget) : ""}”?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {removeTarget?.source === "local"
                ? "This only removes the browser-local shortcut. The Durable Object, its transcript, and any pinned model remain on the fleet."
                : `This only removes the browser-local shortcut. ${removeTarget ? SOURCE_LABEL[removeTarget.source] : "Server"}-listed rows still come from the server and will remain visible.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmRemove}
            >
              Remove shortcut
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
