"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Clock,
  Copy,
  FileJson,
  Info,
  RefreshCcw,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Markdown } from "@/components/workspace/markdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { buildJsonExport, buildMarkdownExport } from "@/lib/export";
import { useElapsed } from "@/hooks/use-elapsed";
import type { ChatRun } from "@/lib/chat-types";
import {
  cn,
  copyText,
  downloadTextFile,
  formatDateTime,
  formatDuration,
  safeFileStem,
  shortId,
} from "@/lib/utils";

function CopyValue({ label, value }: { label: string; value: string | null }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  return (
    <div className="min-w-0">
      <div className="meta-label">{label}</div>
      <div className="mt-0.5 flex items-center gap-1">
        <code className="min-w-0 truncate font-mono text-[10px] text-foreground/80" title={value}>
          {value}
        </code>
        <button
          type="button"
          className="shrink-0 rounded p-0.5 text-muted-foreground opacity-60 transition-opacity hover:bg-muted hover:text-foreground hover:opacity-100"
          aria-label={`Copy ${label}`}
          onClick={() => {
            void copyText(value).then((ok) => {
              if (!ok) {
                toast.error("Copy failed");
                return;
              }
              setCopied(true);
              toast.success(`${label} copied`);
              window.setTimeout(() => setCopied(false), 1500);
            });
          }}
        >
          {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
        </button>
      </div>
    </div>
  );
}

function statusBadge(run: ChatRun) {
  if (run.status === "done") return <Badge variant="success">done</Badge>;
  if (run.status === "unanswered") return <Badge variant="warning">unanswered</Badge>;
  if (run.status === "error") return <Badge variant="destructive">request failed</Badge>;
  return <Badge variant="muted">{run.status}</Badge>;
}

export function RunCard({
  agent,
  defaultModel,
  run,
  onRetry,
  onReuseId,
  onRemove,
}: {
  agent: string;
  defaultModel?: string | null;
  run: ChatRun;
  onRetry: (run: ChatRun) => void;
  onReuseId: (run: ChatRun) => void;
  onRemove: (run: ChatRun) => void;
}) {
  const [detailsOpen, setDetailsOpen] = useState(true);

  const copyBody = () => {
    const text = run.error ? run.error : run.text;
    void copyText(text).then((ok) =>
      ok ? toast.success("Response copied") : toast.error("Copy failed"),
    );
  };

  const exportRun = (format: "md" | "json") => {
    const payload = {
      agent,
      exportedAt: Date.now(),
      runs: [run],
    };
    const stem = `${safeFileStem("run")}-${safeFileStem(run.requestId)}`;
    if (format === "md") {
      downloadTextFile(`${stem}.md`, buildMarkdownExport(payload), "text/markdown");
    } else {
      downloadTextFile(`${stem}.json`, buildJsonExport(payload), "application/json");
    }
  };

  return (
    <article className="animate-slide-in space-y-2.5">
      <div className="flex justify-end">
        <div className="max-w-[90%] rounded-xl rounded-br-sm border border-primary/15 bg-primary/10 px-3 py-2 text-sm leading-relaxed">
          <p className="whitespace-pre-wrap break-words">{run.prompt}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border bg-card">
          <span className="font-mono text-[10px] font-semibold text-primary">π</span>
        </span>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div
            className={cn(
              "rounded-xl rounded-tl-sm border bg-card/85 p-3 shadow-sm",
              run.status === "error" && "border-destructive/25",
              run.status === "unanswered" && "border-amber-500/25",
            )}
          >
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold">Fleet</span>
              <span className="text-[10px] text-muted-foreground">·</span>
              {statusBadge(run)}
              {run.model ? (
                <Badge variant="outline" className="max-w-[180px] truncate font-mono text-[9px]">
                  {run.model}
                </Badge>
              ) : (
                <Badge
                  variant="muted"
                  className="max-w-[220px] truncate text-[9px]"
                  title={defaultModel ?? "Fleet default"}
                >
                  fleet default{defaultModel ? ` · ${defaultModel}` : ""}
                </Badge>
              )}
              <span className="ml-auto flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatDuration(run.latencyMs)}
              </span>
            </div>

            {run.error ? (
              <div className="rounded-md border border-destructive/25 bg-destructive/5 p-2.5 text-xs text-destructive">
                <div className="mb-1 flex items-center gap-1.5 font-medium">
                  <AlertTriangle className="h-3.5 w-3.5" /> {run.httpStatus ? `HTTP ${run.httpStatus}` : "Request error"}
                </div>
                <p className="whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed">{run.error}</p>
              </div>
            ) : run.text ? (
              <Markdown content={run.text} />
            ) : (
              <p className="text-sm italic text-muted-foreground">The agent returned no text.</p>
            )}

            {run.reason ? (
              <div className="mt-2.5 flex items-start gap-2 rounded-md border border-amber-500/25 bg-amber-500/5 p-2.5 text-xs">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="min-w-0">
                  <p className="font-medium text-amber-700 dark:text-amber-400">Reason returned by pi</p>
                  <p className="mt-0.5 whitespace-pre-wrap break-words font-mono text-[11px] text-muted-foreground">
                    {run.reason}
                  </p>
                </div>
              </div>
            ) : null}

            <div className="mt-2.5 border-t pt-1.5">
              <button
                type="button"
                onClick={() => setDetailsOpen((open) => !open)}
                className="flex w-full items-center gap-1 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
                aria-expanded={detailsOpen}
              >
                <ChevronDown className={cn("h-3 w-3 transition-transform", detailsOpen && "rotate-180")} />
                Run details
                <span className="ml-auto font-mono">
                  {shortId(run.requestId, 18)} · {run.status}
                </span>
              </button>
              {detailsOpen ? (
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <CopyValue label="Request ID" value={run.requestId} />
                  <CopyValue
                    label={run.submissionId && run.submissionId !== run.operationId ? "Submission ID" : "Operation = submission"}
                    value={run.submissionId ?? run.operationId}
                  />
                  {run.operationId && run.submissionId && run.operationId !== run.submissionId ? (
                    <CopyValue label="Operation ID" value={run.operationId} />
                  ) : null}
                  <div>
                    <div className="meta-label">Latency</div>
                    <div className="mt-0.5 font-mono text-[10px] text-foreground/80">
                      {formatDuration(run.latencyMs)} client round-trip
                    </div>
                  </div>
                  <div>
                    <div className="meta-label">Created</div>
                    <div className="mt-0.5 font-mono text-[10px] text-foreground/80" title={formatDateTime(run.createdAt)}>
                      {new Date(run.createdAt).toISOString()}
                    </div>
                  </div>
                  {run.httpStatus ? <CopyValue label="HTTP status" value={String(run.httpStatus)} /> : null}
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-1 px-1">
            <span className="text-[10px] text-muted-foreground">{formatDateTime(run.createdAt)}</span>
            <span className="mx-1 h-2.5 w-px bg-border" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="h-6 w-6" onClick={copyBody} aria-label="Copy response">
                  <Copy className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy response</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-6 w-6"
                  onClick={() => onRetry(run)}
                  aria-label="Send this prompt again with a new request ID"
                >
                  <RefreshCcw className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Retry with a new ID</TooltipContent>
            </Tooltip>
            <Button
              variant="ghost"
              size="xs"
              className="h-6 gap-1 px-1.5 text-[10px] text-muted-foreground"
              onClick={() => onReuseId(run)}
            >
              <RotateCcw className="h-3 w-3" /> reuse ID
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="ml-auto h-6 w-6" aria-label="Run actions">
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => exportRun("md")}>Export run (.md)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportRun("json")}>
                  <FileJson className="h-3.5 w-3.5" /> Export run (.json)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onRemove(run)}>
                  <Trash2 className="h-3.5 w-3.5" /> Remove from this browser
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </article>
  );
}

export function PendingRun({
  prompt,
  model,
  startedAt,
}: {
  prompt: string;
  model: string | null;
  startedAt: number;
}) {
  return (
    <article className="animate-slide-in space-y-2.5">
      <div className="flex justify-end">
        <div className="max-w-[90%] rounded-xl rounded-br-sm border border-primary/15 bg-primary/10 px-3 py-2 text-sm leading-relaxed">
          <p className="whitespace-pre-wrap break-words">{prompt}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border bg-card">
          <span className="font-mono text-[10px] font-semibold text-primary">π</span>
        </span>
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 rounded-xl rounded-tl-sm border bg-card/85 px-3 py-2.5 text-xs text-muted-foreground shadow-sm">
            <span className="flex gap-1">
              <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-primary" />
              <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-primary [animation-delay:200ms]" />
              <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-primary [animation-delay:400ms]" />
            </span>
            <span>Durable run in flight</span>
            {model ? <span className="hidden font-mono text-[10px] sm:inline">{model}</span> : null}
            <LiveElapsed startedAt={startedAt} />
          </div>
        </div>
      </div>
    </article>
  );
}

function LiveElapsed({ startedAt }: { startedAt: number }) {
  const elapsed = useElapsed(startedAt, true);
  return (
    <span className="font-mono text-[10px] text-foreground/60">
      {formatDuration(elapsed)}
    </span>
  );
}
