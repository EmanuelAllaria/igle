<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('censo_import_errors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('run_id')->constrained('censo_import_runs')->cascadeOnDelete();
            $table->unsignedInteger('row_number')->nullable();
            $table->string('dni', 40)->nullable();
            $table->string('field', 80)->nullable();
            $table->string('message', 500);
            $table->json('raw')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['run_id', 'row_number']);
            $table->index(['dni']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('censo_import_errors');
    }
};

