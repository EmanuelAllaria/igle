"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminNavLink(props: { href: string; label: string; icon?: LucideIcon }) {
  const pathname = usePathname();
  const active = pathname === props.href || pathname.startsWith(`${props.href}/`);
  const Icon = props.icon;

  return (
    <Link
      href={props.href}
      className={cn(
        "group relative flex items-center justify-between gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition-all duration-200 ease-in-out",
        "hover:scale-[1.01] active:scale-[0.99]",
        "hover:bg-white/[0.06]",
        active
          ? "bg-white/[0.10] text-[color:var(--admin-sidebar-foreground)] ring-1 ring-white/[0.14]"
          : "text-[color:var(--admin-sidebar-muted)] hover:text-[color:var(--admin-sidebar-foreground)]",
      )}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        {Icon ? <Icon className="h-[18px] w-[18px] shrink-0 opacity-90" strokeWidth={1.5} /> : null}
        <span className="truncate">{props.label}</span>
      </span>
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full transition-all duration-200 ease-in-out",
          active
            ? "bg-[color:var(--admin-accent)]"
            : "bg-transparent group-hover:bg-white/30",
        )}
      />
    </Link>
  );
}
