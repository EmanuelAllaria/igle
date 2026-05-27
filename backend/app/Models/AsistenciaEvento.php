<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AsistenciaEvento extends Model
{
    use HasFactory;

    protected $table = 'asistencia_evento';

    protected $fillable = [
        'evento_id',
        'discipulado_miembro_id',
        'estado_asistencia_id',
    ];

    public function evento(): BelongsTo
    {
        return $this->belongsTo(Evento::class);
    }

    public function discipuladoMiembro(): BelongsTo
    {
        return $this->belongsTo(DiscipuladoMiembro::class);
    }

    public function estadoAsistencia(): BelongsTo
    {
        return $this->belongsTo(EstadoAsistencia::class, 'estado_asistencia_id');
    }
}
