<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('miembros', function (Blueprint $table) {
            if (!Schema::hasColumn('miembros', 'dni')) {
                $table->string('dni', 30)->nullable()->unique()->after('tel_celular');
            }

            if (!Schema::hasColumn('miembros', 'familia_nombre')) {
                $table->string('familia_nombre', 255)->nullable()->after('apellido');
            }

            if (!Schema::hasColumn('miembros', 'deleted_at')) {
                $table->softDeletes();
            }
        });

        if (Schema::hasColumn('miembros', 'dni') && Schema::hasColumn('miembros', 'nro_doc')) {
            DB::table('miembros')
                ->whereNull('dni')
                ->whereNotNull('nro_doc')
                ->update(['dni' => DB::raw('nro_doc')]);
        }

        $ids = DB::table('miembros')
            ->whereNull('dni')
            ->orderBy('id')
            ->pluck('id');

        foreach ($ids as $id) {
            $next = DB::transaction(function () {
                $row = DB::table('miembro_provisorio_secuencias')
                    ->where('id', 1)
                    ->lockForUpdate()
                    ->first();

                $ultimo = (int) ($row?->ultimo_numero ?? 0);
                $siguiente = $ultimo + 1;

                DB::table('miembro_provisorio_secuencias')
                    ->where('id', 1)
                    ->update([
                        'ultimo_numero' => $siguiente,
                        'updated_at' => now(),
                    ]);

                return $siguiente;
            });

            DB::table('miembros')
                ->where('id', $id)
                ->update([
                    'dni' => sprintf('PROV-%05d', $next),
                    'updated_at' => now(),
                ]);
        }
    }

    public function down(): void
    {
        Schema::table('miembros', function (Blueprint $table) {
            if (Schema::hasColumn('miembros', 'dni')) {
                $table->dropUnique(['dni']);
                $table->dropColumn('dni');
            }

            if (Schema::hasColumn('miembros', 'familia_nombre')) {
                $table->dropColumn('familia_nombre');
            }

            if (Schema::hasColumn('miembros', 'deleted_at')) {
                $table->dropSoftDeletes();
            }
        });
    }
};

