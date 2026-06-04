<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('familias_genealogicas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('union_id')->unique()->constrained('uniones')->cascadeOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        $unionIds = DB::table('uniones')->orderBy('id')->pluck('id');

        foreach ($unionIds as $unionId) {
            DB::table('familias_genealogicas')->insert([
                'union_id' => $unionId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('familias_genealogicas');
    }
};
