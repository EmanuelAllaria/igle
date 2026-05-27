<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(LoginRequest $request)
    {
        $validated = $request->validated();

        $user = User::query()->where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return $this->fail('Credenciales inválidas.', null, 401);
        }

        $token = $user->createToken($validated['device_name'] ?? 'api')->plainTextToken;

        return $this->ok([
            'token' => $token,
            'user' => $user->load(['roles', 'permissions']),
        ]);
    }

    public function me(Request $request)
    {
        return $this->ok($request->user()?->load(['roles', 'permissions']));
    }

    public function logout(Request $request)
    {
        $request->user()?->currentAccessToken()?->delete();

        return $this->ok(null, 'Sesión cerrada.');
    }
}

