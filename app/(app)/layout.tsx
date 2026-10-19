import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { isAuthEnabled, isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const authEnabled = isAuthEnabled();
  if (authEnabled && !(await isAuthenticated())) {
    redirect("/unlock");
  }
  return <AppShell authEnabled={authEnabled}>{children}</AppShell>;
}
