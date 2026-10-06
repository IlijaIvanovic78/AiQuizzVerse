import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { TitleStrategy, provideRouter, withComponentInputBinding } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideState, provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { AppTitleStrategy } from './app-title.strategy';
import { routes } from './app.routes';
import { AuthBootstrapService } from './core/auth/auth-bootstrap.service';
import { authInterceptor } from './core/auth/auth.interceptor';
import { UiSoundsService } from './core/sound/ui-sounds.service';
import { AuthEffects } from './store/auth/auth.effects';
import { authFeature } from './store/auth/auth.reducer';
import { ChestsEffects } from './store/chests/chests.effects';
import { chestsFeature } from './store/chests/chests.reducer';
import { clearOnSignOut } from './store/clear-on-sign-out';
import { FriendsEffects } from './store/friends/friends.effects';
import { friendsFeature } from './store/friends/friends.reducer';
import { LeaderboardEffects } from './store/leaderboard/leaderboard.effects';
import { leaderboardFeature } from './store/leaderboard/leaderboard.reducer';
import { MatchHistoryEffects } from './store/match-history/match-history.effects';
import { matchHistoryFeature } from './store/match-history/match-history.reducer';
import { matchInviteFeature } from './store/match-invite/match-invite.reducer';
import { MatchEffects } from './store/match/match.effects';
import { matchFeature } from './store/match/match.reducer';
import { PathsEffects } from './store/paths/paths.effects';
import { pathsFeature } from './store/paths/paths.reducer';
import { QuizzesEffects } from './store/quizzes/quizzes.effects';
import { quizzesFeature } from './store/quizzes/quizzes.reducer';
import { RealtimeEffects } from './store/realtime/realtime.effects';
import { ReviewEffects } from './store/review/review.effects';
import { reviewFeature } from './store/review/review.reducer';
import { EquipmentEffects } from './store/shop/equipment.effects';
import { PaymentsEffects } from './store/shop/payments.effects';
import { ShopEffects } from './store/shop/shop.effects';
import { shopFeature } from './store/shop/shop.reducer';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    { provide: TitleStrategy, useClass: AppTitleStrategy },
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideStore({}, { metaReducers: [clearOnSignOut] }),
    provideState(authFeature),
    provideState(quizzesFeature),
    provideState(matchFeature),
    provideState(matchInviteFeature),
    provideState(pathsFeature),
    provideState(reviewFeature),
    provideState(shopFeature),
    provideState(friendsFeature),
    provideState(leaderboardFeature),
    provideState(matchHistoryFeature),
    provideState(chestsFeature),
    provideEffects([
      AuthEffects,
      QuizzesEffects,
      MatchEffects,
      PathsEffects,
      ReviewEffects,
      ShopEffects,
      PaymentsEffects,
      EquipmentEffects,
      FriendsEffects,
      LeaderboardEffects,
      MatchHistoryEffects,
      ChestsEffects,
      RealtimeEffects,
    ]),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
    provideAppInitializer(() => inject(AuthBootstrapService).restore()),
    provideAppInitializer(() => inject(UiSoundsService).start()),
  ],
};
