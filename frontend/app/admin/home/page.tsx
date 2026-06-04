"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventInput } from "@fullcalendar/core";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function parseCalendarEvents(raw: unknown): EventInput[] {
  if (!isRecord(raw)) return [];
  const list = Array.isArray(raw.events) ? raw.events : [];

  return list.flatMap((x) => {
    if (!isRecord(x)) return [];
    const title = typeof x.title === "string" ? x.title : null;
    const start = typeof x.start === "string" ? x.start : null;
    if (!title || !start) return [];

    const idRaw = x.id;
    const id = typeof idRaw === "string" ? idRaw : typeof idRaw === "number" ? String(idRaw) : undefined;
    const allDay = x.allDay === true;
    const extendedProps = isRecord(x.extendedProps) ? x.extendedProps : undefined;

    return [
      {
        id,
        title,
        start,
        allDay,
        extendedProps,
      } satisfies EventInput,
    ];
  });
}

type AlarmasPayload = {
  generated_at: string | null;
  viewer: { is_pastor: boolean; is_secretaria: boolean; role_slugs: string[] };
  categorias: Array<{ codigo: string; titulo: string; prioridad: string; items: unknown[] }>;
} | null;

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

function parseAlarmas(raw: unknown): AlarmasPayload {
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
    viewer.is_pastor ? byRole?.pastor : viewer.is_secretaria ? byRole?.secretaria : byRole?.pastor ?? byRole?.secretaria;

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

export default function AdminHomePage() {
  const [calLoading, setCalLoading] = useState(true);
  const [calError, setCalError] = useState<string | null>(null);
  const [events, setEvents] = useState<EventInput[]>([]);

  const [alarmasLoading, setAlarmasLoading] = useState(true);
  const [alarmasError, setAlarmasError] = useState<string | null>(null);
  const [alarmas, setAlarmas] = useState<AlarmasPayload>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      setCalLoading(true);
      setCalError(null);
      setAlarmasLoading(true);
      setAlarmasError(null);

      try {
        const [cRes, aRes] = await Promise.all([
          fetch("/api/calendario", { headers: { Accept: "application/json" }, cache: "no-store" }),
          fetch("/api/dashboard/alarmas", { headers: { Accept: "application/json" }, cache: "no-store" }),
        ]);

        const [cJson, aJson] = await Promise.all([cRes.json().catch(() => null), aRes.json().catch(() => null)]);

        if (!cRes.ok) throw new Error(extractMessage(cJson) ?? "No se pudo cargar el calendario.");
        if (!aRes.ok) throw new Error(extractMessage(aJson) ?? "No se pudieron cargar alarmas.");

        const calData = extractData(cJson);
        const evs = parseCalendarEvents(calData);

        if (!alive) return;
        setEvents(evs);
        setAlarmas(parseAlarmas(extractData(aJson)));
      } catch (e) {
        if (!alive) return;
        const msg = e instanceof Error ? e.message : "Error inesperado.";
        setCalError(msg);
        setAlarmasError(msg);
      } finally {
        if (!alive) return;
        setCalLoading(false);
        setAlarmasLoading(false);
      }
    }

    void load();
    return () => {
      alive = false;
    };
  }, []);

  const alarmasTop = useMemo(() => {
    const cats = alarmas?.categorias ?? [];
    return [...cats].sort((a, b) => b.items.length - a.items.length).slice(0, 3);
  }, [alarmas]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Home</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Centro operativo: calendario, alarmas y accesos rápidos.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/miembros">
            <Button>Miembros</Button>
          </Link>
          <Link href="/admin/discipulados">
            <Button variant="secondary">Discipulados</Button>
          </Link>
          <Link href="/admin/ministerios">
            <Button variant="secondary">Ministerios</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_420px]">
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <CardTitle>Calendario</CardTitle>
                <CardDescription>Eventos y cumpleaños.</CardDescription>
              </div>
              {calLoading ? <Badge variant="muted">Cargando...</Badge> : <Badge variant="muted">{events.length} items</Badge>}
            </div>
            {calError ? (
              <div className="mt-3 rounded-xl border border-red-200/70 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
                {calError}
              </div>
            ) : null}
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface)] p-3 shadow-sm">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                height="auto"
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: "dayGridMonth,timeGridWeek,timeGridDay",
                }}
                events={events}
                dayMaxEvents
                eventClassNames={(arg) => {
                  const tipo = (arg.event.extendedProps?.tipo as string | undefined) ?? "";
                  return [
                    "rounded-lg border shadow-sm",
                    "transition-all duration-200 ease-in-out hover:scale-[1.01]",
                    tipo === "cumpleanos"
                      ? "bg-[color:color-mix(in_srgb,var(--admin-accent),white_85%)] border-[color:var(--admin-border)] text-slate-900"
                      : "bg-[color:var(--admin-surface-muted)] border-[color:var(--admin-border)] text-slate-900",
                  ];
                }}
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle>Alarmas prioritarias</CardTitle>
                  <CardDescription>Lo urgente del día.</CardDescription>
                </div>
                {alarmas?.generated_at ? (
                  <Badge variant="muted">{new Date(alarmas.generated_at).toLocaleString()}</Badge>
                ) : null}
              </div>
              {alarmasError ? (
                <div className="mt-3 rounded-xl border border-red-200/70 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
                  {alarmasError}
                </div>
              ) : null}
            </CardHeader>
            <CardContent>
              {alarmasLoading ? (
                <div className="text-sm text-slate-600 dark:text-slate-400">Cargando...</div>
              ) : alarmasTop.length === 0 ? (
                <div className="text-sm text-slate-600 dark:text-slate-400">Sin alarmas.</div>
              ) : (
                <div className="space-y-2">
                  {alarmasTop.map((a) => (
                    <Link
                      key={a.codigo}
                      href={a.codigo === "ALM-01" ? "/admin/discipulados" : "/admin/miembros"}
                      className="block rounded-xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface)] p-4 shadow-sm transition-all duration-200 ease-in-out hover:shadow-md hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{a.titulo}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                            <Badge variant="muted">{a.codigo}</Badge>
                            <span>{a.items.length} registros</span>
                          </div>
                        </div>
                        <Badge variant="warning">Alta</Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Accesos rápidos</CardTitle>
              <CardDescription>Regla de los 3 clicks: ir directo al módulo.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2">
                <Link href="/admin/miembros" className="rounded-xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-muted)] p-4 text-sm font-medium text-slate-900 shadow-sm transition-all duration-200 ease-in-out hover:scale-[1.01] active:scale-[0.99] dark:text-slate-100">
                  Alta / búsqueda de miembros
                </Link>
                <Link href="/admin/discipulados" className="rounded-xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-muted)] p-4 text-sm font-medium text-slate-900 shadow-sm transition-all duration-200 ease-in-out hover:scale-[1.01] active:scale-[0.99] dark:text-slate-100">
                  Asistencias y eventos
                </Link>
                <Link href="/admin/ministerios" className="rounded-xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-muted)] p-4 text-sm font-medium text-slate-900 shadow-sm transition-all duration-200 ease-in-out hover:scale-[1.01] active:scale-[0.99] dark:text-slate-100">
                  Ministerios y asignaciones
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
