<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('respuesta_formularios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('formulario_id')->constrained('formularios')->cascadeOnDelete();
            $table->foreignId('miembro_id')->nullable()->constrained('miembros')->nullOnDelete();
            $table->jsonb('json_data');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('respuesta_formularios');
    }
};

