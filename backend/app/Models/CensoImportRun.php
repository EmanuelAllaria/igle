<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class CensoImportRun extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'original_filename',
        'status',
        'processed_count',
        'created_count',
        'updated_count',
        'error_count',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function errors(): HasMany
    {
        return $this->hasMany(CensoImportError::class, 'run_id');
    }
}

