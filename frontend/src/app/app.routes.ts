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

  // Dashboard (protected)
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    title: 'Dashboard - AI QuizVerse',
  },

  // Profile routes (protected)
  {
    path: 'profile',
    canActivate: [authGuard],
    children: [
      {
        path: '2fa',
        loadComponent: () =>
          import('./features/auth/two-fa-setup/two-fa-setup.component').then(
            (m) => m.TwoFASetupComponent,
          ),
        title: '2FA Setup - AI QuizVerse',
      },
      {
        path: '',
        redirectTo: '2fa',
        pathMatch: 'full',
      },
    ],
  },

  // Wildcard - redirect to dashboard
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
