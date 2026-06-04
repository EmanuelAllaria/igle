"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

type ImportRun = {
  id: number;
  original_filename: string | null;
  status: string;
  processed_count: number;
  created_count: number;
  updated_count: number;
  error_count: number;
  created_at?: string;
};

type ImportError = {
  id: number;
  row_number: number | null;
  dni: string | null;
  field: string | null;
  message: string;
  raw: unknown;
  created_at?: string;
};

export default function AdminImportarCensoPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<
    | { kind: "idle" }
    | { kind: "uploading" }
    | { kind: "success"; message: string }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  const [runs, setRuns] = useState<ImportRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);
  const [errors, setErrors] = useState<ImportError[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const selectedRun = useMemo(() => runs.find((r) => r.id === selectedRunId) ?? null, [runs, selectedRunId]);

  useEffect(() => {
    let alive = true;
    async function loadRuns() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/censo/importar/logs?per_page=20", { headers: { Accept: "application/json" }, cache: "no-store" });
        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error(extractMessage(json) ?? "No se pudieron cargar importaciones.");
        const data = extractData(json);
        const list = isRecord(data) && Array.isArray(data.data) ? (data.data as unknown[]) : [];
        const parsed: ImportRun[] = list.flatMap((x) => {
          if (!isRecord(x)) return [];
          if (typeof x.id !== "number") return [];
          return [
            {
              id: x.id,
              original_filename: typeof x.original_filename === "string" ? x.original_filename : null,
              status: typeof x.status === "string" ? x.status : "unknown",
              processed_count: typeof x.processed_count === "number" ? x.processed_count : 0,
              created_count: typeof x.created_count === "number" ? x.created_count : 0,
              updated_count: typeof x.updated_count === "number" ? x.updated_count : 0,
              error_count: typeof x.error_count === "number" ? x.error_count : 0,
              created_at: typeof x.created_at === "string" ? x.created_at : undefined,
            },
          ];
        });

        if (!alive) return;
        setRuns(parsed);
        if (parsed.length > 0 && selectedRunId === null) {
          setSelectedRunId(parsed[0].id);
        }
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Error inesperado.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    void loadRuns();
    return () => {
      alive = false;
    };
  }, [reloadTick, selectedRunId]);

  useEffect(() => {
    if (!selectedRunId) return;
    let alive = true;
    async function loadErrors() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/censo/importar/logs?run_id=${encodeURIComponent(String(selectedRunId))}`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error(extractMessage(json) ?? "No se pudieron cargar errores.");
        const data = extractData(json);
        const errsRaw = isRecord(data) && Array.isArray(data.errors) ? (data.errors as unknown[]) : [];
        const parsed: ImportError[] = errsRaw.flatMap((x) => {
          if (!isRecord(x)) return [];
          if (typeof x.id !== "number") return [];
          return [
            {
              id: x.id,
              row_number: typeof x.row_number === "number" ? x.row_number : null,
              dni: typeof x.dni === "string" ? x.dni : null,
              field: typeof x.field === "string" ? x.field : null,
              message: typeof x.message === "string" ? x.message : "Error",
              raw: "raw" in x ? x.raw : null,
              created_at: typeof x.created_at === "string" ? x.created_at : undefined,
            },
          ];
        });

        if (!alive) return;
        setErrors(parsed);
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Error inesperado.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    void loadErrors();
    return () => {
      alive = false;
    };
  }, [selectedRunId]);

  async function upload() {
    if (!file) {
      setUploadStatus({ kind: "error", message: "Seleccioná un archivo CSV o Excel." });
      return;
    }

    setUploadStatus({ kind: "uploading" });
    try {
      const formData = new FormData();
      formData.set("file", file);

      const res = await fetch("/api/censo/importar", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData,
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(extractMessage(json) ?? "No se pudo importar.");

      setUploadStatus({ kind: "success", message: extractMessage(json) ?? "Importación completada." });
      setFile(null);
      setReloadTick((v) => v + 1);
    } catch (e) {
      setUploadStatus({ kind: "error", message: e instanceof Error ? e.message : "Error inesperado." });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Importar Censo</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Subí una planilla CSV/Excel. El sistema busca por DNI: actualiza si existe, crea si no existe, y registra los errores para corregir.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_380px]">
        <div className="rounded-xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface)] p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="w-full">
              <Label>Archivo</Label>
              <Input type="file" accept=".csv,.txt,.xlsx,.xls" onChange={(e) => setFile(e.target.files?.item(0) ?? null)} />
              <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">Formatos: CSV, XLSX, XLS. Tamaño máx: 20MB.</div>
            </div>
            <Button onClick={() => void upload()} disabled={uploadStatus.kind === "uploading"}>
              {uploadStatus.kind === "uploading" ? "Importando..." : "Importar"}
            </Button>
          </div>

          {uploadStatus.kind === "error" ? (
            <div className="mt-4 rounded-xl border border-red-200/70 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
              {uploadStatus.message}
            </div>
          ) : null}
          {uploadStatus.kind === "success" ? (
            <div className="mt-4 rounded-xl border border-emerald-200/70 bg-emerald-50 p-4 text-sm text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
              {uploadStatus.message}
            </div>
          ) : null}

          {error ? (
            <div className="mt-4 rounded-xl border border-red-200/70 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
              {error}
            </div>
          ) : null}

          <div className="mt-6 flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Errores de importación</div>
            <Badge variant="muted">{loading ? "Cargando..." : `${errors.length}`}</Badge>
          </div>

          {errors.length === 0 ? (
            <div className="mt-3 text-sm text-slate-600 dark:text-slate-400">No hay errores para este run.</div>
          ) : (
            <div className="mt-3 space-y-2">
              {errors.slice(0, 50).map((e) => (
                <div
                  key={e.id}
                  className="rounded-xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface)] p-4 shadow-sm transition-all duration-200 ease-in-out hover:shadow-md hover:scale-[1.01] active:scale-[0.99]"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="muted">Fila {e.row_number ?? "?"}</Badge>
                    {e.dni ? <Badge variant="muted">DNI {e.dni}</Badge> : <Badge variant="warning">Sin DNI</Badge>}
                    {e.field ? <Badge variant="muted">{e.field}</Badge> : null}
                  </div>
                  <div className="mt-2 text-sm text-slate-900 dark:text-slate-100">{e.message}</div>
                  {isRecord(e.raw) ? (
                    <pre className="mt-3 overflow-auto rounded-xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-muted)] p-3 text-xs text-slate-900 dark:text-slate-100">
                      {JSON.stringify(e.raw, null, 2)}
                    </pre>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface)] p-6 shadow-sm">
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Historial</div>
          <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">Seleccioná una importación para ver su log.</div>

          <div className="mt-4 space-y-2">
            {runs.length === 0 ? (
              <div className="text-sm text-slate-600 dark:text-slate-400">Todavía no hay importaciones.</div>
            ) : (
              runs.map((r) => {
                const active = r.id === selectedRunId;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedRunId(r.id)}
                    className={[
                      "w-full rounded-xl border p-4 text-left shadow-sm transition-all duration-200 ease-in-out hover:scale-[1.01] active:scale-[0.99]",
                      active ? "border-[color:var(--admin-border)] bg-[color:var(--admin-surface)]" : "border-[color:var(--admin-border)] bg-[color:var(--admin-surface-muted)]",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                          {r.original_filename ?? `Run #${r.id}`}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                          <Badge variant="muted">#{r.id}</Badge>
                          <Badge variant="muted">{r.status}</Badge>
                          <span>{r.created_at ? new Date(r.created_at).toLocaleString() : ""}</span>
                        </div>
                      </div>
                      <Badge variant={r.error_count > 0 ? "warning" : "muted"}>{r.error_count} err</Badge>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <MiniStat label="Procesadas" value={r.processed_count} />
                      <MiniStat label="Creadas" value={r.created_count} />
                      <MiniStat label="Actualizadas" value={r.updated_count} />
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {selectedRun ? (
            <div className="mt-5 rounded-xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface)] p-5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Run seleccionado</div>
              <div className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                {selectedRun.original_filename ?? `Run #${selectedRun.id}`}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant="muted">Status: {selectedRun.status}</Badge>
                <Badge variant="muted">Errores: {selectedRun.error_count}</Badge>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function MiniStat(props: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-muted)] p-3 shadow-sm">
      <div className="text-[11px] font-medium text-slate-600 dark:text-slate-400">{props.label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{props.value}</div>
    </div>
  );
}
