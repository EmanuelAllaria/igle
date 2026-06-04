"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type CatalogoItem = { id: number; nombre: string };
type Catalogos = {
  estados_civiles: CatalogoItem[];
  tipos_union: CatalogoItem[];
  estados_union: CatalogoItem[];
  roles_ministerio: CatalogoItem[];
};

type MiembroMin = { id: number; nombre: string; apellido: string; dni?: string | null };
type DiscipuladoListItem = { id: number; nombre: string };
type MinisterioListItem = { id: number; nombre: string };

type VinculoDraft = {
  dni: string;
  miembro: MiembroMin;
  placeholder: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractData<T>(json: unknown): T | null {
  if (!isRecord(json)) return null;
  const data = (json.data ?? json) as unknown;
  return data as T;
}

function extractMessage(json: unknown): string | null {
  if (!isRecord(json)) return null;
  return typeof json.message === "string" ? json.message : null;
}

function fullName(m: { nombre: string; apellido: string }) {
  return `${m.apellido}, ${m.nombre}`.trim();
}

function normalizeDni(raw: string): string {
  return raw.trim().replace(/\s+/g, "");
}

export function MiembroAltaWizardModal(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [catalogos, setCatalogos] = useState<Catalogos | null>(null);
  const [discipulados, setDiscipulados] = useState<DiscipuladoListItem[]>([]);
  const [ministerios, setMinisterios] = useState<MinisterioListItem[]>([]);

  const [dni, setDni] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");

  const [conyugeDni, setConyugeDni] = useState("");
  const [conyuge, setConyuge] = useState<VinculoDraft | null>(null);

  const [hijoDni, setHijoDni] = useState("");
  const [hijos, setHijos] = useState<VinculoDraft[]>([]);
  const [parentRole, setParentRole] = useState<"padre" | "madre">("padre");

  const [estadoCivilId, setEstadoCivilId] = useState<number | null>(null);
  const [discipuladoId, setDiscipuladoId] = useState<number | null>(null);
  const [ministerioId, setMinisterioId] = useState<number | null>(null);
  const [rolMinisterioId, setRolMinisterioId] = useState<number | null>(null);

  const matrimonioTipoUnionId = useMemo(() => {
    const tipos = catalogos?.tipos_union ?? [];
    const match =
      tipos.find((t) => t.nombre.toLowerCase().includes("matrimon")) ?? tipos.at(0) ?? null;
    return match?.id ?? null;
  }, [catalogos]);

  const estadoUnionId = useMemo(() => {
    const estados = catalogos?.estados_union ?? [];
    const match =
      estados.find((e) => e.nombre.toLowerCase().includes("vig")) ??
      estados.find((e) => e.nombre.toLowerCase().includes("act")) ??
      estados.at(0) ??
      null;
    return match?.id ?? null;
  }, [catalogos]);

  const effectiveRoleMinisterioId = useMemo(() => {
    if (rolMinisterioId) return rolMinisterioId;
    return catalogos?.roles_ministerio?.at(0)?.id ?? null;
  }, [rolMinisterioId, catalogos]);

  useEffect(() => {
    if (!props.open) return;
    let alive = true;

    async function loadAll() {
      try {
        const [catRes, disRes, minRes] = await Promise.all([
          fetch("/api/catalogos", { headers: { Accept: "application/json" }, cache: "no-store" }),
          fetch("/api/discipulados", { headers: { Accept: "application/json" }, cache: "no-store" }),
          fetch("/api/ministerios", { headers: { Accept: "application/json" }, cache: "no-store" }),
        ]);

        const [catJson, disJson, minJson] = await Promise.all([
          catRes.json().catch(() => null),
          disRes.json().catch(() => null),
          minRes.json().catch(() => null),
        ]);

        if (!catRes.ok) throw new Error(extractMessage(catJson) ?? "No se pudieron cargar catálogos.");
        if (!disRes.ok) throw new Error(extractMessage(disJson) ?? "No se pudieron cargar discipulados.");
        if (!minRes.ok) throw new Error(extractMessage(minJson) ?? "No se pudieron cargar ministerios.");

        const cat = extractData<Catalogos>(catJson);
        const dis = extractData<DiscipuladoListItem[]>(disJson) ?? [];
        const min = extractData<MinisterioListItem[]>(minJson) ?? [];

        if (!cat) throw new Error("Respuesta inválida de catálogos.");

        if (!alive) return;
        setCatalogos({
          estados_civiles: Array.isArray(cat.estados_civiles) ? cat.estados_civiles : [],
          tipos_union: Array.isArray(cat.tipos_union) ? cat.tipos_union : [],
          estados_union: Array.isArray(cat.estados_union) ? cat.estados_union : [],
          roles_ministerio: Array.isArray(cat.roles_ministerio) ? cat.roles_ministerio : [],
        });
        setDiscipulados(Array.isArray(dis) ? dis : []);
        setMinisterios(Array.isArray(min) ? min : []);
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Error inesperado.");
      }
    }

    void loadAll();
    return () => {
      alive = false;
    };
  }, [props.open]);

  async function getMiembroByDni(dniValue: string): Promise<MiembroMin | null> {
    const res = await fetch(`/api/miembros/${encodeURIComponent(dniValue)}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (res.status === 404) return null;
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(extractMessage(json) ?? "No se pudo buscar el DNI.");
    const d = extractData<MiembroMin>(json);
    if (!d) throw new Error("Respuesta inválida del servidor.");
    return d;
  }

  async function createPlaceholderMember(dniValue: string): Promise<MiembroMin> {
    const payload = {
      dni: dniValue,
      nombre: "Pendiente",
      apellido: "Sin datos",
    };

    const res = await fetch("/api/miembros", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const existing = await getMiembroByDni(dniValue);
      if (existing) return existing;
      throw new Error(extractMessage(json) ?? "No se pudo crear el placeholder.");
    }
    const d = extractData<MiembroMin>(json);
    if (!d) throw new Error("Respuesta inválida del servidor.");
    return d;
  }

  async function resolveOrCreateByDni(raw: string): Promise<VinculoDraft> {
    const normalized = normalizeDni(raw);
    if (!normalized) throw new Error("El DNI no puede estar vacío.");

    const existing = await getMiembroByDni(normalized);
    if (existing) {
      return { dni: normalized, miembro: existing, placeholder: false };
    }

    const created = await createPlaceholderMember(normalized);
    return { dni: normalized, miembro: created, placeholder: true };
  }

  async function addConyuge() {
    setError(null);
    try {
      setBusy(true);
      const v = await resolveOrCreateByDni(conyugeDni);
      setConyuge(v);
      setConyugeDni("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado.");
    } finally {
      setBusy(false);
    }
  }

  async function addHijo() {
    setError(null);
    try {
      setBusy(true);
      const v = await resolveOrCreateByDni(hijoDni);
      setHijos((prev) => {
        if (prev.some((x) => x.dni === v.dni)) return prev;
        return [...prev, v];
      });
      setHijoDni("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado.");
    } finally {
      setBusy(false);
    }
  }

  function canGoNextFromStep1(): boolean {
    return nombre.trim().length > 0 && apellido.trim().length > 0;
  }

  async function finish() {
    setError(null);
    if (!canGoNextFromStep1()) {
      setError("Nombre y apellido son obligatorios.");
      setStep(1);
      return;
    }

    setBusy(true);
    try {
      const payload = {
        dni: dni.trim() ? normalizeDni(dni) : null,
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        estadocivil_id: estadoCivilId,
      };

      const res = await fetch("/api/miembros", {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(extractMessage(json) ?? "No se pudo crear el miembro.");

      const created = extractData<MiembroMin>(json);
      if (!created) throw new Error("Respuesta inválida del servidor.");

      if (conyuge && matrimonioTipoUnionId && estadoUnionId) {
        const a = created.id;
        const b = conyuge.miembro.id;
        const persona1_id = Math.min(a, b);
        const persona2_id = Math.max(a, b);

        const uRes = await fetch("/api/uniones", {
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({
            persona1_id,
            persona2_id,
            tipo_union_id: matrimonioTipoUnionId,
            estado_union_id: estadoUnionId,
          }),
        });
        const uJson = await uRes.json().catch(() => null);
        if (!uRes.ok) throw new Error(extractMessage(uJson) ?? "No se pudo crear la unión.");
      }

      if (hijos.length > 0) {
        const parentField = parentRole === "madre" ? "madre_id" : "padre_id";
        for (const h of hijos) {
          const r = await fetch(`/api/miembros/${encodeURIComponent(h.dni)}`, {
            method: "PUT",
            headers: { Accept: "application/json", "Content-Type": "application/json" },
            body: JSON.stringify({ [parentField]: created.id }),
          });
          const rJson = await r.json().catch(() => null);
          if (!r.ok) throw new Error(extractMessage(rJson) ?? `No se pudo vincular el hijo ${h.dni}.`);
        }
      }

      if (discipuladoId) {
        const dRes = await fetch(`/api/discipulados/${encodeURIComponent(String(discipuladoId))}/miembros`, {
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({ miembros: [created.id] }),
        });
        const dJson = await dRes.json().catch(() => null);
        if (!dRes.ok) throw new Error(extractMessage(dJson) ?? "No se pudo asignar el discipulado.");
      }

      if (ministerioId) {
        if (!effectiveRoleMinisterioId) {
          throw new Error("No hay roles de ministerio disponibles para asignar.");
        }

        const mRes = await fetch(`/api/ministerios/${encodeURIComponent(String(ministerioId))}/miembros`, {
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({ miembro_id: created.id, rol_ministerio_id: effectiveRoleMinisterioId }),
        });
        const mJson = await mRes.json().catch(() => null);
        if (!mRes.ok) throw new Error(extractMessage(mJson) ?? "No se pudo asignar el ministerio.");
      }

      props.onOpenChange(false);
      props.onCreated();
      setDni("");
      setNombre("");
      setApellido("");
      setConyugeDni("");
      setConyuge(null);
      setHijoDni("");
      setHijos([]);
      setParentRole("padre");
      setEstadoCivilId(null);
      setDiscipuladoId(null);
      setMinisterioId(null);
      setRolMinisterioId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado.");
    } finally {
      setBusy(false);
    }
  }

  const stepPills = (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => setStep(1)}
        className={[
          "rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 ease-in-out",
          step === 1
            ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
            : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-900",
        ].join(" ")}
        disabled={busy}
      >
        1 · Datos
      </button>
      <button
        type="button"
        onClick={() => setStep(2)}
        className={[
          "rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 ease-in-out",
          step === 2
            ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
            : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-900",
        ].join(" ")}
        disabled={busy || !canGoNextFromStep1()}
      >
        2 · Vínculos
      </button>
      <button
        type="button"
        onClick={() => setStep(3)}
        className={[
          "rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 ease-in-out",
          step === 3
            ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
            : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-900",
        ].join(" ")}
        disabled={busy || !canGoNextFromStep1()}
      >
        3 · Clasificación
      </button>
    </div>
  );

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <DialogTitle>Alta de Miembro</DialogTitle>
              <DialogDescription>Regla de los 3 clicks: alta + vínculos + clasificación sin salir del contexto.</DialogDescription>
            </div>
            {stepPills}
          </div>
        </DialogHeader>

        <div className="px-6 pb-2 pt-4">
          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
              {error}
            </div>
          ) : null}
        </div>

        <div className="px-6 pb-2">
          <Separator />
        </div>

        <div className="px-6 py-5">
          {step === 1 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="sm:col-span-1">
                <Label htmlFor="dni">DNI / ID Provisorio</Label>
                <Input
                  id="dni"
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                  placeholder="Ej: 30111222 o PROV-00042"
                  disabled={busy}
                />
                <div className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
                  Si lo dejás vacío, se genera automáticamente un PROV-xxxxx.
                </div>
              </div>
              <div className="sm:col-span-1">
                <Label htmlFor="nombre">Nombre</Label>
                <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Juan" disabled={busy} />
              </div>
              <div className="sm:col-span-1">
                <Label htmlFor="apellido">Apellido</Label>
                <Input id="apellido" value={apellido} onChange={(e) => setApellido(e.target.value)} placeholder="Ej: Pérez" disabled={busy} />
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-6">
              <div className="rounded-2xl border border-neutral-200 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/60">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Cónyuge</div>
                    <div className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                      Ingresá DNI. Si no existe, se crea un placeholder al instante.
                    </div>
                  </div>
                  {conyuge ? (
                    <Button variant="secondary" size="sm" onClick={() => setConyuge(null)} disabled={busy}>
                      Quitar
                    </Button>
                  ) : null}
                </div>

                {conyuge ? (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <div className="text-sm text-neutral-900 dark:text-neutral-100">{fullName(conyuge.miembro)}</div>
                    <Badge variant="muted">{conyuge.dni}</Badge>
                    {conyuge.placeholder ? <Badge variant="warning">Placeholder</Badge> : null}
                  </div>
                ) : (
                  <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
                    <Input
                      value={conyugeDni}
                      onChange={(e) => setConyugeDni(e.target.value)}
                      placeholder="DNI del cónyuge"
                      disabled={busy}
                    />
                    <Button onClick={() => void addConyuge()} disabled={busy || normalizeDni(conyugeDni) === ""}>
                      Vincular
                    </Button>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/60">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Hijos</div>
                    <div className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                      Vinculá hijos por DNI. Si no existen, se crean placeholders.
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className={[
                        "rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 ease-in-out",
                        parentRole === "padre"
                          ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                          : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-900",
                      ].join(" ")}
                      onClick={() => setParentRole("padre")}
                      disabled={busy}
                    >
                      Como padre
                    </button>
                    <button
                      type="button"
                      className={[
                        "rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 ease-in-out",
                        parentRole === "madre"
                          ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                          : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-900",
                      ].join(" ")}
                      onClick={() => setParentRole("madre")}
                      disabled={busy}
                    >
                      Como madre
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
                  <Input value={hijoDni} onChange={(e) => setHijoDni(e.target.value)} placeholder="DNI del hijo/a" disabled={busy} />
                  <Button onClick={() => void addHijo()} disabled={busy || normalizeDni(hijoDni) === ""}>
                    Agregar
                  </Button>
                </div>

                {hijos.length > 0 ? (
                  <div className="mt-4 space-y-2">
                    {hijos.map((h) => (
                      <div
                        key={h.dni}
                        className="flex flex-col gap-2 rounded-2xl border border-neutral-200 bg-white p-3 transition-all duration-200 ease-in-out hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-950 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm text-neutral-900 dark:text-neutral-100">{fullName(h.miembro)}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <Badge variant="muted">{h.dni}</Badge>
                            {h.placeholder ? <Badge variant="warning">Placeholder</Badge> : null}
                          </div>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setHijos((prev) => prev.filter((x) => x.dni !== h.dni))}
                          disabled={busy}
                        >
                          Quitar
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 text-xs text-neutral-600 dark:text-neutral-400">Todavía no hay hijos vinculados.</div>
                )}
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="sm:col-span-1">
                <Label htmlFor="estado">Estado (Civil)</Label>
                <select
                  id="estado"
                  value={estadoCivilId ?? ""}
                  onChange={(e) => setEstadoCivilId(e.target.value ? Number(e.target.value) : null)}
                  disabled={busy}
                  className="h-10 w-full rounded-2xl border border-neutral-200 bg-white px-3 text-sm text-neutral-900 shadow-sm transition-all duration-200 ease-in-out focus:border-neutral-900/25 focus:ring-2 focus:ring-neutral-900/10 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-white/20 dark:focus:ring-white/10"
                >
                  <option value="">Sin asignar</option>
                  {(catalogos?.estados_civiles ?? []).map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-1">
                <Label htmlFor="discipulado">Discipulado</Label>
                <select
                  id="discipulado"
                  value={discipuladoId ?? ""}
                  onChange={(e) => setDiscipuladoId(e.target.value ? Number(e.target.value) : null)}
                  disabled={busy}
                  className="h-10 w-full rounded-2xl border border-neutral-200 bg-white px-3 text-sm text-neutral-900 shadow-sm transition-all duration-200 ease-in-out focus:border-neutral-900/25 focus:ring-2 focus:ring-neutral-900/10 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-white/20 dark:focus:ring-white/10"
                >
                  <option value="">Sin asignar</option>
                  {discipulados.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-1">
                <Label htmlFor="ministerio">Ministerio</Label>
                <select
                  id="ministerio"
                  value={ministerioId ?? ""}
                  onChange={(e) => setMinisterioId(e.target.value ? Number(e.target.value) : null)}
                  disabled={busy}
                  className="h-10 w-full rounded-2xl border border-neutral-200 bg-white px-3 text-sm text-neutral-900 shadow-sm transition-all duration-200 ease-in-out focus:border-neutral-900/25 focus:ring-2 focus:ring-neutral-900/10 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-white/20 dark:focus:ring-white/10"
                >
                  <option value="">Sin asignar</option>
                  {ministerios.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {ministerioId ? (
                <div className="sm:col-span-3">
                  <div className="rounded-2xl border border-neutral-200 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/60">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Rol en el ministerio</div>
                        <div className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                          Se usa el primer rol disponible si no seleccionás uno.
                        </div>
                      </div>
                      <select
                        value={rolMinisterioId ?? ""}
                        onChange={(e) => setRolMinisterioId(e.target.value ? Number(e.target.value) : null)}
                        disabled={busy}
                        className="h-10 rounded-2xl border border-neutral-200 bg-white px-3 text-sm text-neutral-900 shadow-sm transition-all duration-200 ease-in-out focus:border-neutral-900/25 focus:ring-2 focus:ring-neutral-900/10 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-white/20 dark:focus:ring-white/10"
                      >
                        <option value="">Automático</option>
                        {(catalogos?.roles_ministerio ?? []).map((x) => (
                          <option key={x.id} value={x.id}>
                            {x.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => props.onOpenChange(false)} disabled={busy}>
            Cancelar
          </Button>

          {step > 1 ? (
            <Button variant="secondary" onClick={() => setStep((s) => (s === 2 ? 1 : 2))} disabled={busy}>
              Atrás
            </Button>
          ) : null}

          {step < 3 ? (
            <Button
              onClick={() => setStep((s) => (s === 1 ? 2 : 3))}
              disabled={busy || (step === 1 && !canGoNextFromStep1())}
            >
              Continuar
            </Button>
          ) : (
            <Button onClick={() => void finish()} disabled={busy || !canGoNextFromStep1()}>
              Crear miembro
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
