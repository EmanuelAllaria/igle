"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await axios.post(
        "/api/auth/login",
        { email, password, device_name: "web" },
        { withCredentials: true, headers: { Accept: "application/json" } },
      );

      if (res.status >= 200 && res.status < 300) {
        router.push("/admin/dashboard");
        return;
      }

      setError("Credenciales inválidas.");
    } catch {
      setError("No se pudo iniciar sesión. Verificá tus credenciales.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 bg-[var(--color-background)] text-[var(--color-foreground)]">
      <div className="mx-auto flex w-full max-w-md flex-col px-4 py-14">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
          <h1 className="text-xl font-semibold tracking-tight">Iniciar sesión</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Acceso al panel administrativo.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-600"
                placeholder="admin@iglesia.com"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-600"
                placeholder="••••••••"
                required
              />
            </div>

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
