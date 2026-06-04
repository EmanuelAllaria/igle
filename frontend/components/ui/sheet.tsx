"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type SheetContextValue = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const SheetContext = React.createContext<SheetContextValue | null>(null);

export function Sheet(props: { open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode }) {
  return <SheetContext.Provider value={{ open: props.open, onOpenChange: props.onOpenChange }}>{props.children}</SheetContext.Provider>;
}

function useSheetContext() {
  const ctx = React.useContext(SheetContext);
  if (!ctx) throw new Error("Sheet components must be used within <Sheet>.");
  return ctx;
}

export function SheetContent(props: { className?: string; children: React.ReactNode }) {
  const { open, onOpenChange } = useSheetContext();

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false);
      }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200 ease-in-out" />
      <div
        className={cn(
          "absolute inset-y-0 right-0 w-full max-w-3xl overflow-hidden rounded-l-3xl border-l border-[color:var(--admin-border)] bg-[color:var(--admin-surface)] shadow-2xl shadow-black/20 backdrop-blur-xl",
          "ring-1 ring-black/[0.03] dark:ring-white/[0.06]",
          "transition-transform duration-200 ease-in-out",
          "translate-x-0",
          props.className,
        )}
      >
        {props.children}
      </div>
    </div>,
    document.body,
  );
}

export function SheetHeader(props: { className?: string; children: React.ReactNode }) {
  return <div className={cn("border-b border-[color:var(--admin-border)] px-6 py-5", props.className)}>{props.children}</div>;
}

export function SheetTitle(props: { className?: string; children: React.ReactNode }) {
  return <div className={cn("text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100", props.className)}>{props.children}</div>;
}

export function SheetDescription(props: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mt-1 text-sm text-slate-600 dark:text-slate-400", props.className)}>{props.children}</div>;
}

export function SheetBody(props: { className?: string; children: React.ReactNode }) {
  return <div className={cn("max-h-[calc(100vh-140px)] overflow-y-auto px-6 py-6", props.className)}>{props.children}</div>;
}

export function SheetFooter(props: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("flex items-center justify-end gap-2 border-t border-[color:var(--admin-border)] px-6 py-4", props.className)}>
      {props.children}
    </div>
  );
}
