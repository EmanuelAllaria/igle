<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Ministerio\StoreMinisterioMiembroRequest;
use App\Http\Requests\Ministerio\StoreMinisterioRequest;
use App\Http\Requests\Ministerio\UpdateMinisterioRequest;
use App\Models\Ministerio;
use App\Models\MinisterioMiembro;
use App\Models\Miembro;

class MinisterioController extends Controller
{
    public function index()
    {
        $items = Ministerio::query()
            ->with(['grupoMinisterio'])
            ->orderBy('nombre')
            ->get();

        return $this->ok($items);
    }

    public function store(StoreMinisterioRequest $request)
    {
        $ministerio = Ministerio::query()->create($request->validated());
        $ministerio->load(['grupoMinisterio']);

        return $this->ok($ministerio, 'Ministerio creado.', 201);
    }

    public function show(Ministerio $ministerio)
    {
        $ministerio->load([
            'grupoMinisterio',
            'ministerioMiembros.miembro',
            'ministerioMiembros.rolMinisterio',
        ]);

        return $this->ok($ministerio);
    }

    public function update(UpdateMinisterioRequest $request, Ministerio $ministerio)
    {
        $ministerio->fill($request->validated());
        $ministerio->save();
        $ministerio->load(['grupoMinisterio']);

        return $this->ok($ministerio, 'Ministerio actualizado.');
    }

    public function destroy(Ministerio $ministerio)
    {
        $ministerio->delete();

        return $this->ok(null, 'Ministerio eliminado.');
    }

    public function addMiembro(StoreMinisterioMiembroRequest $request, Ministerio $ministerio)
    {
        $validated = $request->validated();

        $row = MinisterioMiembro::query()->updateOrCreate(
            [
                'ministerio_id' => $ministerio->id,
                'miembro_id' => (int) $validated['miembro_id'],
            ],
            [
                'rol_ministerio_id' => (int) $validated['rol_ministerio_id'],
            ],
        );

        $row->load(['miembro', 'rolMinisterio', 'ministerio']);

        return $this->ok($row, 'Miembro asignado al ministerio.', 201);
    }

    public function removeMiembro(Ministerio $ministerio, Miembro $miembro)
    {
        MinisterioMiembro::query()
            ->where('ministerio_id', $ministerio->id)
            ->where('miembro_id', $miembro->id)
            ->delete();

        return $this->ok(null, 'Miembro removido del ministerio.');
    }
}

