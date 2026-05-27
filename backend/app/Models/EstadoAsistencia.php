<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EstadoAsistencia extends Model
{
    public $timestamps = false;

    protected $table = 'estados_asistencia';

    protected $fillable = [
        'nombre_corto',
        'nombre_largo',
    ];

    public function asistenciasEvento(): HasMany
    {
        return $this->hasMany(AsistenciaEvento::class, 'estado_asistencia_id');
    }
}

