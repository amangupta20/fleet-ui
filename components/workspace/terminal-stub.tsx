"use client";

import { useEffect, useRef } from "react";
import type { Terminal as XTermTerminal } from "@xterm/xterm";
import { SquareTerminal, WifiOff } from "lucide-react";
import { useTheme } from "next-themes";

import { Badge } from "@/components/ui/badge";
import "@xterm/xterm/css/xterm.css";

const DARK_THEME = {
  background: "#080b09",
  foreground: "#d7e4dc",
  cursor: "#34d399",
  selectionBackground: "rgba(52, 211, 153, 0.25)",
  black: "#0b0f0d",
  red: "#f87171",
  green: "#34d399",
  yellow: "#fbbf24",
  blue: "#60a5fa",
  magenta: "#c084fc",
  cyan: "#2dd4bf",
  white: "#e5e7eb",
  brightBlack: "#4b5563",
};

const LIGHT_THEME = {
  background: "#faf9f6",
  foreground: "#1c2320",
  cursor: "#0f766e",
  selectionBackground: "rgba(13, 148, 136, 0.2)",
  black: "#1c2320",
  red: "#b91c1c",
  green: "#047857",
  yellow: "#b45309",
  blue: "#1d4ed8",
  magenta: "#7e22ce",
  cyan: "#0f766e",
  white: "#f8fafc",
  brightBlack: "#6b7280",
};

export function TerminalStub({ agent }: { agent: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<XTermTerminal | null>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    let disposed = false;
    let resizeObserver: ResizeObserver | null = null;
    let cleanupTerminal: (() => void) | null = null;

    const boot = async () => {
      const [{ Terminal }, { FitAddon }] = await Promise.all([
        import("@xterm/xterm"),
        import("@xterm/addon-fit"),
      ]);
      if (disposed || !containerRef.current) return;

      const isDark = (resolvedTheme ?? "dark") === "dark";
      const terminal = new Terminal({
        allowProposedApi: true,
        convertEol: true,
        cursorBlink: true,
        disableStdin: true,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
        fontSize: 12,
        lineHeight: 1.35,
        scrollback: 500,
        theme: isDark ? DARK_THEME : LIGHT_THEME,
      });
      const fit = new FitAddon();
      terminal.loadAddon(fit);
      terminal.open(containerRef.current);
      terminalRef.current = terminal;

      try {
        fit.fit();
      } catch {
        // Hidden panes can report zero dimensions; the observer retries.
      }

      const dim = "\x1b[90m";
      const green = "\x1b[32m";
      const yellow = "\x1b[33m";
      const reset = "\x1b[0m";
      terminal.writeln(`${green}fleet-ui${reset} ${dim}// xterm.js local surface${reset}`);
      terminal.writeln(`${dim}agent${reset}  ${agent}`);
      terminal.writeln(`${dim}transport${reset}  ${yellow}not connected (stub)${reset}`);
      terminal.writeln("");
      terminal.writeln(`${yellow}This terminal is a UI stub.${reset} It renders locally and sends no`);
      terminal.writeln("bytes to the fleet Worker. A real PTY transport is on the");
      terminal.writeln("roadmap behind the terminal feature flag.");
      terminal.writeln("");
      terminal.writeln(`${dim}${"─".repeat(46)}${reset}`);
      terminal.write(`${green}${agent}@fleet${reset}:${dim}~${reset}$ `);

      resizeObserver = new ResizeObserver(() => {
        try {
          fit.fit();
        } catch {
          // Ignore transient zero-size observations.
        }
      });
      resizeObserver.observe(containerRef.current);

      cleanupTerminal = () => {
        resizeObserver?.disconnect();
        terminal.dispose();
        terminalRef.current = null;
      };
    };

    void boot();

    return () => {
      disposed = true;
      cleanupTerminal?.();
    };
    // The terminal is intentionally created once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent]);

  useEffect(() => {
    if (!terminalRef.current) return;
    terminalRef.current.options.theme = resolvedTheme === "light" ? LIGHT_THEME : DARK_THEME;
  }, [resolvedTheme]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#080b09]">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-white/10 px-3 py-2 text-[11px] text-zinc-300">
        <SquareTerminal className="h-3.5 w-3.5 text-emerald-400" />
        <span className="font-medium">terminal — {agent}</span>
        <Badge variant="warning" className="border-amber-400/20 bg-amber-400/10 text-[9px] text-amber-300">
          stub · flag on
        </Badge>
        <span className="ml-auto flex items-center gap-1.5 text-[10px] text-zinc-500">
          <WifiOff className="h-3 w-3" /> local xterm only
        </span>
      </div>
      <div className="min-h-0 flex-1 p-2">
        <div ref={containerRef} className="h-full w-full overflow-hidden rounded border border-white/10" />
      </div>
      <div className="shrink-0 border-t border-white/10 px-3 py-1.5 font-mono text-[10px] text-zinc-500">
        transport: disabled · xterm.js {`v6`} installed · no Worker calls
      </div>
    </div>
  );
}
