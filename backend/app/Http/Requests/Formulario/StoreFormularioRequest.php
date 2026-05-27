<?php

namespace App\Http\Requests\Formulario;

use App\Http\Requests\ApiFormRequest;
use Illuminate\Validation\Rule;

class StoreFormularioRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'titulo' => ['required', 'string', 'max:150'],
            'slug' => [
                'required',
                'string',
                'max:150',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('formularios', 'slug'),
            ],
            'campos' => ['required', 'array', 'min:1'],
            'campos.*.label' => ['required', 'string', 'max:150'],
            'campos.*.tipo' => ['required', 'string', Rule::in(['texto', 'numero', 'fecha'])],
            'campos.*.es_requerido' => ['required', 'boolean'],
        ];
    }
}

