/**
 * Future fleet capabilities. Everything here is a UI stub: flags persist
 * locally and render inert surfaces. None of these keys ever trigger a
 * backend call in v1.
 */
export type FeatureKey =
  | "terminal"
  | "files"
  | "harness"
  | "previews"
  | "mcp"
  | "skills"
  | "queues"
  | "vault"
  | "nodeOps"
  | "analytics";

export interface FeatureDefinition {
  key: FeatureKey;
  label: string;
  description: string;
  icon:
    | "terminal"
    | "files"
    | "sliders"
    | "eye"
    | "plug"
    | "sparkles"
    | "list"
    | "lock"
    | "server"
    | "chart";
  /** Where the stub appears once enabled. */
  surface: string;
  hint: string;
}

export const FEATURES: readonly FeatureDefinition[] = [
  {
    key: "terminal",
    label: "Terminal",
    description: "Interactive shell attached to a fleet node, xterm.js transport planned.",
    icon: "terminal",
    surface: "Pane tab · Labs",
    hint: "xterm.js is installed. The terminal renders locally and sends no bytes to the Worker.",
  },
  {
    key: "files",
    label: "Files & diffs",
    description: "Browse the workspace, preview edits, and review a run's diff.",
    icon: "files",
    surface: "Pane tab · Labs",
    hint: "Read-only placeholder. File transport needs a node-side filesystem API.",
  },
  {
    key: "harness",
    label: "Harness picker",
    description: "Swap the agent harness (Pi Durable today) per pane or run.",
    icon: "sliders",
    surface: "Pane header · Labs",
    hint: "The picker lists only Pi Durable (default) and is disabled.",
  },
  {
    key: "previews",
    label: "Preview URLs",
    description: "Open services started by an agent through signed preview links.",
    icon: "eye",
    surface: "Labs",
    hint: "No preview router is configured in this build.",
  },
  {
    key: "mcp",
    label: "MCP servers",
    description: "Attach Model Context Protocol servers and inspect their tools.",
    icon: "plug",
    surface: "Labs",
    hint: "MCP is not wired to fleet-base yet.",
  },
  {
    key: "skills",
    label: "Skills",
    description: "Reusable instruction packs the fleet can load per agent.",
    icon: "sparkles",
    surface: "Labs",
    hint: "Skill loading is a roadmap item.",
  },
  {
    key: "queues",
    label: "Queues & runs",
    description: "Schedule prompts, fan them out, and follow durable run state.",
    icon: "list",
    surface: "Labs",
    hint: "Queues need a Worker-side API that fleet-base does not expose.",
  },
  {
    key: "vault",
    label: "Vault",
    description: "Store provider credentials and per-agent secrets securely.",
    icon: "lock",
    surface: "Labs",
    hint: "Secrets stay in the Worker environment in v1.",
  },
  {
    key: "nodeOps",
    label: "Node operations",
    description: "Inspect celld nodes, leases, residency, and deploy reloads.",
    icon: "server",
    surface: "Labs",
    hint: "The public Worker API does not expose node internals.",
  },
  {
    key: "analytics",
    label: "Analytics",
    description: "Token, latency, and completion trends across agents and models.",
    icon: "chart",
    surface: "Labs",
    hint: "Analytics will roll up locally stored runs in a future release.",
  },
] as const;

export const FEATURE_KEYS = FEATURES.map((feature) => feature.key);

export type FeatureFlags = Record<FeatureKey, boolean>;

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = Object.fromEntries(
  FEATURE_KEYS.map((key) => [key, false]),
) as FeatureFlags;

export function isFeatureKey(value: string): value is FeatureKey {
  return (FEATURE_KEYS as readonly string[]).includes(value);
}
