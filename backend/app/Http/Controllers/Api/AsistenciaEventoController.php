<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Evento\StoreAsistenciasEventoRequest;
use App\Models\AsistenciaEvento;
use App\Models\DiscipuladoMiembro;
use App\Models\EstadoAsistencia;
use App\Models\Evento;

class AsistenciaEventoController extends Controller
{
    public function index(Evento $evento)
    {
        $items = AsistenciaEvento::query()
            ->where('evento_id', $evento->id)
            ->with(['estadoAsistencia', 'discipuladoMiembro.miembro', 'discipuladoMiembro.rolDiscipulado', 'discipuladoMiembro.discipulado'])
            ->orderBy('id')
            ->get();

        return $this->ok([
            'evento' => $evento,
            'asistencias' => $items,
        ]);
    }

    public function store(StoreAsistenciasEventoRequest $request, Evento $evento)
    {
        $validated = $request->validated();
        $items = $validated['asistencias'];

        $eventoId = $evento->id;

        $miembroIds = array_values(array_unique(array_map(fn ($i) => (int) $i['miembro_id'], $items)));
        $discipuladoMiembros = DiscipuladoMiembro::query()
            ->whereIn('miembro_id', $miembroIds)
            ->get()
            ->keyBy('miembro_id');

        $guardErrors = [];
        $saved = [];

        foreach ($items as $idx => $item) {
            if ((int) $item['evento_id'] !== $eventoId) {
                $guardErrors["asistencias.$idx.evento_id"] = ['No coincide con el evento de la URL.'];
                continue;
            }

            $discipuladoMiembro = $discipuladoMiembros->get((int) $item['miembro_id']);
            if (!$discipuladoMiembro) {
                $guardErrors["asistencias.$idx.miembro_id"] = ['El miembro no está inscripto en ningún discipulado.'];
                continue;
            }

            if ($evento->discipulado_id !== null && $discipuladoMiembro->discipulado_id !== $evento->discipulado_id) {
                $guardErrors["asistencias.$idx.miembro_id"] = ['El miembro no pertenece al discipulado del evento.'];
                continue;
            }

            $estadoAsistenciaId = array_key_exists('estado_asistencia_id', $item) ? (int) ($item['estado_asistencia_id'] ?? 0) : 0;
            if (!$estadoAsistenciaId && array_key_exists('estado', $item) && is_string($item['estado'])) {
                $estadoAsistenciaId = (int) EstadoAsistencia::query()
                    ->where('nombre_corto', $item['estado'])
                    ->value('id');
            }
            if (!$estadoAsistenciaId) {
                $guardErrors["asistencias.$idx.estado_asistencia_id"] = ['Estado de asistencia inválido.'];
                continue;
            }

            $asistencia = AsistenciaEvento::query()->updateOrCreate(
                [
                    'evento_id' => $eventoId,
                    'discipulado_miembro_id' => $discipuladoMiembro->id,
                ],
                [
                    'estado_asistencia_id' => $estadoAsistenciaId,
                ],
            );

            $saved[] = $asistencia;
        }

        if (!empty($guardErrors)) {
            return $this->fail('Validación de integridad fallida.', $guardErrors, 422);
        }

        return $this->ok([
            'evento' => $evento,
            'count' => count($saved),
        ], 'Asistencias guardadas.', 201);
    }
}
