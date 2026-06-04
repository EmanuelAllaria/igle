<?php

namespace App\Services;

use App\Models\Miembro;

class FamiliaService
{
    public function arbolPara(Miembro $miembro): array
    {
        $miembro->loadMissing([
            'padre:id,dni,nombre,apellido',
            'madre:id,dni,nombre,apellido',
            'hijosPorPadre:id,dni,nombre,apellido,padre_id,madre_id',
            'hijosPorMadre:id,dni,nombre,apellido,padre_id,madre_id',
            'unionesComoPersona1.persona2:id,dni,nombre,apellido',
            'unionesComoPersona1.tipoUnion:id,nombre',
            'unionesComoPersona1.estadoUnion:id,nombre',
            'unionesComoPersona2.persona1:id,dni,nombre,apellido',
            'unionesComoPersona2.tipoUnion:id,nombre',
            'unionesComoPersona2.estadoUnion:id,nombre',
        ]);

        $uniones = collect([
            ...($miembro->unionesComoPersona1 ?? []),
            ...($miembro->unionesComoPersona2 ?? []),
        ])
            ->unique('id')
            ->values()
            ->map(function ($u) use ($miembro) {
                $other = (int) $u->persona1_id === (int) $miembro->id ? $u->persona2 : $u->persona1;

                return [
                    'id' => (int) $u->id,
                    'tipo_union' => $u->tipoUnion ? ['id' => (int) $u->tipoUnion->id, 'nombre' => $u->tipoUnion->nombre] : null,
                    'estado_union' => $u->estadoUnion ? ['id' => (int) $u->estadoUnion->id, 'nombre' => $u->estadoUnion->nombre] : null,
                    'conyuge' => $other ? $this->toPersona($other) : null,
                ];
            })
            ->all();

        $hijos = collect([
            ...($miembro->hijosPorPadre ?? []),
            ...($miembro->hijosPorMadre ?? []),
        ])
            ->unique('id')
            ->values()
            ->map(fn ($x) => $this->toPersona($x))
            ->all();

        return [
            'miembro' => $this->toPersona($miembro),
            'padre' => $miembro->padre ? $this->toPersona($miembro->padre) : null,
            'madre' => $miembro->madre ? $this->toPersona($miembro->madre) : null,
            'uniones' => $uniones,
            'hijos' => $hijos,
        ];
    }

    public function syncFamilia(Miembro $miembro): void
    {
    }

    public function syncForMember(Miembro $miembro): void
    {
    }

    private function toPersona(Miembro $m): array
    {
        return [
            'id' => (int) $m->id,
            'dni' => $m->dni,
            'nombre' => $m->nombre,
            'apellido' => $m->apellido,
        ];
    }
}
