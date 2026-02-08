import { ApplicationConfig, provideBrowserGlobalErrorListeners, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';

import { routes } from './app.routes';
import { appStatusReducer } from './store/app-status/app-status.reducer';
import { AppStatusEffects } from './store/app-status/app-status.effects';
import { authInterceptor, authInitializerProvider } from './core';
import { authReducer } from './store/auth/auth.reducer';
import { AuthEffects } from './store/auth/auth.effects';
import { friendsReducer } from './store/friends/friends.reducer';
import { FriendsEffects } from './store/friends/friends.effects';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideStore({
      appStatus: appStatusReducer,
      auth: authReducer,
      friends: friendsReducer,
    }),
    provideEffects([AppStatusEffects, AuthEffects, FriendsEffects]),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: !isDevMode(),
      autoPause: true,
      trace: false,
      traceLimit: 75,
    }),
    authInitializerProvider, // Initialize auth state from localStorage
  ],
};
