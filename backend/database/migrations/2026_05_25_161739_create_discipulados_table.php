<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('discipulados', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 120);
            $table->foreignId('anio_id')->constrained('anios')->restrictOnDelete();
            $table->foreignId('grupo_miembro_id')->constrained('grupo_miembros')->restrictOnDelete();
            $table->timestamps();

            $table->unique(['nombre', 'anio_id', 'grupo_miembro_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('discipulados');
    }
};

