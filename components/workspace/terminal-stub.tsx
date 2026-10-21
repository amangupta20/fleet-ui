"use client";

import { useEffect, useRef } from "react";
import type { Terminal as XTermTerminal } from "@xterm/xterm";
import { SquareTerminal, WifiOff } from "lucide-react";
import { useTheme } from "next-themes";

import { Badge } from "@/components/ui/badge";
import "@xterm/xterm/css/xterm.css";

/**
 * Terminal stub.
 *
 * The xterm canvas stays disabled (`disableStdin`) and renders locally. It
 * prints no shell prompt and no fabricated output: there is no container, no
 * PTY, and no Worker call behind this surface.
 *
 * xterm needs literal colours, so these repeat the theme tokens
 * (docs/design-system.md -> "Literals"): the picked dark skin, and the
 * OpenCode light palette.
 */
const DARK_THEME = {
  background: "#000000",
  foreground: "#fdfcfc",
  cursor: "#30d158",
  selectionBackground: "rgba(34, 211, 238, 0.25)",
};

const LIGHT_THEME = {
  background: "#fdfcfc",
  foreground: "#201d1d",
  cursor: "#007aff",
  selectionBackground: "rgba(0, 122, 255, 0.2)",
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
        cursorBlink: false,
        disableStdin: true,
        fontFamily:
          "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
        fontSize: 14,
        lineHeight: 1.5,
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

      // Plain text only: this surface must not look like a working shell.
      terminal.writeln("fleet-ui // xterm.js local surface");
      terminal.writeln(`agent     ${agent}`);
      terminal.writeln("transport not connected (stub)");
      terminal.writeln("");
      terminal.writeln("This terminal is a UI stub. It renders locally and sends no");
      terminal.writeln("bytes to the fleet Worker.");
      terminal.writeln("");
      terminal.writeln("terminal - needs containers, not yet");

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
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b px-3 py-2 font-mono text-sm text-muted-foreground">
        <SquareTerminal className="size-3.5 text-success" />
        <span className="font-medium text-foreground">terminal — needs containers, not yet</span>
        <Badge variant="warning" className="text-sm">
          stub
        </Badge>
        <span className="ml-auto flex items-center gap-1.5 text-sm">
          <WifiOff /> local xterm only · agent {agent}
        </span>
      </div>
      <div className="min-h-0 flex-1 p-2">
        <div ref={containerRef} className="h-full w-full overflow-hidden rounded-lg border" />
      </div>
      <div className="shrink-0 border-t px-3 py-1.5 font-mono text-sm text-muted-foreground">
        transport: disabled · xterm.js {`v6`} installed · no Worker calls
      </div>
    </div>
  );
}
