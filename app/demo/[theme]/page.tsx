import { notFound } from "next/navigation";

import { DemoShell } from "./demo-shell";

import "../demo-theme.css";

/**
 * Theme demos.
 *
 * The same console, the same agent and the same submissionId in every
 * variant — only the skin differs. See `demo-theme.css` for what each variant
 * changes. This is a skin pass: no behaviour changes.
 */
const VARIANTS = ["a", "b", "c"] as const;

type Variant = (typeof VARIANTS)[number];

function isVariant(value: string): value is Variant {
  return (VARIANTS as readonly string[]).includes(value);
}

export default async function DemoPage({ params }: { params: Promise<{ theme: string }> }) {
  const { theme } = await params;
  if (!isVariant(theme)) notFound();

  return <DemoShell theme={theme} />;
}
