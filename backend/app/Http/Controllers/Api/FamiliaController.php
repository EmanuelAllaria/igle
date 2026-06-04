<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FamiliaGenealogica;
use App\Models\Miembro;

class FamiliaController extends Controller
{
    public function index()
    {
        $familias = FamiliaGenealogica::query()
            ->with([
                'union.persona1:id,dni,nombre,apellido,tel_celular',
                'union.persona2:id,dni,nombre,apellido,tel_celular',
            ])
            ->orderByDesc('id')
            ->get();

        $allPersonaIds = $familias
            ->flatMap(fn ($f) => [$f->union?->persona1_id, $f->union?->persona2_id])
            ->filter()
            ->unique()
            ->values();

        $children = $allPersonaIds->isEmpty()
            ? collect()
            : Miembro::query()
                ->whereIn('padre_id', $allPersonaIds)
                ->orWhereIn('madre_id', $allPersonaIds)
                ->get(['id', 'dni', 'nombre', 'apellido', 'tel_celular', 'padre_id', 'madre_id']);

        $childrenByPair = $children->groupBy(function ($m) {
            if ($m->padre_id === null || $m->madre_id === null) {
                return 'null';
            }

            $a = (int) $m->padre_id;
            $b = (int) $m->madre_id;
            $min = min($a, $b);
            $max = max($a, $b);

            return $min.'|'.$max;
        });

        $groups = $familias->groupBy(function ($f) {
            $u = $f->union;
            if (!$u || $u->persona1_id === null || $u->persona2_id === null) {
                return 'FG-'.$f->id;
            }

            $a = (int) $u->persona1_id;
            $b = (int) $u->persona2_id;
            $min = min($a, $b);
            $max = max($a, $b);

            return $min.'|'.$max;
        });

        $result = $groups->values()->map(function ($group) use ($childrenByPair) {
            $f = $group->first();
            $u = $f?->union;
            $p1 = $u?->persona1;
            $p2 = $u?->persona2;

            $pairKey = null;
            if ($p1 && $p2) {
                $min = min((int) $p1->id, (int) $p2->id);
                $max = max((int) $p1->id, (int) $p2->id);
                $pairKey = $min.'|'.$max;
            }

            $a = null;
            $b = null;
            if ($p1 && $p2) {
                if ((int) $p1->id <= (int) $p2->id) {
                    $a = $p1;
                    $b = $p2;
                } else {
                    $a = $p2;
                    $b = $p1;
                }
            }

            $nombre = $this->buildFamiliaNombre($a?->apellido, $b?->apellido) ?? 'Familia';
            $key = $pairKey ? 'P-'.$pairKey : 'FG-'.$f->id;

            $hijos = $pairKey
                ? $childrenByPair->get($pairKey, collect())
                    ->sortBy(fn ($m) => mb_strtolower(trim((string) $m->apellido)).'|'.mb_strtolower(trim((string) $m->nombre)))
                    ->values()
                    ->map(fn ($m) => [
                        'id' => (int) $m->id,
                        'dni' => $m->dni,
                        'nombre' => $m->nombre,
                        'apellido' => $m->apellido,
                        'tel_celular' => $m->tel_celular,
                    ])
                    ->all()
                : [];

            $padre = $a ? [
                'id' => (int) $a->id,
                'dni' => $a->dni,
                'nombre' => $a->nombre,
                'apellido' => $a->apellido,
                'tel_celular' => $a->tel_celular,
            ] : null;

            $madre = $b ? [
                'id' => (int) $b->id,
                'dni' => $b->dni,
                'nombre' => $b->nombre,
                'apellido' => $b->apellido,
                'tel_celular' => $b->tel_celular,
            ] : null;

            return [
                'key' => $key,
                'nombre' => $nombre,
                'padre' => $padre,
                'madre' => $madre,
                'hijos' => $hijos,
                'hijos_count' => count($hijos),
                'integrantes_count' => count($hijos) + ($padre ? 1 : 0) + ($madre ? 1 : 0),
            ];
        })
            ->sortBy(fn ($f) => mb_strtolower((string) ($f['nombre'] ?? '')))
            ->values()
            ->all();

        return $this->ok($result);
    }

    private function buildFamiliaNombre(?string $apellido1, ?string $apellido2): ?string
    {
        $a1 = is_string($apellido1) ? trim($apellido1) : null;
        $a2 = is_string($apellido2) ? trim($apellido2) : null;

        $a1 = $a1 !== '' ? $a1 : null;
        $a2 = $a2 !== '' ? $a2 : null;

        if ($a1 === null && $a2 === null) {
            return null;
        }

        if ($a1 !== null && $a2 !== null) {
            if (mb_strtolower($a1) === mb_strtolower($a2)) {
                return 'Familia '.$a1;
            }

            return 'Familia '.$a1.' - '.$a2;
        }

        return 'Familia '.($a1 ?? $a2);
    }
}
