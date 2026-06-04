<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::table('grupo_ministerios')->count() === 0) {
            DB::table('grupo_ministerios')->insertOrIgnore([
                ['nombre' => 'General'],
                ['nombre' => 'Culto'],
                ['nombre' => 'Formación'],
            ]);
        }

        if (DB::table('roles_ministerio')->count() === 0) {
            DB::table('roles_ministerio')->insertOrIgnore([
                ['nombre' => 'Miembro'],
                ['nombre' => 'Líder'],
                ['nombre' => 'Coordinador'],
            ]);
        }
    }

    public function down(): void
    {
        DB::table('grupo_ministerios')->whereIn('nombre', ['General', 'Culto', 'Formación'])->delete();
        DB::table('roles_ministerio')->whereIn('nombre', ['Miembro', 'Líder', 'Coordinador'])->delete();
    }
};

