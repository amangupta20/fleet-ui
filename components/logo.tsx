import { cn } from "@/lib/utils";

/**
 * Brand mark. Colours come from the OpenCode tokens (docs/design-system.md):
 * the mark is drawn with `currentColor` so it inherits the token colours.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded border border-brand/30 bg-brand/10 text-brand",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 64 64" className="size-6">
        <g stroke="currentColor" strokeWidth="4" strokeLinecap="round">
          <path d="M18 20h28" />
          <path d="M18 32h13" />
          <path d="M18 44h28" />
        </g>
        <circle cx="46" cy="32" r="4.5" fill="currentColor" />
        <circle cx="31" cy="20" r="3" fill="currentColor" opacity="0.6" />
        <circle cx="31" cy="44" r="3" fill="currentColor" opacity="0.6" />
      </svg>
    </span>
  );
}

export function Brand({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-w-0 items-center gap-2.5 rounded text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label="Fleet UI home"
    >
      <Logo className="transition-transform duration-300 group-hover:-rotate-3" />
      <span className="min-w-0">
        <span className="block text-sm font-medium leading-tight tracking-tight">Fleet UI</span>
        <span className="block truncate font-mono text-sm leading-tight text-muted-foreground">
          celld · pi-durable
        </span>
      </span>
    </button>
  );
}
