<?php

namespace App\Http\Requests\Ministerio;

use App\Http\Requests\ApiFormRequest;

class UpdateMinisterioRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'nombre' => ['sometimes', 'required', 'string', 'max:120'],
            'grupo_ministerio_id' => ['sometimes', 'required', 'integer', 'exists:grupo_ministerios,id'],
        ];
    }
}

