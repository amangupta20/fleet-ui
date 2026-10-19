"use client";

import { useEffect } from "react";
import { toast } from "sonner";

/**
 * Production-only registration: the service worker uses network-first
 * navigation, but keeping it out of `next dev` avoids stale chunk confusion
 * while editing.
 */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    let disposed = false;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        if (disposed) return;

        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              toast("Fleet UI updated", {
                description: "Reload to pick up the new app shell.",
                action: { label: "Reload", onClick: () => window.location.reload() },
                duration: 12_000,
              });
            }
          });
        });
      } catch {
        // PWA support is progressive; a failed registration shouldn't break the console.
      }
    };

    if (document.readyState === "complete") {
      void register();
    } else {
      window.addEventListener("load", register);
    }
    return () => {
      disposed = true;
      window.removeEventListener("load", register);
    };
  }, []);

  return null;
}
