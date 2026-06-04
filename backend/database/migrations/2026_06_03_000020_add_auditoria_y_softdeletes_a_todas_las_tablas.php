<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach ($this->tables() as $tableName) {
            if (!Schema::hasTable($tableName)) {
                continue;
            }

            $this->ensureAuditColumns($tableName);
        }
    }

    public function down(): void
    {
        foreach ($this->tables() as $tableName) {
            if (!Schema::hasTable($tableName)) {
                continue;
            }

            Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                if (Schema::hasColumn($tableName, 'deleted_at')) {
                    $table->dropSoftDeletes();
                }
            });
        }
    }

    private function ensureAuditColumns(string $tableName): void
    {
        Schema::table($tableName, function (Blueprint $table) use ($tableName) {
            $hasCreatedAt = Schema::hasColumn($tableName, 'created_at');
            $hasUpdatedAt = Schema::hasColumn($tableName, 'updated_at');

            if (!$hasCreatedAt && !$hasUpdatedAt) {
                $table->timestamps();
            } elseif (!$hasCreatedAt) {
                $table->timestamp('created_at')->nullable();
            } elseif (!$hasUpdatedAt) {
                $table->timestamp('updated_at')->nullable();
            }

            if (!Schema::hasColumn($tableName, 'deleted_at')) {
                $table->softDeletes();
            }
        });
    }

    /**
     * @return array<int, string>
     */
    private function tables(): array
    {
        return [
            'users',
            'password_reset_tokens',
            'sessions',
            'cache',
            'cache_locks',
            'jobs',
            'job_batches',
            'failed_jobs',
            'personal_access_tokens',

            'sexos',
            'estados_civiles',
            'anios',
            'bautizados',
            'grupo_miembros',
            'roles_discipulado',
            'tipos_union',
            'estados_union',
            'discipulados',
            'miembros',
            'discipulado_miembro',
            'eventos',
            'asistencia_eventos',
            'uniones',

            'roles',
            'permissions',
            'permission_role',
            'role_user',
            'permission_user',

            'formularios',
            'campo_formularios',
            'respuesta_formularios',

            'grupo_ministerios',
            'roles_ministerio',
            'ministerios',
            'ministerio_miembro',

            'estados_asistencia',
            'miembro_provisorio_secuencias',
        ];
    }
};
