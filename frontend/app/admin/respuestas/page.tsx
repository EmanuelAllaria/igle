"use client";

import Link from "next/link";

export default function AdminRespuestasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Respuestas</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Visualización de respuestas de formularios.</p>
      </div>

      <div className="rounded-xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-muted)] p-6 text-sm text-slate-700 shadow-sm dark:text-slate-300">
        Esta sección está lista para conectarse al listado de respuestas. Por ahora podés crear un formulario y usar su
        link público para generar respuestas.
        <div className="mt-4 flex gap-2">
          <Link
            href="/admin/forms"
            className="inline-flex items-center justify-center rounded-xl bg-[color:var(--admin-accent)] px-4 py-2 text-sm font-medium text-[color:var(--admin-accent-foreground)] shadow-sm transition-all duration-200 ease-in-out hover:scale-[1.01] hover:bg-[color:var(--admin-accent-hover)] active:scale-[0.99]"
          >
            Ir a Formularios
          </Link>
        </div>
      </div>
    </div>
  );
}
