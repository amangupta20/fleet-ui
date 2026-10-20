"use client";

import { useMemo } from "react";
import {
  keepPreviousData,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { mergeAgentRows } from "@/lib/agent-merge";
import {
  fetchPaperclipAgents,
  fetchServerAgents,
  getAgentState,
  getHealth,
  getMessages,
  getModels,
  promptAgent,
  resetAgent,
  type PromptResult,
} from "@/lib/fleet-api";
import type { PromptRequestBody } from "@/lib/fleet-types";
import { useFleetStore } from "@/stores/fleet-store";

export const fleetKeys = {
  all: ["fleet"] as const,
  health: () => [...fleetKeys.all, "health"] as const,
  models: () => [...fleetKeys.all, "models"] as const,
  agents: () => [...fleetKeys.all, "agent"] as const,
  serverAgents: () => [...fleetKeys.all, "agents", "server"] as const,
  paperclipAgents: () => [...fleetKeys.all, "agents", "paperclip"] as const,
  state: (name: string) => [...fleetKeys.agents(), name, "state"] as const,
  messages: (name: string, limit: number) =>
    [...fleetKeys.agents(), name, "messages", limit] as const,
};

export function useHealth() {
  return useQuery({
    queryKey: fleetKeys.health(),
    queryFn: ({ signal }) => getHealth(signal),
    refetchInterval: 15_000,
    staleTime: 8_000,
    retry: 1,
  });
}

export function useModels() {
  return useQuery({
    queryKey: fleetKeys.models(),
    queryFn: ({ signal }) => getModels(signal),
    staleTime: 30_000,
    retry: 1,
    refetchOnWindowFocus: true,
  });
}

/**
 * Server-side agent index (`GET /agents` via the same-origin proxy).
 * `fetchServerAgents` degrades to `[]` on 502/offline, so this query never
 * blocks the rail: local recents remain usable while the Worker is down.
 */
export function useServerAgents() {
  return useQuery({
    queryKey: fleetKeys.serverAgents(),
    queryFn: ({ signal }) => fetchServerAgents(signal),
    staleTime: 20_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    retry: 0,
  });
}

/** Optional Paperclip directory; disabled/misconfigured yields `enabled:false`. */
export function usePaperclipAgents() {
  return useQuery({
    queryKey: fleetKeys.paperclipAgents(),
    queryFn: ({ signal }) => fetchPaperclipAgents(signal),
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    retry: 0,
  });
}

/**
 * The rail's single source of truth: union of the fleet index, the optional
 * Paperclip directory, and browser-local recents. Duplicate names collapse with
 * fleet > paperclip > local precedence.
 */
export function useAgentDirectory() {
  const localAgents = useFleetStore((state) => state.agents);
  const server = useServerAgents();
  const paperclip = usePaperclipAgents();
  const rows = useMemo(
    () =>
      mergeAgentRows({
        server: server.data,
        paperclip: paperclip.data?.agents,
        local: localAgents,
      }),
    [localAgents, paperclip.data?.agents, server.data],
  );

  return {
    rows,
    localAgents,
    server,
    paperclip,
    paperclipEnabled: paperclip.data?.enabled === true,
  };
}

export function useAgentState(name: string | null) {
  return useQuery({
    queryKey: fleetKeys.state(name ?? "__none__"),
    queryFn: ({ signal }) => getAgentState(name ?? "", signal),
    enabled: Boolean(name),
    staleTime: 20_000,
    refetchInterval: 60_000,
    retry: 1,
  });
}

export function useAgentStates(names: readonly string[]) {
  return useQueries({
    queries: names.map((name) => ({
      queryKey: fleetKeys.state(name),
      queryFn: ({ signal }: { signal: AbortSignal }) => getAgentState(name, signal),
      staleTime: 20_000,
      refetchInterval: 60_000,
      retry: 1,
    })),
  });
}

export function useMessages(name: string, limit: number, enabled = true) {
  return useQuery({
    queryKey: fleetKeys.messages(name, limit),
    queryFn: ({ signal }) => getMessages(name, limit, signal),
    enabled: Boolean(name) && enabled,
    staleTime: 5_000,
    retry: 1,
    placeholderData: keepPreviousData,
  });
}

export function useResetAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => resetAgent(name),
    onSuccess: (_data, name) => {
      void queryClient.invalidateQueries({ queryKey: fleetKeys.state(name) });
      void queryClient.invalidateQueries({
        queryKey: [...fleetKeys.agents(), name, "messages"],
      });
    },
  });
}

export interface PromptVariables {
  agent: string;
  body: PromptRequestBody;
}

export function usePromptAgent() {
  const queryClient = useQueryClient();
  return useMutation<PromptResult, Error, PromptVariables>({
    mutationFn: ({ agent, body }) => promptAgent(agent, body),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({
        queryKey: [...fleetKeys.agents(), variables.agent, "messages"],
      });
      void queryClient.invalidateQueries({ queryKey: fleetKeys.state(variables.agent) });
      // The Registry bumps lastActive/prompts on every prompt POST.
      void queryClient.invalidateQueries({ queryKey: fleetKeys.serverAgents() });
    },
  });
}
