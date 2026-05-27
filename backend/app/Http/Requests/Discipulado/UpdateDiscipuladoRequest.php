<?php

namespace App\Http\Requests\Discipulado;

use App\Http\Requests\ApiFormRequest;
use App\Models\Discipulado;
use Illuminate\Validation\Validator;

class UpdateDiscipuladoRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'nombre' => ['required', 'string', 'max:120'],
            'anio_id' => ['required', 'integer', 'exists:anios,id'],
            'grupo_miembro_id' => ['required', 'integer', 'exists:grupo_miembros,id'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            if ($v->errors()->isNotEmpty()) return;

            $discipulado = $this->route('discipulado');
            if (!$discipulado) return;

            $nombre = $this->input('nombre');
            $anioId = $this->input('anio_id');
            $grupoId = $this->input('grupo_miembro_id');
            if (!$nombre || !$anioId || !$grupoId) return;

            $exists = Discipulado::query()
                ->where('nombre', $nombre)
                ->where('anio_id', $anioId)
                ->where('grupo_miembro_id', $grupoId)
                ->where('id', '<>', $discipulado->id)
                ->exists();

            if ($exists) {
                $v->errors()->add('nombre', 'Ya existe un discipulado con ese nombre/año/grupo.');
            }
        });
    }
}
