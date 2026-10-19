"use client";

import { useMemo, useState } from "react";
import {
  Bot,
  Copy,
  Download,
  FileJson,
  Info,
  Loader2,
  RefreshCw,
  ScrollText,
  User,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useMessages } from "@/hooks/use-fleet";
import type { MessageEntry } from "@/lib/fleet-types";
import { copyText, cn, downloadTextFile, errorMessage, formatRelativeTime, safeFileStem } from "@/lib/utils";
import { useFleetStore } from "@/stores/fleet-store";

function kindStyle(kind: string | null): { label: string; className: string; icon: typeof Bot } {
  const value = kind ?? "unknown";
  if (value.includes("user")) {
    return { label: "user", className: "text-sky-600 dark:text-sky-400 border-sky-500/20 bg-sky-500/5", icon: User };
  }
  if (value.includes("assistant")) {
    return { label: "assistant", className: "text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/5", icon: Bot };
  }
  if (value.includes("tool")) {
    return { label: "tool", className: "text-amber-600 dark:text-amber-400 border-amber-500/20 bg-amber-500/5", icon: Wrench };
  }
  if (value.includes("system")) {
    return { label: "system", className: "text-violet-600 dark:text-violet-400 border-violet-500/20 bg-violet-500/5", icon: Info };
  }
  return { label: value, className: "text-muted-foreground border-border bg-muted/40", icon: Info };
}

function messageToText(message: MessageEntry): string {
  return `# ${String(message.id)} · ${message.kind ?? "unknown"}\n\n${message.preview}\n`;
}

export function TranscriptPane({ agent }: { agent: string }) {
  const limit = useFleetStore((state) => state.transcriptLimit);
  const setTranscriptLimit = useFleetStore((state) => state.setTranscriptLimit);
  const query = useMessages(agent, limit, true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const messages = useMemo(() => query.data?.messages ?? [], [query.data]);
  const lastSynced = query.dataUpdatedAt
    ? formatRelativeTime(query.dataUpdatedAt)
    : null;

  const transcriptText = useMemo(
    () => messages.map((message) => messageToText(message)).join("\n---\n\n"),
    [messages],
  );

  const copy = () => {
    void copyText(transcriptText).then((ok) =>
      ok ? toast.success("Durable transcript copied") : toast.error("Copy failed"),
    );
  };

  const exportTranscript = (format: "txt" | "json") => {
    const stem = `${safeFileStem(agent)}-durable-transcript`;
    if (format === "json") {
      downloadTextFile(
        `${stem}.json`,
        JSON.stringify({ agent, exportedAt: new Date().toISOString(), messages }, null, 2),
        "application/json",
      );
    } else {
      downloadTextFile(`${stem}.txt`, transcriptText, "text/plain");
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b bg-muted/15 px-2.5 py-1.5">
        <div className="flex items-center gap-1.5 text-[11px] font-medium">
          <ScrollText className="h-3.5 w-3.5 text-muted-foreground" /> Durable transcript
        </div>
        <Badge variant="muted" className="font-mono text-[9px]">
          previews · 800ch max
        </Badge>
        <div className="ml-auto flex items-center gap-1">
          <Select value={String(limit)} onValueChange={(value) => setTranscriptLimit(Number(value))}>
            <SelectTrigger className="h-7 w-[92px] text-[10px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 25, 50, 100].map((option) => (
                <SelectItem key={option} value={String(option)}>
                  last {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-7 w-7"
                onClick={() => void query.refetch()}
                disabled={query.isFetching}
                aria-label="Refresh transcript"
              >
                {query.isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Refresh{lastSynced ? ` · ${lastSynced}` : ""}</TooltipContent>
          </Tooltip>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-7 w-7"
                disabled={messages.length === 0}
                aria-label="Export transcript"
              >
                <Download className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={copy}>
                <Copy className="h-3.5 w-3.5" /> Copy
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportTranscript("txt")}>Export .txt</DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportTranscript("json")}>
                <FileJson className="h-3.5 w-3.5" /> Export .json
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        <div className="mx-auto w-full max-w-3xl">
          {query.isPending ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }, (_, index) => (
                <Skeleton key={index} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : query.isError ? (
            <div className="rounded-lg border border-destructive/25 bg-destructive/5 p-4 text-sm">
              <p className="font-medium text-destructive">Could not load durable transcript</p>
              <p className="mt-1 text-xs text-muted-foreground">{errorMessage(query.error)}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => void query.refetch()}>
                Retry
              </Button>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center px-4 py-12 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border bg-muted/30">
                <ScrollText className="h-4 w-4 text-muted-foreground" />
              </span>
              <h3 className="mt-3 text-sm font-semibold">No durable messages yet</h3>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
                Send a prompt in the Chat tab. This view tails the agent's SQLite-backed transcript through{" "}
                <code className="font-mono text-foreground">GET /agent/:name/messages</code>.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between gap-2 px-1 text-[10px] text-muted-foreground">
                <span>
                  {messages.length} entr{messages.length === 1 ? "y" : "ies"} · last synced {lastSynced ?? "—"}
                </span>
                <span className="hidden font-mono sm:inline">messages?limit={limit}</span>
              </div>
              <ol className="relative space-y-2 before:absolute before:bottom-2 before:left-[13px] before:top-2 before:w-px before:bg-border">
                {messages.map((message, index) => {
                  const style = kindStyle(message.kind);
                  const Icon = style.icon;
                  const key = `${String(message.id ?? "msg")}-${index}`;
                  const long = message.preview.length > 420;
                  const isExpanded = expanded[key] ?? false;
                  return (
                    <li key={key} className="relative flex gap-2.5">
                      <span
                        className={cn(
                          "relative z-10 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border bg-card",
                          style.className,
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0 flex-1 rounded-lg border bg-card/75 p-2.5 shadow-sm">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant="outline" className={cn("font-mono text-[9px]", style.className)}>
                            {style.label}
                          </Badge>
                          <span className="font-mono text-[9px] text-muted-foreground">id {String(message.id ?? "—")}</span>
                          <span className="ml-auto font-mono text-[9px] text-muted-foreground">#{index + 1}</span>
                        </div>
                        <pre
                          className={cn(
                            "mt-2 whitespace-pre-wrap break-words font-sans text-[11px] leading-relaxed text-foreground/85",
                            long && !isExpanded && "line-clamp-[8] overflow-hidden",
                          )}
                        >
                          {message.preview}
                        </pre>
                        {long ? (
                          <button
                            type="button"
                            className="mt-1.5 text-[10px] font-medium text-primary hover:underline"
                            onClick={() => setExpanded((state) => ({ ...state, [key]: !isExpanded }))}
                          >
                            {isExpanded ? "Show less" : "Show full preview"}
                          </button>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ol>
              <p className="mt-3 px-1 text-[10px] leading-relaxed text-muted-foreground">
                Preview text is truncated by the Worker at 800 characters. Lifecycle entries (e.g.{" "}
                <code className="font-mono">pi.system</code>) can legitimately have no text.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
