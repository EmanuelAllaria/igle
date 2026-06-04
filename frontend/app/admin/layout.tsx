"use client";

import type { ReactNode } from "react";
import { BookOpen, FileText, Home, LayoutDashboard, Upload, Users, Landmark } from "lucide-react";
import { AdminNavLink } from "@/components/admin/admin-nav-link";
import { AdminBreadcrumb } from "@/components/admin/admin-breadcrumb";
import { SidebarThemeToggle } from "@/components/admin/sidebar-theme-toggle";
import { Separator } from "@/components/ui/separator";

export default function AdminLayout(props: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(1200px_650px_at_12%_-10%,rgba(30,64,175,0.10),transparent_60%),radial-gradient(900px_520px_at_98%_-8%,rgba(200,139,47,0.14),transparent_55%),radial-gradient(900px_520px_at_30%_110%,rgba(14,165,233,0.10),transparent_55%)] dark:bg-[radial-gradient(1200px_650px_at_12%_-10%,rgba(56,189,248,0.09),transparent_60%),radial-gradient(900px_520px_at_98%_-8%,rgba(217,162,76,0.12),transparent_55%),radial-gradient(900px_520px_at_25%_110%,rgba(99,102,241,0.08),transparent_55%)]" />

      <div className="relative mx-auto flex w-full max-w-[1480px] gap-6 px-4 py-6">
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-6">
            <div className="rounded-3xl border border-[color:var(--admin-sidebar-border)] bg-[linear-gradient(180deg,var(--admin-sidebar),var(--admin-sidebar-2))] p-4 shadow-2xl shadow-black/[0.12] backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold tracking-tight text-[color:var(--admin-sidebar-foreground)]">Asamblea Cristiana</div>
                  <div className="mt-1 text-xs text-[color:var(--admin-sidebar-muted)]">Centro de administración</div>
                </div>
              </div>

              <Separator className="my-4 bg-white/10" />

              <nav className="mt-4 space-y-1">
                <AdminNavLink href="/admin/home" label="Home" icon={LayoutDashboard} />
                <AdminNavLink href="/admin/miembros" label="Miembros" icon={Users} />
                <AdminNavLink href="/admin/discipulados" label="Discipulados" icon={BookOpen} />
                <AdminNavLink href="/admin/forms" label="Formularios" icon={FileText} />
                <AdminNavLink href="/admin/ministerios" label="Ministerios" icon={Landmark} />
                <AdminNavLink href="/admin/familias" label="Familias" icon={Home} />
                <Separator className="my-3 bg-white/10" />
                <AdminNavLink href="/admin/configuracion/importar" label="Importar Censo" icon={Upload} />
              </nav>

              <Separator className="my-4 bg-white/10" />
              <div className="mt-4">
                <SidebarThemeToggle />
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-4">
            <header className="flex items-center justify-between gap-4 rounded-2xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface)] px-6 py-4 shadow-sm backdrop-blur">
              <AdminBreadcrumb />
            </header>

            <div className="rounded-2xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface)] shadow-sm backdrop-blur">
              <div className="p-6 lg:p-8">{props.children}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
