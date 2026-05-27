"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type CampoTipo = "texto" | "numero" | "fecha";

type CampoDraft = {
  key: string;
  label: string;
  tipo: CampoTipo;
  es_requerido: boolean;
};

type FormularioListItem = {
  id: number;
  titulo: string;
  slug: string;
  campos_count?: number;
};

type RespuestaListItem = {
  id: number;
  created_at?: string;
  miembro?: { id: number; nombre: string; apellido: string } | null;
  json_data: unknown;
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

function slugIsValid(slug: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export default function AdminFormsPage() {
  const [formularios, setFormularios] = useState<FormularioListItem[]>([]);
  const [formulariosLoading, setFormulariosLoading] = useState(true);
  const [formulariosError, setFormulariosError] = useState<string | null>(null);
  const [reloadList, setReloadList] = useState(0);

  const [selected, setSelected] = useState<FormularioListItem | null>(null);
  const [respuestas, setRespuestas] = useState<RespuestaListItem[]>([]);
  const [respuestasLoading, setRespuestasLoading] = useState(false);
  const [respuestasError, setRespuestasError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState<number | null>(null);

  const [titulo, setTitulo] = useState("");
  const [slug, setSlug] = useState("");
  const [campos, setCampos] = useState<CampoDraft[]>([
    { key: crypto.randomUUID(), label: "Nombre", tipo: "texto", es_requerido: true },
  ]);

  const [status, setStatus] = useState<
    | { kind: "idle" }
    | { kind: "saving" }
    | { kind: "success"; slug: string }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  const canSubmit = useMemo(() => status.kind !== "saving", [status.kind]);

  useEffect(() => {
    let alive = true;
    async function load() {
      setFormulariosLoading(true);
      setFormulariosError(null);
      try {
        const res = await fetch("/api/formularios", { headers: { Accept: "application/json" }, cache: "no-store" });
        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error(extractMessage(json) ?? "No se pudieron cargar formularios.");
        const data = extractData(json);
        const list = Array.isArray(data) ? (data as FormularioListItem[]) : [];
        if (!alive) return;
        setFormularios(list);
      } catch (e) {
        if (!alive) return;
        setFormulariosError(e instanceof Error ? e.message : "Error inesperado.");
      } finally {
        if (!alive) return;
        setFormulariosLoading(false);
      }
    }
    void load();
    return () => {
      alive = false;
    };
  }, [reloadList]);

  useEffect(() => {
    let alive = true;

    async function loadRespuestas() {
      if (!selected) return;
      setRespuestasLoading(true);
      setRespuestasError(null);
      try {
        const res = await fetch(`/api/forms/${encodeURIComponent(selected.slug)}/respuestas?per_page=20&page=${page}`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error(extractMessage(json) ?? "No se pudieron cargar respuestas.");
        const data = extractData(json);
        if (!isRecord(data)) throw new Error("Respuesta inválida del servidor.");

        const respuestasWrap = isRecord(data.respuestas) ? (data.respuestas as Record<string, unknown>) : null;
        const rows = respuestasWrap && Array.isArray(respuestasWrap.data) ? (respuestasWrap.data as RespuestaListItem[]) : [];
        const lp = respuestasWrap && typeof respuestasWrap.last_page === "number" ? (respuestasWrap.last_page as number) : null;

        if (!alive) return;
        setRespuestas(rows);
        setLastPage(lp);
      } catch (e) {
        if (!alive) return;
        setRespuestasError(e instanceof Error ? e.message : "Error inesperado.");
        setRespuestas([]);
        setLastPage(null);
      } finally {
        if (!alive) return;
        setRespuestasLoading(false);
      }
    }

    void loadRespuestas();
    return () => {
      alive = false;
    };
  }, [page, selected]);

  function addCampo() {
    setCampos((prev) => [
      ...prev,
      { key: crypto.randomUUID(), label: "", tipo: "texto", es_requerido: false },
    ]);
  }

  function removeCampo(key: string) {
    setCampos((prev) => prev.filter((c) => c.key !== key));
  }

  async function submit() {
    setStatus({ kind: "idle" });

    const t = titulo.trim();
    const s = slug.trim();
    if (!t) {
      setStatus({ kind: "error", message: "El título es obligatorio." });
      return;
    }
    if (!s) {
      setStatus({ kind: "error", message: "El slug es obligatorio." });
      return;
    }
    if (!slugIsValid(s)) {
      setStatus({
        kind: "error",
        message: "Slug inválido. Usá minúsculas, números y guiones (ej: encuesta-2026).",
      });
      return;
    }
    const payloadCampos = campos
      .map((c) => ({
        label: c.label.trim(),
        tipo: c.tipo,
        es_requerido: c.es_requerido,
      }))
      .filter((c) => c.label.length > 0);

    if (payloadCampos.length === 0) {
      setStatus({ kind: "error", message: "Agregá al menos un campo con label." });
      return;
    }

    setStatus({ kind: "saving" });
    try {
      const res = await fetch("/api/formularios", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ titulo: t, slug: s, campos: payloadCampos }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(extractMessage(json) ?? "No se pudo crear el formulario.");

      setStatus({ kind: "success", slug: s });
      setTitulo("");
      setSlug("");
      setCampos([{ key: crypto.randomUUID(), label: "", tipo: "texto", es_requerido: false }]);
      setReloadList((v) => v + 1);
    } catch (e) {
      setStatus({ kind: "error", message: e instanceof Error ? e.message : "Error inesperado." });
    }
  }

  return (
    <main className="flex-1 bg-[var(--color-background)] text-[var(--color-foreground)]">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Formularios</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Crear formularios y campos dinámicos.
          </p>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
            <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Crear formulario</div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Título">
                <input
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-600"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                />
              </Field>
              <Field label="Slug">
                <input
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-600"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="ej: encuesta-2026"
                />
              </Field>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Campos</div>
              <button
                type="button"
                className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-900 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-900"
                onClick={addCampo}
                disabled={!canSubmit}
              >
                Agregar campo
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {campos.map((c, idx) => (
                <div
                  key={c.key}
                  className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/30"
                >
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Field label={`Label #${idx + 1}`}>
                      <input
                        className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-600"
                        value={c.label}
                        onChange={(e) =>
                          setCampos((prev) =>
                            prev.map((x) => (x.key === c.key ? { ...x, label: e.target.value } : x)),
                          )
                        }
                      />
                    </Field>

                    <Field label="Tipo">
                      <select
                        className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-600"
                        value={c.tipo}
                        onChange={(e) =>
                          setCampos((prev) =>
                            prev.map((x) =>
                              x.key === c.key ? { ...x, tipo: e.target.value as CampoTipo } : x,
                            ),
                          )
                        }
                      >
                        <option value="texto">Texto</option>
                        <option value="numero">Número</option>
                        <option value="fecha">Fecha</option>
                      </select>
                    </Field>

                    <Field label="Requerido">
                      <div className="flex h-10 items-center gap-2">
                        <input
                          type="checkbox"
                          checked={c.es_requerido}
                          onChange={(e) =>
                            setCampos((prev) =>
                              prev.map((x) =>
                                x.key === c.key ? { ...x, es_requerido: e.target.checked } : x,
                              ),
                            )
                          }
                        />
                        <span className="text-sm text-neutral-700 dark:text-neutral-300">
                          {c.es_requerido ? "Sí" : "No"}
                        </span>
                      </div>
                    </Field>
                  </div>

                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-900 hover:bg-neutral-50 disabled:opacity-60 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-900"
                      onClick={() => removeCampo(c.key)}
                      disabled={!canSubmit || campos.length === 1}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {status.kind === "error" ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
                {status.message}
              </div>
            ) : null}

            {status.kind === "success" ? (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100">
                Formulario creado.{" "}
                <Link className="underline" href={`/forms/${status.slug}`}>
                  Abrir formulario público
                </Link>
              </div>
            ) : null}

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
                onClick={submit}
                disabled={!canSubmit}
              >
                {status.kind === "saving" ? "Guardando..." : "Crear formulario"}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
            <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              Respuestas por formulario
            </div>
            <div className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
              Seleccioná un formulario para ver sus respuestas.
            </div>

            {formulariosLoading ? (
              <div className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">Cargando...</div>
            ) : formulariosError ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
                {formulariosError}
              </div>
            ) : formularios.length === 0 ? (
              <div className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">No hay formularios.</div>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-2">
                {formularios.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`rounded-2xl border p-4 text-left text-sm shadow-sm transition ${
                      selected?.id === f.id
                        ? "border-neutral-900 bg-neutral-50 dark:border-neutral-100 dark:bg-neutral-900/30"
                        : "border-neutral-200 bg-white hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900"
                    }`}
                    onClick={() => {
                      setSelected(f);
                      setPage(1);
                    }}
                  >
                    <div className="font-medium text-neutral-900 dark:text-neutral-100">{f.titulo}</div>
                    <div className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                      {f.slug}
                      {typeof f.campos_count === "number" ? ` · ${f.campos_count} campos` : ""}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selected ? (
              <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center justify-between gap-3 border-b border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900/40">
                  <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {selected.titulo}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-900 hover:bg-neutral-50 disabled:opacity-60 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-900"
                      disabled={respuestasLoading || page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Anterior
                    </button>
                    <button
                      type="button"
                      className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-900 hover:bg-neutral-50 disabled:opacity-60 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-900"
                      disabled={respuestasLoading || lastPage === null || page >= lastPage}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Siguiente
                    </button>
                  </div>
                </div>

                {respuestasLoading ? (
                  <div className="p-4 text-sm text-neutral-600 dark:text-neutral-400">Cargando...</div>
                ) : respuestasError ? (
                  <div className="p-4 text-sm text-red-700 dark:text-red-300">{respuestasError}</div>
                ) : respuestas.length === 0 ? (
                  <div className="p-4 text-sm text-neutral-600 dark:text-neutral-400">
                    Sin respuestas.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-separate border-spacing-0">
                      <thead>
                        <tr className="bg-neutral-50 text-left text-xs font-semibold text-neutral-600 dark:bg-neutral-900/40 dark:text-neutral-300">
                          <th className="px-4 py-3">Fecha de envío</th>
                          <th className="px-4 py-3">Miembro</th>
                          <th className="px-4 py-3">Datos</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {respuestas.map((r) => (
                          <tr
                            key={r.id}
                            className="border-t border-neutral-100 align-top dark:border-neutral-900"
                          >
                            <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">
                              {r.created_at ? new Date(r.created_at).toLocaleString() : "-"}
                            </td>
                            <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">
                              {r.miembro ? `${r.miembro.apellido}, ${r.miembro.nombre}` : "-"}
                            </td>
                            <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">
                              <pre className="max-w-[52ch] overflow-x-auto whitespace-pre-wrap break-words rounded-xl border border-neutral-200 bg-white p-3 text-xs dark:border-neutral-800 dark:bg-neutral-950">
                                {JSON.stringify(r.json_data ?? null, null, 2)}
                              </pre>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}

function Field(props: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1">
      <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{props.label}</div>
      {props.children}
    </label>
  );
}
