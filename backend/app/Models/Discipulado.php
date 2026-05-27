<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Discipulado extends Model
{
    use HasFactory;

    protected $fillable = [
        'nombre',
        'anio_id',
        'grupo_miembro_id',
    ];

    public function anio(): BelongsTo
    {
        return $this->belongsTo(Anio::class);
    }

    public function grupoMiembro(): BelongsTo
    {
        return $this->belongsTo(GrupoMiembro::class);
    }

    public function discipuladoMiembros(): HasMany
    {
        return $this->hasMany(DiscipuladoMiembro::class);
    }

    public function miembros(): BelongsToMany
    {
        return $this->belongsToMany(Miembro::class, 'discipulado_miembro')
            ->withPivot(['id', 'roldiscipulado_id'])
            ->withTimestamps();
    }

    public function eventos(): HasMany
    {
        return $this->hasMany(Evento::class);
    }
}
