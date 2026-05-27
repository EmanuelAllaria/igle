<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DiscipuladoMiembro extends Model
{
    use HasFactory;

    protected $table = 'discipulado_miembro';

    protected $fillable = [
        'discipulado_id',
        'miembro_id',
        'roldiscipulado_id',
    ];

    public function discipulado(): BelongsTo
    {
        return $this->belongsTo(Discipulado::class);
    }

    public function miembro(): BelongsTo
    {
        return $this->belongsTo(Miembro::class);
    }

    public function rolDiscipulado(): BelongsTo
    {
        return $this->belongsTo(RolDiscipulado::class, 'roldiscipulado_id');
    }

    public function asistenciaEventos(): HasMany
    {
        return $this->hasMany(AsistenciaEvento::class);
    }

    public function eventos(): BelongsToMany
    {
        return $this->belongsToMany(Evento::class, 'asistencia_evento')
            ->withPivot(['id', 'estado_asistencia_id'])
            ->withTimestamps();
    }
}
