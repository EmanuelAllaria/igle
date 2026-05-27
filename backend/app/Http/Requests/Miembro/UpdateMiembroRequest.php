<?php

namespace App\Http\Requests\Miembro;

use App\Http\Requests\ApiFormRequest;
use Illuminate\Validation\Rule;

class UpdateMiembroRequest extends ApiFormRequest
{
    public function rules(): array
    {
        $miembroId = $this->route('miembro')?->id;

        return [
            'nombre' => ['sometimes', 'required', 'string', 'max:120'],
            'apellido' => ['sometimes', 'required', 'string', 'max:120'],
            'profesion' => ['nullable', 'string', 'max:120'],
            'fecha_nac' => ['nullable', 'date'],
            'email' => ['nullable', 'email', 'max:150', Rule::unique('miembros', 'email')->ignore($miembroId)],
            'tel_celular' => ['nullable', 'string', 'max:30'],
            'nro_doc' => ['nullable', 'string', 'max:30', Rule::unique('miembros', 'nro_doc')->ignore($miembroId)],
            'direccion' => ['nullable', 'string', 'max:255'],
            'anio_ingreso' => ['nullable', 'integer', 'min:1900', 'max:2100'],
            'sexo_id' => ['nullable', 'integer', 'exists:sexos,id'],
            'estadocivil_id' => ['nullable', 'integer', 'exists:estados_civiles,id'],
            'bautizado_id' => ['nullable', 'integer', 'exists:bautizados,id'],
            'padre_id' => ['nullable', 'integer', 'exists:miembros,id', 'different:madre_id', Rule::notIn([$miembroId])],
            'madre_id' => ['nullable', 'integer', 'exists:miembros,id', 'different:padre_id', Rule::notIn([$miembroId])],
        ];
    }
}
