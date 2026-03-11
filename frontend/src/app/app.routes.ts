import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards';

export const routes: Routes = [
  // Root redirect
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },

  // Auth routes (guest only)
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login.component').then((m) => m.LoginComponent),
        title: 'Login - AI QuizVerse',
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
        title: 'Register - AI QuizVerse',
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
    ],
  },

  // Authenticated routes (wrapped in Layout)
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/layout/layout.component').then((m) => m.LayoutComponent),
    children: [
      // Dashboard
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
        title: 'Dashboard - AI QuizVerse',
      },

      // Profile
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile.component').then((m) => m.ProfileComponent),
        title: 'My Profile - AI QuizVerse',
      },

      // Game lobby (with match ID)
      {
        path: 'game/:id',
        loadComponent: () =>
          import('./features/game/game-lobby/game-lobby.component').then((m) => m.GameLobbyComponent),
        title: 'Game - AI QuizVerse',
      },

    ],
  },

  // Wildcard - redirect to dashboard
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
