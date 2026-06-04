"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "secondary" | "ghost" | "destructive";
type ButtonSize = "default" | "sm" | "lg";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantClasses: Record<ButtonVariant, string> = {
  default:
    "bg-[linear-gradient(135deg,var(--admin-accent),var(--admin-accent-2))] text-[color:var(--admin-accent-foreground)] hover:brightness-[0.98]",
  secondary:
    "border border-[color:var(--admin-border)] bg-[color:var(--admin-surface)] text-slate-900 hover:border-[color:var(--admin-border-strong)] hover:bg-[color:var(--admin-surface-muted)] dark:text-slate-100",
  ghost:
    "text-slate-900 hover:bg-[color:var(--admin-surface-muted)] dark:text-slate-100",
  destructive:
    "border border-red-200/70 bg-red-50 text-red-800 hover:bg-red-100/70 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200 dark:hover:bg-red-950/45",
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-10 px-4 text-sm",
  sm: "h-9 px-3 text-sm",
  lg: "h-11 px-5 text-sm",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "default", size = "default", type, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type ?? "button"}
      className={cn(
        "inline-flex select-none items-center justify-center gap-2 rounded-2xl font-medium shadow-sm transition-all duration-200 ease-in-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10 dark:focus-visible:ring-white/15",
        "disabled:pointer-events-none disabled:opacity-50",
        "hover:scale-[1.01] active:scale-[0.99]",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
});
