<?php

namespace App\Services;

use App\Models\AsistenciaEvento;
use App\Models\DiscipuladoMiembro;
use App\Models\EstadoAsistencia;
use App\Models\Evento;
use App\Models\Miembro;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class PastoralAlarmasService
{
    private const CACHE_KEY = 'dashboard_alarmas_v1';

    public function getOrCompute(): array
    {
        return Cache::remember(self::CACHE_KEY, now()->addHours(25), function () {
            return $this->compute();
        });
    }

    public function refresh(): array
    {
        $data = $this->compute();
        Cache::put(self::CACHE_KEY, $data, now()->addHours(25));
        return $data;
    }

    public function compute(): array
    {
        $now = CarbonImmutable::now();

        $alm01 = $this->alm01AusentesTresSemanas($now);
        $alm02 = $this->alm02CumpleanosDelDia($now);

        return [
            'generated_at' => $now->toIso8601String(),
            'by_role' => [
                'pastor' => [
                    $alm01,
                    $alm02,
                ],
                'secretaria' => [
                    $alm02,
                ],
            ],
        ];
    }

    private function alm01AusentesTresSemanas(CarbonImmutable $now): array
    {
        $ausenteId = (int) EstadoAsistencia::query()
            ->where('nombre_corto', 'ausente')
            ->value('id');

        if (!$ausenteId) {
            return [
                'codigo' => 'ALM-01',
                'titulo' => 'Miembros ausentes 3 semanas consecutivas',
                'prioridad' => 'alta',
                'items' => [],
            ];
        }

        $since = $now->subWeeks(4)->startOfDay();

        $eventos = Evento::query()
            ->where('fecha', '>=', $since)
            ->whereNotNull('discipulado_id')
            ->orderByDesc('fecha')
            ->get(['id', 'discipulado_id', 'fecha'])
            ->groupBy('discipulado_id');

        $matches = collect();

        foreach ($eventos as $discipuladoId => $rows) {
            $last3 = $rows->take(3)->values();
            if ($last3->count() < 3) continue;

            $eventoIds = $last3->pluck('id')->all();

            $discipuladoMiembroIds = AsistenciaEvento::query()
                ->whereIn('evento_id', $eventoIds)
                ->where('estado_asistencia_id', $ausenteId)
                ->select('discipulado_miembro_id', DB::raw('count(*) as c'))
                ->groupBy('discipulado_miembro_id')
                ->having('c', '=', 3)
                ->pluck('discipulado_miembro_id');

            if ($discipuladoMiembroIds->isEmpty()) continue;

            $loaded = DiscipuladoMiembro::query()
                ->whereIn('id', $discipuladoMiembroIds)
                ->with(['miembro:id,dni,nombre,apellido,tel_celular', 'discipulado:id,nombre'])
                ->get();

            foreach ($loaded as $dm) {
                if (!$dm->miembro || !$dm->discipulado) continue;
                $matches->push([
                    'miembro' => [
                        'id' => (int) $dm->miembro->id,
                        'dni' => $dm->miembro->dni,
                        'nombre' => $dm->miembro->nombre,
                        'apellido' => $dm->miembro->apellido,
                        'tel_celular' => $dm->miembro->tel_celular,
                    ],
                    'discipulado' => [
                        'id' => (int) $dm->discipulado->id,
                        'nombre' => $dm->discipulado->nombre,
                    ],
                    'semanas' => 3,
                    'desde' => optional($last3->last()?->fecha)->toDateString(),
                    'hasta' => optional($last3->first()?->fecha)->toDateString(),
                ]);
            }
        }

        $items = $matches
            ->sortBy(fn ($x) => ($x['miembro']['apellido'] ?? '').' '.($x['miembro']['nombre'] ?? ''))
            ->values()
            ->all();

        return [
            'codigo' => 'ALM-01',
            'titulo' => 'Miembros ausentes 3 semanas consecutivas',
            'prioridad' => 'alta',
            'items' => $items,
        ];
    }

    private function alm02CumpleanosDelDia(CarbonImmutable $now): array
    {
        $month = (int) $now->month;
        $day = (int) $now->day;

        $rows = Miembro::query()
            ->whereNotNull('fecha_nac')
            ->whereMonth('fecha_nac', $month)
            ->whereDay('fecha_nac', $day)
            ->orderBy('apellido')
            ->orderBy('nombre')
            ->get(['id', 'dni', 'nombre', 'apellido', 'tel_celular', 'fecha_nac']);

        $items = [];
        foreach ($rows as $m) {
            $age = null;
            if ($m->fecha_nac) {
                try {
                    $age = $now->diffInYears(CarbonImmutable::parse($m->fecha_nac));
                } catch (\Throwable) {
                    $age = null;
                }
            }

            $items[] = [
                'miembro' => [
                    'id' => (int) $m->id,
                    'dni' => $m->dni,
                    'nombre' => $m->nombre,
                    'apellido' => $m->apellido,
                    'tel_celular' => $m->tel_celular,
                ],
                'cumple' => [
                    'fecha_nac' => $m->fecha_nac?->toDateString(),
                    'edad' => $age,
                ],
            ];
        }

        return [
            'codigo' => 'ALM-02/03',
            'titulo' => 'Cumpleaños del día',
            'prioridad' => 'alta',
            'items' => $items,
        ];
    }
}
