import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1 bg-[var(--color-background)] text-[var(--color-foreground)]">
      <div className="mx-auto flex w-full max-w-4xl flex-col px-4 py-14">
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
          <h1 className="text-3xl font-semibold tracking-tight">
            Sistema Iglesia
          </h1>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Accesos rápidos.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Link
              href="/admin/dashboard"
              className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm font-medium text-neutral-900 shadow-sm transition hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-900"
            >
              Panel Administrativo
              <div className="mt-1 text-xs font-normal text-neutral-600 dark:text-neutral-400">
                Acceso al panel de gestión.
              </div>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
