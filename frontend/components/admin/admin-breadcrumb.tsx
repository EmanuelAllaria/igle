"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const LABELS: Record<string, string> = {
  home: "Home",
  dashboard: "Dashboard",
  miembros: "Miembros",
  discipulados: "Discipulados",
  forms: "Formularios",
  respuestas: "Respuestas",
  ministerios: "Ministerios",
  familias: "Familias",
  configuracion: "Configuración",
  importar: "Importar censo",
};

function toLabel(segment: string) {
  return (
    LABELS[segment] ??
    segment
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export function AdminBreadcrumb(props: { className?: string }) {
  const pathname = usePathname();

  const items = useMemo(() => {
    const raw = (pathname ?? "").split("?")[0] ?? "";
    if (!raw.startsWith("/admin")) return [];

    const parts = raw.split("/").filter(Boolean);
    const segments = parts.slice(1);
    const acc: Array<{ href: string; label: string }> = [{ href: "/admin/home", label: "Admin" }];

    let href = "/admin";
    for (const seg of segments) {
      href += `/${seg}`;
      acc.push({ href, label: toLabel(seg) });
    }

    return acc;
  }, [pathname]);

  if (items.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn("min-w-0", props.className)}>
      <ol className="flex min-w-0 flex-wrap items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={item.href} className="flex min-w-0 items-center gap-1.5">
              {idx !== 0 ? <ChevronRight className="h-4 w-4 shrink-0 opacity-60" strokeWidth={1.5} /> : null}
              {isLast ? (
                <span className="truncate font-medium text-slate-900 dark:text-slate-100">{item.label}</span>
              ) : (
                <Link
                  href={item.href}
                  className="truncate rounded-md px-1 py-0.5 transition-all duration-200 ease-in-out hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800/40 dark:hover:text-slate-100"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
