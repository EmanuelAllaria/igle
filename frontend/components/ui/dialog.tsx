"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type DialogContextValue = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const DialogContext = React.createContext<DialogContextValue | null>(null);

export function Dialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <DialogContext.Provider value={{ open: props.open, onOpenChange: props.onOpenChange }}>
      {props.children}
    </DialogContext.Provider>
  );
}

function useDialogContext() {
  const ctx = React.useContext(DialogContext);
  if (!ctx) throw new Error("Dialog components must be used within <Dialog>.");
  return ctx;
}

export function DialogContent(props: { className?: string; children: React.ReactNode }) {
  const { open, onOpenChange } = useDialogContext();

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false);
      }}
    >
      <div
        className={cn(
          "absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200 ease-in-out",
        )}
      />
      <div
        className={cn(
          "relative w-full max-w-3xl overflow-hidden rounded-xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface)] shadow-xl shadow-slate-900/10",
          "transition-all duration-200 ease-in-out",
          "dark:bg-[color:var(--admin-surface)] dark:shadow-black/40",
          props.className,
        )}
      >
        {props.children}
      </div>
    </div>,
    document.body,
  );
}

export function DialogHeader(props: { className?: string; children: React.ReactNode }) {
  return <div className={cn("px-6 pt-6", props.className)}>{props.children}</div>;
}

export function DialogTitle(props: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100", props.className)}>
      {props.children}
    </div>
  );
}

export function DialogDescription(props: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("mt-1 text-sm text-neutral-600 dark:text-neutral-400", props.className)}>
      {props.children}
    </div>
  );
}

export function DialogFooter(props: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-2 px-6 pb-6 pt-4 sm:flex-row sm:items-center sm:justify-end",
        props.className,
      )}
    >
      {props.children}
    </div>
  );
}
