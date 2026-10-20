"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Bot,
  Boxes,
  CheckCircle2,
  CloudOff,
  Copy,
  Cpu,
  Gem,
  Network,
  RefreshCw,
  Search,
  Server,
  Sparkles,
  Star,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useModels } from "@/hooks/use-fleet";
import type { CatalogModel } from "@/lib/fleet-types";
import { providerAccent, providerLabel, PROVIDER_ORDER } from "@/lib/model";
import {
  cn,
  copyText,
  errorMessage,
  formatCompactNumber,
  formatFullNumber,
  formatRelativeTime,
} from "@/lib/utils";

const ENV_HINTS: Record<string, string> = {
  router: "ROUTER_MODEL (+ ROUTER_BASE_URL)",
  "opencode-go": "OPENCODE_API_KEY",
  openai: "OPENAI_API_KEY",
  google: "GEMINI_API_KEY",
};

const PROVIDER_ICONS: Record<string, typeof Server> = {
  router: Network,
  "opencode-go": Sparkles,
  openai: Bot,
  google: Gem,
};

function providerHint(provider: string): string {
  return ENV_HINTS[provider] ?? `${provider.toUpperCase().replace(/-/g, "_")}_API_KEY`;
}

function copyRef(value: string) {
  void copyText(value).then((ok) =>
    ok ? toast.success("Model reference copied", { description: value }) : toast.error("Copy failed"),
  );
}

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Cpu;
  accent?: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="meta-label">{label}</p>
            <p className={cn("mt-1.5 truncate text-base font-bold leading-[1.5]", accent)} title={value}>
              {value}
            </p>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">{detail}</p>
          </div>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted/40">
            <Icon className="size-3.5 text-muted-foreground" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function CatalogRow({
  model,
  isDefault,
  configured,
}: {
  model: CatalogModel;
  isDefault: boolean;
  configured: boolean;
}) {
  const ref = `${model.provider}/${model.id}`;
  return (
    <TableRow className={cn(!configured && "opacity-55")}>
      <TableCell>
        <div className="flex items-center gap-2">
          {isDefault ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Star className="size-3.5 shrink-0 fill-warning text-warning" />
              </TooltipTrigger>
              <TooltipContent>Resolved fleet default</TooltipContent>
            </Tooltip>
          ) : (
            <span className="size-3.5 shrink-0" />
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{model.name}</p>
            <button
              type="button"
              onClick={() => copyRef(ref)}
              className="group/ref flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              title={`Copy ${ref}`}
            >
              <code className="truncate font-mono">{model.id}</code>
              <Copy className="opacity-0 transition-opacity group-hover/ref:opacity-100" />
            </button>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <span className={cn("text-sm font-medium", providerAccent(model.provider))}>
          {providerLabel(model.provider)}
        </span>
      </TableCell>
      <TableCell className="font-mono text-sm" title={formatFullNumber(model.contextWindow)}>
        {formatCompactNumber(model.contextWindow)}
      </TableCell>
      <TableCell className="font-mono text-sm" title={formatFullNumber(model.maxTokens)}>
        {formatCompactNumber(model.maxTokens)}
      </TableCell>
      <TableCell>
        {configured ? (
          <Badge variant="success" className="text-sm">
            <CheckCircle2 className="size-2.5" /> ready
          </Badge>
        ) : (
          <Badge variant="muted" className="text-sm">
            <XCircle className="size-2.5" /> not configured
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-right">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-6"
              onClick={() => copyRef(ref)}
              aria-label={`Copy ${ref}`}
              disabled={!configured}
            >
              <Copy />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy provider/id</TooltipContent>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
}

export function ProvidersDashboard() {
  const models = useModels();
  const [search, setSearch] = useState("");
  const [providerFilter, setProviderFilter] = useState<string>("all");

  const data = models.data;
  const defaultRef = data?.default ? `${data.default.provider}/${data.default.id}` : null;

  const providers = useMemo(() => {
    const names = [
      ...PROVIDER_ORDER,
      ...Object.keys(data?.configured ?? {}),
      ...(data?.catalog.map((model) => model.provider) ?? []),
    ];
    return [...new Set(names)].filter(Boolean);
  }, [data]);

  const providerGroups = useMemo(() => {
    return providers.map((provider) => {
      const catalog = (data?.catalog ?? []).filter((model) => model.provider === provider);
      const configured = data?.configured[provider] === true;
      const live =
        provider === "router" && Array.isArray(data?.router.live)
          ? data.router.live.length
          : null;
      return { provider, catalog, configured, live };
    });
  }, [data, providers]);

  const filteredCatalog = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (data?.catalog ?? []).filter((model) => {
      if (providerFilter !== "all" && model.provider !== providerFilter) return false;
      if (!needle) return true;
      return (
        model.id.toLowerCase().includes(needle) ||
        model.name.toLowerCase().includes(needle) ||
        model.provider.toLowerCase().includes(needle)
      );
    });
  }, [data?.catalog, providerFilter, search]);

  const configuredCount = providerGroups.filter((group) => group.configured).length;
  const routerLive = data?.router.live ?? null;
  const routerCatalogIds = new Set(
    (data?.catalog ?? []).filter((model) => model.provider === "router").map((model) => model.id),
  );
  const unpinnedLive = (routerLive ?? []).filter((id) => !routerCatalogIds.has(id));
  const lastUpdated = data ? formatRelativeTime(models.dataUpdatedAt) : null;

  return (
    <div className="mx-auto w-full max-w-7xl px-3 py-4 md:px-6 md:py-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold leading-[1.5]">Providers</h1>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            The Worker's static catalog, env-provider readiness, and live router discovery. Models are addressed as{" "}
            <code className="rounded bg-muted px-1 font-mono text-sm text-foreground">provider/id</code>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated ? <span className="hidden text-sm text-muted-foreground sm:inline">synced {lastUpdated}</span> : null}
          <Button variant="outline" size="sm" onClick={() => void models.refetch()} disabled={models.isFetching}>
            <RefreshCw className={cn(models.isFetching && "animate-spin")} />
            Refresh
          </Button>
          <Button size="sm" asChild>
            <Link href="/">
              Open workspace <ArrowUpRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      {models.isError ? (
        <Card className="mt-5 border-destructive/25 bg-destructive/5">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
            <CloudOff className="size-5 shrink-0 text-destructive" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-destructive">Could not load /models</p>
              <p className="mt-1 text-sm text-muted-foreground">{errorMessage(models.error)}</p>
              <p className="mt-1.5 font-mono text-sm text-muted-foreground">
                Check FLEET_URL and that <span className="text-foreground">celld dev</span> is running at port 9876.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => void models.refetch()}>
              <RefreshCw /> Retry
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {models.isPending ? (
        <div className="mt-5 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-[104px] rounded-lg" />
            ))}
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-[148px] rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-72 rounded-lg" />
        </div>
      ) : data ? (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Fleet default"
              value={defaultRef ?? "Unset"}
              detail={data.default ? "fresh sessions start here" : "no provider resolved"}
              icon={Star}
              accent={data.default ? "text-brand" : "text-warning"}
            />
            <StatCard
              label="Configured providers"
              value={`${configuredCount} / ${providerGroups.length}`}
              detail={configuredCount > 0 ? "env credentials detected" : "set at least one provider"}
              icon={CheckCircle2}
            />
            <StatCard
              label="Catalog"
              value={String(data.catalog.length)}
              detail="pre-registered provider models"
              icon={Boxes}
            />
            <StatCard
              label="Router discovery"
              value={routerLive === null ? "Unreachable" : `${routerLive.length} live`}
              detail={routerLive === null ? "static router ids still usable" : data.router.baseUrl}
              icon={Network}
              accent={routerLive === null ? "text-warning" : undefined}
            />
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {providerGroups.map((group) => {
              const Icon = PROVIDER_ICONS[group.provider] ?? Server;
              const maxContext = Math.max(0, ...group.catalog.map((model) => model.contextWindow));
              return (
                <Card
                  key={group.provider}
                  className={cn(
                    "overflow-hidden",
                    !group.configured && "border-dashed bg-muted/10",
                  )}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="flex size-7 items-center justify-center rounded-md border bg-muted/40">
                          <Icon className={cn("size-3.5", providerAccent(group.provider))} />
                        </span>
                        <CardTitle className="text-sm">{providerLabel(group.provider)}</CardTitle>
                      </div>
                      {group.configured ? (
                        <Badge variant="success" className="text-sm">configured</Badge>
                      ) : (
                        <Badge variant="muted" className="text-sm">off</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Catalog models</span>
                      <span className="font-mono">{group.catalog.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Largest context</span>
                      <span className="font-mono">{maxContext ? formatCompactNumber(maxContext) : "—"}</span>
                    </div>
                    {group.provider === "router" ? (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Live ids</span>
                        <span className={cn("font-mono", group.live === null && "text-warning")}>
                          {group.live === null ? "unreachable" : group.live}
                        </span>
                      </div>
                    ) : null}
                    {!group.configured ? (
                      <p className="border-t pt-2 font-mono text-sm leading-relaxed text-muted-foreground">
                        {providerHint(group.provider)}
                      </p>
                    ) : (
                      <p className="border-t pt-2 font-mono text-sm leading-relaxed text-muted-foreground">
                        {group.provider === "router" ? data.router.baseUrl : "env authentication ready"}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {group0Router(data) ? (
            <Card className="mt-5 border-warning/20 bg-warning/[0.03]">
              <CardContent className="flex flex-col gap-2 p-3 text-sm sm:flex-row sm:items-start">
                <Network className="mt-0.5 size-4 shrink-0 text-warning" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">Router serves ids outside the pinned catalog</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                    {unpinnedLive.length} live id{unpinnedLive.length === 1 ? "" : "s"} cannot be selected per-request
                    until pre-registered via <code className="font-mono text-foreground">ROUTER_EXTRA_MODELS</code>.
                  </p>
                  <div className="mt-2 flex max-h-16 flex-wrap gap-1 overflow-y-auto">
                    {unpinnedLive.slice(0, 40).map((id) => (
                      <code key={id} className="rounded border bg-background px-1.5 py-0.5 font-mono text-sm">
                        {id}
                      </code>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card className="mt-5 overflow-hidden">
            <CardHeader className="gap-3 pb-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Cpu className="size-4 text-brand" /> Model catalog
                  </CardTitle>
                  <CardDescription className="mt-1 text-sm">
                    {filteredCatalog.length} of {data.catalog.length} models · click an id to copy.
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search models or providers…"
                    className="h-8 pl-8 text-sm"
                    aria-label="Search model catalog"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                <Button
                  variant={providerFilter === "all" ? "secondary" : "ghost"}
                  size="xs"
                  className="h-6 rounded px-2 text-sm"
                  onClick={() => setProviderFilter("all")}
                >
                  All <span className="font-mono opacity-60">{data.catalog.length}</span>
                </Button>
                {providerGroups.map((group) => (
                  <Button
                    key={group.provider}
                    variant={providerFilter === group.provider ? "secondary" : "ghost"}
                    size="xs"
                    className="h-6 rounded px-2 text-sm"
                    onClick={() => setProviderFilter(group.provider)}
                  >
                    {providerLabel(group.provider)}
                    <span className="font-mono opacity-60">{group.catalog.length}</span>
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredCatalog.length === 0 ? (
                <div className="flex flex-col items-center px-4 py-12 text-center">
                  <Search className="size-5 text-muted-foreground" />
                  <p className="mt-2 text-sm font-medium">No models match</p>
                  <p className="mt-1 text-sm text-muted-foreground">Clear the search or pick another provider.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => {
                      setSearch("");
                      setProviderFilter("all");
                    }}
                  >
                    Reset filters
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Model</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Context</TableHead>
                      <TableHead>Max out</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCatalog.map((model) => (
                      <CatalogRow
                        key={`${model.provider}/${model.id}`}
                        model={model}
                        isDefault={defaultRef === `${model.provider}/${model.id}`}
                        configured={data.configured[model.provider] === true}
                      />
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <p className="mt-4 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            Live from <code className="font-mono">GET /models</code>. Router base URL and env credentials come from the
            Worker; this UI never sees provider keys.
            <Link href="/labs" className="ml-auto inline-flex items-center gap-1 text-brand hover:underline">
              Explore future capabilities <ArrowUpRight className="size-3" />
            </Link>
          </p>
        </>
      ) : null}
    </div>
  );
}

function group0Router(data: { router: { live: string[] | null }; catalog: CatalogModel[] }) {
  if (!Array.isArray(data.router.live)) return false;
  const catalogIds = new Set(data.catalog.filter((model) => model.provider === "router").map((model) => model.id));
  return data.router.live.some((id) => !catalogIds.has(id));
}
