<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Union\StoreUnionRequest;
use App\Http\Requests\Union\UpdateUnionRequest;
use App\Models\FamiliaGenealogica;
use App\Models\Union;

class UnionController extends Controller
{
    public function index()
    {
        $items = Union::query()
            ->with(['persona1', 'persona2', 'tipoUnion', 'estadoUnion'])
            ->orderByDesc('id')
            ->get();

        return $this->ok($items);
    }

    public function store(StoreUnionRequest $request)
    {
        $validated = $request->validated();
        $a = (int) ($validated['persona1_id'] ?? 0);
        $b = (int) ($validated['persona2_id'] ?? 0);
        if ($a > 0 && $b > 0 && $a > $b) {
            $validated['persona1_id'] = $b;
            $validated['persona2_id'] = $a;
        }

        $union = Union::query()->create($validated);
        FamiliaGenealogica::query()->firstOrCreate(['union_id' => $union->id]);
        $union->load(['persona1', 'persona2', 'tipoUnion', 'estadoUnion']);

        return $this->ok($union, 'Unión creada.', 201);
    }

    public function show(Union $union)
    {
        $union->load(['persona1', 'persona2', 'tipoUnion', 'estadoUnion']);

        return $this->ok($union);
    }

    public function update(UpdateUnionRequest $request, Union $union)
    {
        $validated = $request->validated();
        $a = (int) ($validated['persona1_id'] ?? $union->persona1_id);
        $b = (int) ($validated['persona2_id'] ?? $union->persona2_id);
        if ($a > 0 && $b > 0 && $a > $b) {
            $validated['persona1_id'] = $b;
            $validated['persona2_id'] = $a;
        }

        $union->fill($validated);
        $union->save();
        FamiliaGenealogica::query()->firstOrCreate(['union_id' => $union->id]);
        $union->load(['persona1', 'persona2', 'tipoUnion', 'estadoUnion']);

        return $this->ok($union, 'Unión actualizada.');
    }

    public function destroy(Union $union)
    {
        $union->delete();

        return $this->ok(null, 'Unión eliminada.');
    }
}
