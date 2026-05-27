<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ministerio_miembro', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ministerio_id')->constrained('ministerios')->cascadeOnDelete();
            $table->foreignId('miembro_id')->constrained('miembros')->cascadeOnDelete();
            $table->foreignId('rol_ministerio_id')->constrained('roles_ministerio')->cascadeOnDelete();

            $table->unique(['ministerio_id', 'miembro_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ministerio_miembro');
    }
};

