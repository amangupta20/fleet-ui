"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { ChatRun } from "@/lib/chat-types";

export interface LastRequest {
  requestId: string;
  prompt: string;
  model: string | null;
  at: number;
}

const MAX_RUNS_PER_AGENT = 60;
const MAX_TEXT_CHARS = 80_000;

interface ChatStore {
  runsByAgent: Record<string, ChatRun[]>;
  lastRequestByAgent: Record<string, LastRequest>;
  addRun: (agent: string, run: ChatRun) => void;
  removeRun: (agent: string, runId: string) => void;
  clearAgent: (agent: string) => void;
  setLastRequest: (agent: string, request: LastRequest) => void;
  clearAll: () => void;
}

function trimRun(run: ChatRun): ChatRun {
  return run.text.length > MAX_TEXT_CHARS
    ? { ...run, text: `${run.text.slice(0, MAX_TEXT_CHARS)}\n\n[truncated locally at ${MAX_TEXT_CHARS} characters]` }
    : run;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      runsByAgent: {},
      lastRequestByAgent: {},

      addRun: (agent, run) => {
        set((state) => {
          const existing = state.runsByAgent[agent] ?? [];
          const next = [...existing, trimRun(run)].slice(-MAX_RUNS_PER_AGENT);
          return { runsByAgent: { ...state.runsByAgent, [agent]: next } };
        });
      },

      removeRun: (agent, runId) => {
        set((state) => {
          const existing = state.runsByAgent[agent] ?? [];
          return {
            runsByAgent: {
              ...state.runsByAgent,
              [agent]: existing.filter((run) => run.id !== runId),
            },
          };
        });
      },

      clearAgent: (agent) => {
        set((state) => {
          const runsByAgent = { ...state.runsByAgent };
          delete runsByAgent[agent];
          return { runsByAgent };
        });
      },

      setLastRequest: (agent, request) => {
        set((state) => ({
          lastRequestByAgent: { ...state.lastRequestByAgent, [agent]: request },
        }));
      },

      clearAll: () => set({ runsByAgent: {}, lastRequestByAgent: {} }),
    }),
    {
      name: "fleet-ui.chat.v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
