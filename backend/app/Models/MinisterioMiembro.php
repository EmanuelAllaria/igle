<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MinisterioMiembro extends Model
{
    public $timestamps = false;

    protected $table = 'ministerio_miembro';

    protected $fillable = [
        'ministerio_id',
        'miembro_id',
        'rol_ministerio_id',
    ];

    public function ministerio(): BelongsTo
    {
        return $this->belongsTo(Ministerio::class, 'ministerio_id');
    }

    public function miembro(): BelongsTo
    {
        return $this->belongsTo(Miembro::class, 'miembro_id');
    }

    public function rolMinisterio(): BelongsTo
    {
        return $this->belongsTo(RolMinisterio::class, 'rol_ministerio_id');
    }
}

