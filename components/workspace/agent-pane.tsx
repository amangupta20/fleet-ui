"use client";

import { useEffect, useState } from "react";
import {
  ChevronDown,
  FileDiff,
  MessageSquareText,
  MoreHorizontal,
  Plus,
  RotateCcw,
  ScrollText,
  SquareTerminal,
} from "lucide-react";
import { toast } from "sonner";

import { AddAgentDialog } from "@/components/add-agent-dialog";
import { AgentAvatar } from "@/components/agent-avatar";
import { ChatPane } from "@/components/workspace/chat-pane";
import { LifecycleChip } from "@/components/workspace/lifecycle-chip";
import { FilesStub } from "@/components/workspace/files-stub";
import { PaneEmpty } from "@/components/workspace/pane-empty";
import { TerminalStub } from "@/components/workspace/terminal-stub";
import { TranscriptPane } from "@/components/workspace/transcript-pane";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAgentDirectory, useAgentState, useResetAgent } from "@/hooks/use-fleet";
import { decodeAgentName } from "@/lib/agent-name";
import { deriveAgentLifecycle } from "@/lib/lifecycle";
import { cn, errorMessage } from "@/lib/utils";
import { useChatStore } from "@/stores/chat-store";
import { useFleetStore } from "@/stores/fleet-store";

export function AgentPane({
  index,
  agentName,
  isActive,
}: {
  index: number;
  agentName: string | null;
  isActive: boolean;
}) {
  const [tab, setTab] = useState("chat");
  const [switchOpen, setSwitchOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const { rows: agents } = useAgentDirectory();
  const features = useFleetStore((state) => state.features);
  const setPaneAgent = useFleetStore((state) => state.setPaneAgent);
  const rememberAgent = useFleetStore((state) => state.rememberAgent);
  const runCount = useChatStore((state) =>
    agentName ? (state.runsByAgent[agentName]?.length ?? 0) : 0,
  );
  const clearAgent = useChatStore((state) => state.clearAgent);
  const resetAgent = useResetAgent();
  const stateQuery = useAgentState(agentName);
  const inflight = useChatStore((state) => (agentName ? state.inflightByAgent[agentName] : undefined));
  const agentRuns = useChatStore((state) => (agentName ? state.runsByAgent[agentName] : undefined));

  useEffect(() => {
    if (tab === "terminal" && !features.terminal) setTab("chat");
    if (tab === "files" && !features.files) setTab("chat");
  }, [features.files, features.terminal, tab]);

  useEffect(() => {
    setTab("chat");
  }, [agentName]);

  if (!agentName) return <PaneEmpty index={index} />;

  const displayAgentName = decodeAgentName(agentName);
  const lifecycle = deriveAgentLifecycle({
    probe: stateQuery,
    promptInFlight: Boolean(inflight),
    lastRun: agentRuns && agentRuns.length > 0 ? agentRuns[agentRuns.length - 1] : null,
  });

  const handleReset = async () => {
    try {
      await resetAgent.mutateAsync(agentName);
      clearAgent(agentName);
      toast.success(`Reset ${displayAgentName}`, {
        description: "Server context cleared and browser run log removed.",
      });
      setResetOpen(false);
    } catch (error) {
      toast.error("Reset failed", { description: errorMessage(error) });
    }
  };

  return (
    <div className={cn("pane-surface h-full", isActive && "ring-1 ring-brand/10")}>
      <div className="flex shrink-0 items-center gap-2 border-b px-2.5 py-2">
        <DropdownMenu open={switchOpen} onOpenChange={setSwitchOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex min-w-0 items-center gap-2 rounded-md px-1 py-1 text-left outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Switch agent in pane ${index + 1}`}
            >
              <AgentAvatar name={displayAgentName} size="md" />
              <span className="min-w-0">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-medium leading-tight">{displayAgentName}</span>
                  <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
                </span>
                <span className="flex items-center gap-1.5 font-mono text-sm leading-tight text-muted-foreground">
                  <LifecycleChip lifecycle={lifecycle} className="px-1" />
                  <span className="mx-0.5 text-border">·</span>pane {index + 1}
                </span>
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Switch pane agent</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {agents.map((agent) => {
              const displayName = agent.local?.label?.trim() || decodeAgentName(agent.name);
              return (
                <DropdownMenuItem
                  key={agent.name}
                  disabled={agent.name === agentName}
                  onClick={() => {
                    rememberAgent(agent.name);
                    setPaneAgent(index, agent.name);
                    setSwitchOpen(false);
                  }}
                >
                  <AgentAvatar name={displayName} size="sm" />
                  <span className="truncate">{displayName}</span>
                  {agent.name === agentName ? (
                    <span className="ml-auto font-mono text-sm text-muted-foreground">current</span>
                  ) : null}
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                setSwitchOpen(false);
                setAddOpen(true);
              }}
            >
              <Plus /> Add new agent
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="ml-auto flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-7"
                onClick={() => setTab("transcript")}
                aria-label="Open durable transcript"
              >
                <ScrollText />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Durable transcript</TooltipContent>
          </Tooltip>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="size-7" aria-label="Pane actions">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="truncate">{displayAgentName}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setTab("chat")}>
                <MessageSquareText /> Chat
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTab("transcript")}>
                <ScrollText /> Durable transcript
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setResetOpen(true)}
              >
                <RotateCcw /> Reset agent
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center gap-2 border-b px-2">
          <TabsList className="h-8 gap-0.5 bg-transparent p-0">
            <TabsTrigger
              value="chat"
              className="h-8 gap-1.5 rounded-none border-b-2 border-transparent px-2 text-sm data-[state=active]:border-brand data-[state=active]:bg-transparent"
            >
              <MessageSquareText />
              Chat
              {runCount > 0 ? (
                <span className="rounded bg-muted px-1 font-mono text-sm text-muted-foreground">{runCount}</span>
              ) : null}
            </TabsTrigger>
            <TabsTrigger
              value="transcript"
              className="h-8 gap-1.5 rounded-none border-b-2 border-transparent px-2 text-sm data-[state=active]:border-brand data-[state=active]:bg-transparent"
            >
              <ScrollText />
              Transcript
            </TabsTrigger>
            {features.terminal ? (
              <TabsTrigger
                value="terminal"
                className="h-8 gap-1.5 rounded-none border-b-2 border-transparent px-2 text-sm data-[state=active]:border-brand data-[state=active]:bg-transparent"
              >
                <SquareTerminal />
                Terminal
                <span className="rounded bg-warning/10 px-1 font-mono text-sm text-warning">
                  stub
                </span>
              </TabsTrigger>
            ) : null}
            {features.files ? (
              <TabsTrigger
                value="files"
                className="h-8 gap-1.5 rounded-none border-b-2 border-transparent px-2 text-sm data-[state=active]:border-brand data-[state=active]:bg-transparent"
              >
                <FileDiff />
                Files
              </TabsTrigger>
            ) : null}
          </TabsList>
        </div>

        <TabsContent
          value="chat"
          forceMount
          className="mt-0 min-h-0 flex-1 overflow-hidden data-[state=inactive]:hidden"
        >
          <ChatPane key={agentName} agent={agentName} />
        </TabsContent>
        <TabsContent value="transcript" className="mt-0 min-h-0 flex-1 overflow-hidden">
          <TranscriptPane agent={agentName} />
        </TabsContent>
        {features.terminal ? (
          <TabsContent value="terminal" className="mt-0 min-h-0 flex-1 overflow-hidden">
            <TerminalStub agent={agentName} />
          </TabsContent>
        ) : null}
        {features.files ? (
          <TabsContent value="files" className="mt-0 min-h-0 flex-1 overflow-hidden">
            <FilesStub agent={agentName} />
          </TabsContent>
        ) : null}
      </Tabs>

      <AddAgentDialog open={addOpen} onOpenChange={setAddOpen} />

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset “{displayAgentName}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This starts a fresh server context for the Durable Object: history leaves the active transcript but
              durable records remain. Browser-recorded runs for this agent will also be cleared here.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleReset();
              }}
              disabled={resetAgent.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <RotateCcw className={cn("size-4", resetAgent.isPending && "animate-spin")} />
              {resetAgent.isPending ? "Resetting…" : "Reset agent"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
