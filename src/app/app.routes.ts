import { Routes } from '@angular/router';

import { anonymousOnlyGuard, authGuard } from './core/auth/auth.guard';
import { Shell } from './core/layout/shell';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [anonymousOnlyGuard],
    title: 'Sign in · SunBloom',
    loadComponent: () => import('./features/auth/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    canActivate: [anonymousOnlyGuard],
    title: 'Create account · SunBloom',
    loadComponent: () => import('./features/auth/register.page').then((m) => m.RegisterPage),
  },
  {
    // Everything inside the shell requires a session.
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'skills' },
      {
        path: 'skills',
        loadChildren: () => import('./features/skills/skills.routes').then((m) => m.skillsRoutes),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
