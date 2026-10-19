export const MAX_AGENT_NAME_LENGTH = 64;

/**
 * Durable Object names are path segments in the fleet Worker
 * (`/agent/:name/...`), so slashes and control characters are out. The Worker
 * decodes the segment, which means spaces and unicode are technically legal;
 * we keep them but reject anything that cannot round-trip safely.
 */
export function normalizeAgentName(raw: string): string {
  return raw.trim().normalize("NFC");
}

export function validateAgentName(raw: string): { ok: true; name: string } | { ok: false; error: string } {
  const name = normalizeAgentName(raw);
  if (!name) return { ok: false, error: "Give the agent a name." };
  if (name.length > MAX_AGENT_NAME_LENGTH) {
    return { ok: false, error: `Keep names under ${MAX_AGENT_NAME_LENGTH} characters.` };
  }
  if (/[/\\?#]/.test(name)) {
    return { ok: false, error: "Names cannot contain / \\ ? or #." };
  }
  if (/[\u0000-\u001f\u007f]/.test(name)) {
    return { ok: false, error: "Names cannot contain control characters." };
  }
  return { ok: true, name };
}

export function agentPath(name: string, suffix = ""): string {
  return `/api/agent/${encodeURIComponent(name)}${suffix}`;
}

export function compareAgentNames(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: "base", numeric: true });
}
