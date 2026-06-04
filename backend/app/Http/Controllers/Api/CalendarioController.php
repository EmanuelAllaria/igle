<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Evento;
use App\Models\Miembro;
use Carbon\Carbon;
use Illuminate\Http\Request;

class CalendarioController extends Controller
{
    public function index(Request $request)
    {
        $fromRaw = $request->query('from');
        $toRaw = $request->query('to');

        $now = Carbon::now();
        $from = $this->parseDateOrNull($fromRaw)?->startOfDay() ?? $now->copy()->startOfMonth()->subDays(7)->startOfDay();
        $to = $this->parseDateOrNull($toRaw)?->endOfDay() ?? $now->copy()->endOfMonth()->addDays(14)->endOfDay();

        if ($to->lessThan($from)) {
            [$from, $to] = [$to->copy()->startOfDay(), $from->copy()->endOfDay()];
        }

        $eventos = Evento::query()
            ->whereBetween('fecha', [$from, $to])
            ->orderBy('fecha')
            ->get(['id', 'nombre', 'descripcion', 'fecha', 'ubicacion', 'discipulado_id'])
            ->map(fn (Evento $e) => [
                'id' => (int) $e->id,
                'title' => $e->nombre,
                'start' => $e->fecha?->toISOString(),
                'allDay' => false,
                'extendedProps' => [
                    'tipo' => 'evento',
                    'ubicacion' => $e->ubicacion,
                    'descripcion' => $e->descripcion,
                    'discipulado_id' => $e->discipulado_id,
                ],
            ])
            ->values()
            ->all();

        $miembros = Miembro::query()
            ->whereNotNull('fecha_nac')
            ->get(['id', 'dni', 'nombre', 'apellido', 'tel_celular', 'fecha_nac']);

        $cumpleanos = [];
        $years = collect([$from->year, $to->year])->unique()->values();

        foreach ($miembros as $m) {
            $fechaNac = $m->fecha_nac ? Carbon::parse($m->fecha_nac) : null;
            if (!$fechaNac) continue;

            foreach ($years as $y) {
                $bday = $this->safeDate((int) $y, $fechaNac->month, $fechaNac->day);
                if (!$bday) continue;
                if ($bday->lt($from) || $bday->gt($to)) continue;

                $cumpleanos[] = [
                    'id' => 'cumple-'.$m->id.'-'.$y,
                    'title' => 'Cumple: '.$m->apellido.', '.$m->nombre,
                    'start' => $bday->toDateString(),
                    'allDay' => true,
                    'extendedProps' => [
                        'tipo' => 'cumpleanos',
                        'miembro' => [
                            'id' => (int) $m->id,
                            'dni' => $m->dni,
                            'nombre' => $m->nombre,
                            'apellido' => $m->apellido,
                            'tel_celular' => $m->tel_celular,
                        ],
                        'edad' => max(0, ((int) $y) - (int) $fechaNac->year),
                    ],
                ];
            }
        }

        usort($cumpleanos, fn ($a, $b) => strcmp((string) $a['start'], (string) $b['start']));

        return $this->ok([
            'range' => [
                'from' => $from->toISOString(),
                'to' => $to->toISOString(),
            ],
            'events' => [
                ...$eventos,
                ...$cumpleanos,
            ],
        ]);
    }

    private function parseDateOrNull($value): ?Carbon
    {
        if (!is_string($value) || trim($value) === '') return null;
        try {
            return Carbon::parse($value);
        } catch (\Throwable) {
            return null;
        }
    }

    private function safeDate(int $year, int $month, int $day): ?Carbon
    {
        try {
            return Carbon::createFromDate($year, $month, $day)->startOfDay();
        } catch (\Throwable) {
            try {
                return Carbon::createFromDate($year, $month, 28)->startOfDay();
            } catch (\Throwable) {
                return null;
            }
        }
    }
}

