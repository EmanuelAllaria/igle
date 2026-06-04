<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('miembros', function (Blueprint $table) {
            if (!Schema::hasColumn('miembros', 'vivienda_id')) {
                $table->foreignId('vivienda_id')->nullable()->after('direccion')->constrained('viviendas')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('miembros', function (Blueprint $table) {
            if (Schema::hasColumn('miembros', 'vivienda_id')) {
                $table->dropConstrainedForeignId('vivienda_id');
            }
        });
    }
};

