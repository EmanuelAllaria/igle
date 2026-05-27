<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        DB::table('sexos')->insertOrIgnore([
            ['nombre' => 'Masculino', 'created_at' => $now, 'updated_at' => $now],
            ['nombre' => 'Femenino', 'created_at' => $now, 'updated_at' => $now],
        ]);

        DB::table('estados_civiles')->insertOrIgnore([
            ['nombre' => 'Soltero/a', 'created_at' => $now, 'updated_at' => $now],
            ['nombre' => 'Casado/a', 'created_at' => $now, 'updated_at' => $now],
            ['nombre' => 'Divorciado/a', 'created_at' => $now, 'updated_at' => $now],
            ['nombre' => 'Viudo/a', 'created_at' => $now, 'updated_at' => $now],
        ]);

        DB::table('bautizados')->insertOrIgnore([
            ['nombre' => 'Si', 'created_at' => $now, 'updated_at' => $now],
            ['nombre' => 'No', 'created_at' => $now, 'updated_at' => $now],
        ]);

        $current = (int) date('Y');
        $years = [];
        for ($y = $current - 2; $y <= $current + 2; $y++) {
            $years[] = ['anio' => $y, 'created_at' => $now, 'updated_at' => $now];
        }
        DB::table('anios')->insertOrIgnore($years);

        DB::table('grupo_miembros')->insertOrIgnore([
            ['nombre' => 'General', 'created_at' => $now, 'updated_at' => $now],
            ['nombre' => 'Jovenes', 'created_at' => $now, 'updated_at' => $now],
            ['nombre' => 'Adultos', 'created_at' => $now, 'updated_at' => $now],
        ]);
    }

    public function down(): void
    {
        DB::table('sexos')->whereIn('nombre', ['Masculino', 'Femenino'])->delete();
        DB::table('estados_civiles')->whereIn('nombre', ['Soltero/a', 'Casado/a', 'Divorciado/a', 'Viudo/a'])->delete();
        DB::table('bautizados')->whereIn('nombre', ['Si', 'No'])->delete();

        $current = (int) date('Y');
        DB::table('anios')->whereBetween('anio', [$current - 2, $current + 2])->delete();
        DB::table('grupo_miembros')->whereIn('nombre', ['General', 'Jovenes', 'Adultos'])->delete();
    }
};

