import { combineReducers } from '@ngrx/store';
import { ChestView } from '../core/models/chest.model';
import { PathSummary } from '../core/models/path.model';
import { CurrentUser } from '../core/models/user.model';
import { AuthActions } from './auth/auth.actions';
import { authFeature } from './auth/auth.reducer';
import { ChestsActions } from './chests/chests.actions';
import { chestsFeature } from './chests/chests.reducer';
import { clearOnSignOut } from './clear-on-sign-out';
import { PathsActions } from './paths/paths.actions';
import { pathsFeature } from './paths/paths.reducer';

const reducer = clearOnSignOut(
  combineReducers({
    auth: authFeature.reducer,
    chests: chestsFeature.reducer,
    paths: pathsFeature.reducer,
  }),
);

const user: CurrentUser = {
  id: 'hero',
  username: 'demo_hero',
  avatarKey: 'mini-mage',
  petKey: null,
  level: 3,
  email: 'hero@example.com',
  xp: 400,
  coins: 300,
  streak: 2,
  longestStreak: 5,
  streakFreezes: 0,
  twoFaEnabled: false,
  xpIntoLevel: 100,
  xpForNextLevel: 300,
  sabotages: ['INK'],
};

const chest: ChestView = {
  id: 'chest-1',
  type: 'WOODEN',
  source: 'DAILY_MATCH',
  earnedAt: '2026-10-01T10:00:00.000Z',
  openedAt: null,
  reward: null,
};

const path: PathSummary = {
  id: 'path-1',
  topic: 'Dinosaurs',
  audience: 'KIDS',
  language: 'EN',
  stepsCleared: 1,
  totalSteps: 5,
  stars: 3,
  maxStars: 15,
  nextStep: null,
  createdAt: '2026-10-01T10:00:00.000Z',
};

function playing() {
  const signedIn = reducer(undefined, AuthActions.signedIn({ user }));
  const withChests = reducer(signedIn, ChestsActions.loaded({ unopened: [chest], recent: [] }));
  return reducer(withChests, PathsActions.loaded({ paths: [path] }));
}

describe('clear on sign out', () => {
  it("forgets the last player's data after logging out", () => {
    const state = reducer(playing(), AuthActions.logout());

    expect(state.chests.ids).toEqual([]);
    expect(state.chests.loaded).toBe(false);
    expect(state.paths.paths).toEqual([]);
    expect(state.paths.loaded).toBe(false);
    expect(state.auth.user).toBeNull();
    expect(state.auth.status).toBe('anonymous');
  });

  it('forgets it the same way when the session expires', () => {
    const state = reducer(playing(), AuthActions.sessionExpired());

    expect(state.paths.paths).toEqual([]);
    expect(state.auth.status).toBe('anonymous');
  });

  it('keeps the data for every other action', () => {
    const state = reducer(playing(), AuthActions.coinsUpdated({ coins: 500 }));

    expect(state.paths.paths).toEqual([path]);
    expect(state.auth.user?.coins).toBe(500);
  });
});
