"use client";

import {
  keepPreviousData,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getAgentState,
  getHealth,
  getMessages,
  getModels,
  promptAgent,
  resetAgent,
  type PromptResult,
} from "@/lib/fleet-api";
import type { PromptRequestBody } from "@/lib/fleet-types";

export const fleetKeys = {
  all: ["fleet"] as const,
  health: () => [...fleetKeys.all, "health"] as const,
  models: () => [...fleetKeys.all, "models"] as const,
  agents: () => [...fleetKeys.all, "agent"] as const,
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
    },
  });
}
