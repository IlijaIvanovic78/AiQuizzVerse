import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { guestGuard } from './core/auth/guest.guard';
import { heroGuard, noHeroGuard } from './core/auth/hero.guard';
import { leaveMatchGuard } from './features/play/leave-match.guard';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Log in',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login-page.component').then((m) => m.LoginPageComponent),
  },
  {
    path: 'register',
    title: 'Create account',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/register-page.component').then((m) => m.RegisterPageComponent),
  },
  {
    path: 'welcome',
    title: 'Choose your hero',
    canActivate: [authGuard, noHeroGuard],
    loadComponent: () =>
      import('./features/auth/welcome-page.component').then((m) => m.WelcomePageComponent),
  },
  {
    path: '',
    canActivate: [authGuard, heroGuard],
    loadComponent: () => import('./layout/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      {
        path: 'home',
        title: 'Home',
        loadComponent: () =>
          import('./features/home/home-page.component').then((m) => m.HomePageComponent),
      },
      {
        path: 'create',
        title: 'Create',
        loadComponent: () =>
          import('./features/create/create-page.component').then((m) => m.CreatePageComponent),
      },
      {
        path: 'library',
        title: 'Library',
        loadComponent: () =>
          import('./features/library/library-page.component').then((m) => m.LibraryPageComponent),
      },
      {
        path: 'library/:quizId',
        title: 'Quiz',
        loadComponent: () =>
          import('./features/library/quiz-detail-page.component').then(
            (m) => m.QuizDetailPageComponent,
          ),
      },
      {
        path: 'play/:matchId',
        title: 'Play',
        canDeactivate: [leaveMatchGuard],
        loadComponent: () =>
          import('./features/play/match-page.component').then((m) => m.MatchPageComponent),
      },
      {
        path: 'join',
        title: 'Join a game',
        loadComponent: () =>
          import('./features/play/join-page.component').then((m) => m.JoinPageComponent),
      },
      {
        path: 'join/:code',
        title: 'Join a game',
        loadComponent: () =>
          import('./features/play/join-page.component').then((m) => m.JoinPageComponent),
      },
      {
        path: 'paths',
        title: 'Learning paths',
        loadComponent: () =>
          import('./features/paths/paths-page.component').then((m) => m.PathsPageComponent),
      },
      {
        path: 'paths/:pathId',
        title: 'Learning path',
        loadComponent: () =>
          import('./features/paths/path-page.component').then((m) => m.PathPageComponent),
      },
      {
        path: 'review',
        title: 'Mistakes notebook',
        loadComponent: () =>
          import('./features/review/review-page.component').then((m) => m.ReviewPageComponent),
      },
      {
        path: 'shop',
        title: 'Shop',
        loadComponent: () =>
          import('./features/shop/shop-page.component').then((m) => m.ShopPageComponent),
      },
      {
        path: 'shop/checkout/:purchaseId',
        title: 'Checkout',
        loadComponent: () =>
          import('./features/shop/checkout-page.component').then((m) => m.CheckoutPageComponent),
      },
      {
        path: 'shop/payment/:purchaseId',
        title: 'Payment',
        loadComponent: () =>
          import('./features/shop/payment-result-page.component').then(
            (m) => m.PaymentResultPageComponent,
          ),
      },
      {
        path: 'chests',
        title: 'Treasure room',
        loadComponent: () =>
          import('./features/chests/chests-page.component').then((m) => m.ChestsPageComponent),
      },
      {
        path: 'friends',
        title: 'Friends',
        loadComponent: () =>
          import('./features/friends/friends-page.component').then((m) => m.FriendsPageComponent),
      },
      {
        path: 'leaderboard',
        title: 'Leaderboard',
        loadComponent: () =>
          import('./features/leaderboard/leaderboard-page.component').then(
            (m) => m.LeaderboardPageComponent,
          ),
      },
      {
        path: 'profile',
        title: 'Profile',
        loadComponent: () =>
          import('./features/profile/profile-page.component').then((m) => m.ProfilePageComponent),
      },
      {
        path: 'profile/:username',
        title: 'Profile',
        loadComponent: () =>
          import('./features/profile/profile-page.component').then((m) => m.ProfilePageComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'home' },
];
