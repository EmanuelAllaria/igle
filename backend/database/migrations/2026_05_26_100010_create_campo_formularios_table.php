<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campo_formularios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('formulario_id')->constrained('formularios')->cascadeOnDelete();
            $table->string('label', 150);
            $table->string('tipo', 20);
            $table->boolean('es_requerido');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campo_formularios');
    }
};

