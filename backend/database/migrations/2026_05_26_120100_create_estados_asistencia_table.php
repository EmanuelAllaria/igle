<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('estados_asistencia', function (Blueprint $table) {
            $table->id();
            $table->string('nombre_corto', 30)->unique();
            $table->string('nombre_largo', 80);
        });

        DB::table('estados_asistencia')->insert([
            ['nombre_corto' => 'presente', 'nombre_largo' => 'Presente'],
            ['nombre_corto' => 'ausente', 'nombre_largo' => 'Ausente'],
            ['nombre_corto' => 'justificado', 'nombre_largo' => 'Justificado'],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('estados_asistencia');
    }
};

