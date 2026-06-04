"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type Persona = {
  id: number;
  dni: string | null;
  nombre: string;
  apellido: string;
  tel_celular: string | null;
};

type Familia = {
  key: string;
  nombre: string;
  padre: Persona | null;
  madre: Persona | null;
  hijos: Persona[];
  hijos_count: number;
  integrantes_count: number;
};

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

function fullName(m: { nombre: string; apellido: string }) {
  return `${m.apellido}, ${m.nombre}`.trim();
}

export default function AdminFamiliasPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [familias, setFamilias] = useState<Familia[]>([]);

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [treeOpen, setTreeOpen] = useState(false);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/familias", { headers: { Accept: "application/json" }, cache: "no-store" });
        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error(extractMessage(json) ?? "No se pudieron cargar familias.");

        const data = extractData(json);
        const rows = Array.isArray(data) ? data : [];

        const parsed: Familia[] = rows.flatMap((x) => {
          if (!isRecord(x)) return [];
          if (typeof x.key !== "string" || typeof x.nombre !== "string") return [];

          const padreRaw = isRecord(x.padre) ? x.padre : null;
          const madreRaw = isRecord(x.madre) ? x.madre : null;

          const toPersona = (p: Record<string, unknown> | null): Persona | null => {
            if (!p) return null;
            if (typeof p.id !== "number") return null;
            if (typeof p.nombre !== "string" || typeof p.apellido !== "string") return null;
            return {
              id: p.id,
              dni: typeof p.dni === "string" ? p.dni : null,
              nombre: p.nombre,
              apellido: p.apellido,
              tel_celular: typeof p.tel_celular === "string" ? p.tel_celular : null,
            };
          };

          const hijosRaw = Array.isArray(x.hijos) ? (x.hijos as unknown[]) : [];
          const hijos: Persona[] = hijosRaw.flatMap((h) => {
            if (!isRecord(h)) return [];
            const p = toPersona(h);
            return p ? [p] : [];
          });

          return [
            {
              key: x.key,
              nombre: x.nombre,
              padre: toPersona(padreRaw),
              madre: toPersona(madreRaw),
              hijos,
              hijos_count: typeof x.hijos_count === "number" ? x.hijos_count : hijos.length,
              integrantes_count: typeof x.integrantes_count === "number" ? x.integrantes_count : hijos.length,
            },
          ];
        });

        if (!alive) return;
        setFamilias(parsed);
        setSelectedKey((prev) => (prev === null && parsed.length > 0 ? parsed[0]!.key : prev));
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

  const selected = useMemo(() => {
    return familias.find((f) => f.key === selectedKey) ?? null;
  }, [familias, selectedKey]);

  const sorted = useMemo(() => {
    return [...familias].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [familias]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Familias</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Familia genealógica creada a partir de una unión (pareja) y sus hijos vinculados.</p>
        </div>
        <Button
          variant="secondary"
          onClick={() => {
            if (!selected) return;
            setTreeOpen(true);
          }}
          disabled={!selected}
        >
          Ver Árbol Genealógico
        </Button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200/70 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_420px]">
        <div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {loading ? (
              <Card>
                <CardHeader>
                  <CardTitle>Cargando...</CardTitle>
                  <CardDescription>Obteniendo familias.</CardDescription>
                </CardHeader>
                <CardContent />
              </Card>
            ) : sorted.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Sin familias</CardTitle>
                  <CardDescription>Vinculá padre/madre para inferir familias.</CardDescription>
                </CardHeader>
                <CardContent />
              </Card>
            ) : (
              sorted.map((f) => (
                <Card
                  key={f.key}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedKey(f.key)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") setSelectedKey(f.key);
                  }}
                  className={selectedKey === f.key ? "ring-2 ring-[color:var(--admin-accent)]/30" : undefined}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <CardTitle className="truncate">{f.nombre}</CardTitle>
                        <CardDescription>Padre / Madre / Hijos</CardDescription>
                      </div>
                      <Badge variant="muted">{f.integrantes_count}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                      <span>{f.hijos_count} hijos</span>
                      <span>Ver</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface)] p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                {selected?.nombre ?? "Seleccioná una familia"}
              </div>
              <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">Integrantes inferidos por padre_id / madre_id.</div>
            </div>
            {selected ? <Badge variant="muted">{selected.integrantes_count}</Badge> : null}
          </div>

          {!selected ? (
            <div className="mt-4 text-sm text-slate-600 dark:text-slate-400">No hay familia seleccionada.</div>
          ) : (
            <div className="mt-4 space-y-3">
              <PersonaRow roleLabel="Cónyuge 1" persona={selected.padre} />
              <PersonaRow roleLabel="Cónyuge 2" persona={selected.madre} />

              <div className="mt-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Hijos</div>
                {selected.hijos.length === 0 ? (
                  <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">Sin hijos vinculados.</div>
                ) : (
                  <div className="mt-2 space-y-2">
                    {selected.hijos.map((h) => (
                      <div
                        key={h.id}
                        className="rounded-xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface)] p-4 shadow-sm transition-all duration-200 ease-in-out hover:shadow-md hover:scale-[1.01] active:scale-[0.99]"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="min-w-0 truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                            {fullName(h)}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">{h.dni ? <Badge variant="muted">{h.dni}</Badge> : null}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <Sheet open={treeOpen} onOpenChange={setTreeOpen}>
        <SheetContent className="max-w-4xl">
          <SheetHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <SheetTitle>Árbol genealógico</SheetTitle>
                <SheetDescription>{selected?.nombre ?? "Familia"}</SheetDescription>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setTreeOpen(false)}>
                Cerrar
              </Button>
            </div>
          </SheetHeader>

          <SheetBody>
            {!selected ? (
              <div className="text-sm text-slate-600 dark:text-slate-400">No hay familia seleccionada.</div>
            ) : (
              <FamilyTree familia={selected} />
            )}
          </SheetBody>

          <SheetFooter>
            <Button variant="secondary" onClick={() => setTreeOpen(false)}>
              Cerrar
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function PersonaRow(props: { roleLabel: string; persona: Persona | null }) {
  return (
    <div className="rounded-xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface)] p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
            {props.roleLabel}
          </div>
          <div className="mt-1 truncate text-sm font-medium text-slate-900 dark:text-slate-100">
            {props.persona ? fullName(props.persona) : "—"}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {props.persona?.dni ? <Badge variant="muted">{props.persona.dni}</Badge> : <Badge variant="warning">Sin DNI</Badge>}
        </div>
      </div>
    </div>
  );
}

function FamilyTree(props: { familia: Familia }) {
  const padre = props.familia.padre;
  const madre = props.familia.madre;
  const hijos = props.familia.hijos;

  return (
    <div className="rounded-xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface)] p-6 shadow-sm">
      <div className="flex flex-col items-center gap-6">
        <div className="flex w-full flex-col items-center gap-3 sm:flex-row sm:items-stretch sm:justify-center">
          <Node label="Cónyuge 1" persona={padre} />
          <div className="hidden w-10 items-center justify-center sm:flex">
            <div className="h-px w-full bg-[color:var(--admin-border)]" />
          </div>
          <Node label="Cónyuge 2" persona={madre} />
        </div>

        <div className="flex w-full items-center justify-center">
          <div className="h-px w-full max-w-md bg-[color:var(--admin-border)]" />
        </div>

        {hijos.length === 0 ? (
          <div className="text-sm text-slate-600 dark:text-slate-400">Sin hijos vinculados.</div>
        ) : (
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {hijos.map((h) => (
              <Node key={h.id} label="Hijo/a" persona={h} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Node(props: { label: string; persona: Persona | null }) {
  return (
    <div className="w-full max-w-sm rounded-xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface)] p-5 shadow-sm transition-all duration-200 ease-in-out hover:scale-[1.01] hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
            {props.label}
          </div>
          <div className="mt-1 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
            {props.persona ? fullName(props.persona) : "—"}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {props.persona?.dni ? <Badge variant="muted">{props.persona.dni}</Badge> : null}
        </div>
      </div>
    </div>
  );
}
