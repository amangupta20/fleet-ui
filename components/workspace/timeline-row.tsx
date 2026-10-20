"use client";

import {
  AlertTriangle,
  CircleDot,
  FileCode2,
  ShieldQuestion,
  Terminal,
  User,
  Wrench,
} from "lucide-react";

import { DiffRegion } from "@/components/workspace/diff-region";
import { Markdown } from "@/components/workspace/markdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { touchesFiles, type TimelineRow } from "@/lib/timeline";
import { cn } from "@/lib/utils";

/**
 * One timeline row.
 *
 * Each row type gets its own rail colour, glyph and type treatment so a turn
 * can be read without reading its text. Colours come from the OpenCode tokens
 * only (see docs/design-system.md).
 */

const RAIL: Record<TimelineRow["type"], string> = {
  user: "border-brand",
  model: "border-success",
  "tool-call": "border-warning",
  "tool-result": "border-muted-foreground/40",
  permission: "border-warning",
  system: "border-border",
};

function RowFrame({
  row,
  glyph,
  children,
}: {
  row: TimelineRow;
  glyph: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("border-l-2 pl-3", RAIL[row.type])} data-row-type={row.type}>
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground">{glyph}</span>
        <span className="font-mono text-sm font-medium uppercase tracking-[0.08em] text-muted-foreground">
          {row.title}
        </span>
        {row.category ? <Badge variant="outline">{row.category}</Badge> : null}
        {row.status && row.status !== "done" ? (
          <Badge variant={row.status === "error" ? "destructive" : "warning"}>{row.status}</Badge>
        ) : null}
      </div>
      <div className="mt-1 min-w-0">{children}</div>
    </div>
  );
}

function UserRow({ row }: { row: TimelineRow }) {
  return (
    <RowFrame row={row} glyph={<User className="size-3.5" />}>
      <p className="whitespace-pre-wrap break-words text-base leading-[1.5] text-foreground">
        {row.text || <span className="text-muted-foreground">(empty prompt)</span>}
      </p>
      {row.detail ? <p className="mt-1 font-mono text-sm text-muted-foreground">{row.detail}</p> : null}
    </RowFrame>
  );
}

function ModelRow({ row }: { row: TimelineRow }) {
  const failed = row.status === "error";
  return (
    <RowFrame row={row} glyph={<CircleDot className="size-3.5" />}>
      {failed ? (
        <div className="rounded border border-destructive/30 bg-destructive/5 p-2">
          <div className="flex items-center gap-1.5 text-sm font-medium text-destructive">
            <AlertTriangle className="size-3.5" /> {row.detail ?? "request failed"}
          </div>
          <pre className="mt-1 whitespace-pre-wrap break-words font-mono text-sm leading-[1.5] text-destructive/90">
            {row.text}
          </pre>
        </div>
      ) : row.text ? (
        <div className="rounded border bg-card/60 p-2.5">
          <Markdown content={row.text} />
        </div>
      ) : (
        <p className="text-sm italic text-muted-foreground">
          {row.detail ?? "The agent returned no text."}
        </p>
      )}
      {row.detail && !failed ? (
        <p className="mt-1 font-mono text-sm text-muted-foreground">{row.detail}</p>
      ) : null}
    </RowFrame>
  );
}

function ToolCallRow({ row }: { row: TimelineRow }) {
  const showsDiff = touchesFiles(row.category ?? "other");
  return (
    <RowFrame row={row} glyph={<Wrench className="size-3.5" />}>
      <div className="rounded border bg-muted/30 px-2 py-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-sm text-foreground">{row.title}</span>
          <Badge variant="warning">tool call</Badge>
        </div>
        {row.detail ? (
          <p className="mt-1 font-mono text-sm text-muted-foreground">{row.detail}</p>
        ) : null}
      </div>
      {showsDiff ? (
        <DiffRegion path={row.filePath ?? null} diff={row.diff ?? null} className="mt-2" />
      ) : (
        <p className="mt-1 font-mono text-sm text-muted-foreground">
          no file region · this tool does not change files
        </p>
      )}
    </RowFrame>
  );
}

function ToolResultRow({ row }: { row: TimelineRow }) {
  return (
    <RowFrame row={row} glyph={<Terminal className="size-3.5" />}>
      <div className="rounded border bg-muted/30 p-2">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-sm text-foreground">{row.title}</span>
          <Badge variant="muted">result</Badge>
          <span className="ml-auto font-mono text-sm text-muted-foreground">800ch max</span>
        </div>
        <pre className="mt-1.5 max-h-56 overflow-auto whitespace-pre-wrap break-words font-mono text-sm leading-[1.5] text-foreground/85">
          {row.text || "(no text content)"}
        </pre>
      </div>
      {row.filePath || row.diff ? (
        <DiffRegion path={row.filePath ?? null} diff={row.diff ?? null} className="mt-2" />
      ) : null}
      {row.detail ? (
        <p className="mt-1 font-mono text-sm text-muted-foreground">{row.detail}</p>
      ) : null}
    </RowFrame>
  );
}

function PermissionRow({ row }: { row: TimelineRow }) {
  return (
    <RowFrame row={row} glyph={<ShieldQuestion className="size-3.5" />}>
      <div className="rounded border border-warning/40 bg-warning/5 p-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-medium text-warning">permission request</span>
          <Badge variant="warning">needs a decision</Badge>
        </div>
        {row.text ? (
          <pre className="mt-1.5 whitespace-pre-wrap break-words font-mono text-sm leading-[1.5] text-foreground/85">
            {row.text}
          </pre>
        ) : null}
        <div className="mt-2 flex items-center gap-2">
          <Button size="xs" variant="outline" disabled>
            Approve
          </Button>
          <Button size="xs" variant="outline" disabled>
            Deny
          </Button>
          <span className="font-mono text-sm text-muted-foreground">
            decisions need a backend endpoint
          </span>
        </div>
      </div>
    </RowFrame>
  );
}

function SystemRow({ row }: { row: TimelineRow }) {
  return (
    <RowFrame row={row} glyph={<FileCode2 className="size-3.5" />}>
      <p className="font-mono text-sm leading-[1.5] text-muted-foreground">
        {row.text || "(no text content)"}
      </p>
    </RowFrame>
  );
}

export function TimelineRowView({ row }: { row: TimelineRow }) {
  switch (row.type) {
    case "user":
      return <UserRow row={row} />;
    case "model":
      return <ModelRow row={row} />;
    case "tool-call":
      return <ToolCallRow row={row} />;
    case "tool-result":
      return <ToolResultRow row={row} />;
    case "permission":
      return <PermissionRow row={row} />;
    default:
      return <SystemRow row={row} />;
  }
}

/**
 * Disabled revert control.
 *
 * The Worker has no checkpoint endpoint, so the control exists, is labelled,
 * and is inert: it never claims to have reverted anything.
 */
export function RevertStub({ epochId }: { epochId: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex" tabIndex={0}>
          <Button variant="outline" size="xs" disabled aria-label={`Revert epoch ${epochId}`}>
            Revert
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>needs backend checkpoint</TooltipContent>
    </Tooltip>
  );
}
