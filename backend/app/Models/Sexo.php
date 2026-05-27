<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sexo extends Model
{
    use HasFactory;

    protected $fillable = [
        'nombre',
    ];

    public function miembros(): HasMany
    {
        return $this->hasMany(Miembro::class);
    }
}
