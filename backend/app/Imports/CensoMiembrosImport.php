<?php

namespace App\Imports;

use App\Models\CensoImportError;
use App\Models\CensoImportRun;
use App\Models\Miembro;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class CensoMiembrosImport implements ToCollection, WithHeadingRow
{
    public function __construct(private readonly int $runId)
    {
    }

    public function collection(Collection $rows)
    {
        $run = CensoImportRun::query()->findOrFail($this->runId);

        $processed = 0;
        $created = 0;
        $updated = 0;
        $errors = 0;

        foreach ($rows as $idx => $row) {
            $processed++;

            $raw = is_array($row) ? $row : (method_exists($row, 'toArray') ? $row->toArray() : []);
            $normalized = $this->normalizeRow($raw);

            $dni = $this->pick($normalized, ['dni', 'nro_doc', 'documento', 'documento_numero', 'doc', 'dni_numero']);
            $dni = is_string($dni) ? trim($dni) : '';

            if ($dni === '') {
                $errors++;
                CensoImportError::query()->create([
                    'run_id' => $run->id,
                    'row_number' => $this->rowNumberFromIndex($idx),
                    'dni' => null,
                    'field' => 'dni',
                    'message' => 'Falta DNI. No se puede importar la fila.',
                    'raw' => $raw,
                ]);
                continue;
            }

            try {
                $payload = $this->buildMiembroPayload($normalized);

                $existing = Miembro::query()
                    ->where('dni', $dni)
                    ->orWhere('nro_doc', $dni)
                    ->first();

                if ($existing) {
                    $existing->fill($payload);
                    $existing->save();
                    $updated++;
                } else {
                    $payload['dni'] = $dni;
                    if (!array_key_exists('nombre', $payload) || trim((string) ($payload['nombre'] ?? '')) === '') {
                        $payload['nombre'] = 'Pendiente';
                        $errors++;
                        CensoImportError::query()->create([
                            'run_id' => $run->id,
                            'row_number' => $this->rowNumberFromIndex($idx),
                            'dni' => $dni,
                            'field' => 'nombre',
                            'message' => 'Falta nombre. Se creó como placeholder.',
                            'raw' => $raw,
                        ]);
                    }
                    if (!array_key_exists('apellido', $payload) || trim((string) ($payload['apellido'] ?? '')) === '') {
                        $payload['apellido'] = 'Sin datos';
                        $errors++;
                        CensoImportError::query()->create([
                            'run_id' => $run->id,
                            'row_number' => $this->rowNumberFromIndex($idx),
                            'dni' => $dni,
                            'field' => 'apellido',
                            'message' => 'Falta apellido. Se creó como placeholder.',
                            'raw' => $raw,
                        ]);
                    }

                    Miembro::query()->create($payload);
                    $created++;
                }
            } catch (\Throwable $e) {
                $errors++;
                CensoImportError::query()->create([
                    'run_id' => $run->id,
                    'row_number' => $this->rowNumberFromIndex($idx),
                    'dni' => $dni,
                    'field' => null,
                    'message' => 'Error inesperado: '.$e->getMessage(),
                    'raw' => $raw,
                ]);
            }
        }

        $run->fill([
            'status' => 'done',
            'processed_count' => $processed,
            'created_count' => $created,
            'updated_count' => $updated,
            'error_count' => $errors,
        ]);
        $run->save();
    }

    private function buildMiembroPayload(array $row): array
    {
        $payload = [];

        $nombre = $this->pick($row, ['nombre', 'nombres']);
        if (is_string($nombre) && trim($nombre) !== '') $payload['nombre'] = trim($nombre);

        $apellido = $this->pick($row, ['apellido', 'apellidos']);
        if (is_string($apellido) && trim($apellido) !== '') $payload['apellido'] = trim($apellido);

        $email = $this->pick($row, ['email', 'mail', 'correo']);
        if (is_string($email) && trim($email) !== '') {
            $email = trim($email);
            if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $payload['email'] = $email;
            }
        }

        $cel = $this->pick($row, ['tel_celular', 'celular', 'telefono', 'tel']);
        if (is_string($cel) && trim($cel) !== '') $payload['tel_celular'] = trim($cel);

        $direccion = $this->pick($row, ['direccion', 'domicilio']);
        if (is_string($direccion) && trim($direccion) !== '') $payload['direccion'] = trim($direccion);

        $anioIngreso = $this->pick($row, ['anio_ingreso', 'año_ingreso', 'anio']);
        if (is_numeric($anioIngreso)) {
            $payload['anio_ingreso'] = (int) $anioIngreso;
        } elseif (is_string($anioIngreso) && trim($anioIngreso) !== '' && ctype_digit(trim($anioIngreso))) {
            $payload['anio_ingreso'] = (int) trim($anioIngreso);
        }

        $fechaNac = $this->pick($row, ['fecha_nac', 'fecha_nacimiento', 'nacimiento']);
        $parsed = $this->parseDate($fechaNac);
        if ($parsed) $payload['fecha_nac'] = $parsed;

        return $payload;
    }

    private function parseDate($value): ?string
    {
        if ($value === null) return null;
        if ($value instanceof \DateTimeInterface) {
            return Carbon::instance($value)->toDateString();
        }
        if (is_numeric($value)) {
            try {
                return Carbon::instance(ExcelDate::excelToDateTimeObject((float) $value))->toDateString();
            } catch (\Throwable) {
                return null;
            }
        }
        if (is_string($value)) {
            $v = trim($value);
            if ($v === '') return null;
            try {
                return Carbon::parse($v)->toDateString();
            } catch (\Throwable) {
                return null;
            }
        }
        return null;
    }

    private function normalizeRow(array $row): array
    {
        $out = [];
        foreach ($row as $k => $v) {
            $key = is_string($k) ? $k : (string) $k;
            $key = Str::of($key)->lower()->replace([' ', '-', '.'], '_')->__toString();
            $out[$key] = $v;
        }
        return $out;
    }

    private function pick(array $row, array $keys)
    {
        foreach ($keys as $k) {
            if (array_key_exists($k, $row) && $row[$k] !== null && $row[$k] !== '') {
                return $row[$k];
            }
        }
        return null;
    }

    private function rowNumberFromIndex(int $idx): int
    {
        return $idx + 2;
    }
}
