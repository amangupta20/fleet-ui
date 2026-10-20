import { cn } from "@/lib/utils";

/**
 * Agent avatar: a neutral tile with the agent's initials.
 *
 * It used to pick one of six palette slots by hashing the name, which put
 * semantic colours on a decorative element — a red avatar read as "this
 * agent is in error" and a blue one as "this agent is interactive". Colour in
 * the rail is reserved for state (the lifecycle chip) and source (the origin
 * badge); the initials carry the identity.
 */
const AVATAR = "bg-muted text-muted-foreground border-border";

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
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md border font-medium",
        size === "sm" && "size-6 text-sm",
        size === "md" && "size-8 text-sm",
        size === "lg" && "size-10 text-sm",
        AVATAR,
        className,
      )}
      aria-hidden
    >
      {agentInitials(name)}
    </span>
  );
}
