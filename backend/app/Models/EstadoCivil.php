<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EstadoCivil extends Model
{
    use HasFactory;

    protected $table = 'estados_civiles';

    protected $fillable = [
        'nombre',
    ];

    public function miembros(): HasMany
    {
        return $this->hasMany(Miembro::class, 'estadocivil_id');
    }
}
