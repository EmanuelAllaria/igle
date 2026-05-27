<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Miembro extends Model
{
    use HasFactory;

    protected $fillable = [
        'nombre',
        'apellido',
        'profesion',
        'fecha_nac',
        'email',
        'tel_celular',
        'nro_doc',
        'direccion',
        'anio_ingreso',
        'sexo_id',
        'estadocivil_id',
        'bautizado_id',
        'padre_id',
        'madre_id',
    ];

    protected function casts(): array
    {
        return [
            'fecha_nac' => 'date',
            'anio_ingreso' => 'integer',
        ];
    }

    public function sexo(): BelongsTo
    {
        return $this->belongsTo(Sexo::class);
    }

    public function estadoCivil(): BelongsTo
    {
        return $this->belongsTo(EstadoCivil::class, 'estadocivil_id');
    }

    public function bautizado(): BelongsTo
    {
        return $this->belongsTo(Bautizado::class);
    }

    public function padre(): BelongsTo
    {
        return $this->belongsTo(self::class, 'padre_id');
    }

    public function madre(): BelongsTo
    {
        return $this->belongsTo(self::class, 'madre_id');
    }

    public function hijosPorPadre(): HasMany
    {
        return $this->hasMany(self::class, 'padre_id');
    }

    public function hijosPorMadre(): HasMany
    {
        return $this->hasMany(self::class, 'madre_id');
    }

    public function discipulados(): BelongsToMany
    {
        return $this->belongsToMany(Discipulado::class, 'discipulado_miembro')
            ->withPivot(['id', 'roldiscipulado_id'])
            ->withTimestamps();
    }

    public function discipuladoMiembros(): HasMany
    {
        return $this->hasMany(DiscipuladoMiembro::class);
    }

    public function ministerios(): BelongsToMany
    {
        return $this->belongsToMany(Ministerio::class, 'ministerio_miembro')
            ->withPivot(['id', 'rol_ministerio_id']);
    }

    public function ministerioMiembros(): HasMany
    {
        return $this->hasMany(MinisterioMiembro::class);
    }

    public function unionesComoPersona1(): HasMany
    {
        return $this->hasMany(Union::class, 'persona1_id');
    }

    public function unionesComoPersona2(): HasMany
    {
        return $this->hasMany(Union::class, 'persona2_id');
    }
}
