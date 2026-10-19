/**
 * Request/operation ids are opaque strings to the fleet Worker. A readable
 * prefix makes them easy to spot in `/messages` and server logs while the
 * random UUID keeps collisions (and accidental idempotency) unlikely.
 */
export function generateRequestId(prefix = "req"): string {
  const cryptoApi = globalThis.crypto;
  const random =
    typeof cryptoApi?.randomUUID === "function"
      ? cryptoApi.randomUUID()
      : fallbackUuid();
  return `${prefix}_${random}`;
}

function fallbackUuid(): string {
  const bytes = new Uint8Array(16);
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }
  // RFC 4122 version 4 variant bits.
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function isValidRequestId(value: string): boolean {
  return /^[A-Za-z0-9._:/=-]{1,200}$/.test(value);
}
