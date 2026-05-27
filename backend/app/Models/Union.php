<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Union extends Model
{
    use HasFactory;

    protected $table = 'uniones';

    protected $fillable = [
        'persona1_id',
        'persona2_id',
        'tipo_union_id',
        'estado_union_id',
    ];

    public function persona1(): BelongsTo
    {
        return $this->belongsTo(Miembro::class, 'persona1_id');
    }

    public function persona2(): BelongsTo
    {
        return $this->belongsTo(Miembro::class, 'persona2_id');
    }

    public function tipoUnion(): BelongsTo
    {
        return $this->belongsTo(TipoUnion::class, 'tipo_union_id');
    }

    public function estadoUnion(): BelongsTo
    {
        return $this->belongsTo(EstadoUnion::class, 'estado_union_id');
    }
}
