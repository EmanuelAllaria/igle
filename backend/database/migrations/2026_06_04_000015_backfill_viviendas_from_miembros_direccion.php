<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $direcciones = DB::table('miembros')
            ->whereNotNull('direccion')
            ->where('direccion', '<>', '')
            ->select('direccion')
            ->distinct()
            ->orderBy('direccion')
            ->pluck('direccion');

        $map = [];

        foreach ($direcciones as $direccion) {
            $id = DB::table('viviendas')->insertGetId([
                'direccion' => $direccion,
                'referencia' => null,
                'telefono_fijo' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $map[$direccion] = $id;
        }

        foreach ($map as $direccion => $viviendaId) {
            DB::table('miembros')
                ->whereNull('vivienda_id')
                ->where('direccion', $direccion)
                ->update([
                    'vivienda_id' => $viviendaId,
                    'updated_at' => now(),
                ]);
        }
    }

    public function down(): void
    {
    }
};

