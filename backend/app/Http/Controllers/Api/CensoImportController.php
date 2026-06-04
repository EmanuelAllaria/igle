<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Imports\CensoMiembrosImport;
use App\Models\CensoImportRun;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Maatwebsite\Excel\Facades\Excel;

class CensoImportController extends Controller
{
    public function importar(Request $request)
    {
        $validated = $request->validate([
            'file' => ['required', 'file', 'max:20480', 'mimes:csv,txt,xlsx,xls'],
        ]);

        /** @var \Illuminate\Http\UploadedFile $file */
        $file = $validated['file'];

        $run = CensoImportRun::query()->create([
            'user_id' => $request->user()?->id,
            'original_filename' => $file->getClientOriginalName(),
            'status' => 'processing',
        ]);

        try {
            Excel::import(new CensoMiembrosImport($run->id), $file);
        } catch (\Throwable $e) {
            $run->fill(['status' => 'failed']);
            $run->save();

            throw ValidationException::withMessages([
                'file' => ['No se pudo procesar el archivo: '.$e->getMessage()],
            ]);
        }

        $run->refresh();

        return $this->ok($run, 'Importación finalizada.', 201);
    }

    public function logs(Request $request)
    {
        $perPage = (int) $request->query('per_page', 10);
        $perPage = max(1, min(50, $perPage));

        $runId = $request->query('run_id');

        if ($runId !== null) {
            $run = CensoImportRun::query()
                ->with(['errors' => fn ($q) => $q->orderBy('id')])
                ->findOrFail((int) $runId);

            return $this->ok($run);
        }

        $runs = CensoImportRun::query()
            ->orderByDesc('id')
            ->paginate($perPage);

        return $this->ok($runs);
    }
}

