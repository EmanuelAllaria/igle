<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Evento extends Model
{
    use HasFactory;

    protected $fillable = [
        'nombre',
        'descripcion',
        'fecha',
        'ubicacion',
        'discipulado_id',
    ];

    protected function casts(): array
    {
        return [
            'fecha' => 'datetime',
        ];
    }

    public function discipulado(): BelongsTo
    {
        return $this->belongsTo(Discipulado::class);
    }

    public function asistenciaEventos(): HasMany
    {
        return $this->hasMany(AsistenciaEvento::class);
    }

    public function discipuladoMiembros(): BelongsToMany
    {
        return $this->belongsToMany(DiscipuladoMiembro::class, 'asistencia_evento')
            ->withPivot(['id', 'estado_asistencia_id'])
            ->withTimestamps();
    }
}
