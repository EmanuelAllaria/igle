"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractData(json: unknown): unknown {
  if (!isRecord(json)) return null;
  return json.data ?? json;
}

function extractMessage(json: unknown): string | null {
  if (!isRecord(json)) return null;
  return typeof json.message === "string" ? json.message : null;
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalMiembros, setTotalMiembros] = useState<number | null>(null);
  const [discipuladosActivos, setDiscipuladosActivos] = useState<number | null>(null);
  const [formularios, setFormularios] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [mRes, dRes, fRes] = await Promise.all([
          fetch("/api/miembros?per_page=1", { headers: { Accept: "application/json" }, cache: "no-store" }),
          fetch("/api/discipulados", { headers: { Accept: "application/json" }, cache: "no-store" }),
          fetch("/api/formularios", { headers: { Accept: "application/json" }, cache: "no-store" }),
        ]);

        const [mJson, dJson, fJson] = await Promise.all([
          mRes.json().catch(() => null),
          dRes.json().catch(() => null),
          fRes.json().catch(() => null),
        ]);

        if (!mRes.ok) throw new Error(extractMessage(mJson) ?? "No se pudo cargar miembros.");
        if (!dRes.ok) throw new Error(extractMessage(dJson) ?? "No se pudo cargar discipulados.");
        if (!fRes.ok) throw new Error(extractMessage(fJson) ?? "No se pudo cargar formularios.");

        const mData = extractData(mJson);
        const dData = extractData(dJson);
        const fData = extractData(fJson);

        const total =
          isRecord(mData) && typeof mData.total === "number"
            ? (mData.total as number)
            : isRecord(mData) && Array.isArray(mData.data)
              ? (mData.data as unknown[]).length
              : null;

        const discipuladosCount = Array.isArray(dData) ? dData.length : null;
        const formsCount = Array.isArray(fData) ? fData.length : null;

        if (!alive) return;
        setTotalMiembros(total);
        setDiscipuladosActivos(discipuladosCount);
        setFormularios(formsCount);
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Error inesperado.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    void load();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <main className="flex-1">
      <div className="mx-auto w-full max-w-5xl py-4">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">Resumen general del sistema.</p>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </div>
          ) : null}

          <div className="mt-6">
            <div className="text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
              Resumen
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Card title="Total Miembros" value={loading ? "Cargando..." : formatNumber(totalMiembros)} />
              <Card title="Discipulados Activos" value={loading ? "Cargando..." : formatNumber(discipuladosActivos)} />
              <Card title="Formularios" value={loading ? "Cargando..." : formatNumber(formularios)} />
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link
              href="/admin/miembros"
              className="rounded-2xl border border-neutral-200 bg-white p-5 text-sm font-medium text-neutral-900 shadow-sm transition hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-900"
            >
              Miembros
              <div className="mt-1 text-xs font-normal text-neutral-600 dark:text-neutral-400">
                Altas, bajas y consultas.
              </div>
            </Link>

            <Link
              href="/admin/discipulados"
              className="rounded-2xl border border-neutral-200 bg-white p-5 text-sm font-medium text-neutral-900 shadow-sm transition hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-900"
            >
              Discipulados
              <div className="mt-1 text-xs font-normal text-neutral-600 dark:text-neutral-400">
                Eventos y registro de asistencia.
              </div>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

function formatNumber(v: number | null) {
  return typeof v === "number" ? v.toLocaleString() : "—";
}

function Card(props: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/30">
      <div className="text-xs font-medium text-neutral-600 dark:text-neutral-400">{props.title}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
        {props.value}
      </div>
    </div>
  );
}
