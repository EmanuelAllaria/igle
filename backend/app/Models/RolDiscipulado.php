<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RolDiscipulado extends Model
{
    use HasFactory;

    protected $table = 'roles_discipulado';

    protected $fillable = [
        'nombre',
    ];

    public function discipuladoMiembros(): HasMany
    {
        return $this->hasMany(DiscipuladoMiembro::class, 'roldiscipulado_id');
    }
}
