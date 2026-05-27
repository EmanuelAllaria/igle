<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EstadoUnion extends Model
{
    use HasFactory;

    protected $table = 'estados_union';

    protected $fillable = [
        'nombre',
    ];

    public function uniones(): HasMany
    {
        return $this->hasMany(Union::class, 'estado_union_id');
    }
}
