<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CampoFormulario extends Model
{
    public $timestamps = false;

    protected $table = 'campo_formularios';

    protected $fillable = [
        'formulario_id',
        'label',
        'tipo',
        'es_requerido',
    ];

    protected function casts(): array
    {
        return [
            'es_requerido' => 'boolean',
        ];
    }

    public function formulario(): BelongsTo
    {
        return $this->belongsTo(Formulario::class, 'formulario_id');
    }
}

