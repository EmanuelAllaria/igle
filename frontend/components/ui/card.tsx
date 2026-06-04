"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Card(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        "rounded-2xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface)] shadow-sm backdrop-blur",
        "ring-1 ring-black/[0.03] dark:ring-white/[0.06]",
        "transition-all duration-200 ease-in-out hover:shadow-md hover:shadow-black/[0.06] hover:scale-[1.01] active:scale-[0.99]",
        props.className,
      )}
    />
  );
}

export function CardHeader(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn("p-6 pb-0", props.className)} />;
}

export function CardTitle(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn("text-sm font-semibold text-slate-900 dark:text-slate-100", props.className)}
    />
  );
}

export function CardDescription(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn("mt-1 text-xs text-slate-600 dark:text-slate-400", props.className)}
    />
  );
}

export function CardContent(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn("p-6 pt-4", props.className)} />;
}

