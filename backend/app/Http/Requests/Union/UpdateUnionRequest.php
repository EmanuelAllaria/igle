<?php

namespace App\Http\Requests\Union;

use App\Http\Requests\ApiFormRequest;
use App\Models\Union;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateUnionRequest extends ApiFormRequest
{
    public function rules(): array
    {
        $unionId = $this->route('union')?->id;

        return [
            'persona1_id' => [
                'sometimes',
                'required',
                'integer',
                'exists:miembros,id',
                'different:persona2_id',
            ],
            'persona2_id' => ['sometimes', 'required', 'integer', 'exists:miembros,id', 'different:persona1_id'],
            'tipo_union_id' => ['sometimes', 'required', 'integer', 'exists:tipos_union,id'],
            'estado_union_id' => ['sometimes', 'required', 'integer', 'exists:estados_union,id'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            if ($v->errors()->isNotEmpty()) return;

            $union = $this->route('union');
            if (!$union) return;

            $persona1Id = $this->input('persona1_id', $union->persona1_id);
            $persona2Id = $this->input('persona2_id', $union->persona2_id);
            $tipoUnionId = $this->input('tipo_union_id', $union->tipo_union_id);

            if (!$persona1Id || !$persona2Id || !$tipoUnionId) return;

            $exists = Union::query()
                ->where('persona1_id', $persona1Id)
                ->where('persona2_id', $persona2Id)
                ->where('tipo_union_id', $tipoUnionId)
                ->where('id', '<>', $union->id)
                ->exists();

            if ($exists) {
                $v->errors()->add('persona1_id', 'Ya existe una unión con esos valores.');
            }
        });
    }
}
