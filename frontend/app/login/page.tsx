"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

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
        router.push("/admin/home");
        return;
      }

      setError("Credenciales inválidas.");
    } catch (err: unknown) {
      let message: string | null = null;
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as unknown;
        if (isRecord(data) && typeof data.message === "string") {
          message = data.message;
        }
      }
      setError(message ?? "No se pudo iniciar sesión. Verificá tus credenciales.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 bg-[var(--color-background)] text-[var(--color-foreground)]">
      <div className="mx-auto flex w-full max-w-md flex-col px-4 py-14">
        <div className="rounded-3xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface)] p-8 shadow-2xl shadow-black/[0.08] backdrop-blur">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Iniciar sesión</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Acceso al panel administrativo.</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-slate-100">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="mt-1"
                placeholder="admin@iglesia.com"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-slate-100">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="mt-1"
                placeholder="••••••••"
                required
              />
            </div>

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
                {error}
              </div>
            ) : null}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Ingresando..." : "Ingresar"}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
