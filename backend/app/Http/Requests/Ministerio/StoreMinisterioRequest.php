<?php

namespace App\Http\Requests\Ministerio;

use App\Http\Requests\ApiFormRequest;
use Illuminate\Validation\Rule;

class StoreMinisterioRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'nombre' => ['required', 'string', 'max:120'],
            'grupo_ministerio_id' => ['required', 'integer', 'exists:grupo_ministerios,id'],
        ];
    }
}

