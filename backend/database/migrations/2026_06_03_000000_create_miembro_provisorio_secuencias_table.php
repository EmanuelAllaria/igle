<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('miembro_provisorio_secuencias', function (Blueprint $table) {
            $table->unsignedTinyInteger('id')->primary();
            $table->unsignedInteger('ultimo_numero')->default(0);
            $table->timestamps();
            $table->softDeletes();
        });

        DB::table('miembro_provisorio_secuencias')->insert([
            'id' => 1,
            'ultimo_numero' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('miembro_provisorio_secuencias');
    }
};

