<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('uniones', function (Blueprint $table) {
            $table->dropForeign(['tipo_union_id']);
            $table->dropForeign(['estado_union_id']);
        });

        Schema::table('uniones', function (Blueprint $table) {
            $table->foreign('tipo_union_id')->references('id')->on('tipos_union')->cascadeOnDelete();
            $table->foreign('estado_union_id')->references('id')->on('estados_union')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('uniones', function (Blueprint $table) {
            $table->dropForeign(['tipo_union_id']);
            $table->dropForeign(['estado_union_id']);
        });

        Schema::table('uniones', function (Blueprint $table) {
            $table->foreign('tipo_union_id')->references('id')->on('tipos_union')->restrictOnDelete();
            $table->foreign('estado_union_id')->references('id')->on('estados_union')->restrictOnDelete();
        });
    }
};

