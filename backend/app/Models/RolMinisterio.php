<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RolMinisterio extends Model
{
    public $timestamps = false;

    protected $table = 'roles_ministerio';

    protected $fillable = [
        'nombre',
    ];

    public function ministerioMiembros(): HasMany
    {
        return $this->hasMany(MinisterioMiembro::class, 'rol_ministerio_id');
    }
}

