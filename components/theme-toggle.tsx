"use client";

import { useEffect, useState } from "react";
import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className={className}
          aria-label={`Change theme (currently ${mounted ? (theme ?? "system") : "system"})`}
        >
          {mounted && resolvedTheme === "dark" ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem checked={mounted && theme === "light"} onCheckedChange={() => setTheme("light")}>
          <Sun className="mr-1.5 h-3.5 w-3.5" /> Light
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={mounted && theme === "dark"} onCheckedChange={() => setTheme("dark")}>
          <Moon className="mr-1.5 h-3.5 w-3.5" /> Dark
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={mounted && theme === "system"} onCheckedChange={() => setTheme("system")}>
          <Laptop className="mr-1.5 h-3.5 w-3.5" /> System
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
