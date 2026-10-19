"use client";

import { useEffect, useState } from "react";

import { useChatStore } from "@/stores/chat-store";
import { useFleetStore } from "@/stores/fleet-store";

/** True once both persisted stores have rehydrated on the client. */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const check = () => {
      if (cancelled) return;
      if (useFleetStore.persist.hasHydrated() && useChatStore.persist.hasHydrated()) {
        setHydrated(true);
      }
    };

    check();
    const unsubFleet = useFleetStore.persist.onFinishHydration(check);
    const unsubChat = useChatStore.persist.onFinishHydration(check);
    return () => {
      cancelled = true;
      unsubFleet();
      unsubChat();
    };
  }, []);

  return hydrated;
}
