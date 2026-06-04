<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Miembro\StoreMiembroRequest;
use App\Http\Requests\Miembro\UpdateMiembroRequest;
use App\Models\Miembro;
use App\Services\FamiliaService;
use App\Services\ViviendaService;
use Illuminate\Http\Request;

class MiembroController extends Controller
{
    public function index(Request $request)
    {
        $all = $request->boolean('all', false);

        if ($all) {
            $items = Miembro::query()
                ->with([
                    'estadoCivil',
                    'ministerios',
                    'unionesComoPersona1.persona2',
                    'unionesComoPersona1.tipoUnion',
                    'unionesComoPersona1.estadoUnion',
                    'unionesComoPersona2.persona1',
                    'unionesComoPersona2.tipoUnion',
                    'unionesComoPersona2.estadoUnion',
                ])
                ->orderBy('apellido')
                ->orderBy('nombre')
                ->get();

            return $this->ok($items);
        }

        $perPage = (int) $request->query('per_page', 20);
        $perPage = max(1, min(100, $perPage));

        $miembros = Miembro::query()
            ->with([
                'estadoCivil',
                'ministerios',
                'unionesComoPersona1.persona2',
                'unionesComoPersona1.tipoUnion',
                'unionesComoPersona1.estadoUnion',
                'unionesComoPersona2.persona1',
                'unionesComoPersona2.tipoUnion',
                'unionesComoPersona2.estadoUnion',
            ])
            ->orderBy('apellido')
            ->orderBy('nombre')
            ->paginate($perPage);

        return $this->ok($miembros);
    }

    public function store(StoreMiembroRequest $request)
    {
        $data = $request->validated();
        $miembroData = $data;
        unset($miembroData['direccion'], $miembroData['vivienda_direccion'], $miembroData['vivienda_referencia'], $miembroData['vivienda_telefono_fijo']);

        $miembro = Miembro::query()->make($miembroData);
        app(ViviendaService::class)->syncFromInput($miembro, $data);
        $miembro->save();

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
            'hijosPorPadre',
            'hijosPorMadre',
            'unionesComoPersona1.persona2',
            'unionesComoPersona1.tipoUnion',
            'unionesComoPersona1.estadoUnion',
            'unionesComoPersona2.persona1',
            'unionesComoPersona2.tipoUnion',
            'unionesComoPersona2.estadoUnion',
            'vivienda',
            'vivienda.miembros',
        ]);

        $arbol = app(FamiliaService::class)->arbolPara($miembro);

        return $this->ok([
            ...$miembro->toArray(),
            'arbol_genealogico' => $arbol,
        ]);
    }

    public function update(UpdateMiembroRequest $request, Miembro $miembro)
    {
        $data = $request->validated();
        $miembroData = $data;
        unset($miembroData['direccion'], $miembroData['vivienda_direccion'], $miembroData['vivienda_referencia'], $miembroData['vivienda_telefono_fijo']);

        $miembro->fill($miembroData);
        app(ViviendaService::class)->syncFromInput($miembro, $data);
        $miembro->save();

        return $this->ok($miembro, 'Miembro actualizado.');
    }

    public function destroy(Miembro $miembro)
    {
        $miembro->delete();

        return $this->ok(null, 'Miembro eliminado.');
    }
}
