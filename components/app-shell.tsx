"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { SidebarContent } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { WorkerStatus } from "@/components/worker-status";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils";

const TITLES: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "Workspace", subtitle: "Prompt durable agents side by side" },
  "/providers": { title: "Providers", subtitle: "Catalog, router health, and model defaults" },
  "/labs": { title: "Labs", subtitle: "Future capabilities behind local flags" },
};

function pageMeta(pathname: string): { title: string; subtitle: string } {
  const hit = Object.entries(TITLES).find(([href]) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href),
  );
  return hit?.[1] ?? TITLES["/"]!;
}

function ConsoleSkeleton() {
  return (
    <div className="flex h-dvh overflow-hidden">
      <div className="hidden w-[272px] shrink-0 border-r bg-sidebar p-4 lg:block">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-2.5 w-24" />
          </div>
        </div>
        <div className="mt-7 space-y-2">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-8 w-full" />
          ))}
        </div>
        <Skeleton className="mt-8 h-px w-full" />
        <div className="mt-5 space-y-2.5">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-md" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-2.5 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-14 items-center justify-between border-b px-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-7 w-28 rounded-full" />
        </div>
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-3xl space-y-4">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-80 max-w-full" />
            <Skeleton className="h-[420px] w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppShell({
  authEnabled,
  children,
}: {
  authEnabled: boolean;
  children: React.ReactNode;
}) {
  const hydrated = useHydrated();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const meta = pageMeta(pathname);

  if (!hydrated) return <ConsoleSkeleton />;

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <aside className="hidden w-[272px] shrink-0 border-r border-sidebar-border lg:block">
        <SidebarContent authEnabled={authEnabled} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[300px] border-sidebar-border bg-sidebar p-0">
          <SheetTitle className="sr-only">Fleet navigation</SheetTitle>
          <SidebarContent authEnabled={authEnabled} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="relative z-20 flex h-14 shrink-0 items-center gap-3 border-b bg-background/85 px-3 backdrop-blur md:px-5">
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="lg:hidden" aria-label="Open navigation">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-sm font-semibold tracking-tight">{meta.title}</h1>
                <span className="hidden h-1 w-1 rounded-full bg-border sm:block" />
                <p className="hidden truncate text-xs text-muted-foreground sm:block">{meta.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <WorkerStatus compact />
              <span className="mx-0.5 hidden h-4 w-px bg-border sm:block" />
              <ThemeToggle />
            </div>
          </header>

          <main className={cn("min-h-0 flex-1", pathname === "/" ? "overflow-hidden" : "overflow-y-auto")}>{children}</main>
        </div>
      </Sheet>
    </div>
  );
}
