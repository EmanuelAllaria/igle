<?php

namespace App\Console\Commands;

use App\Services\PastoralAlarmasService;
use Illuminate\Console\Command;

class RefreshPastoralAlarmas extends Command
{
    protected $signature = 'pastoral:alarmas-refresh';
    protected $description = 'Recalcula y cachea las alarmas pastorales del dashboard (ALM-01, ALM-02/03).';

    public function handle(PastoralAlarmasService $service): int
    {
        $data = $service->refresh();

        $pastor = $data['by_role']['pastor'] ?? [];
        $secretaria = $data['by_role']['secretaria'] ?? [];

        $this->info('Alarmas refrescadas.');
        $this->line('Pastor: '.count($pastor).' categorías');
        $this->line('Secretaría: '.count($secretaria).' categorías');
        $this->line('generated_at: '.($data['generated_at'] ?? '-'));

        return self::SUCCESS;
    }
}

