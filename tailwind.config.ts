import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

/**
 * Design system: OpenCode.
 * Source: .agents/skills/popular-web-designs/templates/opencode.ai.md
 * See docs/design-system.md for the token source and the console type ramp.
 *
 * The template's mono stack is the app's only typeface ("one font, one
 * voice"), so the sans stack points at the same family. Depth is flat: the
 * template uses borders and background shifts, never box-shadows, so the
 * shadow scale is empty.
 */
const OPENCODE_MONO = [
  "'JetBrains Mono'",
  "ui-monospace",
  "SFMono-Regular",
  "Menlo",
  "Monaco",
  "Consolas",
  "'Liberation Mono'",
  "'Courier New'",
  "monospace",
];

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1440px" },
    },
    // OpenCode depth model: flat. No elevation shadows.
    boxShadow: {},
    extend: {
      colors: {
        border: "hsl(var(--border) / var(--border-alpha))",
        input: "hsl(var(--input) / var(--border-alpha))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          accent: "hsl(var(--sidebar-accent) / var(--sidebar-accent-alpha))",
          "accent-hover": "hsl(var(--sidebar-accent-hover) / var(--sidebar-accent-hover-alpha))",
          border: "hsl(var(--sidebar-border) / var(--border-alpha))",
        },
        // OpenCode semantic accents
        brand: "hsl(var(--accent-brand))",
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "var(--radius)",
        sm: "var(--radius)",
      },
      fontFamily: {
        sans: OPENCODE_MONO,
        mono: OPENCODE_MONO,
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.45" },
        },
        "slide-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-soft": "pulse-soft 1.8s ease-in-out infinite",
        "slide-in": "slide-in 0.18s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
