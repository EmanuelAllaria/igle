<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GrupoMiembro extends Model
{
    use HasFactory;

    protected $fillable = [
        'nombre',
    ];

    public function discipulados(): HasMany
    {
        return $this->hasMany(Discipulado::class);
    }
}
