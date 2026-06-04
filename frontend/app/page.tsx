import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1 bg-[var(--color-background)] text-[var(--color-foreground)]">
      <div className="mx-auto flex w-full max-w-5xl flex-col px-4 py-16">
        <div className="rounded-3xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface)] p-10 shadow-2xl shadow-black/[0.08] backdrop-blur">
          <div className="max-w-2xl">
            <div className="inline-flex items-center rounded-full border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-muted)] px-3 py-1 text-xs font-medium text-slate-700 shadow-sm backdrop-blur dark:text-slate-200">
              Sistema Iglesia
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Centro operativo de la iglesia
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Gestión moderna de miembros, discipulados, ministerios y seguimiento pastoral. Todo con navegación rápida y sin perder contexto.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Link
              href="/admin/home"
              className="group rounded-3xl border border-[color:var(--admin-border)] bg-[linear-gradient(135deg,var(--admin-accent),var(--admin-accent-2))] p-6 shadow-sm transition-all duration-200 ease-in-out hover:scale-[1.01] hover:shadow-md active:scale-[0.99]"
            >
              <div className="text-sm font-semibold tracking-tight text-[color:var(--admin-accent-foreground)]">Panel administrativo</div>
              <div className="mt-1 text-xs text-[color:var(--admin-accent-foreground)]/80">
                Entrar al dashboard Home y módulos principales.
              </div>
            </Link>

            <Link
              href="/login"
              className="rounded-3xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface)] p-6 shadow-sm backdrop-blur transition-all duration-200 ease-in-out hover:scale-[1.01] hover:bg-[color:var(--admin-surface-muted)] active:scale-[0.99]"
            >
              <div className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">Iniciar sesión</div>
              <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                Acceso con credenciales.
              </div>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
