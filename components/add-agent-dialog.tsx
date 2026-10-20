"use client";

import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { AgentAvatar } from "@/components/agent-avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MAX_AGENT_NAME_LENGTH } from "@/lib/agent-name";
import { useFleetStore } from "@/stores/fleet-store";

interface AddAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddAgentDialog({ open, onOpenChange }: AddAgentDialogProps) {
  const addAgent = useFleetStore((state) => state.addAgent);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setName("");
    setError(null);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 60);
    return () => window.clearTimeout(timer);
  }, [open]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const result = addAgent(name);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast.success("Agent added", { description: `${result.name} is ready in the active pane.` });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="size-4 text-brand" /> Add an agent
            </DialogTitle>
            <DialogDescription>
              Any Durable Object name works — <code className="font-mono text-foreground">alice</code>,{" "}
              <code className="font-mono text-foreground">repo-review</code>, or{" "}
              <code className="font-mono text-foreground">prod-oncall</code>. The name is the fleet cell.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 space-y-2">
            <Label htmlFor="agent-name">Agent name</Label>
            <div className="flex items-center gap-2">
              <AgentAvatar name={name || "new"} />
              <Input
                id="agent-name"
                ref={inputRef}
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setError(null);
                }}
                placeholder="e.g. alice"
                maxLength={MAX_AGENT_NAME_LENGTH}
                autoComplete="off"
                spellCheck={false}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "agent-name-error" : "agent-name-hint"}
              />
            </div>
            {error ? (
              <p id="agent-name-error" className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : (
              <p id="agent-name-hint" className="text-sm text-muted-foreground">
                Stored in this browser. No agent is created on the server until the first prompt.
              </p>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              <Plus className="h-4 w-4" /> Add agent
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
