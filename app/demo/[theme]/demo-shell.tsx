"use client";

import { SidebarContent } from "@/components/app-sidebar";
import { Workspace } from "@/components/workspace/workspace";
import { useHydrated } from "@/hooks/use-hydrated";

/**
 * Demo shell.
 *
 * The rail and the workspace read the persisted stores, so the demo waits for
 * hydration the same way the console shell does — otherwise the server HTML
 * and the seeded browser state disagree.
 */
export function DemoShell({ theme }: { theme: string }) {
  const hydrated = useHydrated();

  if (!hydrated) {
    return <div data-theme={theme} className="h-dvh bg-background" />;
  }

  return (
    <div data-theme={theme} className="flex h-dvh overflow-hidden bg-background text-foreground">
      <aside className="hidden w-[300px] shrink-0 border-r border-sidebar-border lg:block">
        <SidebarContent authEnabled={false} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <Workspace />
      </div>
    </div>
  );
}
