<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Formulario\StoreFormularioRequest;
use App\Http\Requests\Formulario\StoreRespuestaFormularioRequest;
use App\Models\Formulario;
use App\Models\RespuestaFormulario;
use Illuminate\Http\Request;

class FormularioController extends Controller
{
    public function index()
    {
        $items = Formulario::query()
            ->withCount(['campos'])
            ->orderByDesc('id')
            ->get();

        return $this->ok($items);
    }

    public function respuestas(Request $request, string $slug)
    {
        $formulario = Formulario::query()
            ->where('slug', $slug)
            ->first();

        if (!$formulario) {
            return $this->fail('Formulario no encontrado.', null, 404);
        }

        $perPage = (int) $request->query('per_page', 20);
        $perPage = max(1, min(100, $perPage));

        $items = RespuestaFormulario::query()
            ->where('formulario_id', $formulario->id)
            ->with(['miembro:id,nombre,apellido'])
            ->orderByDesc('id')
            ->paginate($perPage);

        return $this->ok([
            'formulario' => $formulario,
            'respuestas' => $items,
        ]);
    }

    public function store(StoreFormularioRequest $request)
    {
        $validated = $request->validated();

        $formulario = Formulario::query()->create([
            'titulo' => $validated['titulo'],
            'slug' => $validated['slug'],
        ]);

        $formulario->campos()->createMany($validated['campos']);
        $formulario->load(['campos']);

        return $this->ok($formulario, 'Formulario creado.', 201);
    }

    public function showBySlug(string $slug)
    {
        $formulario = Formulario::query()
            ->where('slug', $slug)
            ->with(['campos'])
            ->first();

        if (!$formulario) {
            return $this->fail('Formulario no encontrado.', null, 404);
        }

        return $this->ok($formulario);
    }

    public function storeRespuesta(StoreRespuestaFormularioRequest $request, string $slug)
    {
        $formulario = Formulario::query()
            ->where('slug', $slug)
            ->with(['campos'])
            ->first();

        if (!$formulario) {
            return $this->fail('Formulario no encontrado.', null, 404);
        }

        $validated = $request->validated();
        $json = $validated['json_data'];

        $errors = [];

        foreach ($formulario->campos as $campo) {
            $key = (string) $campo->id;
            $value = array_key_exists($key, $json) ? $json[$key] : null;

            $emptyText = is_string($value) ? trim($value) === '' : $value === null;
            if ($campo->es_requerido && $emptyText) {
                $errors["json_data.$key"] = ['Campo requerido.'];
                continue;
            }

            if ($emptyText) {
                continue;
            }

            if ($campo->tipo === 'numero') {
                if (!is_numeric($value)) {
                    $errors["json_data.$key"] = ['Debe ser un número.'];
                }
            } elseif ($campo->tipo === 'fecha') {
                if (!is_string($value) || strtotime($value) === false) {
                    $errors["json_data.$key"] = ['Debe ser una fecha válida.'];
                }
            } else {
                if (!is_string($value)) {
                    $errors["json_data.$key"] = ['Debe ser texto.'];
                }
            }
        }

        if (!empty($errors)) {
            return $this->fail('Validación fallida.', $errors, 422);
        }

        $respuesta = RespuestaFormulario::query()->create([
            'formulario_id' => $formulario->id,
            'miembro_id' => $validated['miembro_id'] ?? null,
            'json_data' => $json,
        ]);

        return $this->ok($respuesta, 'Respuesta guardada.', 201);
    }
}
