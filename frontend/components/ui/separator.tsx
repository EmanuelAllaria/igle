"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type SeparatorProps = React.HTMLAttributes<HTMLDivElement>;

export function Separator({ className, ...props }: SeparatorProps) {
  return (
    <div
      className={cn("h-px w-full bg-[color:var(--admin-border)]", className)}
      {...props}
    />
  );
}
