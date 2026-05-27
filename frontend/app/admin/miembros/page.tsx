"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type EstadoCivil = { id: number; nombre: string };

type Sexo = { id: number; nombre: string };
type Bautizado = { id: number; nombre: string };
type MiembroPadre = { id: number; nombre: string; apellido: string };
type TipoUnion = { id: number; nombre: string };
type EstadoUnion = { id: number; nombre: string };

type MiembroListItem = {
  id: number;
  nombre: string;
  apellido: string;
  profesion: string | null;
  estado_civil?: EstadoCivil | null;
};

type MiembroDetalle = {
  id: number;
  nombre: string;
  apellido: string;
  profesion: string | null;
  fecha_nac: string | null;
  email: string | null;
  tel_celular: string | null;
  nro_doc: string | null;
  direccion: string | null;
  anio_ingreso: number | null;
  sexo?: { id: number; nombre: string } | null;
  estado_civil?: EstadoCivil | null;
  bautizado?: { id: number; nombre: string } | null;
  padre?: { id: number; nombre: string; apellido: string } | null;
  madre?: { id: number; nombre: string; apellido: string } | null;
  uniones_como_persona1?: Array<UnionDetalle>;
  uniones_como_persona2?: Array<UnionDetalle>;
};

type UnionDetalle = {
  id: number;
  persona1_id: number;
  persona2_id: number;
  tipo_union_id: number;
  estado_union_id: number;
  persona1?: { id: number; nombre: string; apellido: string } | null;
  persona2?: { id: number; nombre: string; apellido: string } | null;
  tipo_union?: { id: number; nombre: string } | null;
  estado_union?: { id: number; nombre: string } | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeDetailResponse(json: unknown): MiembroDetalle | null {
  if (!isRecord(json)) return null;
  const data = (json.data ?? json) as unknown;
  if (!isRecord(data)) return null;
  if (typeof data.id !== "number") return null;
  return data as MiembroDetalle;
}

function extractMessage(json: unknown): string | null {
  if (!isRecord(json)) return null;
  return typeof json.message === "string" ? json.message : null;
}

function fullName(m: { nombre: string; apellido: string }) {
  return `${m.apellido}, ${m.nombre}`.trim();
}

function toDateInputValue(value: string | null): string {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const iso = String(value);
  if (iso.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(iso)) return iso.slice(0, 10);
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function formatDateDisplay(value: string | null): string {
  if (!value) return "-";
  const iso = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString();
}

function isMarriedLike(estadoCivilNombre: string | null): boolean {
  if (!estadoCivilNombre) return false;
  const n = estadoCivilNombre.trim().toLowerCase();
  return n.includes("casad") || n.includes("viud") || n.includes("divorciad");
}

function findByNombre<T extends { id: number; nombre: string }>(items: T[], nombre: string): T | null {
  const n = nombre.trim().toLowerCase();
  for (const it of items) {
    if (it.nombre.trim().toLowerCase() === n) return it;
  }
  return null;
}

export default function AdminMiembrosPage() {
  const router = useRouter();

  const [miembros, setMiembros] = useState<MiembroListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const [qNombre, setQNombre] = useState("");
  const [qProfesion, setQProfesion] = useState("");
  const [qEstadoCivil, setQEstadoCivil] = useState("");

  const [openId, setOpenId] = useState<number | null>(null);
  const [detail, setDetail] = useState<MiembroDetalle | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createStatus, setCreateStatus] = useState<
    | { kind: "idle" }
    | { kind: "saving" }
    | { kind: "success"; message: string }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  const [editId, setEditId] = useState<number | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editStatus, setEditStatus] = useState<
    | { kind: "idle" }
    | { kind: "saving" }
    | { kind: "success"; message: string }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  const [catalogos, setCatalogos] = useState<{
    sexos: Sexo[];
    estados_civiles: EstadoCivil[];
    bautizados: Bautizado[];
    miembros_padres: MiembroPadre[];
    tipos_union: TipoUnion[];
    estados_union: EstadoUnion[];
  } | null>(null);
  const [catalogosLoading, setCatalogosLoading] = useState(false);
  const [catalogosError, setCatalogosError] = useState<string | null>(null);

  const [form, setForm] = useState<{
    nombre: string;
    apellido: string;
    profesion: string;
    fecha_nac: string;
    email: string;
    tel_celular: string;
    nro_doc: string;
    direccion: string;
    anio_ingreso: string;
    sexo_id: number | null;
    estadocivil_id: number | null;
    bautizado_id: number | null;
    padre_id: number | null;
    madre_id: number | null;
    conyuge_es_iglesia: boolean;
    conyuge_id: number | null;
    familia: Array<{ key: string; miembro_id: number | null; tipo_union_id: number | null }>;
  }>({
    nombre: "",
    apellido: "",
    profesion: "",
    fecha_nac: "",
    email: "",
    tel_celular: "",
    nro_doc: "",
    direccion: "",
    anio_ingreso: "",
    sexo_id: null,
    estadocivil_id: null,
    bautizado_id: null,
    padre_id: null,
    madre_id: null,
    conyuge_es_iglesia: false,
    conyuge_id: null,
    familia: [],
  });

  const [editForm, setEditForm] = useState<{
    nombre: string;
    apellido: string;
    profesion: string;
    fecha_nac: string;
    email: string;
    tel_celular: string;
    nro_doc: string;
    direccion: string;
    anio_ingreso: string;
    sexo_id: number | null;
    estadocivil_id: number | null;
    bautizado_id: number | null;
    padre_id: number | null;
    madre_id: number | null;
    conyuge_es_iglesia: boolean;
    conyuge_id: number | null;
    familia: Array<{ key: string; miembro_id: number | null; tipo_union_id: number | null }>;
  }>({
    nombre: "",
    apellido: "",
    profesion: "",
    fecha_nac: "",
    email: "",
    tel_celular: "",
    nro_doc: "",
    direccion: "",
    anio_ingreso: "",
    sexo_id: null,
    estadocivil_id: null,
    bautizado_id: null,
    padre_id: null,
    madre_id: null,
    conyuge_es_iglesia: false,
    conyuge_id: null,
    familia: [],
  });

  const ensureCatalogosLoaded = useCallback(async () => {
    if (catalogos || catalogosLoading) return;
    setCatalogosLoading(true);
    setCatalogosError(null);
    try {
      const res = await fetch("/api/catalogos", { headers: { Accept: "application/json" } });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(extractMessage(json) ?? "No se pudieron cargar catálogos.");
      const data = (isRecord(json) ? (json.data ?? json) : null) as unknown;
      if (!isRecord(data)) throw new Error("Respuesta inválida del servidor.");
      setCatalogos({
        sexos: Array.isArray(data.sexos) ? (data.sexos as Sexo[]) : [],
        estados_civiles: Array.isArray(data.estados_civiles) ? (data.estados_civiles as EstadoCivil[]) : [],
        bautizados: Array.isArray(data.bautizados) ? (data.bautizados as Bautizado[]) : [],
        miembros_padres: Array.isArray(data.miembros_padres) ? (data.miembros_padres as MiembroPadre[]) : [],
        tipos_union: Array.isArray(data.tipos_union) ? (data.tipos_union as TipoUnion[]) : [],
        estados_union: Array.isArray(data.estados_union) ? (data.estados_union as EstadoUnion[]) : [],
      });
    } catch (e) {
      setCatalogosError(e instanceof Error ? e.message : "Error inesperado.");
    } finally {
      setCatalogosLoading(false);
    }
  }, [catalogos, catalogosLoading]);

  useEffect(() => {
    const id = setTimeout(() => {
      const url = new URL(window.location.href);
      if (url.searchParams.get("create") !== "1") return;
      setCreateStatus({ kind: "idle" });
      setCreateOpen(true);
      url.searchParams.delete("create");
      router.replace(url.pathname);
      void ensureCatalogosLoaded();
    }, 0);
    return () => clearTimeout(id);
  }, [ensureCatalogosLoaded, router]);

  async function createMiembro() {
    setCreateStatus({ kind: "idle" });

    const nombre = form.nombre.trim();
    const apellido = form.apellido.trim();
    if (!nombre || !apellido) {
      setCreateStatus({ kind: "error", message: "Nombre y apellido son obligatorios." });
      return;
    }

    const anio = form.anio_ingreso.trim();
    const anioNum = anio ? Number(anio) : null;
    if (anio && (Number.isNaN(anioNum) || !Number.isFinite(anioNum))) {
      setCreateStatus({ kind: "error", message: "Año de ingreso no es válido." });
      return;
    }

    setCreateStatus({ kind: "saving" });
    try {
      const payload = {
        nombre,
        apellido,
        profesion: form.profesion.trim() ? form.profesion.trim() : null,
        fecha_nac: form.fecha_nac.trim() ? form.fecha_nac.trim() : null,
        email: form.email.trim() ? form.email.trim() : null,
        tel_celular: form.tel_celular.trim() ? form.tel_celular.trim() : null,
        nro_doc: form.nro_doc.trim() ? form.nro_doc.trim() : null,
        direccion: form.direccion.trim() ? form.direccion.trim() : null,
        anio_ingreso: anioNum,
        sexo_id: form.sexo_id,
        estadocivil_id: form.estadocivil_id,
        bautizado_id: form.bautizado_id,
        padre_id: form.padre_id,
        madre_id: form.madre_id,
      };

      const res = await fetch("/api/miembros", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(extractMessage(json) ?? "No se pudo crear el miembro.");

      const created = normalizeDetailResponse(json);
      const createdId = created?.id ?? null;
      if (createdId) {
        await persistUnionesFromForm(createdId, form);
      }

      setCreateStatus({ kind: "success", message: extractMessage(json) ?? "Miembro creado." });
      setCreateOpen(false);
      setForm({
        nombre: "",
        apellido: "",
        profesion: "",
        fecha_nac: "",
        email: "",
        tel_celular: "",
        nro_doc: "",
        direccion: "",
        anio_ingreso: "",
        sexo_id: null,
        estadocivil_id: null,
        bautizado_id: null,
        padre_id: null,
        madre_id: null,
        conyuge_es_iglesia: false,
        conyuge_id: null,
        familia: [],
      });
      setReloadTick((v) => v + 1);
    } catch (e) {
      setCreateStatus({
        kind: "error",
        message: e instanceof Error ? e.message : "Error inesperado.",
      });
    }
  }

  async function openEdit(id: number) {
    setEditStatus({ kind: "idle" });
    setEditId(id);
    setEditOpen(true);
    void ensureCatalogosLoaded();

    try {
      const res = await fetch(`/api/miembros/${id}`, { headers: { Accept: "application/json" }, cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(extractMessage(json) ?? "No se pudo cargar el miembro.");
      const d = normalizeDetailResponse(json);
      if (!d) throw new Error("Respuesta inválida del servidor.");

      const matrimonio = d.uniones_como_persona1?.find((u) => u.tipo_union?.nombre === "Matrimonio")
        ?? d.uniones_como_persona2?.find((u) => u.tipo_union?.nombre === "Matrimonio")
        ?? null;
      const conyugeId = matrimonio
        ? matrimonio.persona1_id === d.id
          ? matrimonio.persona2_id
          : matrimonio.persona1_id
        : null;

      const familia: Array<{ key: string; miembro_id: number | null; tipo_union_id: number | null }> = [];
      const allUniones = [...(d.uniones_como_persona1 ?? []), ...(d.uniones_como_persona2 ?? [])];
      for (const u of allUniones) {
        if (u.tipo_union?.nombre === "Matrimonio") continue;
        const otherId = u.persona1_id === d.id ? u.persona2_id : u.persona1_id;
        familia.push({
          key: crypto.randomUUID(),
          miembro_id: otherId,
          tipo_union_id: u.tipo_union_id,
        });
      }

      setEditForm({
        nombre: d.nombre ?? "",
        apellido: d.apellido ?? "",
        profesion: d.profesion ?? "",
        fecha_nac: toDateInputValue(d.fecha_nac),
        email: d.email ?? "",
        tel_celular: d.tel_celular ?? "",
        nro_doc: d.nro_doc ?? "",
        direccion: d.direccion ?? "",
        anio_ingreso: d.anio_ingreso ? String(d.anio_ingreso) : "",
        sexo_id: d.sexo?.id ?? null,
        estadocivil_id: d.estado_civil?.id ?? null,
        bautizado_id: d.bautizado?.id ?? null,
        padre_id: d.padre?.id ?? null,
        madre_id: d.madre?.id ?? null,
        conyuge_es_iglesia: !!conyugeId,
        conyuge_id: conyugeId,
        familia,
      });
    } catch (e) {
      setEditStatus({ kind: "error", message: e instanceof Error ? e.message : "Error inesperado." });
    }
  }

  async function deleteMiembro(id: number) {
    const m = miembros.find((x) => x.id === id) ?? null;
    const label = m ? fullName(m) : `#${id}`;
    if (!window.confirm(`¿Eliminar el miembro "${label}"?`)) return;

    try {
      const res = await fetch(`/api/miembros/${id}`, { method: "DELETE", headers: { Accept: "application/json" } });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(extractMessage(json) ?? "No se pudo eliminar el miembro.");

      if (openId === id) setOpenId(null);
      if (editId === id) {
        setEditOpen(false);
        setEditId(null);
      }
      setReloadTick((v) => v + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado.");
    }
  }

  async function updateMiembro() {
    if (!editId) return;

    setEditStatus({ kind: "idle" });

    const nombre = editForm.nombre.trim();
    const apellido = editForm.apellido.trim();
    if (!nombre || !apellido) {
      setEditStatus({ kind: "error", message: "Nombre y apellido son obligatorios." });
      return;
    }

    const anio = editForm.anio_ingreso.trim();
    const anioNum = anio ? Number(anio) : null;
    if (anio && (Number.isNaN(anioNum) || !Number.isFinite(anioNum))) {
      setEditStatus({ kind: "error", message: "Año de ingreso no es válido." });
      return;
    }

    setEditStatus({ kind: "saving" });
    try {
      const payload = {
        nombre,
        apellido,
        profesion: editForm.profesion.trim() ? editForm.profesion.trim() : null,
        fecha_nac: editForm.fecha_nac.trim() ? editForm.fecha_nac.trim() : null,
        email: editForm.email.trim() ? editForm.email.trim() : null,
        tel_celular: editForm.tel_celular.trim() ? editForm.tel_celular.trim() : null,
        nro_doc: editForm.nro_doc.trim() ? editForm.nro_doc.trim() : null,
        direccion: editForm.direccion.trim() ? editForm.direccion.trim() : null,
        anio_ingreso: anioNum,
        sexo_id: editForm.sexo_id,
        estadocivil_id: editForm.estadocivil_id,
        bautizado_id: editForm.bautizado_id,
        padre_id: editForm.padre_id,
        madre_id: editForm.madre_id,
      };

      const res = await fetch(`/api/miembros/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(extractMessage(json) ?? "No se pudo actualizar el miembro.");

      await persistUnionesFromForm(editId, editForm);

      setEditStatus({ kind: "success", message: extractMessage(json) ?? "Miembro actualizado." });
      setEditOpen(false);
      setEditId(null);
      setReloadTick((v) => v + 1);
      if (openId === editId) setOpenId(editId);
    } catch (e) {
      setEditStatus({ kind: "error", message: e instanceof Error ? e.message : "Error inesperado." });
    }
  }

  async function persistUnionesFromForm(miembroId: number, f: {
    estadocivil_id: number | null;
    conyuge_es_iglesia: boolean;
    conyuge_id: number | null;
    familia: Array<{ key: string; miembro_id: number | null; tipo_union_id: number | null }>;
  }) {
    const cats = catalogos;
    if (!cats) return;

    const estadoCivilNombre = cats.estados_civiles.find((x) => x.id === f.estadocivil_id)?.nombre ?? null;
    if (!isMarriedLike(estadoCivilNombre)) return;

    const tipoMatrimonio = findByNombre(cats.tipos_union, "Matrimonio");
    const estadoActiva = findByNombre(cats.estados_union, "Activa");
    const estadoViudo = findByNombre(cats.estados_union, "Viudo/a");
    const estadoDivorcio = findByNombre(cats.estados_union, "Divorciado/a");

    const estadoUnion =
      estadoCivilNombre?.toLowerCase().includes("viud") ? estadoViudo
      : estadoCivilNombre?.toLowerCase().includes("divorciad") ? estadoDivorcio
      : estadoActiva;

    if (f.conyuge_es_iglesia && f.conyuge_id && tipoMatrimonio && estadoUnion) {
      await fetch("/api/uniones", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          persona1_id: miembroId,
          persona2_id: f.conyuge_id,
          tipo_union_id: tipoMatrimonio.id,
          estado_union_id: estadoUnion.id,
        }),
      });
    }

    if (!estadoActiva) return;
    for (const rel of f.familia) {
      if (!rel.miembro_id || !rel.tipo_union_id) continue;
      await fetch("/api/uniones", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          persona1_id: miembroId,
          persona2_id: rel.miembro_id,
          tipo_union_id: rel.tipo_union_id,
          estado_union_id: estadoActiva.id,
        }),
      });
    }
  }

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/miembros?per_page=100", {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error(extractMessage(json) ?? "No se pudo cargar la lista.");

        const response = isRecord(json) ? (json as Record<string, unknown>) : null;
        const responseData = response && isRecord(response.data) ? (response.data as Record<string, unknown>) : null;
        const array = responseData && Array.isArray(responseData.data) ? (responseData.data as MiembroListItem[]) : [];

        if (alive) setMiembros(array);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Error inesperado.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    void load();
    return () => {
      alive = false;
    };
  }, [reloadTick]);

  const filtered = useMemo(() => {
    const n = qNombre.trim().toLowerCase();
    const p = qProfesion.trim().toLowerCase();
    const ec = qEstadoCivil.trim().toLowerCase();

    return miembros.filter((m) => {
      const name = `${m.nombre} ${m.apellido}`.toLowerCase();
      const prof = (m.profesion ?? "").toLowerCase();
      const civil = (m.estado_civil?.nombre ?? "").toLowerCase();

      if (n && !name.includes(n)) return false;
      if (p && !prof.includes(p)) return false;
      if (ec && !civil.includes(ec)) return false;
      return true;
    });
  }, [miembros, qNombre, qProfesion, qEstadoCivil]);

  useEffect(() => {
    let alive = true;

    async function loadDetail(id: number) {
      setDetailLoading(true);
      setDetailError(null);
      setDetail(null);
      try {
        const res = await fetch(`/api/miembros/${id}`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error(extractMessage(json) ?? "No se pudo cargar el detalle.");

        const d = normalizeDetailResponse(json);
        if (!d) throw new Error("Respuesta inválida del servidor.");
        if (alive) setDetail(d);
      } catch (e) {
        if (alive) setDetailError(e instanceof Error ? e.message : "Error inesperado.");
      } finally {
        if (alive) setDetailLoading(false);
      }
    }

    if (openId !== null) void loadDetail(openId);
    return () => {
      alive = false;
    };
  }, [openId]);

  return (
    <main className="flex-1 bg-[var(--color-background)] text-[var(--color-foreground)]">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Miembros</h1>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              Gestión de miembros (vista administrativa).
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
            onClick={() => {
              setCreateStatus({ kind: "idle" });
              setCreateOpen(true);
              void ensureCatalogosLoaded();
            }}
          >
            Crear Miembro
          </button>
        </div>

        <div className="mb-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SearchInput
              label="Buscar por nombre"
              value={qNombre}
              onChange={setQNombre}
              placeholder="Ej: Juan Pérez"
            />
            <SearchInput
              label="Filtrar por profesión"
              value={qProfesion}
              onChange={setQProfesion}
              placeholder="Ej: Docente"
            />
            <SearchInput
              label="Filtrar por estado civil"
              value={qEstadoCivil}
              onChange={setQEstadoCivil}
              placeholder="Ej: Casado"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr className="bg-neutral-50 text-left text-xs font-semibold text-neutral-600 dark:bg-neutral-900/40 dark:text-neutral-300">
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Profesión</th>
                  <th className="px-4 py-3">Estado Civil</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {loading ? (
                  <tr>
                    <td className="px-4 py-6 text-neutral-600 dark:text-neutral-400" colSpan={4}>
                      Cargando...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td className="px-4 py-6 text-red-700 dark:text-red-300" colSpan={4}>
                      {error}
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-neutral-600 dark:text-neutral-400" colSpan={4}>
                      Sin resultados.
                    </td>
                  </tr>
                ) : (
                  filtered.map((m) => (
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
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            className="rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 dark:border-red-900/40 dark:bg-neutral-950 dark:text-red-200 dark:hover:bg-red-950/40"
                            onClick={() => void deleteMiembro(m.id)}
                          >
                            Eliminar
                          </button>
                          <button
                            type="button"
                            className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-900 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-900"
                            onClick={() => void openEdit(m.id)}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
                            onClick={() => setOpenId(m.id)}
                          >
                            Ver
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <MiembroModal
        open={openId !== null}
        onClose={() => setOpenId(null)}
        loading={detailLoading}
        error={detailError}
        miembro={detail}
        formatDate={formatDateDisplay}
      />

      <MiembroFormModal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
        }}
        status={createStatus}
        onSave={createMiembro}
        primaryLabel="Crear"
        title="Crear Miembro"
        catalogos={catalogos}
        catalogosLoading={catalogosLoading}
        catalogosError={catalogosError}
        form={form}
        onFormChange={setForm}
        selfId={null}
      />

      <MiembroFormModal
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditId(null);
        }}
        status={editStatus}
        onSave={updateMiembro}
        primaryLabel="Guardar"
        title="Editar Miembro"
        catalogos={catalogos}
        catalogosLoading={catalogosLoading}
        catalogosError={catalogosError}
        form={editForm}
        onFormChange={setEditForm}
        selfId={editId}
      />
    </main>
  );
}

function MiembroFormModal(props: {
  open: boolean;
  onClose: () => void;
  status:
    | { kind: "idle" }
    | { kind: "saving" }
    | { kind: "success"; message: string }
    | { kind: "error"; message: string };
  onSave: () => void;
  title: string;
  primaryLabel: string;
  selfId: number | null;
  catalogos: {
    sexos: Sexo[];
    estados_civiles: EstadoCivil[];
    bautizados: Bautizado[];
    miembros_padres: MiembroPadre[];
    tipos_union: TipoUnion[];
    estados_union: EstadoUnion[];
  } | null;
  catalogosLoading: boolean;
  catalogosError: string | null;
  form: {
    nombre: string;
    apellido: string;
    profesion: string;
    fecha_nac: string;
    email: string;
    tel_celular: string;
    nro_doc: string;
    direccion: string;
    anio_ingreso: string;
    sexo_id: number | null;
    estadocivil_id: number | null;
    bautizado_id: number | null;
    padre_id: number | null;
    madre_id: number | null;
    conyuge_es_iglesia: boolean;
    conyuge_id: number | null;
    familia: Array<{ key: string; miembro_id: number | null; tipo_union_id: number | null }>;
  };
  onFormChange: (v: {
    nombre: string;
    apellido: string;
    profesion: string;
    fecha_nac: string;
    email: string;
    tel_celular: string;
    nro_doc: string;
    direccion: string;
    anio_ingreso: string;
    sexo_id: number | null;
    estadocivil_id: number | null;
    bautizado_id: number | null;
    padre_id: number | null;
    madre_id: number | null;
    conyuge_es_iglesia: boolean;
    conyuge_id: number | null;
    familia: Array<{ key: string; miembro_id: number | null; tipo_union_id: number | null }>;
  }) => void;
}) {
  if (!props.open) return null;

  const sexos = props.catalogos?.sexos ?? [];
  const estados = props.catalogos?.estados_civiles ?? [];
  const bautizados = props.catalogos?.bautizados ?? [];
  const miembros = props.catalogos?.miembros_padres ?? [];
  const tiposUnion = props.catalogos?.tipos_union ?? [];

  const busy = props.status.kind === "saving";

  function setField<K extends keyof typeof props.form>(key: K, value: (typeof props.form)[K]) {
    props.onFormChange({ ...props.form, [key]: value });
  }

  const estadoCivilNombre =
    estados.find((x) => x.id === props.form.estadocivil_id)?.nombre ?? null;
  const showVinculos = isMarriedLike(estadoCivilNombre);

  const tiposFamilia = tiposUnion.filter((t) => t.nombre !== "Matrimonio");
  const miembrosSinSelf = props.selfId ? miembros.filter((m) => m.id !== props.selfId) : miembros;

  function addFamilia() {
    setField("familia", [
      ...props.form.familia,
      { key: crypto.randomUUID(), miembro_id: null, tipo_union_id: null },
    ]);
  }

  function removeFamilia(key: string) {
    setField(
      "familia",
      props.form.familia.filter((x) => x.key !== key),
    );
  }

  function setFamiliaField(
    key: string,
    patch: Partial<{ miembro_id: number | null; tipo_union_id: number | null }>,
  ) {
    setField(
      "familia",
      props.form.familia.map((x) => (x.key === key ? { ...x, ...patch } : x)),
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) props.onClose();
      }}
    >
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex items-start justify-between gap-3 border-b border-neutral-200 p-5 dark:border-neutral-800">
          <div>
            <div className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{props.title}</div>
            <div className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">Campos del DER</div>
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

        <div className="max-h-[75vh] overflow-y-auto p-5">
          {props.catalogosLoading ? (
            <div className="text-sm text-neutral-600 dark:text-neutral-400">Cargando catálogos...</div>
          ) : props.catalogosError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
              {props.catalogosError}
            </div>
          ) : null}

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Nombre">
              <input
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-600"
                value={props.form.nombre}
                onChange={(e) => setField("nombre", e.target.value)}
              />
            </Field>

            <Field label="Apellido">
              <input
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-600"
                value={props.form.apellido}
                onChange={(e) => setField("apellido", e.target.value)}
              />
            </Field>

            <Field label="Profesión">
              <input
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-600"
                value={props.form.profesion}
                onChange={(e) => setField("profesion", e.target.value)}
              />
            </Field>

            <Field label="Fecha nacimiento">
              <input
                type="date"
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-600"
                value={props.form.fecha_nac}
                onChange={(e) => setField("fecha_nac", e.target.value)}
              />
            </Field>

            <Field label="Email">
              <input
                type="email"
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-600"
                value={props.form.email}
                onChange={(e) => setField("email", e.target.value)}
              />
            </Field>

            <Field label="Teléfono / Celular">
              <input
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-600"
                value={props.form.tel_celular}
                onChange={(e) => setField("tel_celular", e.target.value)}
              />
            </Field>

            <Field label="Documento">
              <input
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-600"
                value={props.form.nro_doc}
                onChange={(e) => setField("nro_doc", e.target.value)}
              />
            </Field>

            <Field label="Dirección">
              <input
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-600"
                value={props.form.direccion}
                onChange={(e) => setField("direccion", e.target.value)}
              />
            </Field>

            <Field label="Año ingreso">
              <input
                inputMode="numeric"
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-600"
                value={props.form.anio_ingreso}
                onChange={(e) => setField("anio_ingreso", e.target.value)}
              />
            </Field>

            <Field label="Sexo">
              <select
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-600"
                value={props.form.sexo_id ?? ""}
                onChange={(e) => setField("sexo_id", e.target.value ? Number(e.target.value) : null)}
                disabled={props.catalogosLoading || !!props.catalogosError}
              >
                <option value="">
                  {props.catalogosLoading ? "Cargando..." : "(Sin seleccionar)"}
                </option>
                {sexos.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Estado civil">
              <select
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-600"
                value={props.form.estadocivil_id ?? ""}
                onChange={(e) => setField("estadocivil_id", e.target.value ? Number(e.target.value) : null)}
                disabled={props.catalogosLoading || !!props.catalogosError}
              >
                <option value="">
                  {props.catalogosLoading ? "Cargando..." : "(Sin seleccionar)"}
                </option>
                {estados.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </Field>

            {showVinculos ? (
              <div className="sm:col-span-2 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/30">
                <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  Vínculos familiares
                </div>
                <div className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                  Configuración de cónyuge y familiares (si aplica).
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="flex items-center gap-2 text-sm text-neutral-800 dark:text-neutral-200">
                    <input
                      type="checkbox"
                      checked={props.form.conyuge_es_iglesia}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setField("conyuge_es_iglesia", checked);
                        if (!checked) setField("conyuge_id", null);
                      }}
                      disabled={busy}
                    />
                    ¿Es de la iglesia?
                  </label>

                  <div className="grid gap-1">
                    <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Cónyuge</div>
                    <select
                      className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-400 disabled:opacity-60 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-600"
                      value={props.form.conyuge_id ?? ""}
                      onChange={(e) => setField("conyuge_id", e.target.value ? Number(e.target.value) : null)}
                      disabled={
                        busy ||
                        !props.form.conyuge_es_iglesia ||
                        props.catalogosLoading ||
                        !!props.catalogosError ||
                        miembrosSinSelf.length === 0
                      }
                    >
                      <option value="">
                        {!props.form.conyuge_es_iglesia
                          ? "Marcá 'Es de la iglesia' para seleccionar"
                          : props.catalogosLoading
                            ? "Cargando..."
                            : "Seleccionar"}
                      </option>
                      {miembrosSinSelf.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.apellido}, {m.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Familia</div>
                  <button
                    type="button"
                    className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-900 hover:bg-neutral-50 disabled:opacity-60 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-900"
                    onClick={addFamilia}
                    disabled={busy || props.catalogosLoading || !!props.catalogosError}
                  >
                    Agregar
                  </button>
                </div>

                {props.form.familia.length === 0 ? (
                  <div className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">Sin familiares vinculados.</div>
                ) : (
                  <div className="mt-3 space-y-2">
                    {props.form.familia.map((r) => (
                      <div
                        key={r.key}
                        className="grid grid-cols-1 gap-2 rounded-2xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950 sm:grid-cols-3"
                      >
                        <div className="sm:col-span-2">
                          <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Persona</div>
                          <select
                            className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-400 disabled:opacity-60 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-600"
                            value={r.miembro_id ?? ""}
                            onChange={(e) =>
                              setFamiliaField(r.key, { miembro_id: e.target.value ? Number(e.target.value) : null })
                            }
                            disabled={busy || props.catalogosLoading || !!props.catalogosError}
                          >
                            <option value="">{props.catalogosLoading ? "Cargando..." : "Seleccionar"}</option>
                            {miembrosSinSelf.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.apellido}, {m.nombre}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Parentesco</div>
                          <select
                            className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-400 disabled:opacity-60 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-600"
                            value={r.tipo_union_id ?? ""}
                            onChange={(e) =>
                              setFamiliaField(r.key, { tipo_union_id: e.target.value ? Number(e.target.value) : null })
                            }
                            disabled={busy || props.catalogosLoading || !!props.catalogosError || tiposFamilia.length === 0}
                          >
                            <option value="">
                              {props.catalogosLoading && tiposFamilia.length === 0 ? "Cargando..." : "Seleccionar"}
                            </option>
                            {tiposFamilia.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.nombre}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-900 hover:bg-neutral-50 disabled:opacity-60 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-900"
                            onClick={() => removeFamilia(r.key)}
                            disabled={busy}
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            <Field label="Bautizado">
              <select
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-600"
                value={props.form.bautizado_id ?? ""}
                onChange={(e) => setField("bautizado_id", e.target.value ? Number(e.target.value) : null)}
                disabled={props.catalogosLoading || !!props.catalogosError}
              >
                <option value="">
                  {props.catalogosLoading ? "Cargando..." : "(Sin seleccionar)"}
                </option>
                {bautizados.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nombre}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Padre">
              <select
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-600"
                value={props.form.padre_id ?? ""}
                onChange={(e) => setField("padre_id", e.target.value ? Number(e.target.value) : null)}
                disabled={props.catalogosLoading || !!props.catalogosError}
              >
                <option value="">
                  {props.catalogosLoading ? "Cargando..." : "(Sin seleccionar)"}
                </option>
                {miembros.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.apellido}, {m.nombre}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Madre">
              <select
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-600"
                value={props.form.madre_id ?? ""}
                onChange={(e) => setField("madre_id", e.target.value ? Number(e.target.value) : null)}
                disabled={props.catalogosLoading || !!props.catalogosError}
              >
                <option value="">
                  {props.catalogosLoading ? "Cargando..." : "(Sin seleccionar)"}
                </option>
                {miembros.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.apellido}, {m.nombre}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {props.status.kind === "error" ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
              {props.status.message}
            </div>
          ) : null}

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-900"
              onClick={props.onClose}
              disabled={busy}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
              onClick={props.onSave}
              disabled={busy}
            >
              {busy ? "Guardando..." : props.primaryLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
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

function SearchInput(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{props.label}</div>
      <input
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-600"
      />
    </div>
  );
}

function MiembroModal(props: {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  error: string | null;
  miembro: MiembroDetalle | null;
  formatDate: (v: string | null) => string;
}) {
  if (!props.open) return null;

  const m = props.miembro;

  const uniones = [
    ...(m?.uniones_como_persona1 ?? []),
    ...(m?.uniones_como_persona2 ?? []),
  ];

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
            <div className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {m ? fullName(m) : "Detalle de miembro"}
            </div>
            <div className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
              Información completa
            </div>
          </div>
          <button
            type="button"
            className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-900 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-900"
            onClick={props.onClose}
          >
            Cerrar
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto p-5">
          {props.loading ? (
            <div className="text-sm text-neutral-600 dark:text-neutral-400">Cargando detalle...</div>
          ) : props.error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
              {props.error}
            </div>
          ) : !m ? (
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              No hay información disponible.
            </div>
          ) : (
            <div className="space-y-6">
              <Section title="Datos">
                <KeyValue k="Nombre" v={fullName(m)} />
                <KeyValue k="Profesión" v={m.profesion ?? "-"} />
              <KeyValue k="Fecha nacimiento" v={props.formatDate(m.fecha_nac)} />
                <KeyValue k="Documento" v={m.nro_doc ?? "-"} />
                <KeyValue k="Sexo" v={m.sexo?.nombre ?? "-"} />
                <KeyValue k="Estado civil" v={m.estado_civil?.nombre ?? "-"} />
                <KeyValue k="Bautizado" v={m.bautizado?.nombre ?? "-"} />
                <KeyValue k="Año ingreso" v={m.anio_ingreso?.toString() ?? "-"} />
              </Section>

              <Section title="Contacto">
                <KeyValue k="Email" v={m.email ?? "-"} />
                <KeyValue k="Teléfono / Celular" v={m.tel_celular ?? "-"} />
                <KeyValue k="Dirección" v={m.direccion ?? "-"} />
              </Section>

              <Section title="Padres / Madres">
                <KeyValue k="Padre" v={m.padre ? fullName(m.padre) : "-"} />
                <KeyValue k="Madre" v={m.madre ? fullName(m.madre) : "-"} />
              </Section>

              <Section title="Uniones familiares">
                {uniones.length === 0 ? (
                  <div className="text-sm text-neutral-600 dark:text-neutral-400">Sin uniones.</div>
                ) : (
                  <div className="space-y-2">
                    {uniones.map((u) => {
                      const other =
                        u.persona1_id === m.id ? u.persona2 : u.persona1;
                      return (
                        <div
                          key={`${u.id}-${u.persona1_id}-${u.persona2_id}`}
                          className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm dark:border-neutral-800 dark:bg-neutral-900/30"
                        >
                          <div className="font-medium text-neutral-900 dark:text-neutral-100">
                            {other ? fullName(other) : "Miembro"}
                          </div>
                          <div className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                            {u.tipo_union?.nombre ?? "-"} · {u.estado_union?.nombre ?? "-"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section(props: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
        {props.title}
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">{props.children}</div>
    </div>
  );
}

function KeyValue(props: { k: string; v: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-3 text-sm dark:border-neutral-800 dark:bg-neutral-950">
      <div className="text-xs font-medium text-neutral-600 dark:text-neutral-400">{props.k}</div>
      <div className="mt-1 font-medium text-neutral-900 dark:text-neutral-100">{props.v}</div>
    </div>
  );
}
