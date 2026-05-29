<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $adminRole = Role::query()->firstOrCreate(
            ['slug' => 'admin'],
            ['nombre' => 'Admin'],
        );

        $adminUser = User::query()->updateOrCreate(
            ['email' => 'test@gmail.com'],
            [
                'name' => 'Admin',
                'password' => 'admin123',
            ],
        );

        $adminUser->roles()->syncWithoutDetaching([$adminRole->id]);
    }
}
