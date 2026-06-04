"use client";

import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SidebarThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const label = useMemo(() => {
    if (!mounted) return "Tema";
    return resolvedTheme === "dark" ? "Oscuro" : "Claro";
  }, [mounted, resolvedTheme]);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      className="w-full justify-between border border-white/10 bg-white/5 text-[color:var(--admin-sidebar-foreground)] shadow-none hover:bg-white/10"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Cambiar tema"
    >
      <span className="flex items-center gap-2">
        {isDark ? <Moon className="h-4 w-4" strokeWidth={1.5} /> : <Sun className="h-4 w-4" strokeWidth={1.5} />}
        <span>Tema</span>
      </span>
      <span className="text-xs text-[color:var(--admin-sidebar-muted)]">{label}</span>
    </Button>
  );
}
