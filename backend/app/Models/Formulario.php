<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Formulario extends Model
{
    public $timestamps = false;

    protected $table = 'formularios';

    protected $fillable = [
        'titulo',
        'slug',
    ];

    public function campos(): HasMany
    {
        return $this->hasMany(CampoFormulario::class, 'formulario_id');
    }

    public function respuestas(): HasMany
    {
        return $this->hasMany(RespuestaFormulario::class, 'formulario_id');
    }
}

