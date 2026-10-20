"use client";

import Link from "next/link";
import {
  ChartNoAxesColumn,
  Eye,
  FileDiff,
  FlaskConical,
  ListChecks,
  LockKeyhole,
  Plug,
  ServerCog,
  SlidersHorizontal,
  Sparkles,
  SquareTerminal,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";

import {
  AnalyticsPreview,
  FilesPreview,
  HarnessPreview,
  McpPreview,
  NodeOpsPreview,
  PreviewsPreview,
  QueuesPreview,
  SkillsPreview,
  TerminalPreview,
  VaultPreview,
} from "@/components/labs/feature-previews";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FEATURES, type FeatureDefinition, type FeatureKey } from "@/lib/features";
import { cn } from "@/lib/utils";
import { useFleetStore } from "@/stores/fleet-store";

const ICONS: Record<FeatureDefinition["icon"], typeof SquareTerminal> = {
  terminal: SquareTerminal,
  files: FileDiff,
  sliders: SlidersHorizontal,
  eye: Eye,
  plug: Plug,
  sparkles: Sparkles,
  list: ListChecks,
  lock: LockKeyhole,
  server: ServerCog,
  chart: ChartNoAxesColumn,
};

function Preview({ featureKey }: { featureKey: FeatureKey }) {
  switch (featureKey) {
    case "terminal":
      return <TerminalPreview />;
    case "files":
      return <FilesPreview />;
    case "harness":
      return <HarnessPreview />;
    case "previews":
      return <PreviewsPreview />;
    case "mcp":
      return <McpPreview />;
    case "skills":
      return <SkillsPreview />;
    case "queues":
      return <QueuesPreview />;
    case "vault":
      return <VaultPreview />;
    case "nodeOps":
      return <NodeOpsPreview />;
    case "analytics":
      return <AnalyticsPreview />;
  }
}

const V1_SURFACES = [
  "Multi-pane chat",
  "Durable transcript",
  "Providers dashboard",
  "Idempotent request IDs",
  "PWA shell",
  "Password gate",
];

export function LabsPage() {
  const features = useFleetStore((state) => state.features);
  const toggleFeature = useFleetStore((state) => state.toggleFeature);
  const enabledCount = Object.values(features).filter(Boolean).length;

  return (
    <div className="mx-auto w-full max-w-7xl px-3 py-4 md:px-6 md:py-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold leading-[1.5]">Labs</h1>
            <Badge variant="outline" className="font-mono text-sm">
              future flags
            </Badge>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Ten planned capabilities with local-only stub surfaces. Enabling a flag changes what this browser
            renders — it never changes the Worker or opens a backend connection.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{enabledCount} enabled</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              FEATURES.forEach((feature) => toggleFeature(feature.key, false));
              toast.success("All preview flags reset");
            }}
          >
            Reset flags
          </Button>
          <Button size="sm" asChild>
            <Link href="/">
              <FlaskConical className="size-3.5" /> Workspace
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-5 rounded border border-brand/15 bg-brand/[0.035] p-4">
        <div className="flex items-start gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded border border-brand/20 bg-brand/10">
            <FlaskConical className="size-4 text-brand" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium">Stubs, not fake features</p>
            <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
              Every preview below is inert and clearly labelled. Terminal renders a real xterm.js canvas locally;
              files, MCP, queues, vault, node ops, and analytics are static placeholders. Terminal and Files also
              appear as pane tabs when enabled.
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {V1_SURFACES.map((surface) => (
                <Badge key={surface} variant="secondary" className="text-sm">
                  v1 · {surface}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {FEATURES.map((feature) => {
          const Icon = ICONS[feature.icon];
          const enabled = features[feature.key];
          return (
            <Card
              key={feature.key}
              className={cn("overflow-hidden transition-colors", enabled && "border-brand/25 bg-brand/[0.015]")}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-2.5">
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded border",
                        enabled ? "border-brand/25 bg-brand/10 text-brand" : "bg-muted/40 text-muted-foreground",
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <CardTitle className="flex flex-wrap items-center gap-1.5 text-sm">
                        {feature.label}
                        <Badge variant={enabled ? "default" : "muted"} className="text-sm">
                          {enabled ? "preview on" : "planned"}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-0.5 text-sm leading-relaxed">
                        {feature.description}
                      </CardDescription>
                    </div>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Switch
                          checked={enabled}
                          onCheckedChange={(checked) => toggleFeature(feature.key, checked)}
                          aria-label={`Toggle ${feature.label} preview`}
                        />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>{enabled ? "Hide stub preview" : "Show stub preview"}</TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className="font-mono text-sm">
                    {feature.surface}
                  </Badge>
                  <Badge variant="muted" className="text-sm">
                    no backend calls
                  </Badge>
                  {feature.key === "terminal" || feature.key === "files" ? (
                    <Link href="/" className="ml-auto text-sm text-brand hover:underline">
                      add pane tab →
                    </Link>
                  ) : null}
                </div>
                {enabled ? (
                  <>
                    <Preview featureKey={feature.key} />
                    <p className="mt-2 flex items-start gap-1.5 text-sm leading-relaxed text-muted-foreground">
                      <Wand2 className="mt-0.5 size-3 shrink-0" />
                      {feature.hint}
                    </p>
                  </>
                ) : (
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{feature.hint}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <SquareTerminal className="size-4 text-brand" /> Terminal & files flag behavior
            </CardTitle>
            <CardDescription className="text-sm">
              Enabling terminal or files adds a tab inside each agent pane. Both are safe to leave on — they never
              issue a request.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              The terminal is a real xterm.js instance with input disabled. Files is an empty diff region: no file transport exists yet, so nothing is drawn.
              Turning either flag off removes the tab immediately; active panes fall back to Chat.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Wand2 className="size-4 text-brand" /> Delivery roadmap
            </CardTitle>
            <CardDescription className="text-sm">What must exist before these stubs become features.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
              <li>• Worker endpoints for files, queues, preview routing, MCP, and skills</li>
              <li>• Per-agent auth and scoped secrets for vault and node operations</li>
              <li>• Streaming terminal transport (WebSocket/SSE) with backpressure</li>
              <li>• Analytics rollups from durable run metrics, not browser-only logs</li>
            </ul>
            <p className="mt-3 text-sm text-muted-foreground">
              See the README roadmap. These stubs intentionally stop at the UI boundary.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
