<?php

namespace App\Http\Requests\Discipulado;

use App\Http\Requests\ApiFormRequest;

class AttachDiscipuladoMiembrosRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'miembros' => ['required', 'array', 'min:1'],
            'miembros.*' => ['required', 'integer', 'distinct', 'exists:miembros,id'],
            'roldiscipulado_id' => ['nullable', 'integer', 'exists:roles_discipulado,id'],
        ];
    }
}

