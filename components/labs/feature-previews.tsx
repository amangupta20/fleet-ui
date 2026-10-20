"use client";

import {
  CircleSlash,
  CloudOff,
  KeyRound,
  Lock,
  Play,
  Plus,
  Server,
} from "lucide-react";

import { TerminalStub } from "@/components/workspace/terminal-stub";
import { DiffRegion } from "@/components/workspace/diff-region";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function Frame({ children, note }: { children: React.ReactNode; note?: string }) {
  return (
    <div className="mt-3 overflow-hidden rounded-lg border bg-muted/10">
      {children}
      {note ? (
        <div className="border-t bg-background/40 px-2.5 py-1.5 text-sm text-muted-foreground">{note}</div>
      ) : null}
    </div>
  );
}

export function TerminalPreview() {
  return (
    <Frame note="xterm.js mounts locally. No PTY, no WebSocket, no Worker request.">
      <div className="h-[230px]">
        <TerminalStub agent="labs" />
      </div>
    </Frame>
  );
}

export function FilesPreview() {
  return (
    <Frame note="Empty on purpose — file transport is not implemented, so no sample diff is drawn.">
      <div className="p-2">
        <DiffRegion path={null} diff={null} />
      </div>
    </Frame>
  );
}

export function HarnessPreview() {
  return (
    <Frame note="The picker cannot swap harnesses in v1.">
      <div className="flex items-center gap-2 p-3">
        <div className="flex-1 rounded-md border bg-background px-2.5 py-2 text-sm">
          <span className="text-muted-foreground">Harness · </span>Pi Durable (default)
        </div>
        <Button variant="outline" size="sm" disabled>
          Change
        </Button>
      </div>
    </Frame>
  );
}

export function PreviewsPreview() {
  return (
    <Frame note="A preview router needs signed upstream support first.">
      <div className="space-y-2 p-3">
        <div className="flex items-center gap-2 rounded-md border bg-background px-2.5 py-2 font-mono text-sm text-muted-foreground">
          <CloudOff className="h-3.5 w-3.5" />
          https://preview.example.invalid/agent/main
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>No services registered</span>
          <Badge variant="muted" className="text-sm">not routed</Badge>
        </div>
      </div>
    </Frame>
  );
}

export function McpPreview() {
  return (
    <Frame note="MCP client wiring is deliberately absent from fleet-base.">
      <div className="divide-y">
        {[
          { name: "filesystem", tools: 0 },
          { name: "github", tools: 0 },
          { name: "postgres", tools: 0 },
        ].map((server) => (
          <div key={server.name} className="flex items-center gap-2 px-3 py-2 text-sm">
            <Server className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-mono">{server.name}</span>
            <span className="ml-auto text-sm text-muted-foreground">disconnected</span>
            <Button variant="ghost" size="icon-sm" className="h-6 w-6" disabled aria-label={`Add ${server.name}`}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </Frame>
  );
}

export function SkillsPreview() {
  return (
    <Frame note="Instruction packs are not loaded or installed in v1.">
      <div className="flex flex-wrap gap-1.5 p-3">
        {["code-review", "release-notes", "incident-triage", "repo-audit"].map((skill) => (
          <span
            key={skill}
            className="inline-flex items-center gap-1 rounded border bg-background px-2 py-1 font-mono text-sm text-muted-foreground"
          >
            <Lock className="h-2.5 w-2.5" /> {skill}
          </span>
        ))}
      </div>
    </Frame>
  );
}

export function QueuesPreview() {
  return (
    <Frame note="No scheduler exists; runs here are static mock rows.">
      <div className="divide-y">
        {[
          { name: "nightly-audit", schedule: "0 3 * * *", state: "paused" },
          { name: "release-summary", schedule: "manual", state: "paused" },
        ].map((queue) => (
          <div key={queue.name} className="flex items-center gap-2 px-3 py-2 text-sm">
            <Play className="h-3 w-3 text-muted-foreground" />
            <span className="font-mono">{queue.name}</span>
            <span className="ml-auto font-mono text-sm text-muted-foreground">{queue.schedule}</span>
            <Badge variant="muted" className="text-sm">{queue.state}</Badge>
          </div>
        ))}
      </div>
    </Frame>
  );
}

export function VaultPreview() {
  return (
    <Frame note="Secrets remain in the Worker environment. Nothing is stored by this UI.">
      <div className="divide-y">
        {["ROUTER_API_KEY", "OPENCODE_API_KEY", "OPENAI_API_KEY"].map((key) => (
          <div key={key} className="flex items-center gap-2 px-3 py-2 text-sm">
            <KeyRound className="h-3 w-3 text-muted-foreground" />
            <span className="font-mono">{key}</span>
            <span className="ml-auto font-mono text-muted-foreground">••••••••</span>
            <Lock className="h-3 w-3 text-muted-foreground" />
          </div>
        ))}
      </div>
    </Frame>
  );
}

export function NodeOpsPreview() {
  return (
    <Frame note="The public Worker API doesn't expose celld node internals.">
      <div className="grid grid-cols-2 gap-2 p-3 text-sm">
        {[
          { id: "node-a", lease: "stable", load: 62 },
          { id: "node-b", lease: "expiring", load: 88 },
        ].map((node) => (
          <div key={node.id} className="rounded-md border bg-background p-2">
            <div className="flex items-center justify-between">
              <span className="font-mono">{node.id}</span>
              <Badge variant={node.lease === "stable" ? "success" : "warning"} className="text-sm">
                {node.lease}
              </Badge>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-brand/60" style={{ width: `${node.load}%` }} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{node.load}% simulated load</p>
          </div>
        ))}
      </div>
    </Frame>
  );
}

export function AnalyticsPreview() {
  const bars = [28, 42, 36, 58, 50, 74, 66, 82, 70, 91, 78, 86];
  return (
    <Frame note="Analytics will aggregate locally stored runs in a future release.">
      <div className="p-3">
        <div className="flex h-24 items-end gap-1">
          {bars.map((height, index) => (
            <div
              key={index}
              className="flex-1 rounded-sm bg-brand/35"
              style={{ height: `${height}%` }}
              aria-hidden
            />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-sm text-muted-foreground">
          <span>runs / week</span>
          <span className="flex items-center gap-1">
            <CircleSlash className="h-2.5 w-2.5" /> sample shape only
          </span>
        </div>
      </div>
    </Frame>
  );
}
