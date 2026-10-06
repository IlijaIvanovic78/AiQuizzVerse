import { ShopItem } from '../../core/models/shop.model';
import { CurrentUser } from '../../core/models/user.model';
import { EquipmentActions } from './equipment.actions';
import { PaymentsActions } from './payments.actions';
import { ShopActions } from './shop.actions';
import { shopFeature } from './shop.reducer';

const reducer = shopFeature.reducer;

function item(id: string, changes: Partial<ShopItem>): ShopItem {
  return {
    id,
    name: id,
    type: 'AVATAR',
    description: '',
    price: 100,
    minLevel: 1,
    isStarter: false,
    isChestOnly: false,
    owned: true,
    equipped: false,
    ...changes,
  };
}

const user: CurrentUser = {
  id: 'hero',
  username: 'demo_hero',
  avatarKey: 'mini-mage',
  petKey: 'pet-fox',
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

const items = [
  item('mini-mage', { equipped: true }),
  item('mini-knight', {}),
  item('pet-fox', { type: 'PET', equipped: true }),
  item('pet-bunny', { type: 'PET' }),
];

const loaded = reducer(undefined, ShopActions.itemsLoaded({ items }));

function equippedIds(state: typeof loaded): string[] {
  return shopFeature.selectAllShopItems
    .projector(state)
    .filter((shopItem) => shopItem.equipped)
    .map((shopItem) => shopItem.id);
}

describe('shop reducer equipment', () => {
  it('is busy while an item is being equipped', () => {
    const state = reducer(loaded, EquipmentActions.equipItem({ itemId: 'mini-knight' }));

    expect(state.busy).toBe(true);
  });

  it('moves the equipped badge to the new hero and keeps the pet', () => {
    const equipping = reducer(loaded, EquipmentActions.equipItem({ itemId: 'mini-knight' }));

    const state = reducer(
      equipping,
      EquipmentActions.itemEquipped({ user: { ...user, avatarKey: 'mini-knight' } }),
    );

    expect(state.busy).toBe(false);
    expect(equippedIds(state)).toEqual(['mini-knight', 'pet-fox']);
  });

  it('takes the equipped badge off a pet that was taken off', () => {
    const state = reducer(
      loaded,
      EquipmentActions.petUnequipped({ user: { ...user, petKey: null } }),
    );

    expect(equippedIds(state)).toEqual(['mini-mage']);
  });

  it('stops being busy after a failed equip without showing a shop error', () => {
    const equipping = reducer(loaded, EquipmentActions.equipItem({ itemId: 'mini-knight' }));

    const state = reducer(equipping, EquipmentActions.failed({ error: 'You do not own it.' }));

    expect(state.busy).toBe(false);
    expect(state.error).toBeNull();
    expect(equippedIds(state)).toEqual(['mini-mage', 'pet-fox']);
  });
});

describe('shop reducer purchases', () => {
  it('keeps the purchases loading when the wardrobe items arrive first', () => {
    const loading = reducer(
      reducer(undefined, PaymentsActions.loadHistory()),
      ShopActions.loadItems(),
    );

    const state = reducer(loading, ShopActions.itemsLoaded({ items }));

    expect(state.loading).toBe(false);
    expect(state.purchasesLoading).toBe(true);
  });

  it('stops loading the purchases when they arrive', () => {
    const loading = reducer(undefined, PaymentsActions.loadHistory());

    const state = reducer(loading, PaymentsActions.historyLoaded({ purchases: [] }));

    expect(state.purchasesLoading).toBe(false);
  });
});
