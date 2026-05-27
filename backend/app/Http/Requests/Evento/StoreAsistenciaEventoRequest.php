<?php

namespace App\Http\Requests\Evento;

use App\Http\Requests\ApiFormRequest;
use Illuminate\Validation\Rule;

class StoreAsistenciaEventoRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'discipulado_miembro_id' => ['required', 'integer', 'exists:discipulado_miembro,id'],
            'estado' => ['nullable', 'string', Rule::in(['presente', 'ausente', 'justificado'])],
            'estado_asistencia_id' => ['nullable', 'integer', 'exists:estados_asistencia,id'],
        ];
    }
}
