<?php

namespace App\Http\Requests\Ministerio;

use App\Http\Requests\ApiFormRequest;

class StoreMinisterioMiembroRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'miembro_id' => ['required', 'integer', 'exists:miembros,id'],
            'rol_ministerio_id' => ['required', 'integer', 'exists:roles_ministerio,id'],
        ];
    }
}

