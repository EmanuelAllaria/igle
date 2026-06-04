<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Vivienda extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'viviendas';

    protected $fillable = [
        'direccion',
        'referencia',
        'telefono_fijo',
    ];

    public function miembros(): HasMany
    {
        return $this->hasMany(Miembro::class, 'vivienda_id');
    }
}

