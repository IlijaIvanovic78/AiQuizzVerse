import { ChestReward, ChestView } from '../../core/models/chest.model';
import { ShopItem } from '../../core/models/shop.model';
import { CurrentUser } from '../../core/models/user.model';
import { ChestsActions } from '../chests/chests.actions';
import { ShopActions } from '../shop/shop.actions';
import { AuthActions } from './auth.actions';
import { authFeature } from './auth.reducer';

const reducer = authFeature.reducer;

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

const fog: ShopItem = {
  id: 'sabotage-fog',
  name: 'Fog',
  type: 'SABOTAGE',
  description: "Blur a rival's question for 4 seconds.",
  price: 100,
  minLevel: 3,
  isStarter: false,
  isChestOnly: false,
  owned: true,
  equipped: false,
};

const chest: ChestView = {
  id: 'chest-1',
  type: 'SILVER',
  source: 'LEVEL_UP',
  earnedAt: '2026-10-01T10:00:00.000Z',
  openedAt: '2026-10-02T10:00:00.000Z',
  reward: null,
};

function itemReward(item: ShopItem, duplicate = false): ChestReward {
  return { kind: 'ITEM', coins: duplicate ? item.price : 0, boosts: [], item, duplicate };
}

const signedIn = reducer(undefined, AuthActions.signedIn({ user }));

describe('auth reducer', () => {
  it('unlocks a bought sabotage and takes its price', () => {
    const state = reducer(signedIn, ShopActions.itemBought({ coins: 200, item: fog }));

    expect(state.user?.coins).toBe(200);
    expect(state.user?.sabotages).toEqual(['INK', 'FOG']);
  });

  it('unlocks a sabotage found in a chest', () => {
    const reward = itemReward(fog);

    const state = reducer(signedIn, ChestsActions.opened({ chest, reward, coins: 300 }));

    expect(state.user?.sabotages).toEqual(['INK', 'FOG']);
  });

  it('adds a duplicate sabotage only once and keeps the coins it was turned into', () => {
    const owned = reducer(signedIn, ShopActions.itemBought({ coins: 200, item: fog }));
    const reward = itemReward(fog, true);

    const state = reducer(owned, ChestsActions.opened({ chest, reward, coins: 300 }));

    expect(state.user?.coins).toBe(300);
    expect(state.user?.sabotages).toEqual(['INK', 'FOG']);
  });

  it('stops a failed settings save without touching the login form error', () => {
    const saving = reducer(signedIn, AuthActions.changeUsername({ username: 'new_hero' }));

    const state = reducer(saving, AuthActions.settingsFailed({ error: 'This name is taken.' }));

    expect(state.pending).toBe(false);
    expect(state.error).toBeNull();
  });

  it('leaves the sabotages alone when a hero is bought', () => {
    const hero: ShopItem = { ...fog, id: 'hero-fire-mage', name: 'Fire Mage', type: 'AVATAR' };

    const state = reducer(signedIn, ShopActions.itemBought({ coins: 150, item: hero }));

    expect(state.user?.coins).toBe(150);
    expect(state.user?.sabotages).toEqual(['INK']);
  });
});
