"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select({ className, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        "h-10 w-full rounded-2xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface)] px-3 text-sm text-slate-900 shadow-sm backdrop-blur",
        "outline-none transition-all duration-200 ease-in-out",
        "hover:border-[color:var(--admin-border-strong)] focus:border-[color:var(--admin-accent)] focus:ring-2 focus:ring-black/5",
        "dark:text-slate-100 dark:focus:ring-white/10",
        className,
      )}
      {...props}
    />
  );
});
