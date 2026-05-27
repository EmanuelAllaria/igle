"use client";

import { useEffect, useMemo, useState } from "react";

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
    <main className="flex-1 bg-[var(--color-background)] text-[var(--color-foreground)]">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Discipulados</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Registro de asistencia por evento.
          </p>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Seleccionar discipulado
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-900 hover:bg-neutral-50 disabled:opacity-60 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-900"
                  onClick={openEditDiscipulado}
                  disabled={discipuladoId === null}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60 dark:border-red-900/40 dark:bg-neutral-950 dark:text-red-200 dark:hover:bg-red-950/40"
                  onClick={() => void deleteDiscipulado()}
                  disabled={discipuladoId === null}
                >
                  Eliminar
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-900 hover:bg-neutral-50 disabled:opacity-60 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-900"
                  onClick={() => {
                    setLinkStatus({ kind: "idle" });
                    setLinkMiembroIds([]);
                    setLinkMiembrosOpen(true);
                  }}
                  disabled={discipuladoId === null}
                >
                  Vincular
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-900 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-900"
                  onClick={() => {
                    setCreateDiscipuladoStatus({ kind: "idle" });
                    setCreateDiscipuladoOpen(true);
                  }}
                >
                  Nuevo
                </button>
              </div>
            </div>
            <select
              className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-600"
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
            </select>

            {discipuladosError ? (
              <div className="mt-3 text-sm text-red-700 dark:text-red-300">{discipuladosError}</div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Evento</div>
              <button
                type="button"
                className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-900 hover:bg-neutral-50 disabled:opacity-60 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-900"
                disabled={discipuladoId === null}
                onClick={() => {
                  if (discipuladoId === null) return;
                  setCreateEventoStatus({ kind: "idle" });
                  setCreateEventoOpen(true);
                }}
              >
                Nuevo
              </button>
            </div>
            <select
              className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-400 disabled:opacity-60 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-600"
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
            </select>

            {eventosError ? (
              <div className="mt-3 text-sm text-red-700 dark:text-red-300">{eventosError}</div>
            ) : null}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr className="bg-neutral-50 text-left text-xs font-semibold text-neutral-600 dark:bg-neutral-900/40 dark:text-neutral-300">
                  <th className="px-4 py-3">Miembro</th>
                  <th className="px-4 py-3">Profesión</th>
                  <th className="px-4 py-3">Estado Civil</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {discipuladoId === null ? (
                  <tr>
                    <td className="px-4 py-6 text-neutral-600 dark:text-neutral-400" colSpan={4}>
                      Seleccioná un discipulado.
                    </td>
                  </tr>
                ) : miembrosLoading ? (
                  <tr>
                    <td className="px-4 py-6 text-neutral-600 dark:text-neutral-400" colSpan={4}>
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
                    <td className="px-4 py-6 text-neutral-600 dark:text-neutral-400" colSpan={4}>
                      No hay miembros inscriptos.
                    </td>
                  </tr>
                ) : (
                  miembros.map((m) => (
                    <tr
                      key={m.id}
                      className="border-t border-neutral-100 hover:bg-neutral-50 dark:border-neutral-900 dark:hover:bg-neutral-900/40"
                    >
                      <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">
                        {fullName(m)}
                      </td>
                      <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">
                        {m.profesion ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">
                        {m.estado_civil?.nombre ?? "-"}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-600"
                          value={estadoByMiembroId[m.id] ?? "presente"}
                          onChange={(e) => {
                            const v = e.target.value as EstadoAsistencia;
                            setEstadoByMiembroId((prev) => ({ ...prev, [m.id]: v }));
                          }}
                        >
                          <option value="presente">Presente</option>
                          <option value="ausente">Ausente</option>
                          <option value="justificado">Justificado</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-neutral-200 p-4 dark:border-neutral-800 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              {discipuladoId !== null && eventoId === null
                ? "Seleccioná un evento para guardar asistencia."
                : saveStatus.kind === "success"
                  ? saveStatus.message
                  : saveStatus.kind === "error"
                    ? saveStatus.message
                    : " "}
            </div>

            <button
              type="button"
              className="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
              disabled={!canSave}
              onClick={saveAsistencias}
            >
              {saveStatus.kind === "saving" ? "Guardando..." : "Guardar Asistencia"}
            </button>
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
    </main>
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
  if (!props.open) return null;
  const busy = props.status.kind === "saving";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) props.onClose();
      }}
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex items-start justify-between gap-3 border-b border-neutral-200 p-5 dark:border-neutral-800">
          <div>
            <div className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Vincular miembros</div>
            <div className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">Agregar miembros al discipulado</div>
          </div>
          <button
            type="button"
            className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-900 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-900"
            onClick={props.onClose}
            disabled={busy}
          >
            Cerrar
          </button>
        </div>

        <div className="p-5">
          {props.catalogosLoading ? (
            <div className="text-sm text-neutral-600 dark:text-neutral-400">Cargando...</div>
          ) : props.catalogosError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
              {props.catalogosError}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="grid gap-1">
              <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Rol</div>
              <select
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-400 disabled:opacity-60 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-600"
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
              </select>
            </label>

            <label className="grid gap-1 sm:col-span-2">
              <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Miembros</div>
              <select
                multiple
                size={10}
                className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-400 disabled:opacity-60 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-600"
                value={props.selectedMiembroIds.map(String)}
                onChange={(e) => {
                  const ids: number[] = [];
                  for (const opt of Array.from(e.target.selectedOptions)) {
                    const v = Number(opt.value);
                    if (Number.isFinite(v)) ids.push(v);
                  }
                  props.onMiembrosChange(ids);
                }}
                disabled={busy || props.catalogosLoading || props.miembros.length === 0}
              >
                {props.miembros.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.apellido}, {m.nombre}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {props.status.kind === "error" ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
              {props.status.message}
            </div>
          ) : null}

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50 disabled:opacity-60 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-900"
              onClick={props.onClose}
              disabled={busy}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
              onClick={props.onSave}
              disabled={busy || props.selectedMiembroIds.length === 0}
            >
              {busy ? "Guardando..." : "Vincular"}
            </button>
          </div>
        </div>
      </div>
    </div>
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
  if (!props.open) return null;
  const anios = props.anios;
  const grupos = props.gruposMiembro;
  const catalogosEmpty = anios.length === 0 || grupos.length === 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) props.onClose();
      }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex items-start justify-between gap-3 border-b border-neutral-200 p-5 dark:border-neutral-800">
          <div>
            <div className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Crear Discipulado
            </div>
            <div className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
              Nombre, año y grupo
            </div>
          </div>
          <button
            type="button"
            className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-900 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-900"
            onClick={props.onClose}
            disabled={props.status.kind === "saving"}
          >
            Cerrar
          </button>
        </div>

        <div className="p-5">
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
              <input
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-600"
                value={props.nombre}
                onChange={(e) => props.onNombreChange(e.target.value)}
              />
            </label>

            <label className="grid gap-1">
              <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Año</div>
              <select
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-600"
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
              </select>
            </label>

            <label className="grid gap-1">
              <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Grupo</div>
              <select
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-600"
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
              </select>
            </label>

            {props.status.kind === "error" ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
                {props.status.message}
              </div>
            ) : null}

            <button
              type="button"
              className="mt-1 inline-flex items-center justify-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
              disabled={props.status.kind === "saving" || props.catalogosLoading || catalogosEmpty}
              onClick={props.onSave}
            >
              {props.status.kind === "saving" ? "Guardando..." : "Crear"}
            </button>
          </div>
        </div>
      </div>
    </div>
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
  if (!props.open) return null;
  const anios = props.anios;
  const grupos = props.gruposMiembro;
  const catalogosEmpty = anios.length === 0 || grupos.length === 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) props.onClose();
      }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex items-start justify-between gap-3 border-b border-neutral-200 p-5 dark:border-neutral-800">
          <div>
            <div className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Editar Discipulado</div>
            <div className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">Nombre, año y grupo</div>
          </div>
          <button
            type="button"
            className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-900 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-900"
            onClick={props.onClose}
            disabled={props.status.kind === "saving"}
          >
            Cerrar
          </button>
        </div>

        <div className="p-5">
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
              <input
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-600"
                value={props.nombre}
                onChange={(e) => props.onNombreChange(e.target.value)}
              />
            </label>

            <label className="grid gap-1">
              <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Año</div>
              <select
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-600"
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
              </select>
            </label>

            <label className="grid gap-1">
              <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Grupo</div>
              <select
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-600"
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
              </select>
            </label>

            {props.status.kind === "error" ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
                {props.status.message}
              </div>
            ) : null}

            <button
              type="button"
              className="mt-1 inline-flex items-center justify-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
              disabled={props.status.kind === "saving" || props.catalogosLoading || catalogosEmpty}
              onClick={props.onSave}
            >
              {props.status.kind === "saving" ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </div>
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
  if (!props.open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) props.onClose();
      }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex items-start justify-between gap-3 border-b border-neutral-200 p-5 dark:border-neutral-800">
          <div>
            <div className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Crear Evento</div>
            <div className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
              Asociado al discipulado {props.discipuladoId ?? "-"}
            </div>
          </div>
          <button
            type="button"
            className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-900 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-900"
            onClick={props.onClose}
            disabled={props.status.kind === "saving"}
          >
            Cerrar
          </button>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 gap-3">
            <label className="grid gap-1">
              <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Nombre</div>
              <input
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-600"
                value={props.nombre}
                onChange={(e) => props.onNombreChange(e.target.value)}
              />
            </label>

            <label className="grid gap-1">
              <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Fecha</div>
              <input
                type="datetime-local"
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-600"
                value={props.fecha}
                onChange={(e) => props.onFechaChange(e.target.value)}
              />
            </label>

            <label className="grid gap-1">
              <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Ubicación</div>
              <input
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-600"
                value={props.ubicacion}
                onChange={(e) => props.onUbicacionChange(e.target.value)}
              />
            </label>

            <label className="grid gap-1">
              <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Descripción</div>
              <textarea
                className="min-h-20 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-600"
                value={props.descripcion}
                onChange={(e) => props.onDescripcionChange(e.target.value)}
              />
            </label>

            {props.status.kind === "error" ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
                {props.status.message}
              </div>
            ) : null}

            <button
              type="button"
              className="mt-1 inline-flex items-center justify-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
              disabled={props.status.kind === "saving"}
              onClick={props.onSave}
            >
              {props.status.kind === "saving" ? "Guardando..." : "Crear"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
