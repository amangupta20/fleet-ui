import { cn } from "@/lib/utils";

/**
 * Avatar tints come from the OpenCode tokens only (see
 * docs/design-system.md): accent blue, success green, warning orange, danger
 * red and two neutral surfaces.
 */
const PALETTES = [
  "bg-brand/10 text-brand border-brand/30",
  "bg-success/10 text-success border-success/30",
  "bg-warning/10 text-warning border-warning/30",
  "bg-destructive/10 text-destructive border-destructive/30",
  "bg-muted text-muted-foreground border-border",
  "bg-secondary text-secondary-foreground border-border",
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
        "inline-flex shrink-0 items-center justify-center rounded-md border font-medium",
        size === "sm" && "size-6 text-sm",
        size === "md" && "size-8 text-sm",
        size === "lg" && "size-10 text-sm",
        palette,
        className,
      )}
      aria-hidden
    >
      {agentInitials(name)}
    </span>
  );
}
