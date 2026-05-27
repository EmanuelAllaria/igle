<?php

namespace App\Http\Requests\Discipulado;

use App\Http\Requests\ApiFormRequest;

class StoreDiscipuladoRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'nombre' => ['required', 'string', 'max:120'],
            'anio_id' => ['required', 'integer', 'exists:anios,id'],
            'grupo_miembro_id' => ['required', 'integer', 'exists:grupo_miembros,id'],
        ];
    }
}

