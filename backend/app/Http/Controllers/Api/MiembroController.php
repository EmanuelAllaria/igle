<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Miembro\StoreMiembroRequest;
use App\Http\Requests\Miembro\UpdateMiembroRequest;
use App\Models\Miembro;
use Illuminate\Http\Request;

class MiembroController extends Controller
{
    public function index(Request $request)
    {
        $all = $request->boolean('all', false);

        if ($all) {
            $items = Miembro::query()
                ->with(['estadoCivil'])
                ->orderBy('apellido')
                ->orderBy('nombre')
                ->get();

            return $this->ok($items);
        }

        $perPage = (int) $request->query('per_page', 20);
        $perPage = max(1, min(100, $perPage));

        $miembros = Miembro::query()
            ->with(['estadoCivil'])
            ->orderBy('apellido')
            ->orderBy('nombre')
            ->paginate($perPage);

        return $this->ok($miembros);
    }

    public function store(StoreMiembroRequest $request)
    {
        $miembro = Miembro::query()->create($request->validated());

        return $this->ok($miembro, 'Miembro creado.', 201);
    }

    public function show(Miembro $miembro)
    {
        $miembro->load([
            'sexo',
            'estadoCivil',
            'bautizado',
            'padre',
            'madre',
            'unionesComoPersona1.persona2',
            'unionesComoPersona1.tipoUnion',
            'unionesComoPersona1.estadoUnion',
            'unionesComoPersona2.persona1',
            'unionesComoPersona2.tipoUnion',
            'unionesComoPersona2.estadoUnion',
        ]);

        return $this->ok($miembro);
    }

    public function update(UpdateMiembroRequest $request, Miembro $miembro)
    {
        $miembro->fill($request->validated());
        $miembro->save();

        return $this->ok($miembro, 'Miembro actualizado.');
    }

    public function destroy(Miembro $miembro)
    {
        $miembro->delete();

        return $this->ok(null, 'Miembro eliminado.');
    }
}
