<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('respuesta_formularios', function (Blueprint $table) {
            $table->timestampTz('created_at')->nullable();
        });

        DB::statement('UPDATE respuesta_formularios SET created_at = NOW() WHERE created_at IS NULL');
        DB::statement('ALTER TABLE respuesta_formularios ALTER COLUMN created_at SET DEFAULT NOW()');
        DB::statement('ALTER TABLE respuesta_formularios ALTER COLUMN created_at SET NOT NULL');
    }

    public function down(): void
    {
        Schema::table('respuesta_formularios', function (Blueprint $table) {
            $table->dropColumn('created_at');
        });
    }
};

