<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class CensoImportError extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'run_id',
        'row_number',
        'dni',
        'field',
        'message',
        'raw',
    ];

    protected function casts(): array
    {
        return [
            'raw' => 'array',
            'row_number' => 'integer',
        ];
    }

    public function run(): BelongsTo
    {
        return $this->belongsTo(CensoImportRun::class, 'run_id');
    }
}

