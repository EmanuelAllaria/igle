<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        DB::table('tipos_union')->insertOrIgnore([
            ['nombre' => 'Matrimonio', 'created_at' => $now, 'updated_at' => $now],
            ['nombre' => 'Hermano/a', 'created_at' => $now, 'updated_at' => $now],
            ['nombre' => 'Tío/a', 'created_at' => $now, 'updated_at' => $now],
            ['nombre' => 'Primo/a', 'created_at' => $now, 'updated_at' => $now],
            ['nombre' => 'Sobrino/a', 'created_at' => $now, 'updated_at' => $now],
        ]);

        DB::table('estados_union')->insertOrIgnore([
            ['nombre' => 'Activa', 'created_at' => $now, 'updated_at' => $now],
            ['nombre' => 'Viudo/a', 'created_at' => $now, 'updated_at' => $now],
            ['nombre' => 'Divorciado/a', 'created_at' => $now, 'updated_at' => $now],
        ]);

        DB::table('roles_discipulado')->insertOrIgnore([
            ['nombre' => 'Miembro', 'created_at' => $now, 'updated_at' => $now],
            ['nombre' => 'Líder', 'created_at' => $now, 'updated_at' => $now],
        ]);
    }

    public function down(): void
    {
        DB::table('tipos_union')->whereIn('nombre', ['Matrimonio', 'Hermano/a', 'Tío/a', 'Primo/a', 'Sobrino/a'])->delete();
        DB::table('estados_union')->whereIn('nombre', ['Activa', 'Viudo/a', 'Divorciado/a'])->delete();
        DB::table('roles_discipulado')->whereIn('nombre', ['Miembro', 'Líder'])->delete();
    }
};

