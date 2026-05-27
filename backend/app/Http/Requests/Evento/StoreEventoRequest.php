<?php

namespace App\Http\Requests\Evento;

use App\Http\Requests\ApiFormRequest;

class StoreEventoRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'nombre' => ['required', 'string', 'max:150'],
            'descripcion' => ['nullable', 'string'],
            'fecha' => ['required', 'date'],
            'ubicacion' => ['nullable', 'string', 'max:200'],
        ];
    }
}

