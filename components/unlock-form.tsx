"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Loader2, LockKeyhole } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function UnlockForm({ next }: { next: string }) {
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!password) {
      setError("Enter the console password.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/auth/unlock", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password, next }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string; next?: string }
        | null;
      if (!response.ok) {
        setError(
          response.status === 429
            ? "Too many attempts. Wait a few minutes and try again."
            : (payload?.error ?? "Could not unlock. Try again."),
        );
        setPassword("");
        inputRef.current?.focus();
        return;
      }
      window.location.assign(payload?.next ?? next);
    } catch {
      setError("The Fleet UI server did not respond.");
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">Console password</Label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            ref={inputRef}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError(null);
            }}
            placeholder="••••••••••"
            className="pl-9"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "unlock-error" : undefined}
          />
        </div>
        {error ? (
          <p id="unlock-error" role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
        {pending ? "Unlocking…" : "Unlock console"}
      </Button>
      <p className="text-center text-sm leading-relaxed text-muted-foreground">
        Set on the server as <code className="font-mono">FLEET_UI_PASSWORD</code>. Sessions last seven days.
      </p>
    </form>
  );
}
