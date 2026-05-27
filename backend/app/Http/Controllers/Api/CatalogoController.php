<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Anio;
use App\Models\Bautizado;
use App\Models\EstadoCivil;
use App\Models\EstadoUnion;
use App\Models\GrupoMiembro;
use App\Models\Miembro;
use App\Models\RolDiscipulado;
use App\Models\Sexo;
use App\Models\TipoUnion;

class CatalogoController extends Controller
{
    public function index()
    {
        return $this->ok([
            'sexos' => Sexo::query()->orderBy('nombre')->get(['id', 'nombre']),
            'estados_civiles' => EstadoCivil::query()->orderBy('nombre')->get(['id', 'nombre']),
            'bautizados' => Bautizado::query()->orderBy('id')->get(['id', 'nombre']),
            'anios' => Anio::query()->orderByDesc('anio')->get(['id', 'anio']),
            'grupos_miembros' => GrupoMiembro::query()->orderBy('nombre')->get(['id', 'nombre']),
            'miembros_padres' => Miembro::query()->orderBy('apellido')->orderBy('nombre')->get(['id', 'nombre', 'apellido']),
            'tipos_union' => TipoUnion::query()->orderBy('nombre')->get(['id', 'nombre']),
            'estados_union' => EstadoUnion::query()->orderBy('nombre')->get(['id', 'nombre']),
            'roles_discipulado' => RolDiscipulado::query()->orderBy('nombre')->get(['id', 'nombre']),
        ]);
    }
}
