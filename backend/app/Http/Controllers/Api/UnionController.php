<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Union\StoreUnionRequest;
use App\Http\Requests\Union\UpdateUnionRequest;
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
        $union = Union::query()->create($request->validated());
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
        $union->fill($request->validated());
        $union->save();
        $union->load(['persona1', 'persona2', 'tipoUnion', 'estadoUnion']);

        return $this->ok($union, 'Unión actualizada.');
    }

    public function destroy(Union $union)
    {
        $union->delete();

        return $this->ok(null, 'Unión eliminada.');
    }
}

