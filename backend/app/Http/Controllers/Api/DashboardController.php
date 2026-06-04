<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PastoralAlarmasService;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function alarmas(Request $request, PastoralAlarmasService $service)
    {
        $user = $request->user()?->loadMissing(['roles']);
        $roleSlugs = $user?->roles?->pluck('slug')->filter()->values()->all() ?? [];

        $data = $service->getOrCompute();

        return $this->ok([
            'generated_at' => $data['generated_at'] ?? null,
            'viewer' => [
                'role_slugs' => $roleSlugs,
                'is_pastor' => in_array('pastor', $roleSlugs, true) || in_array('admin', $roleSlugs, true),
                'is_secretaria' => in_array('secretaria', $roleSlugs, true) || in_array('secretary', $roleSlugs, true),
            ],
            'by_role' => $data['by_role'] ?? [],
        ]);
    }
}
