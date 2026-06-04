<?php

namespace App\Http\Requests\Miembro;

use App\Http\Requests\ApiFormRequest;
use App\Models\Miembro;
use Illuminate\Validation\Rule;

class UpdateMiembroRequest extends ApiFormRequest
{
    protected function prepareForValidation(): void
    {
        $dni = $this->input('dni');
        if (($dni === null || trim((string) $dni) === '') && $this->filled('nro_doc')) {
            $dni = $this->input('nro_doc');
        }

        $viviendaDireccion = $this->input('vivienda_direccion');
        if (($viviendaDireccion === null || trim((string) $viviendaDireccion) === '') && $this->filled('direccion')) {
            $viviendaDireccion = $this->input('direccion');
        }

        $this->merge([
            'dni' => $dni,
            'padre_id' => $this->normalizeMiembroId($this->input('padre_id')),
            'madre_id' => $this->normalizeMiembroId($this->input('madre_id')),
            'vivienda_direccion' => $viviendaDireccion,
        ]);
    }

    public function rules(): array
    {
        $miembroId = $this->route('miembro')?->id;

        return [
            'nombre' => ['sometimes', 'required', 'string', 'max:120'],
            'apellido' => ['sometimes', 'required', 'string', 'max:120'],
            'dni' => ['nullable', 'string', 'max:30', Rule::unique('miembros', 'dni')->ignore($miembroId)],
            'profesion' => ['nullable', 'string', 'max:120'],
            'fecha_nac' => ['nullable', 'date'],
            'email' => ['nullable', 'email', 'max:150', Rule::unique('miembros', 'email')->ignore($miembroId)],
            'tel_celular' => ['nullable', 'string', 'max:30'],
            'nro_doc' => ['nullable', 'string', 'max:30', Rule::unique('miembros', 'nro_doc')->ignore($miembroId)],
            'direccion' => ['nullable', 'string', 'max:255'],
            'vivienda_id' => ['nullable', 'integer', 'exists:viviendas,id'],
            'vivienda_direccion' => ['nullable', 'string', 'max:255'],
            'vivienda_referencia' => ['nullable', 'string', 'max:255'],
            'vivienda_telefono_fijo' => ['nullable', 'string', 'max:30'],
            'anio_ingreso' => ['nullable', 'integer', 'min:1900', 'max:2100'],
            'sexo_id' => ['nullable', 'integer', 'exists:sexos,id'],
            'estadocivil_id' => ['nullable', 'integer', 'exists:estados_civiles,id'],
            'bautizado_id' => ['nullable', 'integer', 'exists:bautizados,id'],
            'padre_id' => ['nullable', 'integer', 'exists:miembros,id', 'different:madre_id', Rule::notIn([$miembroId])],
            'madre_id' => ['nullable', 'integer', 'exists:miembros,id', 'different:padre_id', Rule::notIn([$miembroId])],
        ];
    }

    private function normalizeMiembroId($value): ?int
    {
        if ($value === null) {
            return null;
        }

        if (is_int($value) || (is_string($value) && ctype_digit($value))) {
            return (int) $value;
        }

        if (is_string($value)) {
            $dni = trim($value);
            if ($dni === '') {
                return null;
            }

            return Miembro::query()->where('dni', $dni)->value('id');
        }

        return null;
    }
}
