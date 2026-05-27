<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Censo\StoreCensoGeneralRequest;
use App\Models\Miembro;

class CensoGeneralController extends Controller
{
    public function store(StoreCensoGeneralRequest $request)
    {
        $miembro = Miembro::query()->create($request->validated());

        return $this->ok($miembro, 'Censo recibido.', 201);
    }
}

