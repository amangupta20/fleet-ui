"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Copy,
  Cpu,
  Download,
  Eraser,
  FileDown,
  FileJson,
  Info,
  KeyRound,
  Loader2,
  SendHorizontal,
  Sparkles,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";

import { AgentAvatar } from "@/components/agent-avatar";
import { AgentTimeline } from "@/components/workspace/timeline";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useMessages, useModels, usePromptAgent } from "@/hooks/use-fleet";
import { decodeAgentName } from "@/lib/agent-name";
import { FleetApiError } from "@/lib/fleet-api";
import type { CatalogModel } from "@/lib/fleet-types";
import { isValidRequestId, generateRequestId } from "@/lib/request-id";
import type { ChatRun } from "@/lib/chat-types";
import { buildJsonExport, buildMarkdownExport, buildPlainTranscript } from "@/lib/export";
import { buildTimeline, maxMessageId } from "@/lib/timeline";
import { providerLabel, providerAccent, PROVIDER_ORDER } from "@/lib/model";
import {
  cn,
  copyText,
  downloadTextFile,
  errorMessage,
  formatRelativeTime,
  safeFileStem,
  shortId,
} from "@/lib/utils";
import { useChatStore } from "@/stores/chat-store";
import { useFleetStore } from "@/stores/fleet-store";

const EMPTY_RUNS: ChatRun[] = [];

const SUGGESTIONS = [
  {
    title: "Say hello",
    prompt: "Say hi and tell me which model you are running on right now.",
  },
  {
    title: "Prove the tool loop",
    prompt: "Use the echo tool to echo 'hello from Fleet UI' and show me the output.",
  },
  {
    title: "Test the session",
    prompt: "In one sentence, describe what this session's active context contains.",
  },
] as const;

function makeRunId(): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi && typeof cryptoApi.randomUUID === "function") return cryptoApi.randomUUID();
  return `run_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function ModelPicker({
  agent,
  value,
}: {
  agent: string;
  value: string | null;
}) {
  const models = useModels();
  const setAgentModel = useFleetStore((state) => state.setAgentModel);

  const groups = useMemo(() => {
    const catalog = models.data?.catalog ?? [];
    const byProvider = new Map<string, CatalogModel[]>();
    for (const model of catalog) {
      const list = byProvider.get(model.provider) ?? [];
      list.push(model);
      byProvider.set(model.provider, list);
    }
    for (const list of byProvider.values()) {
      list.sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
    }
    const knownOrder = PROVIDER_ORDER.filter((provider) => byProvider.has(provider));
    const extras = [...byProvider.keys()].filter(
      (provider) => !(PROVIDER_ORDER as readonly string[]).includes(provider),
    );
    return [...knownOrder, ...extras].map((provider) => ({
      provider,
      configured: models.data?.configured[provider] !== false,
      models: byProvider.get(provider) ?? [],
    }));
  }, [models.data]);

  const catalogHasValue = Boolean(
    value && models.data?.catalog.some((model) => `${model.provider}/${model.id}` === value),
  );

  return (
    <div className="flex min-w-0 items-center gap-0.5">
      <Cpu className="size-3 shrink-0 text-muted-foreground" />
      <Select
        value={value ?? "__default__"}
        onValueChange={(next) => setAgentModel(agent, next === "__default__" ? null : next)}
        disabled={models.isLoading}
      >
        <SelectTrigger
          className="h-6 w-auto max-w-[190px] gap-1 border-0 bg-transparent px-1.5 font-mono text-sm font-medium text-muted-foreground focus:ring-0 [&>span]:truncate"
          aria-label="Model override for this agent"
          title={value ?? "Fleet default"}
        >
          <SelectValue placeholder="Fleet default">
            {value ?? "Fleet default"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-80 w-[300px]">
          <SelectItem value="__default__">
            <span className="flex min-w-0 flex-col items-start">
              <span className="text-sm font-medium">Fleet default</span>
              {models.data?.default ? (
                <span className="font-mono text-sm text-muted-foreground">
                  {models.data.default.provider}/{models.data.default.id}
                </span>
              ) : (
                <span className="text-sm text-warning">no provider resolved</span>
              )}
            </span>
          </SelectItem>
          {!catalogHasValue && value ? (
            <SelectItem value={value}>
              <span className="font-mono text-sm">{value}</span>
            </SelectItem>
          ) : null}
          {groups.map((group) => (
            <SelectGroup key={group.provider}>
              <SelectLabel className="flex items-center justify-between gap-2">
                <span className={providerAccent(group.provider)}>{providerLabel(group.provider)}</span>
                {!group.configured ? <span className="text-sm font-normal">not configured</span> : null}
              </SelectLabel>
              {group.models.map((model) => {
                const ref = `${model.provider}/${model.id}`;
                return (
                  <SelectItem key={ref} value={ref} disabled={!group.configured}>
                    <span className="flex w-full min-w-0 items-center justify-between gap-3">
                      <span className="truncate font-mono text-sm">{model.id}</span>
                      <span className="shrink-0 font-mono text-sm text-muted-foreground">
                        {new Intl.NumberFormat("en", { notation: "compact" }).format(model.contextWindow)}
                      </span>
                    </span>
                  </SelectItem>
                );
              })}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function HarnessStub() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="hidden cursor-default items-center gap-1 rounded border border-dashed px-1.5 py-0.5 font-mono text-sm text-muted-foreground xl:inline-flex">
          harness: pi-durable
        </span>
      </TooltipTrigger>
      <TooltipContent>
        Harness picker is a Labs stub in v1. Pi Durable is the only harness fleet-base ships.
      </TooltipContent>
    </Tooltip>
  );
}

export function ChatPane({ agent }: { agent: string }) {
  const runs = useChatStore((state) => state.runsByAgent[agent] ?? EMPTY_RUNS);
  const addRun = useChatStore((state) => state.addRun);
  const removeRun = useChatStore((state) => state.removeRun);
  const clearAgent = useChatStore((state) => state.clearAgent);
  const lastRequest = useChatStore((state) => state.lastRequestByAgent[agent]);
  const setLastRequest = useChatStore((state) => state.setLastRequest);
  const setInflight = useChatStore((state) => state.setInflight);

  const agentRecord = useFleetStore((state) => state.agents.find((entry) => entry.name === agent));
  const autoRequestId = useFleetStore((state) => state.autoRequestId);
  const setAutoRequestId = useFleetStore((state) => state.setAutoRequestId);
  const features = useFleetStore((state) => state.features);
  const transcriptLimit = useFleetStore((state) => state.transcriptLimit);
  const models = useModels();
  const mutation = usePromptAgent();
  const messagesQuery = useMessages(agent, transcriptLimit, true);

  const [prompt, setPrompt] = useState("");
  const [requestId, setRequestId] = useState(() => generateRequestId());
  const [showRequestPanel, setShowRequestPanel] = useState(false);
  // The prompt in flight lives in the store, so the rail can show the same
  // `running` lifecycle the timeline shows.
  const inflight = useChatStore((state) => state.inflightByAgent[agent] ?? null);
  const [inputError, setInputError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const startedPerf = useRef<number>(0);
  const displayAgent = decodeAgentName(agent);

  const modelOverride = agentRecord?.modelOverride ?? null;
  // Manual mode keeps the compact footer indicator; opening the full panel is
  // explicit so 3–4 pane layouts keep maximum room for conversation.
  const requestControlsOpen = showRequestPanel;
  const pending = mutation.isPending;

  const resizeTextarea = useCallback(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 176)}px`;
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [prompt, resizeTextarea]);

  const scrollToBottom = useCallback((smooth = false) => {
    const element = scrollRef.current;
    if (!element) return;
    element.scrollTo({ top: element.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);

  useEffect(() => {
    if (!stickToBottom.current) return;
    const frame = window.requestAnimationFrame(() => scrollToBottom(true));
    return () => window.cancelAnimationFrame(frame);
  }, [runs.length, inflight, scrollToBottom]);

  useEffect(() => {
    if (inflight) {
      stickToBottom.current = true;
      scrollToBottom(true);
    }
  }, [inflight, scrollToBottom]);

  const handleScroll = () => {
    const element = scrollRef.current;
    if (!element) return;
    stickToBottom.current = element.scrollHeight - element.scrollTop - element.clientHeight < 120;
  };

  const focusComposer = () => {
    window.setTimeout(() => textareaRef.current?.focus(), 20);
  };

  /**
   * The highest durable message id, read fresh right before a prompt is
   * sent. It is the watermark that lets the timeline attach the durable turn
   * this prompt produces to this prompt's epoch.
   */
  const readWatermark = async (): Promise<number | null> => {
    try {
      const fresh = await messagesQuery.refetch();
      return maxMessageId(fresh.data?.messages ?? []);
    } catch {
      return maxMessageId(messagesQuery.data?.messages ?? []);
    }
  };

  const send = async () => {
    const trimmed = prompt.trim();
    if (!trimmed) {
      setInputError("Write a prompt first.");
      textareaRef.current?.focus();
      return;
    }
    if (pending) return;
    const id = requestId.trim();
    if (!id) {
      setInputError("Add a request ID or turn on auto-generation.");
      setShowRequestPanel(true);
      return;
    }
    if (!isValidRequestId(id)) {
      setInputError("Request IDs can use letters, numbers, and . _ : / = - (max 200).");
      setShowRequestPanel(true);
      return;
    }

    setInputError(null);
    const startedAt = Date.now();
    // The durable transcript has no submissionId per message, so read the
    // transcript once more before sending: the turn this prompt appends
    // starts above the highest message id that read returned.
    setInflight(agent, { prompt: trimmed, model: modelOverride, startedAt });
    const messagesWatermark = await readWatermark();
    startedPerf.current = performance.now();
    stickToBottom.current = true;

    try {
      const result = await mutation.mutateAsync({
        agent,
        body: {
          prompt: trimmed,
          requestId: id,
          ...(modelOverride ? { model: modelOverride } : {}),
        },
      });
      const response = result.response;
      const run: ChatRun = {
        id: makeRunId(),
        prompt: trimmed,
        requestId: id,
        model: modelOverride,
        text: typeof response.text === "string" ? response.text : "",
        status: response.status ?? "done",
        reason: response.reason ?? null,
        submissionId: response.submissionId ?? response.operationId ?? null,
        operationId: response.operationId ?? response.submissionId ?? null,
        latencyMs: result.latencyMs,
        createdAt: Date.now(),
        error: null,
        httpStatus: 200,
        messagesWatermark,
      };
      addRun(agent, run);
      setLastRequest(agent, { requestId: id, prompt: trimmed, model: modelOverride, at: Date.now() });
      setPrompt("");
      setInflight(agent, null);
      if (autoRequestId) setRequestId(generateRequestId());
      if (run.status !== "done") {
        toast.warning("Run finished unanswered", {
          description: run.reason ? `reason: ${run.reason}` : "The agent returned no answer.",
        });
      }
      window.setTimeout(() => textareaRef.current?.focus(), 50);
    } catch (error) {
      const message = errorMessage(error);
      const httpStatus = error instanceof FleetApiError && error.status > 0 ? error.status : null;
      addRun(agent, {
        id: makeRunId(),
        prompt: trimmed,
        requestId: id,
        model: modelOverride,
        text: "",
        status: "error",
        reason: null,
        submissionId: null,
        operationId: null,
        latencyMs: Math.max(0, performance.now() - startedPerf.current),
        createdAt: Date.now(),
        error: message,
        httpStatus,
        messagesWatermark,
      });
      setLastRequest(agent, { requestId: id, prompt: trimmed, model: modelOverride, at: Date.now() });
      setInflight(agent, null);
      if (autoRequestId) setRequestId(generateRequestId());
      toast.error("Prompt failed", { description: message });
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      void send();
    }
  };

  const downloadEpoch = (payload: { agent: string; exportedAt: number; runs: ChatRun[] }, stem: string, format: "md" | "json") => {
    if (format === "md") {
      downloadTextFile(`${stem}.md`, buildMarkdownExport(payload), "text/markdown");
    } else {
      downloadTextFile(`${stem}.json`, buildJsonExport(payload), "application/json");
    }
  };

  const exportTranscript = (format: "md" | "json") => {
    if (runs.length === 0) return;
    downloadEpoch(
      { agent, exportedAt: Date.now(), runs },
      `${safeFileStem(agent)}-transcript-${new Date().toISOString().slice(0, 10)}`,
      format,
    );
  };

  const copyTranscript = () => {
    if (runs.length === 0) return;
    void copyText(buildPlainTranscript(runs)).then((ok) =>
      ok ? toast.success("Transcript copied") : toast.error("Copy failed"),
    );
  };

  const copyRun = (run: ChatRun) => {
    void copyText(run.error ? run.error : run.text).then((ok) =>
      ok ? toast.success("Answer copied") : toast.error("Copy failed"),
    );
  };

  const exportRun = (run: ChatRun, format: "md" | "json") => {
    downloadEpoch(
      { agent, exportedAt: Date.now(), runs: [run] },
      `${safeFileStem("epoch")}-${safeFileStem(run.submissionId ?? run.requestId)}`,
      format,
    );
  };

  const timeline = useMemo(
    () =>
      buildTimeline({
        runs,
        messages: messagesQuery.data?.messages ?? [],
        inflight,
      }),
    [runs, messagesQuery.data?.messages, inflight],
  );

  const retryPrompt = (run: ChatRun) => {
    setPrompt(run.prompt);
    setRequestId(generateRequestId());
    setInputError(null);
    setShowRequestPanel(true);
    focusComposer();
  };

  const reuseId = (run: ChatRun) => {
    setPrompt(run.prompt);
    setRequestId(run.requestId);
    setAutoRequestId(false);
    setShowRequestPanel(true);
    setInputError(null);
    focusComposer();
    toast("Request ID restored", {
      description: "Auto-ID is off. Sending again with the same prompt and id is idempotent.",
    });
  };

  const modelsFailed = models.isError;
  const noDefault = models.isSuccess && !models.data.default;
  const selectedUnconfigured =
    modelOverride &&
    models.data &&
    (() => {
      const slash = modelOverride.indexOf("/");
      if (slash <= 0) return false;
      return models.data.configured[modelOverride.slice(0, slash)] === false;
    })();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-8 shrink-0 items-center gap-2 border-b bg-muted/15 px-3 font-mono text-sm text-muted-foreground">
        <span className="truncate">
          {timeline.epochs.length} epoch{timeline.epochs.length === 1 ? "" : "s"}
          {timeline.durableEpochs.length > 0
            ? ` · ${timeline.durableEpochs.length} durable turn${timeline.durableEpochs.length === 1 ? "" : "s"}`
            : ""}
        </span>
        {runs.length > 0 ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-default">
                <Info className="size-3.5" />
              </span>
            </TooltipTrigger>
            <TooltipContent>
              Epochs are keyed by the submissionId the Worker returned. The durable transcript holds
              the tool activity.
            </TooltipContent>
          </Tooltip>
        ) : null}
        <div className="ml-auto flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-6"
                onClick={copyTranscript}
                disabled={runs.length === 0}
                aria-label="Copy transcript"
              >
                <Copy className="size-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy transcript</TooltipContent>
          </Tooltip>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-6"
                disabled={runs.length === 0}
                aria-label="Export or clear transcript"
              >
                <Download className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Session log</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => exportTranscript("md")}>
                <FileDown className="size-3.5" /> Export Markdown
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportTranscript("json")}>
                <FileJson className="size-3.5" /> Export JSON
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onSelect={(event) => event.preventDefault()}
                  >
                    <Eraser className="size-3.5" /> Clear browser log
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear browser log?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Removes {runs.length} locally stored run{runs.length === 1 ? "" : "s"} for {displayAgent}. The durable
                      server transcript is not touched.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => {
                        clearAgent(agent);
                        toast.success("Browser log cleared");
                      }}
                    >
                      Clear log
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4"
      >
        <div className="mx-auto w-full max-w-5xl space-y-5">
          {modelsFailed ? (
            <div className="flex items-start gap-2 rounded border border-warning/25 bg-warning/5 p-3 text-sm">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-warning" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-warning">Model catalog unavailable</p>
                <p className="mt-0.5 text-muted-foreground">
                  Prompts still use the Worker's default model. {errorMessage(models.error)}
                </p>
              </div>
              <Button variant="outline" size="xs" onClick={() => void models.refetch()}>
                Retry
              </Button>
            </div>
          ) : null}

          {noDefault ? (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/5 p-3 text-sm">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-destructive" />
              <div className="min-w-0">
                <p className="font-medium text-destructive">No model provider configured</p>
                <p className="mt-0.5 text-muted-foreground">
                  Set one provider in the Worker's env and restart celld.{" "}
                  <Link href="/providers" className="text-brand underline underline-offset-2">
                    Inspect providers
                  </Link>
                  .
                </p>
              </div>
            </div>
          ) : null}

          {selectedUnconfigured ? (
            <div className="flex items-start gap-2 rounded border border-warning/25 bg-warning/5 p-3 text-sm">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-warning" />
              <p className="text-muted-foreground">
                The pinned model <code className="font-mono text-foreground">{modelOverride}</code> belongs to an
                unconfigured provider. Switch the override or send with the fleet default.
              </p>
            </div>
          ) : null}

          {timeline.epochs.length === 0 && timeline.durableEpochs.length === 0 && !pending ? (
            <div className="flex flex-col items-center px-2 pb-2 pt-6 text-center">
              <AgentAvatar name={displayAgent} size="lg" className="size-12 text-base" />
              <h2 className="mt-3 text-base font-bold leading-[1.5]">Talk to {displayAgent}</h2>
              <p className="mt-1 max-w-sm text-sm leading-[1.5] text-muted-foreground">
                This pane is wired to the durable cell <code className="font-mono text-foreground">{displayAgent}</code>.
                Every prompt carries a request ID, so retries are idempotent.
              </p>
              <div className="mt-5 grid w-full gap-2 sm:grid-cols-3">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion.title}
                    type="button"
                    onClick={() => {
                      setPrompt(suggestion.prompt);
                      focusComposer();
                    }}
                    className="rounded border bg-card/70 p-3 text-left transition-colors hover:border-brand/40 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Sparkles className="mb-1.5 size-3.5 text-brand" />
                    <span className="block text-sm font-medium">{suggestion.title}</span>
                    <span className="mt-0.5 block text-sm leading-[1.5] text-muted-foreground">
                      {suggestion.prompt}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <AgentTimeline
            timeline={timeline}
            runs={runs}
            defaultModel={
              models.data?.default ? `${models.data.default.provider}/${models.data.default.id}` : null
            }
            actions={{
              onCopy: copyRun,
              onExport: exportRun,
              onRetry: retryPrompt,
              onReuseId: reuseId,
              onRemove: (target) => {
                removeRun(agent, target.id);
                toast.success("Epoch removed from browser log");
              },
            }}
          />
        </div>
      </div>

      <div className="shrink-0 border-t bg-card/60 p-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto w-full max-w-5xl space-y-2">
          {requestControlsOpen ? (
            <div className="rounded-lg border bg-muted/20 p-2.5">
              <div className="flex items-center gap-2">
                <Label htmlFor={`request-id-${agent}`} className="shrink-0 font-mono text-sm uppercase tracking-[0.08em] text-muted-foreground">
                  Request ID
                </Label>
                <Input
                  id={`request-id-${agent}`}
                  value={requestId}
                  onChange={(event) => {
                    setRequestId(event.target.value);
                    setInputError(null);
                  }}
                  className="h-7 min-w-0 flex-1 font-mono text-sm"
                  spellCheck={false}
                  autoComplete="off"
                  aria-label="Request ID"
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      className="size-7 shrink-0"
                      onClick={() => setRequestId(generateRequestId())}
                      aria-label="Generate a new request ID"
                    >
                      <Wand2 className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Generate new ID</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      className="size-7 shrink-0"
                      onClick={() => {
                        void copyText(requestId).then((ok) =>
                          ok ? toast.success("Request ID copied") : toast.error("Copy failed"),
                        );
                      }}
                      aria-label="Copy request ID"
                    >
                      <Copy className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy ID</TooltipContent>
                </Tooltip>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                  <Switch
                    checked={autoRequestId}
                    onCheckedChange={setAutoRequestId}
                    className="scale-90"
                    aria-label="Auto-generate request IDs"
                  />
                  Auto-generate on each send
                </label>
                {lastRequest ? (
                  <button
                    type="button"
                    onClick={() => {
                      setRequestId(lastRequest.requestId);
                      setAutoRequestId(false);
                      setPrompt(lastRequest.prompt);
                      setInputError(null);
                      focusComposer();
                      toast("Last request restored", {
                        description: `${shortId(lastRequest.requestId, 22)} · ${formatRelativeTime(lastRequest.at)}`,
                      });
                    }}
                    className="truncate font-mono text-sm text-brand underline-offset-2 hover:underline"
                    title={lastRequest.requestId}
                  >
                    reuse last · {shortId(lastRequest.requestId, 22)}
                  </button>
                ) : (
                  <span className="text-sm text-muted-foreground">No previous run yet.</span>
                )}
                <span className="ml-auto hidden font-mono text-sm text-muted-foreground md:inline">
                  Same agent + id = same durable run.
                </span>
              </div>
            </div>
          ) : null}

          <div
            className={cn(
              "rounded border bg-background transition-colors focus-within:border-brand/50",
              inputError && "border-destructive/40",
            )}
          >
            <Textarea
              ref={textareaRef}
              value={prompt}
              onChange={(event) => {
                setPrompt(event.target.value);
                setInputError(null);
                resizeTextarea();
              }}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${displayAgent}…  (⌘↵ to send)`}
              className="min-h-[60px] resize-none border-0 bg-transparent px-3 py-2.5 text-base leading-[1.5] focus-visible:ring-0"
              rows={2}
              aria-label={`Prompt for ${displayAgent}`}
              disabled={false}
            />
            <div className="flex items-center gap-1 border-t px-2 py-1.5">
              <ModelPicker agent={agent} value={modelOverride} />
              <Button
                type="button"
                variant="ghost"
                size="xs"
                className={cn(
                  "h-6 gap-1 px-1.5 font-mono text-sm text-muted-foreground",
                  requestControlsOpen && "bg-accent text-foreground",
                )}
                onClick={() => setShowRequestPanel((open) => !open)}
                aria-expanded={requestControlsOpen}
              >
                <KeyRound className="size-3" />
                <span className="hidden sm:inline">ID</span>
                <span className="font-mono text-sm">{shortId(requestId, 9)}</span>
              </Button>
              {features.harness ? <HarnessStub /> : null}
              <div className="ml-auto flex items-center gap-2">
                <span className="hidden items-center gap-1 font-mono text-sm text-muted-foreground sm:flex">
                  <kbd className="rounded border bg-muted px-1 py-0.5 text-sm">⌘</kbd>
                  <kbd className="rounded border bg-muted px-1 py-0.5 text-sm">↵</kbd>
                </span>
                <Button
                  size="sm"
                  className="h-7 gap-1.5 px-2.5 text-sm"
                  onClick={() => void send()}
                  disabled={pending || !prompt.trim()}
                >
                  {pending ? <Loader2 className="size-3.5 animate-spin" /> : <SendHorizontal className="size-3.5" />}
                  {pending ? "Running…" : "Send"}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex min-h-[16px] items-center justify-between gap-2 px-1 font-mono text-sm text-muted-foreground">
            <span className={cn("truncate", inputError && "text-destructive")}>
              {inputError ??
                (autoRequestId
                  ? `Auto ID · ${shortId(requestId, 26)}`
                  : `Manual ID · ${shortId(requestId, 26)}`)}
            </span>
            <span className="hidden shrink-0 items-center gap-3 sm:flex">
              <span className="hidden items-center gap-1 md:inline-flex">no streaming</span>
              <span className="hidden items-center gap-1 md:inline-flex">buffered POST · 10 min</span>
              <span className="flex items-center gap-1">
                <span
                  className={cn(
                    "size-1.5 rounded-sm",
                    pending ? "bg-brand" : "bg-success",
                  )}
                />
                {pending ? "running" : "ready"}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
