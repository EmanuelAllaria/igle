<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RespuestaFormulario extends Model
{
    public $timestamps = false;

    protected $table = 'respuesta_formularios';

    protected $fillable = [
        'formulario_id',
        'miembro_id',
        'json_data',
    ];

    protected function casts(): array
    {
        return [
            'json_data' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function formulario(): BelongsTo
    {
        return $this->belongsTo(Formulario::class, 'formulario_id');
    }

    public function miembro(): BelongsTo
    {
        return $this->belongsTo(Miembro::class, 'miembro_id');
    }
}
