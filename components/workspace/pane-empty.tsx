"use client";

import { useState } from "react";
import { Plus, SquareDashed } from "lucide-react";

import { AddAgentDialog } from "@/components/add-agent-dialog";
import { AgentAvatar } from "@/components/agent-avatar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAgentDirectory } from "@/hooks/use-fleet";
import { decodeAgentName } from "@/lib/agent-name";
import { useFleetStore } from "@/stores/fleet-store";

export function PaneEmpty({ index }: { index: number }) {
  const { rows: agents } = useAgentDirectory();
  const setPaneAgent = useFleetStore((state) => state.setPaneAgent);
  const rememberAgent = useFleetStore((state) => state.rememberAgent);
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="pane-surface h-full items-center justify-center">
      <div className="flex w-full max-w-xs flex-col items-center px-5 text-center">
        <span className="mb-4 flex size-11 items-center justify-center rounded border border-dashed bg-muted/30">
          <SquareDashed className="size-5 text-muted-foreground" />
        </span>
        <h3 className="text-sm font-medium">Pane {index + 1} is empty</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Drop an agent here to run independent conversations side by side.
        </p>
        {agents.length > 0 ? (
          <Select
            value=""
            onValueChange={(value) => {
              if (!value) return;
              rememberAgent(value);
              setPaneAgent(index, value);
            }}
          >
            <SelectTrigger className="mt-4 h-8 w-full text-sm">
              <SelectValue placeholder="Choose an agent…" />
            </SelectTrigger>
            <SelectContent>
              {agents.map((agent) => {
                const displayName = agent.local?.label?.trim() || decodeAgentName(agent.name);
                return (
                  <SelectItem key={agent.name} value={agent.name}>
                    <span className="flex items-center gap-2">
                      <AgentAvatar name={displayName} size="sm" />
                      {displayName}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        ) : null}
        <Button variant="outline" size="sm" className="mt-2 h-8 w-full text-sm" onClick={() => setAddOpen(true)}>
          <Plus /> New agent
        </Button>
      </div>
      <AddAgentDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
