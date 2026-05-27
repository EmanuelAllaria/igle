"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type CampoTipo = "texto" | "numero" | "fecha";

type Campo = {
  id: number;
  label: string;
  tipo: CampoTipo;
  es_requerido: boolean;
};

type Formulario = {
  id: number;
  titulo: string;
  slug: string;
  campos: Campo[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractMessage(json: unknown): string | null {
  if (!isRecord(json)) return null;
  return typeof json.message === "string" ? json.message : null;
}

function extractData(json: unknown): unknown {
  if (!isRecord(json)) return null;
  return json.data ?? json;
}

export default function PublicFormPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [form, setForm] = useState<Formulario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [values, setValues] = useState<Record<string, string>>({});
  const [submitStatus, setSubmitStatus] = useState<
    | { kind: "idle" }
    | { kind: "saving" }
    | { kind: "success"; message: string }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  const requiredErrors = useMemo(() => {
    if (!form) return {};
    const errs: Record<string, string> = {};
    for (const c of form.campos) {
      const key = String(c.id);
      const v = values[key] ?? "";
      if (c.es_requerido && v.trim() === "") errs[key] = "Campo requerido.";
      if (v.trim() !== "" && c.tipo === "numero" && Number.isNaN(Number(v))) errs[key] = "Debe ser un número.";
    }
    return errs;
  }, [form, values]);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setError(null);
      setForm(null);
      try {
        const res = await fetch(`/api/forms/${encodeURIComponent(slug)}`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error(extractMessage(json) ?? "No se pudo cargar el formulario.");

        const data = extractData(json);
        if (!isRecord(data)) throw new Error("Respuesta inválida del servidor.");

        const camposRaw = Array.isArray(data.campos) ? (data.campos as Campo[]) : [];
        const f: Formulario = {
          id: typeof data.id === "number" ? data.id : 0,
          titulo: typeof data.titulo === "string" ? data.titulo : "",
          slug: typeof data.slug === "string" ? data.slug : slug,
          campos: camposRaw,
        };

        if (!alive) return;
        setForm(f);
        const initValues: Record<string, string> = {};
        for (const c of camposRaw) initValues[String(c.id)] = "";
        setValues(initValues);
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Error inesperado.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    if (typeof slug === "string" && slug.length > 0) void load();
    return () => {
      alive = false;
    };
  }, [slug]);

  async function submit() {
    if (!form) return;
    setSubmitStatus({ kind: "idle" });

    const errs = requiredErrors;
    if (Object.keys(errs).length > 0) {
      setSubmitStatus({ kind: "error", message: "Revisá los campos marcados." });
      return;
    }

    setSubmitStatus({ kind: "saving" });
    try {
      const res = await fetch(`/api/forms/${encodeURIComponent(form.slug)}/respuestas`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ miembro_id: null, json_data: values }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(extractMessage(json) ?? "No se pudo guardar la respuesta.");
      setSubmitStatus({ kind: "success", message: extractMessage(json) ?? "Respuesta guardada." });
    } catch (e) {
      setSubmitStatus({ kind: "error", message: e instanceof Error ? e.message : "Error inesperado." });
    }
  }

  return (
    <main className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)]">
      <div className="mx-auto w-full max-w-2xl px-4 py-10">
        {loading ? (
          <div className="text-sm text-neutral-600 dark:text-neutral-400">Cargando...</div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        ) : !form ? (
          <div className="text-sm text-neutral-600 dark:text-neutral-400">No hay formulario.</div>
        ) : (
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
            <h1 className="text-2xl font-semibold tracking-tight">{form.titulo}</h1>
            <div className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">{form.slug}</div>

            <div className="mt-6 space-y-4">
              {form.campos.map((c) => {
                const key = String(c.id);
                const val = values[key] ?? "";
                const err = requiredErrors[key];
                const inputType = c.tipo === "numero" ? "number" : c.tipo === "fecha" ? "date" : "text";

                return (
                  <div key={c.id}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {c.label}
                      </div>
                      {c.es_requerido ? (
                        <div className="text-xs text-neutral-600 dark:text-neutral-400">Requerido</div>
                      ) : null}
                    </div>
                    <input
                      type={inputType}
                      value={val}
                      onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
                      className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-600"
                    />
                    {err ? (
                      <div className="mt-1 text-xs text-red-700 dark:text-red-300">{err}</div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {submitStatus.kind === "error" ? (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
                {submitStatus.message}
              </div>
            ) : null}

            {submitStatus.kind === "success" ? (
              <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100">
                {submitStatus.message}
              </div>
            ) : null}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
                onClick={submit}
                disabled={submitStatus.kind === "saving"}
              >
                {submitStatus.kind === "saving" ? "Guardando..." : "Enviar"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

