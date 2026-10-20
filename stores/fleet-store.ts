"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { normalizeAgentName, validateAgentName } from "@/lib/agent-name";
import type { AgentRecord } from "@/lib/fleet-types";
import {
  DEFAULT_FEATURE_FLAGS,
  type FeatureFlags,
  type FeatureKey,
} from "@/lib/features";

export type Layout = 1 | 2 | 3 | 4;
export type PaneAssignment = string | null;

export interface FleetStore {
  agents: AgentRecord[];
  layout: Layout;
  activePane: number;
  /** Always four slots; indexes >= layout are dormant but keep their agent. */
  panes: [PaneAssignment, PaneAssignment, PaneAssignment, PaneAssignment];
  features: FeatureFlags;
  autoRequestId: boolean;
  transcriptLimit: number;
  addAgent: (rawName: string) => { ok: true; name: string } | { ok: false; error: string };
  /** Adopt a server/Paperclip name into local recents without opening it. */
  rememberAgent: (name: string) => void;
  removeAgent: (name: string) => void;
  renameAgent: (name: string, label: string) => void;
  toggleAgentStar: (name: string) => void;
  setAgentModel: (name: string, model: string | null) => void;
  setLayout: (layout: Layout) => void;
  setActivePane: (index: number) => void;
  setPaneAgent: (index: number, name: string | null) => void;
  openAgentInActivePane: (name: string) => void;
  toggleFeature: (key: FeatureKey, enabled?: boolean) => void;
  setAutoRequestId: (enabled: boolean) => void;
  setTranscriptLimit: (limit: number) => void;
  resetWorkspace: () => void;
}

const DEFAULT_AGENTS: AgentRecord[] = [
  { name: "main", addedAt: Date.now(), modelOverride: null, label: null, starred: false },
];

const INITIAL_PANES: FleetStore["panes"] = ["main", null, null, null];

function sanitizeLayout(value: number): Layout {
  return value === 2 || value === 3 || value === 4 ? value : 1;
}

function clampPane(index: number): number {
  if (!Number.isFinite(index)) return 0;
  return Math.min(3, Math.max(0, Math.round(index)));
}

export const useFleetStore = create<FleetStore>()(
  persist(
    (set, get) => ({
      agents: DEFAULT_AGENTS,
      layout: 1,
      activePane: 0,
      panes: INITIAL_PANES,
      features: DEFAULT_FEATURE_FLAGS,
      autoRequestId: true,
      transcriptLimit: 50,

      addAgent: (rawName) => {
        const result = validateAgentName(rawName);
        if (!result.ok) return result;
        const existing = get().agents.find(
          (agent) => agent.name.toLowerCase() === result.name.toLowerCase(),
        );
        if (existing) {
          // "Any :name" means we can still focus an existing agent, but never
          // create duplicate favicon entries in the rail.
          get().openAgentInActivePane(existing.name);
          return { ok: true, name: existing.name };
        }
        const record: AgentRecord = {
          name: result.name,
          addedAt: Date.now(),
          modelOverride: null,
          label: null,
          starred: false,
        };
        set((state) => ({ agents: [...state.agents, record] }));
        get().openAgentInActivePane(result.name);
        return { ok: true, name: result.name };
      },

      rememberAgent: (rawName) => {
        // Preserve the canonical server name (trim only). User-entered names are
        // normalized by validateAgentName before they reach this point.
        const name = rawName.trim();
        if (!name) return;
        if (get().agents.some((agent) => agent.name === name)) return;
        const record: AgentRecord = {
          name,
          addedAt: Date.now(),
          modelOverride: null,
          label: null,
          starred: false,
        };
        set((state) => ({ agents: [...state.agents, record] }));
      },

      removeAgent: (name) => {
        set((state) => {
          const panes = state.panes.map((pane) =>
            pane === name ? null : pane,
          ) as FleetStore["panes"];
          return {
            agents: state.agents.filter((agent) => agent.name !== name),
            panes,
          };
        });
      },

      renameAgent: (name, rawLabel) => {
        const label = normalizeAgentName(rawLabel);
        if (label.length > 64) return;
        get().rememberAgent(name);
        set((state) => ({
          agents: state.agents.map((agent) =>
            agent.name === name ? { ...agent, label: label || null } : agent,
          ),
        }));
      },

      toggleAgentStar: (name) => {
        get().rememberAgent(name);
        set((state) => ({
          agents: state.agents.map((agent) =>
            agent.name === name ? { ...agent, starred: !agent.starred } : agent,
          ),
        }));
      },

      setAgentModel: (name, model) => {
        set((state) => ({
          agents: state.agents.map((agent) =>
            agent.name === name ? { ...agent, modelOverride: model } : agent,
          ),
        }));
      },

      setLayout: (layout) => {
        const next = sanitizeLayout(layout);
        set((state) => ({
          layout: next,
          activePane: Math.min(state.activePane, next - 1),
        }));
      },

      setActivePane: (index) => {
        const { layout } = get();
        const next = Math.min(clampPane(index), layout - 1);
        set({ activePane: next });
      },

      setPaneAgent: (index, name) => {
        const pane = clampPane(index);
        set((state) => {
          const panes = [...state.panes] as FleetStore["panes"];
          panes[pane] = name;
          return { panes };
        });
      },

      openAgentInActivePane: (name) => {
        // Clicking a server/Paperclip row adopts its name into local recents;
        // the merged source stays fleet/paperclip thanks to precedence.
        get().rememberAgent(name);
        const { activePane, panes, layout } = get();
        const index = Math.min(activePane, layout - 1);
        // If the agent already lives in another visible pane, focus that pane
        // instead of duplicating the same conversation side by side.
        const existingIndex = panes.findIndex((pane, paneIndex) => pane === name && paneIndex < layout);
        if (existingIndex >= 0) {
          set({ activePane: existingIndex });
          return;
        }
        get().setPaneAgent(index, name);
      },

      toggleFeature: (key, enabled) => {
        set((state) => ({
          features: {
            ...state.features,
            [key]: enabled ?? !state.features[key],
          },
        }));
      },

      setAutoRequestId: (enabled) => set({ autoRequestId: enabled }),
      setTranscriptLimit: (limit) => {
        if (!Number.isFinite(limit)) return;
        set({ transcriptLimit: Math.min(100, Math.max(10, Math.round(limit))) });
      },

      resetWorkspace: () =>
        set({
          agents: DEFAULT_AGENTS,
          layout: 1,
          activePane: 0,
          panes: INITIAL_PANES,
          features: DEFAULT_FEATURE_FLAGS,
          autoRequestId: true,
          transcriptLimit: 50,
        }),
    }),
    {
      name: "fleet-ui.store.v1",
      // v2 adds optional rail `label`/`starred`; old records are normalized on
      // rehydrate, so the migration can pass the persisted payload through.
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        agents: state.agents,
        layout: state.layout,
        activePane: state.activePane,
        panes: state.panes,
        features: state.features,
        autoRequestId: state.autoRequestId,
        transcriptLimit: state.transcriptLimit,
      }),
      migrate: (persisted, version) => {
        if (version === 0) return persisted as Partial<FleetStore>;
        return persisted as Partial<FleetStore>;
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Guard persisted payloads written by older/newer shapes.
        state.agents = state.agents.map((agent) => ({
          ...agent,
          label:
            typeof agent.label === "string" && agent.label.trim()
              ? normalizeAgentName(agent.label)
              : null,
          starred: agent.starred === true,
        }));
        const agentNames = new Set(state.agents.map((agent) => agent.name));
        const panes = state.panes.map((pane) => (pane && agentNames.has(pane) ? pane : null)) as FleetStore["panes"];
        state.panes = panes;
        state.layout = sanitizeLayout(state.layout);
        state.activePane = Math.min(clampPane(state.activePane), state.layout - 1);
      },
    },
  ),
);
