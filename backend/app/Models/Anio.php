<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Anio extends Model
{
    use HasFactory;

    protected $fillable = [
        'anio',
    ];

    protected function casts(): array
    {
        return [
            'anio' => 'integer',
        ];
    }

    public function discipulados(): HasMany
    {
        return $this->hasMany(Discipulado::class);
    }
}
