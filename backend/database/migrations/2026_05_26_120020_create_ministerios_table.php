<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ministerios', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 120);
            $table->foreignId('grupo_ministerio_id')->constrained('grupo_ministerios')->cascadeOnDelete();

            $table->unique(['nombre', 'grupo_ministerio_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ministerios');
    }
};

