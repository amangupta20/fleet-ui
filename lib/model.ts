import type { ModelRef } from "./fleet-types";

export function modelRefToString(ref: ModelRef | null | undefined): string | null {
  if (!ref) return null;
  return `${ref.provider}/${ref.id}`;
}

export function parseModelRef(value: string): ModelRef | null {
  const slash = value.indexOf("/");
  if (slash <= 0 || slash === value.length - 1) return null;
  return { provider: value.slice(0, slash), id: value.slice(slash + 1) };
}

export function sameModel(a: ModelRef | null | undefined, b: ModelRef | null | undefined): boolean {
  return Boolean(a && b && a.provider === b.provider && a.id === b.id);
}

export const PROVIDER_LABELS: Record<string, string> = {
  router: "Custom router",
  "opencode-go": "OpenCode Go",
  openai: "OpenAI",
  google: "Google Gemini",
};

export const PROVIDER_ORDER = ["router", "opencode-go", "openai", "google"] as const;

export function providerLabel(provider: string): string {
  return PROVIDER_LABELS[provider] ?? provider;
}

/** Provider accents use the OpenCode tokens only (docs/design-system.md). */
export function providerAccent(provider: string): string {
  switch (provider) {
    case "router":
      return "text-brand";
    case "opencode-go":
      return "text-success";
    case "openai":
      return "text-warning";
    case "google":
      return "text-destructive";
    default:
      return "text-muted-foreground";
  }
}
