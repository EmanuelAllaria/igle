"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
  const [alarmas, setAlarmas] = useState<{
    generated_at: string | null;
    viewer: { is_pastor: boolean; is_secretaria: boolean; role_slugs: string[] };
    categorias: AlarmaCategoria[];
  } | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [mRes, dRes, fRes, aRes] = await Promise.all([
          fetch("/api/miembros?per_page=1", { headers: { Accept: "application/json" }, cache: "no-store" }),
          fetch("/api/discipulados", { headers: { Accept: "application/json" }, cache: "no-store" }),
          fetch("/api/formularios", { headers: { Accept: "application/json" }, cache: "no-store" }),
          fetch("/api/dashboard/alarmas", { headers: { Accept: "application/json" }, cache: "no-store" }),
        ]);

        const [mJson, dJson, fJson, aJson] = await Promise.all([
          mRes.json().catch(() => null),
          dRes.json().catch(() => null),
          fRes.json().catch(() => null),
          aRes.json().catch(() => null),
        ]);

        if (!mRes.ok) throw new Error(extractMessage(mJson) ?? "No se pudo cargar miembros.");
        if (!dRes.ok) throw new Error(extractMessage(dJson) ?? "No se pudo cargar discipulados.");
        if (!fRes.ok) throw new Error(extractMessage(fJson) ?? "No se pudo cargar formularios.");
        if (!aRes.ok) throw new Error(extractMessage(aJson) ?? "No se pudieron cargar alarmas.");

        const mData = extractData(mJson);
        const dData = extractData(dJson);
        const fData = extractData(fJson);
        const aData = extractData(aJson);

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
        setAlarmas(parseAlarmas(aData));
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Resumen general del sistema.</p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200/70 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </div>
      ) : null}

      {alarmas && alarmas.categorias.length > 0 ? (
        <div>
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
              Alarmas (Alta prioridad)
            </div>
            {alarmas.generated_at ? (
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Actualizado: {new Date(alarmas.generated_at).toLocaleString()}
              </div>
            ) : null}
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3">
            {alarmas.categorias.map((a) => (
              <AlarmaCard key={a.codigo} alarma={a} />
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Resumen</div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SummaryCard title="Total Miembros" value={loading ? "Cargando..." : formatNumber(totalMiembros)} />
          <SummaryCard title="Discipulados Activos" value={loading ? "Cargando..." : formatNumber(discipuladosActivos)} />
          <SummaryCard title="Formularios" value={loading ? "Cargando..." : formatNumber(formularios)} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link
          href="/admin/miembros"
          className="rounded-xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface)] p-6 text-sm font-medium text-slate-900 shadow-sm transition-all duration-200 ease-in-out hover:scale-[1.01] hover:bg-[color:var(--admin-surface-muted)] active:scale-[0.99] dark:text-slate-100"
        >
          Miembros
          <div className="mt-1 text-xs font-normal text-slate-600 dark:text-slate-400">Altas, bajas y consultas.</div>
        </Link>

        <Link
          href="/admin/discipulados"
          className="rounded-xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface)] p-6 text-sm font-medium text-slate-900 shadow-sm transition-all duration-200 ease-in-out hover:scale-[1.01] hover:bg-[color:var(--admin-surface-muted)] active:scale-[0.99] dark:text-slate-100"
        >
          Discipulados
          <div className="mt-1 text-xs font-normal text-slate-600 dark:text-slate-400">
            Eventos y registro de asistencia.
          </div>
        </Link>
      </div>
    </div>
  );
}

function formatNumber(v: number | null) {
  return typeof v === "number" ? v.toLocaleString() : "—";
}

function SummaryCard(props: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-muted)] p-5 shadow-sm">
      <div className="text-xs font-medium text-slate-600 dark:text-slate-400">{props.title}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{props.value}</div>
    </div>
  );
}

type AlarmaCategoria = {
  codigo: string;
  titulo: string;
  prioridad: "alta" | "media" | "baja" | string;
  items: unknown[];
};

function parseAlarmas(raw: unknown): {
  generated_at: string | null;
  viewer: { is_pastor: boolean; is_secretaria: boolean; role_slugs: string[] };
  categorias: AlarmaCategoria[];
} | null {
  if (!isRecord(raw)) return null;
  const generated_at = typeof raw.generated_at === "string" ? raw.generated_at : null;

  const viewerRaw = isRecord(raw.viewer) ? raw.viewer : null;
  const viewer = {
    is_pastor: viewerRaw?.is_pastor === true,
    is_secretaria: viewerRaw?.is_secretaria === true,
    role_slugs: Array.isArray(viewerRaw?.role_slugs) ? (viewerRaw?.role_slugs as string[]) : [],
  };

  const byRole = isRecord(raw.by_role) ? raw.by_role : null;
  const chosen =
    viewer.is_pastor
      ? byRole?.pastor
      : viewer.is_secretaria
        ? byRole?.secretaria
        : byRole?.pastor ?? byRole?.secretaria;

  const categorias = Array.isArray(chosen)
    ? (chosen as unknown[]).flatMap((x) => {
        if (!isRecord(x)) return [];
        const codigo = typeof x.codigo === "string" ? x.codigo : null;
        const titulo = typeof x.titulo === "string" ? x.titulo : null;
        const prioridad = typeof x.prioridad === "string" ? x.prioridad : "alta";
        const items = Array.isArray(x.items) ? (x.items as unknown[]) : [];
        if (!codigo || !titulo) return [];
        return [{ codigo, titulo, prioridad, items }];
      })
    : [];

  return { generated_at, viewer, categorias };
}

function toWhatsappUrl(rawPhone: string | null | undefined, nombre: string): string | null {
  if (!rawPhone) return null;
  const digits = String(rawPhone).replace(/\D/g, "");
  if (!digits) return null;
  const text = encodeURIComponent(`Hola ${nombre}...`);
  return `https://wa.me/${digits}?text=${text}`;
}

function AlarmaCard(props: { alarma: AlarmaCategoria }) {
  const count = props.alarma.items.length;

  return (
    <div className="rounded-xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface)] p-5 shadow-sm transition-all duration-200 ease-in-out hover:shadow-md hover:scale-[1.01] active:scale-[0.99]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{props.alarma.titulo}</div>
            <Badge variant="muted">{props.alarma.codigo}</Badge>
            <Badge variant="warning">Alta</Badge>
          </div>
          <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            {count === 0 ? "Sin novedades." : `${count} registros.`}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={props.alarma.codigo === "ALM-01" ? "/admin/discipulados" : "/admin/miembros"}
            className="rounded-xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface)] px-4 py-2 text-sm font-medium text-slate-900 shadow-sm transition-all duration-200 ease-in-out hover:scale-[1.01] hover:bg-[color:var(--admin-surface-muted)] active:scale-[0.99] dark:text-slate-100"
          >
            Ver
          </Link>
        </div>
      </div>

      {props.alarma.codigo === "ALM-01" ? (
        <AusentesList items={props.alarma.items} />
      ) : props.alarma.codigo === "ALM-02/03" ? (
        <CumpleanosList items={props.alarma.items} />
      ) : null}
    </div>
  );
}

function AusentesList(props: { items: unknown[] }) {
  const rows = props.items
    .flatMap((x) => {
      if (!isRecord(x)) return [];
      const miembro = isRecord(x.miembro) ? x.miembro : null;
      const discipulado = isRecord(x.discipulado) ? x.discipulado : null;
      if (!miembro || !discipulado) return [];
      const nombre = typeof miembro.nombre === "string" ? miembro.nombre : "";
      const apellido = typeof miembro.apellido === "string" ? miembro.apellido : "";
      const discip = typeof discipulado.nombre === "string" ? discipulado.nombre : "";
      const dni = typeof miembro.dni === "string" ? miembro.dni : null;
      return [{ nombre, apellido, discip, dni }];
    })
    .slice(0, 6);

  if (rows.length === 0) return null;

  return (
    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
      {rows.map((r, idx) => (
        <div
          key={`${r.dni ?? ""}-${idx}`}
          className="rounded-xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface)] p-4 transition-all duration-200 ease-in-out hover:bg-[color:var(--admin-surface-muted)]"
        >
          <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
            {r.apellido}, {r.nombre}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span>{r.discip}</span>
            {r.dni ? <Badge variant="muted">{r.dni}</Badge> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function CumpleanosList(props: { items: unknown[] }) {
  const rows = props.items
    .flatMap((x) => {
      if (!isRecord(x)) return [];
      const miembro = isRecord(x.miembro) ? x.miembro : null;
      const cumple = isRecord(x.cumple) ? x.cumple : null;
      if (!miembro) return [];
      const nombre = typeof miembro.nombre === "string" ? miembro.nombre : "";
      const apellido = typeof miembro.apellido === "string" ? miembro.apellido : "";
      const tel = typeof miembro.tel_celular === "string" ? miembro.tel_celular : null;
      const dni = typeof miembro.dni === "string" ? miembro.dni : null;
      const edad = typeof cumple?.edad === "number" ? cumple.edad : null;
      return [{ nombre, apellido, tel, dni, edad }];
    })
    .slice(0, 6);

  if (rows.length === 0) return null;

  return (
    <div className="mt-4 space-y-2">
      {rows.map((r, idx) => {
        const url = toWhatsappUrl(r.tel, r.nombre);
        return (
          <div
            key={`${r.dni ?? ""}-${idx}`}
            className="flex flex-col gap-3 rounded-xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface)] p-4 shadow-sm transition-all duration-200 ease-in-out hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                {r.apellido}, {r.nombre}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                {r.dni ? <Badge variant="muted">{r.dni}</Badge> : null}
                {typeof r.edad === "number" ? <Badge variant="muted">{r.edad} años</Badge> : null}
                {r.tel ? <Badge variant="muted">{r.tel}</Badge> : <Badge variant="warning">Sin celular</Badge>}
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                if (!url) return;
                window.open(url, "_blank", "noopener,noreferrer");
              }}
              disabled={!url}
            >
              Enviar saludo por WhatsApp
            </Button>
          </div>
        );
      })}
    </div>
  );
}
