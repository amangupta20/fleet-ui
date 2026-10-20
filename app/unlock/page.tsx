import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LockKeyhole, ShieldCheck } from "lucide-react";

import { UnlockForm } from "@/components/unlock-form";
import { Logo } from "@/components/logo";
import { isAuthEnabled, sanitizeNextPath } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Unlock" };

export default async function UnlockPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  if (!isAuthEnabled()) redirect("/");
  const params = await searchParams;
  const nextValue = Array.isArray(params.next) ? params.next[0] : params.next;
  const next = sanitizeNextPath(nextValue);

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div className="pointer-events-none absolute inset-0 fleet-grid-bg opacity-70" aria-hidden />
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[780px] -translate-x-1/2 rounded bg-brand/10 blur-[120px]"
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo className="mb-4 size-12 rounded" />
          <h1 className="text-base font-bold leading-[1.5]">Fleet UI is locked</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Enter the shared console password to reach your agents.
          </p>
        </div>

        <div className="rounded border bg-card/90 p-6 backdrop-blur">
          <div className="mb-5 flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="size-3.5 text-brand" />
            Password gate · HttpOnly session
          </div>
          <UnlockForm next={next} />
        </div>

        <div className="mt-6 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
          <LockKeyhole className="size-3" />
          The Worker is never exposed to this browser directly.
        </div>
      </div>
    </div>
  );
}
