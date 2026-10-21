"use client";

import { useState } from "react";
import {
  ChevronDown,
  Copy,
  Ellipsis,
  FileDown,
  FileJson,
  Info,
  RefreshCcw,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { RevertStub, TimelineRowView } from "@/components/workspace/timeline-row";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ChatRun } from "@/lib/chat-types";
import { epochKey, type Timeline, type TimelineEpoch } from "@/lib/timeline";
import { cn, copyText, formatDateTime, formatDuration, formatRelativeTime } from "@/lib/utils";

/**
 * Epoch timeline.
 *
 * An epoch is one prompt: rows are grouped by the `submissionId` the Worker
 * returned for that prompt. The revert control is present but inert — the
 * Worker has no checkpoint endpoint yet.
 */

/** The per-epoch actions the timeline can perform. */
interface EpochActions {
  onCopy: (run: ChatRun) => void;
  onExport: (run: ChatRun, format: "md" | "json") => void;
  onRetry: (run: ChatRun) => void;
  onReuseId: (run: ChatRun) => void;
  onRemove: (run: ChatRun) => void;
}

function statusBadge(epoch: TimelineEpoch): React.ReactNode {
  if (epoch.status === "running") return <Badge variant="brand">running</Badge>;
  if (epoch.status === "done") return <Badge variant="success">done</Badge>;
  if (epoch.status === "unanswered") return <Badge variant="warning">unanswered</Badge>;
  if (epoch.status === "error") return <Badge variant="destructive">error</Badge>;
  return <Badge variant="muted">{epoch.status}</Badge>;
}

/** One value in the expanded run details. */
function DetailValue({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="min-w-0">
      <div className="helper-text uppercase tracking-[0.1em]">{label}</div>
      <div className="mt-0.5 flex items-center gap-1">
        <span className="truncate font-mono text-sm text-foreground/85" title={value}>
          {value}
        </span>
        <CopyId label={label} value={value} />
      </div>
    </div>
  );
}

/** An identifier with a copy button. */
function CopyId({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <span className="flex items-center gap-1">
      <span title={value}>{value}</span>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-6"
            aria-label={`Copy ${label}`}
            onClick={() => {
              void copyText(value).then((ok) => {
                if (!ok) {
                  toast.error("Copy failed");
                  return;
                }
                toast.success(`${label} copied`);
              });
            }}
          >
            <Copy />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Copy {label}</TooltipContent>
      </Tooltip>
    </span>
  );
}

function EpochMenu({ run, actions }: { run: ChatRun; actions: EpochActions }) {
  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => actions.onCopy(run)}
            aria-label="Copy answer"
          >
            <Copy />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Copy answer</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => actions.onRetry(run)}
            aria-label="Retry with a new request ID"
          >
            <RefreshCcw />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Retry with a new ID</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => actions.onReuseId(run)}
            aria-label="Reuse the request ID"
          >
            <RotateCcw />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Reuse request ID</TooltipContent>
      </Tooltip>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Epoch actions">
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => actions.onExport(run, "md")}>
              <FileDown /> Export epoch (.md)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => actions.onExport(run, "json")}>
              <FileJson /> Export epoch (.json)
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => actions.onRemove(run)}
            >
              <Trash2 /> Remove from this browser
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function EpochHeader({
  epoch,
  run,
  defaultModel,
  actions,
}: {
  epoch: TimelineEpoch;
  run: ChatRun | null;
  defaultModel: string | null;
  actions: EpochActions;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const submissionLabel = epoch.submissionId ?? (epoch.status === "running" ? "pending submissionId" : "not epoch-linked");

  return (
    <header className="rounded-lg border bg-muted/25 px-2.5 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="label-caps">
          epoch
        </span>
        <span className="font-mono text-sm text-brand">
          {epoch.submissionId ? (
            <CopyId label="submission ID" value={epoch.submissionId} />
          ) : epoch.id === "inflight" ? (
            submissionLabel
          ) : (
            <CopyId label="epoch ID" value={epoch.id} />
          )}
        </span>
        {statusBadge(epoch)}
        <div className="ml-auto flex items-center gap-1">
          <RevertStub epochId={epoch.id} />
          {run ? <EpochMenu run={run} actions={actions} /> : null}
        </div>
      </div>

      <p className="mt-1.5 whitespace-pre-wrap break-words text-base font-bold leading-[1.5] text-foreground">
        {epoch.prompt || "(no prompt text)"}
      </p>

      <div className="mt-1.5 flex items-center gap-2 text-sm text-muted-foreground">
        <span className="truncate">model {epoch.model ?? defaultModel ?? "fleet default"}</span>
        <span aria-hidden>·</span>
        <span className="shrink-0">
          {epoch.createdAt ? formatRelativeTime(epoch.createdAt) : "timestamp not returned"}
        </span>
        {run ? (
          <>
            <span aria-hidden>·</span>
            <span className="shrink-0">{formatDuration(run.latencyMs)} round-trip</span>
          </>
        ) : null}
        <button
          type="button"
          onClick={() => setDetailsOpen((open) => !open)}
          className="ml-auto inline-flex shrink-0 items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          aria-expanded={detailsOpen}
        >
          Run details
          <ChevronDown className={cn("size-3.5 transition-transform", detailsOpen && "rotate-180")} />
        </button>
      </div>

      {detailsOpen ? (
        <div className="mt-2 grid gap-2 border-t border-border/70 pt-2 sm:grid-cols-2">
          <DetailValue label="Request ID" value={run?.requestId ?? null} />
          <DetailValue label="Submission ID" value={epoch.submissionId} />
          {run?.operationId && run.operationId !== epoch.submissionId ? (
            <DetailValue label="Operation ID" value={run.operationId} />
          ) : null}
          <DetailValue label="Model" value={epoch.model ?? defaultModel ?? "fleet default"} />
          <DetailValue
            label="Created"
            value={epoch.createdAt ? formatDateTime(epoch.createdAt) : "timestamp not returned"}
          />
          <DetailValue label="Latency" value={formatDuration(run?.latencyMs ?? null)} />
          {run?.httpStatus ? <DetailValue label="HTTP status" value={String(run.httpStatus)} /> : null}
        </div>
      ) : null}
    </header>
  );
}

export function AgentTimeline({
  timeline,
  runs,
  defaultModel,
  actions,
}: {
  timeline: Timeline;
  runs: ChatRun[];
  defaultModel: string | null;
  actions: EpochActions;
}) {
  const runByEpoch = new Map(runs.map((run) => [epochKey(run), run]));

  return (
    <div className="flex flex-col gap-6">
      {timeline.epochs.map((epoch) => (
        <section key={epoch.id} className="animate-slide-in" data-epoch-id={epoch.id}>
          <EpochHeader
            epoch={epoch}
            run={runByEpoch.get(epoch.id) ?? null}
            defaultModel={defaultModel}
            actions={actions}
          />
          <div className="mt-3 flex flex-col gap-3">
            {epoch.rows.map((row) => (
              <TimelineRowView key={row.id} row={row} />
            ))}
            {epoch.durableRows.length > 0 ? (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex size-4 items-center justify-center text-muted-foreground">
                      <Info className="size-3.5" />
                      <span className="sr-only">How the durable rows below are linked</span>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    Durable rows for this turn, linked by the message-id watermark: the Worker sends
                    no submissionId per message, so the browser reads the transcript before the
                    prompt and links the turn that starts above that watermark.
                  </TooltipContent>
                </Tooltip>
                {epoch.durableRows.map((row) => (
                  <TimelineRowView key={`${epoch.id}-${row.id}`} row={row} />
                ))}
              </>
            ) : null}
          </div>
        </section>
      ))}

      {timeline.durableEpochs.length > 0 ? (
        <section aria-label="Durable activity">
          <div className="rounded-lg border border-dashed bg-muted/15 px-2.5 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="label-caps">
                durable activity
              </span>
              <Badge variant="muted">worker transcript</Badge>
              <span className="helper-text">800ch previews · not epoch-linked</span>
            </div>
            <p className="helper-text mt-1">
              These turns predate every prompt this browser sent, or the Worker never returned a
              submissionId for them, so the console will not attach them to an epoch.
            </p>
          </div>

          <div className="mt-3 flex flex-col gap-4">
            {timeline.durableEpochs.map((epoch) => (
              <div key={epoch.id} className="flex flex-col gap-3" data-durable-epoch={epoch.id}>
                <div className="font-mono text-sm text-muted-foreground">
                  durable turn · {epoch.rows[0]?.messageId ?? "—"}
                </div>
                {epoch.rows.map((row) => (
                  <TimelineRowView key={row.id} row={row} />
                ))}
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
