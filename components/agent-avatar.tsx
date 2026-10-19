import { cn } from "@/lib/utils";

const PALETTES = [
  "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  "bg-sky-500/12 text-sky-700 dark:text-sky-300 border-sky-500/20",
  "bg-amber-500/12 text-amber-700 dark:text-amber-300 border-amber-500/20",
  "bg-violet-500/12 text-violet-700 dark:text-violet-300 border-violet-500/20",
  "bg-rose-500/12 text-rose-700 dark:text-rose-300 border-rose-500/20",
  "bg-teal-500/12 text-teal-700 dark:text-teal-300 border-teal-500/20",
] as const;

function hashName(name: string): number {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function agentInitials(name: string): string {
  const cleaned = name.trim();
  if (!cleaned) return "?";
  const parts = cleaned.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase();
}

export function AgentAvatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const palette = PALETTES[hashName(name) % PALETTES.length] ?? PALETTES[0];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md border font-semibold",
        size === "sm" && "h-6 w-6 text-[9px]",
        size === "md" && "h-8 w-8 text-[11px]",
        size === "lg" && "h-10 w-10 text-sm",
        palette,
        className,
      )}
      aria-hidden
    >
      {agentInitials(name)}
    </span>
  );
}
