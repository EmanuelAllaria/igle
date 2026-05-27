<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ministerio extends Model
{
    public $timestamps = false;

    protected $table = 'ministerios';

    protected $fillable = [
        'nombre',
        'grupo_ministerio_id',
    ];

    public function grupoMinisterio(): BelongsTo
    {
        return $this->belongsTo(GrupoMinisterio::class, 'grupo_ministerio_id');
    }

    public function ministerioMiembros(): HasMany
    {
        return $this->hasMany(MinisterioMiembro::class, 'ministerio_id');
    }

    public function miembros(): BelongsToMany
    {
        return $this->belongsToMany(Miembro::class, 'ministerio_miembro')
            ->withPivot(['id', 'rol_ministerio_id']);
    }
}

