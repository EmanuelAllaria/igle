<?php

use App\Http\Controllers\Api\AsistenciaEventoController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CatalogoController;
use App\Http\Controllers\Api\CensoGeneralController;
use App\Http\Controllers\Api\DiscipuladoController;
use App\Http\Controllers\Api\FormularioController;
use App\Http\Controllers\Api\MinisterioController;
use App\Http\Controllers\Api\MiembroController;
use App\Http\Controllers\Api\UnionController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
    });
});

Route::post('censo-general', [CensoGeneralController::class, 'store']);

Route::get('forms/{slug}', [FormularioController::class, 'showBySlug']);
Route::post('forms/{slug}/respuestas', [FormularioController::class, 'storeRespuesta']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('catalogos', [CatalogoController::class, 'index']);

    Route::apiResource('miembros', MiembroController::class);

    Route::get('formularios', [FormularioController::class, 'index']);
    Route::post('formularios', [FormularioController::class, 'store']);
    Route::get('forms/{slug}/respuestas', [FormularioController::class, 'respuestas']);

    Route::get('discipulados', [DiscipuladoController::class, 'index']);
    Route::post('discipulados', [DiscipuladoController::class, 'store']);
    Route::put('discipulados/{discipulado}', [DiscipuladoController::class, 'update']);
    Route::delete('discipulados/{discipulado}', [DiscipuladoController::class, 'destroy']);
    Route::get('discipulados/{discipulado}/miembros', [DiscipuladoController::class, 'miembros']);
    Route::post('discipulados/{discipulado}/miembros', [DiscipuladoController::class, 'attachMiembros']);
    Route::get('discipulados/{discipulado}/eventos', [DiscipuladoController::class, 'eventos']);
    Route::post('discipulados/{discipulado}/eventos', [DiscipuladoController::class, 'storeEvento']);

    Route::get('eventos/{evento}/asistencias', [AsistenciaEventoController::class, 'index']);
    Route::post('eventos/{evento}/asistencias', [AsistenciaEventoController::class, 'store']);

    Route::apiResource('ministerios', MinisterioController::class);
    Route::post('ministerios/{ministerio}/miembros', [MinisterioController::class, 'addMiembro']);
    Route::delete('ministerios/{ministerio}/miembros/{miembro}', [MinisterioController::class, 'removeMiembro']);

    Route::apiResource('uniones', UnionController::class);
});
