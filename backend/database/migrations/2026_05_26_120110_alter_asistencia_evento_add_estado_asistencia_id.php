<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('asistencia_evento', function (Blueprint $table) {
            $table->foreignId('estado_asistencia_id')
                ->nullable()
                ->constrained('estados_asistencia')
                ->cascadeOnDelete();
        });

        $presenteId = DB::table('estados_asistencia')->where('nombre_corto', 'presente')->value('id');
        $ausenteId = DB::table('estados_asistencia')->where('nombre_corto', 'ausente')->value('id');
        $justificadoId = DB::table('estados_asistencia')->where('nombre_corto', 'justificado')->value('id');

        if ($presenteId) {
            DB::table('asistencia_evento')->where('estado', 'presente')->update(['estado_asistencia_id' => $presenteId]);
            DB::table('asistencia_evento')->whereNull('estado_asistencia_id')->update(['estado_asistencia_id' => $presenteId]);
        }
        if ($ausenteId) {
            DB::table('asistencia_evento')->where('estado', 'ausente')->update(['estado_asistencia_id' => $ausenteId]);
        }
        if ($justificadoId) {
            DB::table('asistencia_evento')->where('estado', 'justificado')->update(['estado_asistencia_id' => $justificadoId]);
        }

        Schema::table('asistencia_evento', function (Blueprint $table) {
            $table->dropColumn('estado');
        });

        DB::statement('ALTER TABLE asistencia_evento ALTER COLUMN estado_asistencia_id SET NOT NULL');
    }

    public function down(): void
    {
        Schema::table('asistencia_evento', function (Blueprint $table) {
            $table->string('estado', 30)->nullable();
        });

        $rows = DB::table('estados_asistencia')->select(['id', 'nombre_corto'])->get();
        $map = [];
        foreach ($rows as $r) {
            $map[(int) $r->id] = (string) $r->nombre_corto;
        }

        $items = DB::table('asistencia_evento')->select(['id', 'estado_asistencia_id'])->get();
        foreach ($items as $it) {
            $id = (int) $it->id;
            $eid = (int) $it->estado_asistencia_id;
            $estado = $map[$eid] ?? 'presente';
            DB::table('asistencia_evento')->where('id', $id)->update(['estado' => $estado]);
        }

        Schema::table('asistencia_evento', function (Blueprint $table) {
            $table->dropForeign(['estado_asistencia_id']);
            $table->dropColumn('estado_asistencia_id');
        });
    }
};
