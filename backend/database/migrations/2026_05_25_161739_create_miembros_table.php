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
        Schema::create('miembros', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 120);
            $table->string('apellido', 120);
            $table->string('profesion', 120)->nullable();
            $table->date('fecha_nac')->nullable();
            $table->string('email', 150)->nullable()->unique();
            $table->string('tel_celular', 30)->nullable();
            $table->string('nro_doc', 30)->nullable()->unique();
            $table->string('direccion', 255)->nullable();
            $table->unsignedSmallInteger('anio_ingreso')->nullable();

            $table->foreignId('sexo_id')->nullable()->constrained('sexos')->restrictOnDelete();
            $table->foreignId('estadocivil_id')->nullable()->constrained('estados_civiles')->restrictOnDelete();
            $table->foreignId('bautizado_id')->nullable()->constrained('bautizados')->restrictOnDelete();

            $table->foreignId('padre_id')->nullable()->constrained('miembros')->nullOnDelete();
            $table->foreignId('madre_id')->nullable()->constrained('miembros')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('miembros');
    }
};
