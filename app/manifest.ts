import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fleet UI",
    short_name: "Fleet",
    description: "Self-hosted console for celld + Pi Durable agent fleets.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    // OpenCode Dark #201d1d (see docs/design-system.md)
    background_color: "#201d1d",
    theme_color: "#201d1d",
    categories: ["developer", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
    shortcuts: [
      { name: "Workspace", short_name: "Chat", url: "/", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Providers", short_name: "Models", url: "/providers", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
