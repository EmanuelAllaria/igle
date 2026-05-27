"use client";

import Link from "next/link";

export default function AdminRespuestasPage() {
  return (
    <main className="flex-1">
      <div className="mx-auto w-full max-w-5xl py-4">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
          <h1 className="text-2xl font-semibold tracking-tight">Respuestas</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Visualización de respuestas de formularios.
          </p>

          <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900/30 dark:text-neutral-300">
            Esta sección está lista para conectarse al listado de respuestas. Por ahora podés crear un formulario y
            usar su link público para generar respuestas.
            <div className="mt-3 flex gap-2">
              <Link
                href="/admin/forms"
                className="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
              >
                Ir a Formularios
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

