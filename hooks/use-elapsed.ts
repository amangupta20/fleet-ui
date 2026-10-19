"use client";

import { useEffect, useState } from "react";

/** Live elapsed milliseconds since `startedAt` while `active` is true. */
export function useElapsed(startedAt: number | null, active: boolean): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active || startedAt === null) return;
    setNow(Date.now());
    const interval = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(interval);
  }, [active, startedAt]);

  if (startedAt === null) return 0;
  return Math.max(0, (active ? now : Date.now()) - startedAt);
}
