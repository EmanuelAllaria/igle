"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "muted" | "warning";
};

const variants: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default:
    "border border-[color:var(--admin-border)] bg-[color:var(--admin-surface)] text-slate-700 dark:text-slate-200",
  muted:
    "border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-muted)] text-slate-600 dark:text-slate-300",
  warning:
    "border border-[color:var(--admin-border)] bg-[color:color-mix(in_srgb,var(--admin-accent),white_88%)] text-slate-900 dark:bg-[color:color-mix(in_srgb,var(--admin-accent),black_72%)] dark:text-slate-100",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium shadow-sm backdrop-blur transition-all duration-200 ease-in-out",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
