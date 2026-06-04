<?php

namespace App\Services;

use App\Models\Miembro;
use App\Models\Vivienda;
use Illuminate\Support\Facades\DB;

class ViviendaService
{
    public function syncFromInput(Miembro $miembro, array $input): void
    {
        if (array_key_exists('vivienda_id', $input)) {
            $miembro->vivienda_id = $input['vivienda_id'];
            return;
        }

        $touchesVivienda =
            array_key_exists('vivienda_direccion', $input)
            || array_key_exists('vivienda_referencia', $input)
            || array_key_exists('vivienda_telefono_fijo', $input);

        if (!$touchesVivienda) {
            return;
        }

        $direccion = $this->normalizeNullableString($input['vivienda_direccion'] ?? null);
        $referencia = $this->normalizeNullableString($input['vivienda_referencia'] ?? null);
        $telefonoFijo = $this->normalizeNullableString($input['vivienda_telefono_fijo'] ?? null);

        if ($direccion === null && $referencia === null && $telefonoFijo === null) {
            $miembro->vivienda_id = null;
            return;
        }

        $current = $miembro->relationLoaded('vivienda') ? $miembro->getRelation('vivienda') : $miembro->vivienda;
        $sameAsCurrent =
            $current instanceof Vivienda
            && $this->normalizeNullableString($current->direccion) === $direccion
            && $this->normalizeNullableString($current->referencia) === $referencia
            && $this->normalizeNullableString($current->telefono_fijo) === $telefonoFijo;

        if ($sameAsCurrent) {
            return;
        }

        $vivienda = DB::transaction(function () use ($direccion, $referencia, $telefonoFijo) {
            return Vivienda::query()->create([
                'direccion' => $direccion,
                'referencia' => $referencia,
                'telefono_fijo' => $telefonoFijo,
            ]);
        });

        $miembro->vivienda_id = $vivienda->id;
    }

    private function normalizeNullableString($value): ?string
    {
        if ($value === null) return null;
        $v = trim((string) $value);
        return $v === '' ? null : $v;
    }
}

