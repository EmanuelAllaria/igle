<?php

namespace App\Http\Requests\Evento;

use App\Http\Requests\ApiFormRequest;
use Illuminate\Validation\Rule;

class StoreAsistenciasEventoRequest extends ApiFormRequest
{
    protected function prepareForValidation(): void
    {
        $payload = $this->all();

        if (!array_key_exists('asistencias', $payload) && array_is_list($payload)) {
            $this->merge(['asistencias' => $payload]);
        }
    }

    public function rules(): array
    {
        return [
            'asistencias' => ['required', 'array', 'min:1'],
            'asistencias.*.miembro_id' => ['required', 'integer', 'exists:miembros,id'],
            'asistencias.*.estado' => ['nullable', 'string', Rule::in(['presente', 'ausente', 'justificado'])],
            'asistencias.*.estado_asistencia_id' => ['nullable', 'integer', 'exists:estados_asistencia,id'],
            'asistencias.*.evento_id' => ['required', 'integer'],
        ];
    }
}
