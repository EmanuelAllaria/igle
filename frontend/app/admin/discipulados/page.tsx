"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type Anio = { id: number; anio: number };
type GrupoMiembro = { id: number; nombre: string };
type RolDiscipulado = { id: number; nombre: string };
type CatalogoMiembro = { id: number; nombre: string; apellido: string };

type Discipulado = {
  id: number;
  nombre: string;
  anio?: Anio | null;
  grupo_miembro?: GrupoMiembro | null;
};

type EstadoCivil = { id: number; nombre: string };

type Miembro = {
  id: number;
  nombre: string;
  apellido: string;
  profesion: string | null;
  estado_civil?: EstadoCivil | null;
};

type Evento = {
  id: number;
  nombre: string;
  fecha: string;
};

type EstadoAsistencia = "presente" | "ausente" | "justificado";

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

function extractId(json: unknown): number | null {
  const data = extractData(json);
  if (!isRecord(data)) return null;
  return typeof data.id === "number" ? data.id : null;
}

function fullName(m: { nombre: string; apellido: string }) {
  return `${m.apellido}, ${m.nombre}`.trim();
}

function formatEventoLabel(e: Evento) {
  const raw = e.fecha ?? "";
  const date = raw ? new Date(raw) : null;
  const fmt = date && !Number.isNaN(date.getTime()) ? date.toLocaleString() : raw;
  return `${e.nombre} (${fmt})`;
}

export default function AdminDiscipuladosPage() {
  const [discipulados, setDiscipulados] = useState<Discipulado[]>([]);
  const [discipuladosLoading, setDiscipuladosLoading] = useState(true);
  const [discipuladosError, setDiscipuladosError] = useState<string | null>(null);
  const [discipuladosReload, setDiscipuladosReload] = useState(0);

  const [discipuladoId, setDiscipuladoId] = useState<number | null>(null);

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [eventoId, setEventoId] = useState<number | null>(null);
  const [eventosLoading, setEventosLoading] = useState(false);
  const [eventosError, setEventosError] = useState<string | null>(null);

  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [miembrosLoading, setMiembrosLoading] = useState(false);
  const [miembrosError, setMiembrosError] = useState<string | null>(null);

  const [qMiembro, setQMiembro] = useState("");
  const [qEstadoCivil, setQEstadoCivil] = useState("");
  const [qEstadoAsistencia, setQEstadoAsistencia] = useState<"" | EstadoAsistencia>("");
  const [visibleRows, setVisibleRows] = useState(50);

  const [anios, setAnios] = useState<Anio[]>([]);
  const [gruposMiembro, setGruposMiembro] = useState<GrupoMiembro[]>([]);
  const [rolesDiscipulado, setRolesDiscipulado] = useState<RolDiscipulado[]>([]);
  const [catalogoMiembros, setCatalogoMiembros] = useState<CatalogoMiembro[]>([]);
  const [catalogosLoading, setCatalogosLoading] = useState(false);
  const [catalogosError, setCatalogosError] = useState<string | null>(null);

  const [createDiscipuladoOpen, setCreateDiscipuladoOpen] = useState(false);
  const [createEventoOpen, setCreateEventoOpen] = useState(false);
  const [linkMiembrosOpen, setLinkMiembrosOpen] = useState(false);
  const [editDiscipuladoOpen, setEditDiscipuladoOpen] = useState(false);
  const [linkMiembroIds, setLinkMiembroIds] = useState<number[]>([]);
  const [linkRolId, setLinkRolId] = useState<number | null>(null);
  const [linkStatus, setLinkStatus] = useState<
    | { kind: "idle" }
    | { kind: "idle" }
    | { kind: "saving" }
    | { kind: "success"; message: string }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  const [newDiscipuladoNombre, setNewDiscipuladoNombre] = useState("");
  const [newDiscipuladoAnioId, setNewDiscipuladoAnioId] = useState<number | null>(null);
  const [newDiscipuladoGrupoId, setNewDiscipuladoGrupoId] = useState<number | null>(null);
  const [createDiscipuladoStatus, setCreateDiscipuladoStatus] = useState<
    | { kind: "idle" }
    | { kind: "saving" }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  const [editDiscipuladoNombre, setEditDiscipuladoNombre] = useState("");
  const [editDiscipuladoAnioId, setEditDiscipuladoAnioId] = useState<number | null>(null);
  const [editDiscipuladoGrupoId, setEditDiscipuladoGrupoId] = useState<number | null>(null);
  const [editDiscipuladoStatus, setEditDiscipuladoStatus] = useState<
    | { kind: "idle" }
    | { kind: "saving" }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  const [newEventoNombre, setNewEventoNombre] = useState("");
  const [newEventoFecha, setNewEventoFecha] = useState("");
  const [newEventoUbicacion, setNewEventoUbicacion] = useState("");
  const [newEventoDescripcion, setNewEventoDescripcion] = useState("");
  const [createEventoStatus, setCreateEventoStatus] = useState<
    | { kind: "idle" }
    | { kind: "saving" }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  useEffect(() => {
    let alive = true;

    async function loadCatalogos() {
      setCatalogosLoading(true);
      setCatalogosError(null);
      try {
        const res = await fetch("/api/catalogos", { headers: { Accept: "application/json" } });
        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error(extractMessage(json) ?? "No se pudieron cargar catálogos.");
        const data = extractData(json);
        if (!isRecord(data)) throw new Error("Respuesta inválida del servidor.");

        const aniosList = Array.isArray(data.anios) ? (data.anios as Anio[]) : [];
        const gruposList = Array.isArray(data.grupos_miembros) ? (data.grupos_miembros as GrupoMiembro[]) : [];
        const rolesList = Array.isArray(data.roles_discipulado) ? (data.roles_discipulado as RolDiscipulado[]) : [];
        const miembrosList = Array.isArray(data.miembros_padres)
          ? (data.miembros_padres as CatalogoMiembro[])
          : [];

        if (!alive) return;
        setAnios(aniosList);
        setGruposMiembro(gruposList);
        setRolesDiscipulado(rolesList);
        setCatalogoMiembros(miembrosList);

        const defaultRol = rolesList.find((r) => r.nombre === "Miembro")?.id ?? rolesList[0]?.id ?? null;
        setLinkRolId(defaultRol);
      } catch (e) {
        if (!alive) return;
        setCatalogosError(e instanceof Error ? e.message : "Error inesperado.");
      } finally {
        if (!alive) return;
        setCatalogosLoading(false);
      }
    }

    void loadCatalogos();
    return () => {
      alive = false;
    };
  }, []);

  const [estadoByMiembroId, setEstadoByMiembroId] = useState<Record<number, EstadoAsistencia>>(
    {},
  );

  const [saveStatus, setSaveStatus] = useState<
    | { kind: "idle" }
    | { kind: "saving" }
    | { kind: "success"; message: string }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  useEffect(() => {
    let alive = true;

    async function loadDiscipulados() {
      setDiscipuladosLoading(true);
      setDiscipuladosError(null);
      try {
        const res = await fetch("/api/discipulados", { headers: { Accept: "application/json" } });
        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error(extractMessage(json) ?? "No se pudo cargar discipulados.");

        const data = extractData(json);
        const list = Array.isArray(data) ? (data as Discipulado[]) : [];
        if (!alive) return;
        setDiscipulados(list);
      } catch (e) {
        if (!alive) return;
        setDiscipuladosError(e instanceof Error ? e.message : "Error inesperado.");
      } finally {
        if (!alive) return;
        setDiscipuladosLoading(false);
      }
    }

    void loadDiscipulados();
    return () => {
      alive = false;
    };
  }, [discipuladosReload]);

  function openEditDiscipulado() {
    if (discipuladoId === null) return;
    const d = discipulados.find((x) => x.id === discipuladoId) ?? null;
    if (!d) return;

    setEditDiscipuladoStatus({ kind: "idle" });
    setEditDiscipuladoNombre(d.nombre ?? "");
    setEditDiscipuladoAnioId(d.anio?.id ?? null);
    setEditDiscipuladoGrupoId(d.grupo_miembro?.id ?? null);
    setEditDiscipuladoOpen(true);
  }

  useEffect(() => {
    let alive = true;

    async function loadForDiscipulado(id: number) {
      setSaveStatus({ kind: "idle" });
      setMiembrosLoading(true);
      setMiembrosError(null);
      setEventosLoading(true);
      setEventosError(null);
      setQMiembro("");
      setQEstadoCivil("");
      setQEstadoAsistencia("");
      setVisibleRows(50);
      setMiembros([]);
      setEventos([]);
      setEventoId(null);
      setEstadoByMiembroId({});

      try {
        const [mRes, eRes] = await Promise.all([
          fetch(`/api/discipulados/${id}/miembros`, { headers: { Accept: "application/json" } }),
          fetch(`/api/discipulados/${id}/eventos`, { headers: { Accept: "application/json" } }),
        ]);

        const [mJson, eJson] = await Promise.all([
          mRes.json().catch(() => null),
          eRes.json().catch(() => null),
        ]);

        if (!mRes.ok) throw new Error(extractMessage(mJson) ?? "No se pudieron cargar miembros.");
        if (!eRes.ok) throw new Error(extractMessage(eJson) ?? "No se pudieron cargar eventos.");

        const mData = extractData(mJson);
        const eData = extractData(eJson);

        const members = isRecord(mData) && Array.isArray(mData.miembros) ? (mData.miembros as Miembro[]) : [];
        const events = isRecord(eData) && Array.isArray(eData.eventos) ? (eData.eventos as Evento[]) : [];

        if (!alive) return;

        setMiembros(members);
        setEventos(events);

        if (events.length > 0) setEventoId(events[0]!.id);

        const nextEstado: Record<number, EstadoAsistencia> = {};
        for (const m of members) nextEstado[m.id] = "presente";
        setEstadoByMiembroId(nextEstado);
      } catch (e) {
        if (!alive) return;
        const msg = e instanceof Error ? e.message : "Error inesperado.";
        setMiembrosError(msg);
        setEventosError(msg);
      } finally {
        if (!alive) return;
        setMiembrosLoading(false);
        setEventosLoading(false);
      }
    }

    if (discipuladoId !== null) void loadForDiscipulado(discipuladoId);

    return () => {
      alive = false;
    };
  }, [discipuladoId]);

  const canSave = eventoId !== null && miembros.length > 0 && saveStatus.kind !== "saving";

  const missingEvento = useMemo(() => {
    if (discipuladoId === null) return false;
    return !eventosLoading && eventos.length === 0;
  }, [discipuladoId, eventosLoading, eventos.length]);

  const estadoCivilOptions = useMemo(() => {
    const set = new Set<string>();
    for (const m of miembros) {
      const v = m.estado_civil?.nombre;
      if (v) set.add(v);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [miembros]);

  const miembrosFiltered = useMemo(() => {
    const q = qMiembro.trim().toLowerCase();
    const ec = qEstadoCivil.trim().toLowerCase();
    const ea = qEstadoAsistencia;

    return miembros.filter((m) => {
      if (q) {
        const name = fullName(m).toLowerCase();
        const prof = (m.profesion ?? "").toLowerCase();
        if (!name.includes(q) && !prof.includes(q)) return false;
      }

      if (ec) {
        const civil = (m.estado_civil?.nombre ?? "").toLowerCase();
        if (civil !== ec) return false;
      }

      if (ea) {
        const estado = estadoByMiembroId[m.id] ?? "presente";
        if (estado !== ea) return false;
      }

      return true;
    });
  }, [estadoByMiembroId, miembros, qEstadoAsistencia, qEstadoCivil, qMiembro]);

  const miembrosVisible = useMemo(() => miembrosFiltered.slice(0, visibleRows), [miembrosFiltered, visibleRows]);

  async function linkMiembros() {
    if (!discipuladoId) return;
    if (linkMiembroIds.length === 0) return;

    setLinkStatus({ kind: "saving" });
    try {
      const res = await fetch(`/api/discipulados/${discipuladoId}/miembros`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ miembros: linkMiembroIds, roldiscipulado_id: linkRolId }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(extractMessage(json) ?? "No se pudieron vincular miembros.");

      const mRes = await fetch(`/api/discipulados/${discipuladoId}/miembros`, { headers: { Accept: "application/json" } });
      const mJson = await mRes.json().catch(() => null);
      if (mRes.ok) {
        const mData = extractData(mJson);
        const members = isRecord(mData) && Array.isArray(mData.miembros) ? (mData.miembros as Miembro[]) : [];
        setMiembros(members);
      }

      setLinkStatus({ kind: "success", message: "Miembros vinculados." });
      setLinkMiembrosOpen(false);
      setLinkMiembroIds([]);
    } catch (e) {
      setLinkStatus({ kind: "error", message: e instanceof Error ? e.message : "Error inesperado." });
    }
  }

  async function saveAsistencias() {
    if (!eventoId) return;

    setSaveStatus({ kind: "saving" });

    const payload = miembros.map((m) => ({
      miembro_id: m.id,
      estado: estadoByMiembroId[m.id] ?? "presente",
      evento_id: eventoId,
    }));

    try {
      const res = await fetch(`/api/eventos/${eventoId}/asistencias`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(extractMessage(json) ?? "No se pudieron guardar asistencias.");

      setSaveStatus({ kind: "success", message: extractMessage(json) ?? "Asistencias guardadas." });
    } catch (e) {
      setSaveStatus({
        kind: "error",
        message: e instanceof Error ? e.message : "Error inesperado.",
      });
    }
  }

  async function createDiscipulado() {
    setCreateDiscipuladoStatus({ kind: "idle" });

    const nombre = newDiscipuladoNombre.trim();
    if (!nombre) {
      setCreateDiscipuladoStatus({ kind: "error", message: "El nombre es obligatorio." });
      return;
    }
    if (!newDiscipuladoAnioId) {
      setCreateDiscipuladoStatus({ kind: "error", message: "El año es obligatorio." });
      return;
    }
    if (!newDiscipuladoGrupoId) {
      setCreateDiscipuladoStatus({ kind: "error", message: "El grupo es obligatorio." });
      return;
    }

    setCreateDiscipuladoStatus({ kind: "saving" });
    try {
      const res = await fetch("/api/discipulados", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          nombre,
          anio_id: newDiscipuladoAnioId,
          grupo_miembro_id: newDiscipuladoGrupoId,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(extractMessage(json) ?? "No se pudo crear el discipulado.");

      const id = extractId(json);
      if (!id) throw new Error("Respuesta inválida del servidor.");

      setCreateDiscipuladoOpen(false);
      setNewDiscipuladoNombre("");
      setNewDiscipuladoAnioId(null);
      setNewDiscipuladoGrupoId(null);
      setCreateDiscipuladoStatus({ kind: "idle" });
      setDiscipuladosReload((v) => v + 1);
      setDiscipuladoId(id);
    } catch (e) {
      setCreateDiscipuladoStatus({
        kind: "error",
        message: e instanceof Error ? e.message : "Error inesperado.",
      });
    }
  }

  async function updateDiscipulado() {
    if (discipuladoId === null) return;

    setEditDiscipuladoStatus({ kind: "idle" });

    const nombre = editDiscipuladoNombre.trim();
    if (!nombre) {
      setEditDiscipuladoStatus({ kind: "error", message: "El nombre es obligatorio." });
      return;
    }
    if (!editDiscipuladoAnioId) {
      setEditDiscipuladoStatus({ kind: "error", message: "El año es obligatorio." });
      return;
    }
    if (!editDiscipuladoGrupoId) {
      setEditDiscipuladoStatus({ kind: "error", message: "El grupo es obligatorio." });
      return;
    }

    setEditDiscipuladoStatus({ kind: "saving" });
    try {
      const res = await fetch(`/api/discipulados/${discipuladoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          nombre,
          anio_id: editDiscipuladoAnioId,
          grupo_miembro_id: editDiscipuladoGrupoId,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(extractMessage(json) ?? "No se pudo actualizar el discipulado.");

      setEditDiscipuladoOpen(false);
      setEditDiscipuladoStatus({ kind: "idle" });
      setDiscipuladosReload((v) => v + 1);
    } catch (e) {
      setEditDiscipuladoStatus({
        kind: "error",
        message: e instanceof Error ? e.message : "Error inesperado.",
      });
    }
  }

  async function deleteDiscipulado() {
    if (discipuladoId === null) return;
    const d = discipulados.find((x) => x.id === discipuladoId) ?? null;
    const label = d ? d.nombre : `#${discipuladoId}`;
    if (!window.confirm(`¿Eliminar el discipulado "${label}"?`)) return;

    try {
      const res = await fetch(`/api/discipulados/${discipuladoId}`, { method: "DELETE", headers: { Accept: "application/json" } });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(extractMessage(json) ?? "No se pudo eliminar el discipulado.");

      setDiscipuladoId(null);
      setEventoId(null);
      setMiembros([]);
      setEventos([]);
      setDiscipuladosReload((v) => v + 1);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error inesperado.";
      setDiscipuladosError(msg);
    }
  }

  async function createEvento() {
    if (!discipuladoId) return;

    setCreateEventoStatus({ kind: "idle" });
    const nombre = newEventoNombre.trim();
    if (!nombre) {
      setCreateEventoStatus({ kind: "error", message: "El nombre es obligatorio." });
      return;
    }
    if (!newEventoFecha.trim()) {
      setCreateEventoStatus({ kind: "error", message: "La fecha es obligatoria." });
      return;
    }

    const date = new Date(newEventoFecha);
    if (Number.isNaN(date.getTime())) {
      setCreateEventoStatus({ kind: "error", message: "La fecha no es válida." });
      return;
    }

    setCreateEventoStatus({ kind: "saving" });
    try {
      const res = await fetch(`/api/discipulados/${discipuladoId}/eventos`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          nombre,
          descripcion: newEventoDescripcion.trim() ? newEventoDescripcion.trim() : null,
          ubicacion: newEventoUbicacion.trim() ? newEventoUbicacion.trim() : null,
          fecha: date.toISOString(),
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(extractMessage(json) ?? "No se pudo crear el evento.");

      const newId = extractId(json);
      if (!newId) throw new Error("Respuesta inválida del servidor.");

      const eRes = await fetch(`/api/discipulados/${discipuladoId}/eventos`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      const eJson = await eRes.json().catch(() => null);
      if (eRes.ok) {
        const eData = extractData(eJson);
        const events = isRecord(eData) && Array.isArray(eData.eventos) ? (eData.eventos as Evento[]) : [];
        setEventos(events);
      }

      setEventoId(newId);
      setCreateEventoOpen(false);
      setNewEventoNombre("");
      setNewEventoFecha("");
      setNewEventoUbicacion("");
      setNewEventoDescripcion("");
      setCreateEventoStatus({ kind: "idle" });
    } catch (e) {
      setCreateEventoStatus({
        kind: "error",
        message: e instanceof Error ? e.message : "Error inesperado.",
      });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Discipulados</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Registro de asistencia por evento.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface)] p-6 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-medium text-slate-700 dark:text-slate-300">Seleccionar discipulado</div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={openEditDiscipulado} disabled={discipuladoId === null}>
                Editar
              </Button>
              <Button variant="destructive" size="sm" onClick={() => void deleteDiscipulado()} disabled={discipuladoId === null}>
                Eliminar
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setLinkStatus({ kind: "idle" });
                  setLinkMiembroIds([]);
                  setLinkMiembrosOpen(true);
                }}
                disabled={discipuladoId === null}
              >
                Vincular
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setCreateDiscipuladoStatus({ kind: "idle" });
                  setCreateDiscipuladoOpen(true);
                }}
              >
                Nuevo
              </Button>
            </div>
          </div>

          <Select
            value={discipuladoId ?? ""}
            onChange={(e) => setDiscipuladoId(e.target.value ? Number(e.target.value) : null)}
            disabled={discipuladosLoading}
          >
            <option value="">Elegí un discipulado</option>
            {discipulados.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre}
                {d.anio?.anio ? ` · ${d.anio.anio}` : ""}
                {d.grupo_miembro?.nombre ? ` · ${d.grupo_miembro.nombre}` : ""}
              </option>
            ))}
          </Select>

            {discipuladosError ? (
              <div className="mt-3 text-sm text-red-700 dark:text-red-300">{discipuladosError}</div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface)] p-6 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs font-medium text-slate-700 dark:text-slate-300">Evento</div>
              <Button
                variant="secondary"
                size="sm"
                disabled={discipuladoId === null}
                onClick={() => {
                  if (discipuladoId === null) return;
                  setCreateEventoStatus({ kind: "idle" });
                  setCreateEventoOpen(true);
                }}
              >
                Nuevo
              </Button>
            </div>
            <Select
              value={eventoId ?? ""}
              onChange={(e) => setEventoId(e.target.value ? Number(e.target.value) : null)}
              disabled={discipuladoId === null || eventosLoading || eventos.length === 0}
            >
              <option value="">{missingEvento ? "No hay eventos disponibles" : "Elegí un evento"}</option>
              {eventos.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {formatEventoLabel(ev)}
                </option>
              ))}
            </Select>

            {eventosError ? (
              <div className="mt-3 text-sm text-red-700 dark:text-red-300">{eventosError}</div>
            ) : null}
          </div>
        </div>

      <div className="overflow-hidden rounded-2xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface)] shadow-sm backdrop-blur">
          <div className="border-b border-[color:var(--admin-border)] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3">
                <label className="grid gap-1">
                  <div className="text-xs font-medium text-slate-700 dark:text-slate-300">Buscar</div>
                  <Input
                    placeholder="Apellido, nombre o profesión..."
                    value={qMiembro}
                    onChange={(e) => {
                      setQMiembro(e.target.value);
                      setVisibleRows(50);
                    }}
                    disabled={discipuladoId === null || miembrosLoading || miembros.length === 0}
                  />
                </label>

                <label className="grid gap-1">
                  <div className="text-xs font-medium text-slate-700 dark:text-slate-300">Estado civil</div>
                  <Select
                    value={qEstadoCivil}
                    onChange={(e) => {
                      setQEstadoCivil(e.target.value);
                      setVisibleRows(50);
                    }}
                    disabled={discipuladoId === null || miembrosLoading || estadoCivilOptions.length === 0}
                  >
                    <option value="">Todos</option>
                    {estadoCivilOptions.map((x) => (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    ))}
                  </Select>
                </label>

                <label className="grid gap-1">
                  <div className="text-xs font-medium text-slate-700 dark:text-slate-300">Asistencia</div>
                  <Select
                    value={qEstadoAsistencia}
                    onChange={(e) => {
                      setQEstadoAsistencia(e.target.value as "" | EstadoAsistencia);
                      setVisibleRows(50);
                    }}
                    disabled={discipuladoId === null || miembrosLoading || miembros.length === 0}
                  >
                    <option value="">Todas</option>
                    <option value="presente">Presente</option>
                    <option value="ausente">Ausente</option>
                    <option value="justificado">Justificado</option>
                  </Select>
                </label>
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-400">
                {discipuladoId !== null && miembros.length > 0 ? (
                  <>
                    Mostrando <span className="font-medium text-slate-900 dark:text-slate-100">{Math.min(visibleRows, miembrosFiltered.length)}</span> de{" "}
                    <span className="font-medium text-slate-900 dark:text-slate-100">{miembrosFiltered.length}</span>
                  </>
                ) : (
                  " "
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr className="bg-[color:var(--admin-surface-muted)] text-left text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <th className="px-4 py-3">Miembro</th>
                  <th className="px-4 py-3">Profesión</th>
                  <th className="px-4 py-3">Estado Civil</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {discipuladoId === null ? (
                  <tr>
                    <td className="px-4 py-6 text-slate-600 dark:text-slate-400" colSpan={4}>
                      Seleccioná un discipulado.
                    </td>
                  </tr>
                ) : miembrosLoading ? (
                  <tr>
                    <td className="px-4 py-6 text-slate-600 dark:text-slate-400" colSpan={4}>
                      Cargando miembros...
                    </td>
                  </tr>
                ) : miembrosError ? (
                  <tr>
                    <td className="px-4 py-6 text-red-700 dark:text-red-300" colSpan={4}>
                      {miembrosError}
                    </td>
                  </tr>
                ) : miembros.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-slate-600 dark:text-slate-400" colSpan={4}>
                      No hay miembros inscriptos.
                    </td>
                  </tr>
                ) : miembrosFiltered.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-slate-600 dark:text-slate-400" colSpan={4}>
                      Sin resultados con los filtros actuales.
                    </td>
                  </tr>
                ) : (
                  miembrosVisible.map((m) => (
                    <tr
                      key={m.id}
                      className="border-t border-[color:var(--admin-border)] hover:bg-[color:var(--admin-surface-muted)]"
                    >
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                        {fullName(m)}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                        {m.profesion ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                        {m.estado_civil?.nombre ?? "-"}
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          value={estadoByMiembroId[m.id] ?? "presente"}
                          onChange={(e) => {
                            const v = e.target.value as EstadoAsistencia;
                            setEstadoByMiembroId((prev) => ({ ...prev, [m.id]: v }));
                          }}
                        >
                          <option value="presente">Presente</option>
                          <option value="ausente">Ausente</option>
                          <option value="justificado">Justificado</option>
                        </Select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        <div className="flex flex-col gap-3 border-t border-[color:var(--admin-border)] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-600 dark:text-slate-400">
              {discipuladoId !== null && eventoId === null
                ? "Seleccioná un evento para guardar asistencia."
                : saveStatus.kind === "success"
                  ? saveStatus.message
                  : saveStatus.kind === "error"
                    ? saveStatus.message
                    : " "}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            {miembrosFiltered.length > visibleRows ? (
              <Button
                variant="secondary"
                onClick={() => setVisibleRows((v) => v + 50)}
                disabled={miembrosLoading}
              >
                Cargar más
              </Button>
            ) : null}

            <Button disabled={!canSave} onClick={saveAsistencias}>
              {saveStatus.kind === "saving" ? "Guardando..." : "Guardar Asistencia"}
            </Button>
          </div>
        </div>
      </div>

      <CreateDiscipuladoModal
        open={createDiscipuladoOpen}
        onClose={() => setCreateDiscipuladoOpen(false)}
        anios={anios}
        gruposMiembro={gruposMiembro}
        catalogosLoading={catalogosLoading}
        catalogosError={catalogosError}
        nombre={newDiscipuladoNombre}
        anioId={newDiscipuladoAnioId}
        grupoId={newDiscipuladoGrupoId}
        onNombreChange={setNewDiscipuladoNombre}
        onAnioChange={setNewDiscipuladoAnioId}
        onGrupoChange={setNewDiscipuladoGrupoId}
        status={createDiscipuladoStatus}
        onSave={createDiscipulado}
      />

      <EditDiscipuladoModal
        open={editDiscipuladoOpen}
        onClose={() => setEditDiscipuladoOpen(false)}
        anios={anios}
        gruposMiembro={gruposMiembro}
        catalogosLoading={catalogosLoading}
        catalogosError={catalogosError}
        nombre={editDiscipuladoNombre}
        anioId={editDiscipuladoAnioId}
        grupoId={editDiscipuladoGrupoId}
        onNombreChange={setEditDiscipuladoNombre}
        onAnioChange={setEditDiscipuladoAnioId}
        onGrupoChange={setEditDiscipuladoGrupoId}
        status={editDiscipuladoStatus}
        onSave={updateDiscipulado}
      />

      <CreateEventoModal
        open={createEventoOpen}
        onClose={() => setCreateEventoOpen(false)}
        discipuladoId={discipuladoId}
        nombre={newEventoNombre}
        fecha={newEventoFecha}
        ubicacion={newEventoUbicacion}
        descripcion={newEventoDescripcion}
        onNombreChange={setNewEventoNombre}
        onFechaChange={setNewEventoFecha}
        onUbicacionChange={setNewEventoUbicacion}
        onDescripcionChange={setNewEventoDescripcion}
        status={createEventoStatus}
        onSave={createEvento}
      />

      <LinkMiembrosModal
        open={linkMiembrosOpen}
        onClose={() => setLinkMiembrosOpen(false)}
        catalogosLoading={catalogosLoading}
        catalogosError={catalogosError}
        miembros={catalogoMiembros}
        roles={rolesDiscipulado}
        selectedMiembroIds={linkMiembroIds}
        selectedRolId={linkRolId}
        status={linkStatus}
        onMiembrosChange={setLinkMiembroIds}
        onRolChange={setLinkRolId}
        onSave={linkMiembros}
      />
    </div>
  );
}

function LinkMiembrosModal(props: {
  open: boolean;
  onClose: () => void;
  catalogosLoading: boolean;
  catalogosError: string | null;
  miembros: CatalogoMiembro[];
  roles: RolDiscipulado[];
  selectedMiembroIds: number[];
  selectedRolId: number | null;
  status:
    | { kind: "idle" }
    | { kind: "saving" }
    | { kind: "success"; message: string }
    | { kind: "error"; message: string };
  onMiembrosChange: (ids: number[]) => void;
  onRolChange: (id: number | null) => void;
  onSave: () => void;
}) {
  const busy = props.status.kind === "saving";
  const [q, setQ] = useState("");

  const miembrosFiltered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return props.miembros;
    return props.miembros.filter((m) => `${m.apellido}, ${m.nombre}`.toLowerCase().includes(query));
  }, [props.miembros, q]);

  const selectedSet = useMemo(() => new Set(props.selectedMiembroIds), [props.selectedMiembroIds]);

  return (
    <Sheet open={props.open} onOpenChange={(open) => (open ? null : props.onClose())}>
      <SheetContent className="max-w-2xl">
        <SheetHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <SheetTitle>Vincular miembros</SheetTitle>
              <SheetDescription>Agregar miembros al discipulado sin perder contexto.</SheetDescription>
            </div>
            <Button variant="secondary" size="sm" onClick={props.onClose} disabled={busy}>
              Cerrar
            </Button>
          </div>
        </SheetHeader>

        <SheetBody>
          {props.catalogosLoading ? (
            <div className="text-sm text-slate-600 dark:text-slate-400">Cargando catálogos...</div>
          ) : props.catalogosError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
              {props.catalogosError}
            </div>
          ) : null}

          <div className="mt-4 grid grid-cols-1 gap-3">
            <label className="grid gap-1">
              <div className="text-xs font-medium text-slate-700 dark:text-slate-300">Rol</div>
              <Select
                value={props.selectedRolId ?? ""}
                onChange={(e) => props.onRolChange(e.target.value ? Number(e.target.value) : null)}
                disabled={busy || props.catalogosLoading || props.roles.length === 0}
              >
                <option value="">{props.catalogosLoading ? "Cargando..." : "Seleccionar"}</option>
                {props.roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nombre}
                  </option>
                ))}
              </Select>
            </label>

            <label className="grid gap-1">
              <div className="text-xs font-medium text-slate-700 dark:text-slate-300">Buscar miembros</div>
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Apellido, nombre..."
                disabled={busy || props.catalogosLoading || props.miembros.length === 0}
              />
            </label>

            <div className="rounded-2xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface)]">
              <div className="flex items-center justify-between gap-3 border-b border-[color:var(--admin-border)] px-4 py-3">
                <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Seleccionados: <span className="text-slate-900 dark:text-slate-100">{props.selectedMiembroIds.length}</span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const ids = miembrosFiltered.map((m) => m.id);
                    const next = new Set(props.selectedMiembroIds);
                    for (const id of ids) next.add(id);
                    props.onMiembrosChange(Array.from(next));
                  }}
                  disabled={busy || props.catalogosLoading || miembrosFiltered.length === 0}
                >
                  Seleccionar filtrados
                </Button>
              </div>

              <div className="max-h-[380px] overflow-y-auto p-2">
                {miembrosFiltered.length === 0 ? (
                  <div className="px-3 py-8 text-sm text-slate-600 dark:text-slate-400">Sin resultados.</div>
                ) : (
                  <div className="grid grid-cols-1 gap-1">
                    {miembrosFiltered.slice(0, 250).map((m) => {
                      const checked = selectedSet.has(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          className="flex items-center gap-3 rounded-xl px-3 py-2 text-left transition-all duration-200 ease-in-out hover:bg-[color:var(--admin-surface-muted)] active:scale-[0.99]"
                          onClick={() => {
                            const next = new Set(props.selectedMiembroIds);
                            if (next.has(m.id)) next.delete(m.id);
                            else next.add(m.id);
                            props.onMiembrosChange(Array.from(next));
                          }}
                          disabled={busy || props.catalogosLoading}
                        >
                          <span className="grid h-5 w-5 place-items-center rounded-md border border-[color:var(--admin-border)] bg-[color:var(--admin-surface)]">
                            <input
                              type="checkbox"
                              checked={checked}
                              readOnly
                              className="h-4 w-4 accent-[color:var(--admin-accent)]"
                            />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                              {m.apellido}, {m.nombre}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {props.status.kind === "error" ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
                {props.status.message}
              </div>
            ) : null}
          </div>
        </SheetBody>

        <SheetFooter>
          <Button variant="secondary" onClick={props.onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button onClick={props.onSave} disabled={busy || props.selectedMiembroIds.length === 0}>
            {busy ? "Guardando..." : "Vincular"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function CreateDiscipuladoModal(props: {
  open: boolean;
  onClose: () => void;
  anios: Anio[];
  gruposMiembro: GrupoMiembro[];
  catalogosLoading: boolean;
  catalogosError: string | null;
  nombre: string;
  anioId: number | null;
  grupoId: number | null;
  onNombreChange: (v: string) => void;
  onAnioChange: (v: number | null) => void;
  onGrupoChange: (v: number | null) => void;
  status: { kind: "idle" } | { kind: "saving" } | { kind: "error"; message: string };
  onSave: () => void;
}) {
  const anios = props.anios;
  const grupos = props.gruposMiembro;
  const catalogosEmpty = anios.length === 0 || grupos.length === 0;

  return (
    <Sheet open={props.open} onOpenChange={(open) => (open ? null : props.onClose())}>
      <SheetContent className="max-w-lg">
        <SheetHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <SheetTitle>Crear Discipulado</SheetTitle>
              <SheetDescription>Nombre, año y grupo.</SheetDescription>
            </div>
            <Button variant="secondary" size="sm" onClick={props.onClose} disabled={props.status.kind === "saving"}>
              Cerrar
            </Button>
          </div>
        </SheetHeader>

        <SheetBody>
          {props.catalogosLoading ? (
            <div className="text-sm text-neutral-600 dark:text-neutral-400">Cargando catálogos...</div>
          ) : props.catalogosError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
              {props.catalogosError}
            </div>
          ) : null}

          <div className="mt-4 grid grid-cols-1 gap-3">
            <label className="grid gap-1">
              <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Nombre</div>
              <Input
                value={props.nombre}
                onChange={(e) => props.onNombreChange(e.target.value)}
              />
            </label>

            <label className="grid gap-1">
              <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Año</div>
              <Select
                value={props.anioId ?? ""}
                onChange={(e) => props.onAnioChange(e.target.value ? Number(e.target.value) : null)}
                disabled={props.catalogosLoading || anios.length === 0}
              >
                <option value="">
                  {props.catalogosLoading && anios.length === 0 ? "Cargando..." : "Elegí un año"}
                </option>
                {anios.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.anio}
                  </option>
                ))}
              </Select>
            </label>

            <label className="grid gap-1">
              <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Grupo</div>
              <Select
                value={props.grupoId ?? ""}
                onChange={(e) => props.onGrupoChange(e.target.value ? Number(e.target.value) : null)}
                disabled={props.catalogosLoading || grupos.length === 0}
              >
                <option value="">
                  {props.catalogosLoading && grupos.length === 0 ? "Cargando..." : "Elegí un grupo"}
                </option>
                {grupos.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nombre}
                  </option>
                ))}
              </Select>
            </label>

            {props.status.kind === "error" ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
                {props.status.message}
              </div>
            ) : null}
          </div>

        </SheetBody>

        <SheetFooter>
          <Button variant="secondary" onClick={props.onClose} disabled={props.status.kind === "saving"}>
            Cancelar
          </Button>
          <Button disabled={props.status.kind === "saving" || props.catalogosLoading || catalogosEmpty} onClick={props.onSave}>
            {props.status.kind === "saving" ? "Guardando..." : "Crear"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function EditDiscipuladoModal(props: {
  open: boolean;
  onClose: () => void;
  anios: Anio[];
  gruposMiembro: GrupoMiembro[];
  catalogosLoading: boolean;
  catalogosError: string | null;
  nombre: string;
  anioId: number | null;
  grupoId: number | null;
  onNombreChange: (v: string) => void;
  onAnioChange: (v: number | null) => void;
  onGrupoChange: (v: number | null) => void;
  status: { kind: "idle" } | { kind: "saving" } | { kind: "error"; message: string };
  onSave: () => void;
}) {
  const anios = props.anios;
  const grupos = props.gruposMiembro;
  const catalogosEmpty = anios.length === 0 || grupos.length === 0;

  return (
    <Sheet open={props.open} onOpenChange={(open) => (open ? null : props.onClose())}>
      <SheetContent className="max-w-lg">
        <SheetHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <SheetTitle>Editar Discipulado</SheetTitle>
              <SheetDescription>Nombre, año y grupo.</SheetDescription>
            </div>
            <Button variant="secondary" size="sm" onClick={props.onClose} disabled={props.status.kind === "saving"}>
              Cerrar
            </Button>
          </div>
        </SheetHeader>

        <SheetBody>
          {props.catalogosLoading ? (
            <div className="text-sm text-neutral-600 dark:text-neutral-400">Cargando catálogos...</div>
          ) : props.catalogosError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
              {props.catalogosError}
            </div>
          ) : null}

          <div className="mt-4 grid grid-cols-1 gap-3">
            <label className="grid gap-1">
              <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Nombre</div>
              <Input
                value={props.nombre}
                onChange={(e) => props.onNombreChange(e.target.value)}
              />
            </label>

            <label className="grid gap-1">
              <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Año</div>
              <Select
                value={props.anioId ?? ""}
                onChange={(e) => props.onAnioChange(e.target.value ? Number(e.target.value) : null)}
                disabled={props.catalogosLoading || anios.length === 0}
              >
                <option value="">
                  {props.catalogosLoading && anios.length === 0 ? "Cargando..." : "Elegí un año"}
                </option>
                {anios.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.anio}
                  </option>
                ))}
              </Select>
            </label>

            <label className="grid gap-1">
              <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Grupo</div>
              <Select
                value={props.grupoId ?? ""}
                onChange={(e) => props.onGrupoChange(e.target.value ? Number(e.target.value) : null)}
                disabled={props.catalogosLoading || grupos.length === 0}
              >
                <option value="">
                  {props.catalogosLoading && grupos.length === 0 ? "Cargando..." : "Elegí un grupo"}
                </option>
                {grupos.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nombre}
                  </option>
                ))}
              </Select>
            </label>

            {props.status.kind === "error" ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
                {props.status.message}
              </div>
            ) : null}
          </div>
        </SheetBody>

        <SheetFooter>
          <Button variant="secondary" onClick={props.onClose} disabled={props.status.kind === "saving"}>
            Cancelar
          </Button>
          <Button disabled={props.status.kind === "saving" || props.catalogosLoading || catalogosEmpty} onClick={props.onSave}>
            {props.status.kind === "saving" ? "Guardando..." : "Guardar"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function CreateEventoModal(props: {
  open: boolean;
  onClose: () => void;
  discipuladoId: number | null;
  nombre: string;
  fecha: string;
  ubicacion: string;
  descripcion: string;
  onNombreChange: (v: string) => void;
  onFechaChange: (v: string) => void;
  onUbicacionChange: (v: string) => void;
  onDescripcionChange: (v: string) => void;
  status: { kind: "idle" } | { kind: "saving" } | { kind: "error"; message: string };
  onSave: () => void;
}) {
  return (
    <Sheet open={props.open} onOpenChange={(open) => (open ? null : props.onClose())}>
      <SheetContent className="max-w-lg">
        <SheetHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <SheetTitle>Crear evento</SheetTitle>
              <SheetDescription>Asociado al discipulado {props.discipuladoId ?? "-"}.</SheetDescription>
            </div>
            <Button variant="secondary" size="sm" onClick={props.onClose} disabled={props.status.kind === "saving"}>
              Cerrar
            </Button>
          </div>
        </SheetHeader>

        <SheetBody>
          <div className="grid grid-cols-1 gap-3">
            <label className="grid gap-1">
              <div className="text-xs font-medium text-slate-700 dark:text-slate-300">Nombre</div>
              <Input value={props.nombre} onChange={(e) => props.onNombreChange(e.target.value)} />
            </label>

            <label className="grid gap-1">
              <div className="text-xs font-medium text-slate-700 dark:text-slate-300">Fecha</div>
              <Input type="datetime-local" value={props.fecha} onChange={(e) => props.onFechaChange(e.target.value)} />
            </label>

            <label className="grid gap-1">
              <div className="text-xs font-medium text-slate-700 dark:text-slate-300">Ubicación</div>
              <Input value={props.ubicacion} onChange={(e) => props.onUbicacionChange(e.target.value)} />
            </label>

            <label className="grid gap-1">
              <div className="text-xs font-medium text-slate-700 dark:text-slate-300">Descripción</div>
              <textarea
                className="min-h-24 w-full rounded-2xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface)] px-3 py-2 text-sm text-slate-900 shadow-sm backdrop-blur outline-none transition-all duration-200 ease-in-out hover:border-[color:var(--admin-border-strong)] focus:border-[color:var(--admin-accent)] focus:ring-2 focus:ring-black/5 disabled:opacity-60 dark:text-slate-100 dark:focus:ring-white/10"
                value={props.descripcion}
                onChange={(e) => props.onDescripcionChange(e.target.value)}
              />
            </label>

            {props.status.kind === "error" ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
                {props.status.message}
              </div>
            ) : null}
          </div>
        </SheetBody>

        <SheetFooter>
          <Button variant="secondary" onClick={props.onClose} disabled={props.status.kind === "saving"}>
            Cancelar
          </Button>
          <Button disabled={props.status.kind === "saving"} onClick={props.onSave}>
            {props.status.kind === "saving" ? "Guardando..." : "Crear"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
