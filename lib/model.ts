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

export function providerAccent(provider: string): string {
  switch (provider) {
    case "router":
      return "text-emerald-600 dark:text-emerald-400";
    case "opencode-go":
      return "text-sky-600 dark:text-sky-400";
    case "openai":
      return "text-violet-600 dark:text-violet-400";
    case "google":
      return "text-amber-600 dark:text-amber-400";
    default:
      return "text-muted-foreground";
  }
}
