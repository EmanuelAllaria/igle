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
        Schema::create('discipulado_miembro', function (Blueprint $table) {
            $table->id();
            $table->foreignId('discipulado_id')->constrained('discipulados')->cascadeOnDelete();
            $table->foreignId('miembro_id')->constrained('miembros')->cascadeOnDelete();
            $table->foreignId('roldiscipulado_id')->constrained('roles_discipulado')->restrictOnDelete();
            $table->timestamps();

            $table->unique(['discipulado_id', 'miembro_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('discipulado_miembro');
    }
};
