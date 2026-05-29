import Link from "next/link";
import type { ReactNode } from "react";

export default function AdminLayout(props: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)]">
      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-6">
        <aside className="w-72 shrink-0">
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
            <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Panel</div>
            <div className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">Navegación</div>

            <nav className="mt-4 space-y-2">
              <NavLink href="/admin/dashboard" label="Resumen" />
              <NavLink href="/admin/miembros" label="Miembros" />
              <NavLink href="/admin/discipulados" label="Discipulados" />
              <NavLink href="/admin/forms" label="Formularios" />
            </nav>
          </div>
        </aside>

        <div className="min-w-0 flex-1">{props.children}</div>
      </div>
    </div>
  );
}

function NavLink(props: { href: string; label: string }) {
  return (
    <Link
      href={props.href}
      className="block rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-900"
    >
      {props.label}
    </Link>
  );
}
