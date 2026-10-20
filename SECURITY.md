# Security policy

## Supported versions

`main` and the latest `0.1.x` release receive security fixes. This is a small self-hosted project; there is no formal SLA.

## Reporting a vulnerability

Please use **GitHub private vulnerability reporting** on this repository:

1. Open the **Security** tab.
2. Choose **Report a vulnerability**.
3. Include affected version/commit, deployment mode (Node, Docker, password gate on/off), reproduction steps, and impact.

Do **not** open a public issue for an undisclosed vulnerability. If private reporting is unavailable, contact the maintainer through the GitHub profile linked from the repository.

## Threat model and expectations

Fleet UI is a **single-user console for an unauthenticated Worker API**, not a multi-tenant control plane.

- **Password gate is optional and shared.** `FLEET_UI_PASSWORD` enables one shared secret with an HMAC-signed HttpOnly cookie. It is not SSO, per-user authorization, or an audit trail.
- **Rate limiting is per process.** Login throttling resets on restart and is not shared across replicas. Put an authenticating proxy or network controls in front of public deployments.
- **Network placement matters.** The Worker (`FLEET_URL`) is typically a private/loopback service. Keep it private; never expose celld directly to the internet.
- **TLS is required in production.** The session cookie is marked `Secure` when HTTPS is detected directly or through `X-Forwarded-Proto`.
- **Trusted proxy headers.** Only trust `X-Forwarded-*` when a reverse proxy you control sets them.
- **Browser-local data.** Prompts, responses, local recents, rail labels/stars, pane layout, and flags are stored in `localStorage`/`session state`. This is readable by any script on the origin and persists on shared machines. Use Settings → Clear chat history or Reset local workspace. The fleet directory itself is server-side; local storage is a fallback.
- **Paperclip is a separate trust boundary.** `PAPERCLIP_API_KEY` is read only by the server route and sent only as a Bearer token to Paperclip. It is not forwarded to the fleet Worker, exposed in responses, or logged. Browser cookies are not forwarded to Paperclip, and fleet headers/values are not forwarded there either.
- **No CSP is configured.** Next.js inline scripts and dev overlays make a generic CSP non-trivial. Add a deployment-specific strict CSP for hostile environments.
- **No upstream request cookies.** The proxy forwards only `content-type` and `accept`, never browser cookies. Fleet API calls are server-to-server.
- **Upstream errors are sanitized.** The fleet proxy does not echo `FLEET_URL` back to the browser; the Paperclip route does not echo `PAPERCLIP_URL`, the API key, or upstream bodies. Both log sanitized server-side diagnostics.
- **Markdown is escaped.** `react-markdown` does not render raw HTML and the app does not use `dangerouslySetInnerHTML`.

## Secrets

Never commit `.env`, `.env.local`, `.dev.vars`, provider keys, passwords, Paperclip API keys, bucket credentials, or deployment state. `.gitignore` excludes these; `.env.example` intentionally contains only `FLEET_URL` and commented Paperclip placeholders. If a secret is exposed, rotate it with the provider immediately and purge it from history — changing the Fleet UI password also invalidates all sessions, and rotating `PAPERCLIP_API_KEY` revokes the console's Paperclip access.

## Hardening checklist

- [ ] Terminate TLS and serve only over HTTPS
- [ ] Set `FLEET_UI_PASSWORD` to a long random value (or put the app behind an authenticating proxy)
- [ ] Keep `FLEET_URL` on a private network / VPN / loopback
- [ ] Add a shared rate limiter or upstream auth proxy if publicly reachable
- [ ] Add a deployment-specific CSP
- [ ] Restrict egress so the proxy can only reach the intended Worker and Paperclip host
- [ ] Keep Node.js and dependencies patched
