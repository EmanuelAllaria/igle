<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Discipulado\AttachDiscipuladoMiembrosRequest;
use App\Http\Requests\Discipulado\StoreDiscipuladoRequest;
use App\Http\Requests\Discipulado\UpdateDiscipuladoRequest;
use App\Http\Requests\Evento\StoreEventoRequest;
use App\Models\Discipulado;
use App\Models\Evento;
use App\Models\RolDiscipulado;

class DiscipuladoController extends Controller
{
    public function index()
    {
        $items = Discipulado::query()
            ->with(['anio', 'grupoMiembro'])
            ->orderByDesc('anio_id')
            ->orderBy('nombre')
            ->get();

        return $this->ok($items);
    }

    public function store(StoreDiscipuladoRequest $request)
    {
        $discipulado = Discipulado::query()->create($request->validated());
        $discipulado->load(['anio', 'grupoMiembro']);

        return $this->ok($discipulado, 'Discipulado creado.', 201);
    }

    public function update(UpdateDiscipuladoRequest $request, Discipulado $discipulado)
    {
        $discipulado->fill($request->validated());
        $discipulado->save();
        $discipulado->load(['anio', 'grupoMiembro']);

        return $this->ok($discipulado, 'Discipulado actualizado.');
    }

    public function destroy(Discipulado $discipulado)
    {
        $discipulado->delete();

        return $this->ok(null, 'Discipulado eliminado.');
    }

    public function miembros(Discipulado $discipulado)
    {
        $items = $discipulado->miembros()
            ->with(['estadoCivil'])
            ->orderBy('apellido')
            ->orderBy('nombre')
            ->get();

        return $this->ok([
            'discipulado' => $discipulado,
            'miembros' => $items,
        ]);
    }

    public function attachMiembros(AttachDiscipuladoMiembrosRequest $request, Discipulado $discipulado)
    {
        $validated = $request->validated();
        $miembros = $validated['miembros'];

        $rolId = $validated['roldiscipulado_id'] ?? RolDiscipulado::query()
            ->where('nombre', 'Miembro')
            ->value('id');

        if (!$rolId) {
            $rolId = RolDiscipulado::query()->orderBy('id')->value('id');
        }

        $payload = [];
        foreach ($miembros as $miembroId) {
            $payload[$miembroId] = ['roldiscipulado_id' => $rolId];
        }

        $discipulado->miembros()->syncWithoutDetaching($payload);

        return $this->ok(null, 'Miembros vinculados.');
    }

    public function eventos(Discipulado $discipulado)
    {
        $items = Evento::query()
            ->where('discipulado_id', $discipulado->id)
            ->orderByDesc('fecha')
            ->get();

        return $this->ok([
            'discipulado' => $discipulado,
            'eventos' => $items,
        ]);
    }

    public function storeEvento(StoreEventoRequest $request, Discipulado $discipulado)
    {
        $payload = $request->validated();
        $payload['discipulado_id'] = $discipulado->id;

        $evento = Evento::query()->create($payload);

        return $this->ok($evento, 'Evento creado.', 201);
    }
}
