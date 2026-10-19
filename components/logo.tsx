import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-primary/30 bg-[#0b0f0d] shadow-[inset_0_1px_0_rgba(255,255,255,.06)]",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 64 64" className="h-6 w-6">
        <g stroke="#34d399" strokeWidth="4" strokeLinecap="round">
          <path d="M18 20h28" />
          <path d="M18 32h13" />
          <path d="M18 44h28" />
        </g>
        <circle cx="46" cy="32" r="4.5" fill="#34d399" />
        <circle cx="31" cy="20" r="3" fill="#5eead4" />
        <circle cx="31" cy="44" r="3" fill="#5eead4" />
      </svg>
    </span>
  );
}

export function Brand({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-2.5 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label="Fleet UI home"
    >
      <Logo className="transition-transform duration-300 group-hover:-rotate-3" />
      <span className="min-w-0">
        <span className="block text-[13px] font-semibold leading-tight tracking-tight">Fleet UI</span>
        <span className="block font-mono text-[10px] leading-tight text-muted-foreground">
          celld · pi-durable
        </span>
      </span>
    </button>
  );
}
