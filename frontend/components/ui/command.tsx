"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type CommandContextValue = {
  query: string;
  setQuery: (v: string) => void;
};

const CommandContext = React.createContext<CommandContextValue | null>(null);

function useCommandContext() {
  const ctx = React.useContext(CommandContext);
  if (!ctx) throw new Error("Command components must be used within <Command>.");
  return ctx;
}

export function Command(props: React.HTMLAttributes<HTMLDivElement> & { value?: string; onValueChange?: (v: string) => void }) {
  const [internal, setInternal] = React.useState("");
  const value = props.value ?? internal;
  const setValue = props.onValueChange ?? setInternal;

  return (
    <CommandContext.Provider value={{ query: value, setQuery: setValue }}>
      <div
        {...props}
        className={cn(
          "rounded-2xl border border-neutral-200 bg-white shadow-sm",
          "dark:border-slate-800 dark:bg-slate-950",
          props.className,
        )}
      />
    </CommandContext.Provider>
  );
}

export function CommandInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { query, setQuery } = useCommandContext();

  return (
    <div className="px-3 pt-3">
      <input
        {...props}
        value={props.value ?? query}
        onChange={(e) => {
          props.onChange?.(e);
          setQuery(e.target.value);
        }}
        className={cn(
          "h-10 w-full rounded-2xl border border-neutral-200 bg-white px-3 text-sm text-neutral-900 shadow-sm outline-none",
          "transition-all duration-200 ease-in-out focus:border-neutral-900/25 focus:ring-2 focus:ring-neutral-900/10",
          "dark:border-slate-800 dark:bg-slate-950 dark:text-neutral-100 dark:focus:border-white/20 dark:focus:ring-white/10",
          props.className,
        )}
      />
    </div>
  );
}

export function CommandList(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn("max-h-72 overflow-auto px-2 pb-2 pt-2", props.className)} />;
}

export function CommandEmpty(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn("px-3 py-8 text-center text-sm text-neutral-600 dark:text-neutral-400", props.className)}
    />
  );
}

export function CommandGroup(props: React.HTMLAttributes<HTMLDivElement> & { heading?: string }) {
  return (
    <div {...props} className={cn("py-1", props.className)}>
      {props.heading ? (
        <div className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
          {props.heading}
        </div>
      ) : null}
      <div>{props.children}</div>
    </div>
  );
}

export function CommandItem(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean },
) {
  return (
    <button
      {...props}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2 text-left text-sm",
        "transition-all duration-200 ease-in-out",
        props.selected
          ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
          : "text-neutral-900 hover:bg-neutral-50 dark:text-neutral-100 dark:hover:bg-slate-900/60",
        "active:scale-[0.99]",
        props.className,
      )}
    />
  );
}

