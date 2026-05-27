<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TipoUnion extends Model
{
    use HasFactory;

    protected $table = 'tipos_union';

    protected $fillable = [
        'nombre',
    ];

    public function uniones(): HasMany
    {
        return $this->hasMany(Union::class, 'tipo_union_id');
    }
}
