<?php

namespace App\Http\Requests\Formulario;

use App\Http\Requests\ApiFormRequest;

class StoreRespuestaFormularioRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'miembro_id' => ['nullable', 'integer', 'exists:miembros,id'],
            'json_data' => ['required', 'array'],
        ];
    }
}

