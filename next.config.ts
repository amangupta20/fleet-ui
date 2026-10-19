import type { NextConfig } from "next";

/**
 * The browser only ever calls same-origin `/api/*`.
 *
 * The rewrite lands on a Node route handler (`app/fleet-proxy/[...path]`)
 * instead of a literal upstream URL because Next bakes `rewrites()` into the
 * production build. Reading FLEET_URL at request time keeps the Docker image
 * runtime-configurable, and centralises the optional password gate without
 * exposing the Worker directly to browsers (celld sends no CORS headers).
 */
const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "/fleet-proxy/:path*",
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
