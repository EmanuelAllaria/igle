<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GrupoMinisterio extends Model
{
    public $timestamps = false;

    protected $table = 'grupo_ministerios';

    protected $fillable = [
        'nombre',
    ];

    public function ministerios(): HasMany
    {
        return $this->hasMany(Ministerio::class, 'grupo_ministerio_id');
    }
}

