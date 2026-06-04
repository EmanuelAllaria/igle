<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class FamiliaGenealogica extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'familias_genealogicas';

    protected $fillable = [
        'union_id',
    ];

    public function union(): BelongsTo
    {
        return $this->belongsTo(Union::class, 'union_id');
    }
}

