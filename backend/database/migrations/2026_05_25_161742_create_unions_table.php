<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('uniones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('persona1_id')->constrained('miembros')->cascadeOnDelete();
            $table->foreignId('persona2_id')->constrained('miembros')->cascadeOnDelete();
            $table->foreignId('tipo_union_id')->constrained('tipos_union')->restrictOnDelete();
            $table->foreignId('estado_union_id')->constrained('estados_union')->restrictOnDelete();
            $table->timestamps();

            $table->unique(['persona1_id', 'persona2_id', 'tipo_union_id']);
        });

        DB::statement('ALTER TABLE uniones ADD CONSTRAINT uniones_personas_distintas_check CHECK (persona1_id <> persona2_id)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('uniones');
    }
};
