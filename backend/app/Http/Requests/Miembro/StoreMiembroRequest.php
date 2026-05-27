<?php

namespace App\Http\Requests\Miembro;

use App\Http\Requests\ApiFormRequest;

class StoreMiembroRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'nombre' => ['required', 'string', 'max:120'],
            'apellido' => ['required', 'string', 'max:120'],
            'profesion' => ['nullable', 'string', 'max:120'],
            'fecha_nac' => ['nullable', 'date'],
            'email' => ['nullable', 'email', 'max:150', 'unique:miembros,email'],
            'tel_celular' => ['nullable', 'string', 'max:30'],
            'nro_doc' => ['nullable', 'string', 'max:30', 'unique:miembros,nro_doc'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'anio_ingreso' => ['nullable', 'integer', 'min:1900', 'max:2100'],
            'sexo_id' => ['nullable', 'integer', 'exists:sexos,id'],
            'estadocivil_id' => ['nullable', 'integer', 'exists:estados_civiles,id'],
            'bautizado_id' => ['nullable', 'integer', 'exists:bautizados,id'],
            'padre_id' => ['nullable', 'integer', 'exists:miembros,id', 'different:madre_id'],
            'madre_id' => ['nullable', 'integer', 'exists:miembros,id', 'different:padre_id'],
        ];
    }
}
