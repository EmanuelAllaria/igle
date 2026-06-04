"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, type = "text", ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        "h-10 w-full rounded-2xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface)] px-3 text-sm text-slate-900 shadow-sm backdrop-blur",
        "outline-none transition-all duration-200 ease-in-out",
        "placeholder:text-slate-400",
        "hover:border-[color:var(--admin-border-strong)] focus:border-[color:var(--admin-accent)] focus:ring-2 focus:ring-black/5",
        "dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-white/10",
        className,
      )}
      {...props}
    />
  );
});
