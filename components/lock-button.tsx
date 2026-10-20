"use client";

import { useState } from "react";
import { LockKeyhole } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function LockButton() {
  const [pending, setPending] = useState(false);

  const lock = async () => {
    setPending(true);
    try {
      await fetch("/auth/lock", { method: "POST", credentials: "same-origin" });
    } finally {
      window.location.assign("/unlock");
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon-sm" onClick={lock} disabled={pending} aria-label="Lock Fleet UI">
          <LockKeyhole className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Lock console</TooltipContent>
    </Tooltip>
  );
}
