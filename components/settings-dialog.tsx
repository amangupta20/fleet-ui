"use client";

import { useState } from "react";
import { Keyboard, RotateCcw, Settings2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useChatStore } from "@/stores/chat-store";
import { useFleetStore } from "@/stores/fleet-store";

export function SettingsDialog({
  open,
  onOpenChange,
  authEnabled,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  authEnabled: boolean;
}) {
  const autoRequestId = useFleetStore((state) => state.autoRequestId);
  const setAutoRequestId = useFleetStore((state) => state.setAutoRequestId);
  const transcriptLimit = useFleetStore((state) => state.transcriptLimit);
  const setTranscriptLimit = useFleetStore((state) => state.setTranscriptLimit);
  const agents = useFleetStore((state) => state.agents);
  const clearAllChat = useChatStore((state) => state.clearAll);
  const [erasePending, setErasePending] = useState(false);

  const eraseLocalState = () => {
    setErasePending(true);
    try {
      window.localStorage.removeItem("fleet-ui.store.v1");
      window.localStorage.removeItem("fleet-ui.chat.v1");
    } finally {
      window.location.reload();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-brand" /> Console settings
          </DialogTitle>
          <DialogDescription>
            Preferences live in this browser. Fleet state itself stays in the Worker's Durable Objects.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <section className="space-y-4">
            <h3 className="text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">Prompting</h3>
            <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="auto-request-id" className="cursor-pointer">Auto-generate request IDs</Label>
                <p className="text-sm text-muted-foreground">
                  Fresh UUID per prompt. Turn off to type or reuse an idempotency key manually.
                </p>
              </div>
              <Switch id="auto-request-id" checked={autoRequestId} onCheckedChange={setAutoRequestId} />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="transcript-limit">Server transcript fetch</Label>
                <p className="text-sm text-muted-foreground">Tail size for the durable transcript tab.</p>
              </div>
              <Select
                value={String(transcriptLimit)}
                onValueChange={(value) => setTranscriptLimit(Number(value))}
              >
                <SelectTrigger id="transcript-limit" className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100].map((limit) => (
                    <SelectItem key={limit} value={String(limit)}>
                      {limit} entries
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>

          <Separator />

          <section className="space-y-3">
            <h3 className="text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">Shortcuts</h3>
            <div className="grid gap-2 rounded-lg border p-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Keyboard className="h-3.5 w-3.5" /> Send prompt
                </span>
                <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-sm">⌘ / Ctrl + Enter</kbd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">New line in prompt</span>
                <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-sm">Shift + Enter</kbd>
              </div>
            </div>
          </section>

          <Separator />

          <section className="space-y-3">
            <h3 className="text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">Local data</h3>
            <p className="text-sm text-muted-foreground">
              {agents.length} agent{agents.length === 1 ? "" : "s"} and their browser-recorded runs are stored in{" "}
              <code className="font-mono">localStorage</code>. Server transcripts are never deleted here.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  clearAllChat();
                  toast.success("Browser chat history cleared");
                }}
              >
                Clear chat history
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="outline" size="sm" className="text-destructive">
                    <RotateCcw className="h-3.5 w-3.5" /> Reset local workspace
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Erase local Fleet UI state?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Removes the agent list, pane layout, feature flags, and browser chat logs. Durable agents and
                      their server transcripts are untouched.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep my data</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={eraseLocalState}
                      disabled={erasePending}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      <Trash2 className="h-4 w-4" /> Erase and reload
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </section>

          <Separator />

          <section className="space-y-1.5">
            <h3 className="text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">Security</h3>
            <p className="text-sm text-muted-foreground">
              {authEnabled
                ? "Password gate is enabled. The session cookie is HttpOnly and HMAC-signed; use the lock button to end it."
                : "Password gate is off. Set FLEET_UI_PASSWORD on the server and restart to require a password."}
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
