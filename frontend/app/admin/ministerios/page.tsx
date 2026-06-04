"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Select } from "@/components/ui/select";
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";

type MinisterioListItem = {
  id: number;
  nombre: string;
  miembros_count?: number;
};

type CatalogoItem = { id: number; nombre: string };
type GrupoMinisterio = { id: number; nombre: string };

type MinisterioDetalle = {
  id: number;
  nombre: string;
  ministerio_miembros?: Array<{
    id: number;
    miembro?: { id: number; dni?: string | null; nombre: string; apellido: string } | null;
    rol_ministerio?: { id: number; nombre: string } | null;
  }>;
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

export default function AdminMinisteriosPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ministerios, setMinisterios] = useState<MinisterioListItem[]>([]);

  const [openId, setOpenId] = useState<number | null>(null);
  const [detalleLoading, setDetalleLoading] = useState(false);
  const [detalleError, setDetalleError] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<MinisterioDetalle | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createNombre, setCreateNombre] = useState("");
  const [createGrupoId, setCreateGrupoId] = useState<number | null>(null);
  const [createStatus, setCreateStatus] = useState<{ kind: "idle" } | { kind: "saving" } | { kind: "error"; message: string }>({ kind: "idle" });

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignBusy, setAssignBusy] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [miembrosAll, setMiembrosAll] = useState<Array<{ id: number; dni: string | null; nombre: string; apellido: string }>>([]);
  const [rolesMinisterio, setRolesMinisterio] = useState<CatalogoItem[]>([]);
  const [gruposMinisterio, setGruposMinisterio] = useState<GrupoMinisterio[]>([]);
  const [memberQuery, setMemberQuery] = useState("");
  const [selectedMiembroId, setSelectedMiembroId] = useState<number | null>(null);
  const [selectedRolId, setSelectedRolId] = useState<number | null>(null);

  async function loadMinisterios() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ministerios", { headers: { Accept: "application/json" }, cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(extractMessage(json) ?? "No se pudieron cargar ministerios.");

      const data = extractData(json);
      const rows = Array.isArray(data) ? data : [];
      const parsed: MinisterioListItem[] = rows.flatMap((x) => {
        if (!isRecord(x)) return [];
        if (typeof x.id !== "number") return [];
        if (typeof x.nombre !== "string") return [];
        return [
          {
            id: x.id,
            nombre: x.nombre,
            miembros_count: typeof x.miembros_count === "number" ? x.miembros_count : undefined,
          },
        ];
      });

      setMinisterios(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  async function loadDetalle(id: number) {
    setDetalleLoading(true);
    setDetalleError(null);
    setDetalle(null);
    try {
      const res = await fetch(`/api/ministerios/${encodeURIComponent(String(id))}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(extractMessage(json) ?? "No se pudo cargar el ministerio.");

      const data = extractData(json);
      if (!isRecord(data) || typeof data.id !== "number" || typeof data.nombre !== "string") {
        throw new Error("Respuesta inválida del servidor.");
      }

      const mmRaw = Array.isArray(data.ministerio_miembros) ? (data.ministerio_miembros as unknown[]) : [];
      const ministerio_miembros = mmRaw.flatMap((r) => {
        if (!isRecord(r) || typeof r.id !== "number") return [];
        const miembroRaw = isRecord(r.miembro) ? r.miembro : null;
        const rolRaw = isRecord(r.rol_ministerio) ? r.rol_ministerio : null;
        const miembro =
          miembroRaw && typeof miembroRaw.id === "number" && typeof miembroRaw.nombre === "string" && typeof miembroRaw.apellido === "string"
            ? {
                id: miembroRaw.id,
                dni: typeof miembroRaw.dni === "string" ? miembroRaw.dni : null,
                nombre: miembroRaw.nombre,
                apellido: miembroRaw.apellido,
              }
            : null;
        const rol =
          rolRaw && typeof rolRaw.id === "number" && typeof rolRaw.nombre === "string"
            ? { id: rolRaw.id, nombre: rolRaw.nombre }
            : null;
        return [{ id: r.id, miembro, rol_ministerio: rol }];
      });

      const parsed: MinisterioDetalle = {
        id: data.id,
        nombre: data.nombre,
        ministerio_miembros,
      };

      setDetalle(parsed);
    } catch (e) {
      setDetalleError(e instanceof Error ? e.message : "Error inesperado.");
    } finally {
      setDetalleLoading(false);
    }
  }

  useEffect(() => {
    async function load() {
      await loadMinisterios();
    }

    void load();
  }, []);

  useEffect(() => {
    if (!assignOpen) return;
    let alive = true;

    async function load() {
      setAssignError(null);
      try {
        const [mRes, cRes] = await Promise.all([
          fetch("/api/miembros?all=1", { headers: { Accept: "application/json" }, cache: "no-store" }),
          fetch("/api/catalogos", { headers: { Accept: "application/json" }, cache: "no-store" }),
        ]);

        const mJson = await mRes.json().catch(() => null);
        if (!mRes.ok) throw new Error(extractMessage(mJson) ?? "No se pudieron cargar los miembros.");

        const cJson = await cRes.json().catch(() => null);
        if (!cRes.ok) throw new Error(extractMessage(cJson) ?? "No se pudieron cargar los catálogos.");

        const mData = extractData(mJson);
        const mRows = Array.isArray(mData) ? mData : [];
        const miembros = mRows.flatMap((x) => {
          if (!isRecord(x)) return [];
          if (typeof x.id !== "number") return [];
          if (typeof x.nombre !== "string" || typeof x.apellido !== "string") return [];
          return [
            {
              id: x.id,
              dni: typeof x.dni === "string" ? x.dni : null,
              nombre: x.nombre,
              apellido: x.apellido,
            },
          ];
        });

        const cData = extractData(cJson);
        const rolesRaw = isRecord(cData) && Array.isArray(cData.roles_ministerio) ? (cData.roles_ministerio as unknown[]) : [];
        const roles = rolesRaw.flatMap((x) => {
          if (!isRecord(x)) return [];
          if (typeof x.id !== "number" || typeof x.nombre !== "string") return [];
          return [{ id: x.id, nombre: x.nombre }];
        });

        const gruposRaw = isRecord(cData) && Array.isArray(cData.grupos_ministerio) ? (cData.grupos_ministerio as unknown[]) : [];
        const grupos = gruposRaw.flatMap((x) => {
          if (!isRecord(x)) return [];
          if (typeof x.id !== "number" || typeof x.nombre !== "string") return [];
          return [{ id: x.id, nombre: x.nombre }];
        });

        if (!alive) return;
        setMiembrosAll(miembros);
        setRolesMinisterio(roles);
        setGruposMinisterio(grupos);

        if (selectedRolId === null && roles.length > 0) {
          setSelectedRolId(roles[0].id);
        }
      } catch (e) {
        if (!alive) return;
        setAssignError(e instanceof Error ? e.message : "Error inesperado.");
      }
    }

    void load();
    return () => {
      alive = false;
    };
  }, [assignOpen, selectedRolId]);

  useEffect(() => {
    if (!createOpen) return;
    let alive = true;

    async function load() {
      try {
        const res = await fetch("/api/catalogos", { headers: { Accept: "application/json" }, cache: "no-store" });
        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error(extractMessage(json) ?? "No se pudieron cargar los catálogos.");

        const data = extractData(json);
        const gruposRaw = isRecord(data) && Array.isArray(data.grupos_ministerio) ? (data.grupos_ministerio as unknown[]) : [];
        const grupos = gruposRaw.flatMap((x) => {
          if (!isRecord(x)) return [];
          if (typeof x.id !== "number" || typeof x.nombre !== "string") return [];
          return [{ id: x.id, nombre: x.nombre }];
        });

        if (!alive) return;
        setGruposMinisterio(grupos);
        setCreateGrupoId((prev) => (prev === null ? grupos[0]?.id ?? null : prev));
      } catch (e) {
        if (!alive) return;
        setCreateStatus({ kind: "error", message: e instanceof Error ? e.message : "Error inesperado." });
      }
    }

    void load();
    return () => {
      alive = false;
    };
  }, [createOpen]);

  async function createMinisterio() {
    const nombre = createNombre.trim();
    if (!nombre) {
      setCreateStatus({ kind: "error", message: "Ingresá el nombre del ministerio." });
      return;
    }
    if (!createGrupoId) {
      setCreateStatus({ kind: "error", message: "Seleccioná un grupo de ministerio." });
      return;
    }

    setCreateStatus({ kind: "saving" });
    try {
      const res = await fetch("/api/ministerios", {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, grupo_ministerio_id: createGrupoId }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(extractMessage(json) ?? "No se pudo crear el ministerio.");

      const data = extractData(json);
      const id = isRecord(data) && typeof data.id === "number" ? data.id : null;

      setCreateOpen(false);
      setCreateNombre("");
      setCreateGrupoId(null);
      setCreateStatus({ kind: "idle" });
      await loadMinisterios();

      if (id) {
        setOpenId(id);
        void loadDetalle(id);
      }
    } catch (e) {
      setCreateStatus({ kind: "error", message: e instanceof Error ? e.message : "Error inesperado." });
    }
  }

  const sorted = useMemo(() => {
    return [...ministerios].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [ministerios]);

  const miembrosFiltered = useMemo(() => {
    const q = memberQuery.trim().toLowerCase();
    if (!q) return miembrosAll;
    return miembrosAll.filter((m) => {
      const name = `${m.apellido} ${m.nombre}`.toLowerCase();
      const dni = (m.dni ?? "").toLowerCase();
      return name.includes(q) || dni.includes(q);
    });
  }, [memberQuery, miembrosAll]);

  const selectedMiembro = useMemo(() => {
    return miembrosAll.find((m) => m.id === selectedMiembroId) ?? null;
  }, [miembrosAll, selectedMiembroId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Ministerios</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Vista de asignaciones por ministerio.</p>
        </div>
        <Button
          variant="secondary"
          onClick={() => {
            setCreateStatus({ kind: "idle" });
            setCreateNombre("");
            setCreateGrupoId(null);
            setCreateOpen(true);
          }}
        >
          Nuevo ministerio
        </Button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200/70 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <Card>
            <CardHeader>
              <CardTitle>Cargando...</CardTitle>
              <CardDescription>Obteniendo ministerios.</CardDescription>
            </CardHeader>
            <CardContent />
          </Card>
        ) : sorted.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Sin ministerios</CardTitle>
              <CardDescription>Creá un ministerio para empezar.</CardDescription>
            </CardHeader>
            <CardContent />
          </Card>
        ) : (
          sorted.map((m) => (
            <Card
              key={m.id}
              role="button"
              tabIndex={0}
              onClick={() => {
                setOpenId(m.id);
                void loadDetalle(m.id);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setOpenId(m.id);
                  void loadDetalle(m.id);
                }
              }}
              className="cursor-pointer"
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="truncate">{m.nombre}</CardTitle>
                    <CardDescription>Detalle de miembros y roles</CardDescription>
                  </div>
                  <Badge variant="muted">{typeof m.miembros_count === "number" ? `${m.miembros_count}` : "—"}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>Miembros asignados</span>
                  <span>Ver</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Sheet
        open={openId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setAssignOpen(false);
            setOpenId(null);
          }
        }}
      >
        <SheetContent className="max-w-3xl">
          <SheetHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <SheetTitle>{detalle?.nombre ?? "Ministerio"}</SheetTitle>
                <SheetDescription>Miembros asignados y su rol.</SheetDescription>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setAssignError(null);
                  setMemberQuery("");
                  setSelectedMiembroId(null);
                  setAssignOpen(true);
                }}
                disabled={openId === null}
              >
                Asignar Miembro
              </Button>
            </div>
          </SheetHeader>

          {detalleError ? (
            <div className="px-6 pb-2 text-sm text-red-700 dark:text-red-200">{detalleError}</div>
          ) : null}

          <SheetBody>
            {detalleLoading ? (
              <div className="text-sm text-slate-600 dark:text-slate-400">Cargando miembros...</div>
            ) : !detalle ? (
              <div className="text-sm text-slate-600 dark:text-slate-400">Sin datos.</div>
            ) : (detalle.ministerio_miembros ?? []).length === 0 ? (
              <div className="text-sm text-slate-600 dark:text-slate-400">No hay miembros asignados.</div>
            ) : (
              <div className="space-y-2">
                {(detalle.ministerio_miembros ?? []).map((row) => (
                  <div
                    key={row.id}
                    className="flex flex-col gap-2 rounded-xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface)] p-4 shadow-sm transition-all duration-200 ease-in-out hover:shadow-md hover:scale-[1.01] active:scale-[0.99] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                        {row.miembro ? fullName(row.miembro) : "—"}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                        {row.miembro?.dni ? <Badge variant="muted">{row.miembro.dni}</Badge> : null}
                        {row.rol_ministerio?.nombre ? <Badge variant="muted">{row.rol_ministerio.nombre}</Badge> : <Badge variant="warning">Sin rol</Badge>}
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        if (!row.miembro?.id) return;
                        window.location.href = `/admin/miembros?open=${encodeURIComponent(String(row.miembro.id))}`;
                      }}
                    >
                      Ver miembro
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </SheetBody>

          <SheetFooter>
            <Button variant="secondary" onClick={() => setOpenId(null)}>
              Cerrar
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={assignOpen} onOpenChange={setAssignOpen}>
        <SheetContent className="max-w-2xl">
          <SheetHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <SheetTitle>Asignar miembro</SheetTitle>
                <SheetDescription>Seleccioná un miembro y su rol dentro del ministerio.</SheetDescription>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setAssignOpen(false)} disabled={assignBusy}>
                Cerrar
              </Button>
            </div>
          </SheetHeader>

          {assignError ? (
            <div className="px-6 pb-2 text-sm text-red-700 dark:text-red-200">{assignError}</div>
          ) : null}

          <SheetBody>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  Miembro
                </div>
                <Command value={memberQuery} onValueChange={setMemberQuery}>
                  <CommandInput placeholder="Buscar por apellido, nombre o DNI..." />
                  <CommandList>
                    {miembrosFiltered.length === 0 ? (
                      <CommandEmpty>Sin resultados.</CommandEmpty>
                    ) : (
                      <CommandGroup heading="Resultados">
                        {miembrosFiltered.slice(0, 80).map((m) => (
                          <CommandItem
                            key={m.id}
                            selected={m.id === selectedMiembroId}
                            onClick={() => setSelectedMiembroId(m.id)}
                          >
                            <span className="min-w-0 truncate">{fullName(m)}</span>
                            <span className="shrink-0 text-xs text-slate-600 dark:text-slate-400">
                              {m.dni ?? "—"}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>

                {selectedMiembro ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge variant="muted">{fullName(selectedMiembro)}</Badge>
                    {selectedMiembro.dni ? <Badge variant="muted">{selectedMiembro.dni}</Badge> : null}
                  </div>
                ) : (
                  <div className="mt-3 text-xs text-slate-600 dark:text-slate-400">Seleccioná un miembro.</div>
                )}
              </div>

              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  Rol
                </div>
                <Select
                  value={selectedRolId ?? ""}
                  onChange={(e) => setSelectedRolId(e.target.value ? Number(e.target.value) : null)}
                  disabled={assignBusy}
                >
                  {rolesMinisterio.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nombre}
                    </option>
                  ))}
                </Select>
                {rolesMinisterio.length === 0 ? (
                  <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                    No hay roles disponibles en roles_ministerio.
                  </div>
                ) : null}
              </div>
            </div>
          </SheetBody>

          <SheetFooter>
            <Button
              variant="secondary"
              onClick={() => setAssignOpen(false)}
              disabled={assignBusy}
            >
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                if (!openId) return;
                if (!selectedMiembroId) {
                  setAssignError("Seleccioná un miembro.");
                  return;
                }
                if (!selectedRolId) {
                  setAssignError("Seleccioná un rol.");
                  return;
                }

                setAssignBusy(true);
                setAssignError(null);
                try {
                  const res = await fetch(`/api/ministerios/${encodeURIComponent(String(openId))}/miembros`, {
                    method: "POST",
                    headers: { Accept: "application/json", "Content-Type": "application/json" },
                    body: JSON.stringify({ miembro_id: selectedMiembroId, rol_ministerio_id: selectedRolId }),
                  });
                  const json = await res.json().catch(() => null);
                  if (!res.ok) throw new Error(extractMessage(json) ?? "No se pudo asignar el miembro.");

                  setAssignOpen(false);
                  await loadDetalle(openId);
                  await loadMinisterios();
                } catch (e) {
                  setAssignError(e instanceof Error ? e.message : "Error inesperado.");
                } finally {
                  setAssignBusy(false);
                }
              }}
              disabled={assignBusy}
            >
              Guardar
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent className="max-w-lg">
          <SheetHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <SheetTitle>Nuevo ministerio</SheetTitle>
                <SheetDescription>Creá un ministerio y luego asigná miembros.</SheetDescription>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setCreateOpen(false)} disabled={createStatus.kind === "saving"}>
                Cerrar
              </Button>
            </div>
          </SheetHeader>

          <SheetBody>
            <div className="grid grid-cols-1 gap-3">
              <label className="grid gap-1">
                <div className="text-xs font-medium text-slate-700 dark:text-slate-300">Nombre</div>
                <Input value={createNombre} onChange={(e) => setCreateNombre(e.target.value)} placeholder="Ej: Alabanza, Jóvenes, Intercesión..." />
              </label>

              <label className="grid gap-1">
                <div className="text-xs font-medium text-slate-700 dark:text-slate-300">Grupo</div>
                <Select
                  value={createGrupoId ?? ""}
                  onChange={(e) => setCreateGrupoId(e.target.value ? Number(e.target.value) : null)}
                  disabled={gruposMinisterio.length === 0}
                >
                  <option value="">{gruposMinisterio.length === 0 ? "No hay grupos cargados" : "Seleccionar"}</option>
                  {gruposMinisterio.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nombre}
                    </option>
                  ))}
                </Select>
              </label>

              {createStatus.kind === "error" ? (
                <div className="rounded-xl border border-red-200/70 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
                  {createStatus.message}
                </div>
              ) : null}
            </div>
          </SheetBody>

          <SheetFooter>
            <Button variant="secondary" onClick={() => setCreateOpen(false)} disabled={createStatus.kind === "saving"}>
              Cancelar
            </Button>
            <Button onClick={() => void createMinisterio()} disabled={createStatus.kind === "saving"}>
              {createStatus.kind === "saving" ? "Creando..." : "Crear"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
