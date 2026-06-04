<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;

class Miembro extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $appends = [
        'uniones',
    ];

    protected $fillable = [
        'nombre',
        'apellido',
        'dni',
        'profesion',
        'fecha_nac',
        'email',
        'tel_celular',
        'nro_doc',
        'direccion',
        'vivienda_id',
        'anio_ingreso',
        'sexo_id',
        'estadocivil_id',
        'bautizado_id',
        'padre_id',
        'madre_id',
        'familia_nombre',
    ];

    protected function casts(): array
    {
        return [
            'fecha_nac' => 'date',
            'anio_ingreso' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (self $miembro) {
            $dni = $miembro->dni ?? $miembro->nro_doc;

            if (is_string($dni)) {
                $dni = trim($dni);
            }

            if ($dni === null || $dni === '') {
                $dni = self::generateProvisionalDni();
            }

            $miembro->dni = $dni;

            if (!isset($miembro->attributes['nro_doc']) || $miembro->attributes['nro_doc'] === null) {
                $miembro->nro_doc = $dni;
            }
        });
    }

    public function getRouteKeyName(): string
    {
        return 'dni';
    }

    public function resolveRouteBinding($value, $field = null)
    {
        $query = static::query();

        if ($field !== null) {
            return $query->where($field, $value)->first();
        }

        if (is_string($value) && ctype_digit($value)) {
            return $query->where('id', (int) $value)->first();
        }

        return $query->where('dni', $value)->first();
    }

    public function resolveRouteBindingOrFail($value, $field = null)
    {
        $model = $this->resolveRouteBinding($value, $field);

        if ($model !== null) {
            return $model;
        }

        throw (new ModelNotFoundException())->setModel(static::class, [$value]);
    }

    public function setDniAttribute($value): void
    {
        $this->attributes['dni'] = $value;

        if (!array_key_exists('nro_doc', $this->attributes) || $this->attributes['nro_doc'] === null) {
            $this->attributes['nro_doc'] = $value;
        }
    }

    public static function generateProvisionalDni(): string
    {
        $next = DB::transaction(function () {
            $row = DB::table('miembro_provisorio_secuencias')
                ->where('id', 1)
                ->lockForUpdate()
                ->first();

            $ultimo = (int) ($row?->ultimo_numero ?? 0);
            $siguiente = $ultimo + 1;

            DB::table('miembro_provisorio_secuencias')
                ->where('id', 1)
                ->update([
                    'ultimo_numero' => $siguiente,
                    'updated_at' => now(),
                ]);

            return $siguiente;
        });

        return sprintf('PROV-%05d', $next);
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

    public function vivienda(): BelongsTo
    {
        return $this->belongsTo(Vivienda::class, 'vivienda_id');
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

    public function getUnionesAttribute()
    {
        $a = $this->relationLoaded('unionesComoPersona1') ? $this->getRelation('unionesComoPersona1') : collect();
        $b = $this->relationLoaded('unionesComoPersona2') ? $this->getRelation('unionesComoPersona2') : collect();

        return $a
            ->concat($b)
            ->unique('id')
            ->values();
    }
}
