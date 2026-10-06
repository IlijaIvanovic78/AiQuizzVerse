import { EntityState, createEntityAdapter } from '@ngrx/entity';
import { createFeature, createReducer, createSelector, on } from '@ngrx/store';
import { CoinPackage, PurchaseView } from '../../core/models/payment.model';
import { BoostOffer, ShopItem } from '../../core/models/shop.model';
import { CurrentUser } from '../../core/models/user.model';
import { PaymentsActions } from './payments.actions';
import { ShopActions } from './shop.actions';

// Also holds the coin packages and purchases that PaymentsActions load.
interface ShopState extends EntityState<ShopItem> {
  itemsLoaded: boolean;
  boosts: BoostOffer[];
  packages: CoinPackage[];
  purchase: PurchaseView | null;
  purchases: PurchaseView[];
  loading: boolean;
  busy: boolean;
  error: string | null;
}

// Chest-only items have no price, so they go after everything the shop sells.
const shopItemsAdapter = createEntityAdapter<ShopItem>({
  sortComparer: (a, b) => Number(a.isChestOnly) - Number(b.isChestOnly) || a.price - b.price,
});
const { selectAll } = shopItemsAdapter.getSelectors();

const initialState: ShopState = shopItemsAdapter.getInitialState({
  itemsLoaded: false,
  boosts: [],
  packages: [],
  purchase: null,
  purchases: [],
  loading: false,
  busy: false,
  error: null,
});

export const shopFeature = createFeature({
  name: 'shop',
  reducer: createReducer(
    initialState,
    on(
      ShopActions.loadItems,
      ShopActions.loadBoosts,
      PaymentsActions.loadPackages,
      PaymentsActions.loadPurchase,
      PaymentsActions.loadHistory,
      (state): ShopState => ({ ...state, loading: true, error: null }),
    ),
    on(
      ShopActions.itemsLoaded,
      (state, { items }): ShopState =>
        shopItemsAdapter.setAll(items, { ...state, itemsLoaded: true, loading: false }),
    ),
    on(
      ShopActions.boostsLoaded,
      (state, { boosts }): ShopState => ({ ...state, boosts, loading: false }),
    ),
    on(
      ShopActions.buyItem,
      ShopActions.equipItem,
      ShopActions.unequipPet,
      ShopActions.claimStarter,
      ShopActions.buyBoost,
      PaymentsActions.checkout,
      PaymentsActions.confirmPurchase,
      PaymentsActions.cancelPurchase,
      (state): ShopState => ({ ...state, busy: true, error: null }),
    ),
    on(
      ShopActions.itemBought,
      (state, { item }): ShopState =>
        shopItemsAdapter.updateOne({ id: item.id, changes: item }, { ...state, busy: false }),
    ),
    on(
      ShopActions.itemEquipped,
      ShopActions.petUnequipped,
      ShopActions.starterClaimed,
      (state, { user }): ShopState => withEquippedItems({ ...state, busy: false }, user),
    ),
    on(
      ShopActions.boostBought,
      (state, { boost }): ShopState => ({
        ...state,
        boosts: state.boosts.map((offer) => (offer.type === boost.type ? boost : offer)),
        busy: false,
      }),
    ),
    on(
      PaymentsActions.packagesLoaded,
      (state, { packages }): ShopState => ({ ...state, packages, loading: false }),
    ),
    on(PaymentsActions.checkoutOpened, (state): ShopState => ({ ...state, busy: false })),
    on(
      PaymentsActions.purchaseLoaded,
      (state, { purchase }): ShopState => ({ ...state, purchase, loading: false }),
    ),
    on(
      PaymentsActions.purchaseConfirmed,
      PaymentsActions.purchaseCancelled,
      (state, { purchase }): ShopState => ({ ...state, purchase, busy: false }),
    ),
    on(
      PaymentsActions.historyLoaded,
      (state, { purchases }): ShopState => ({ ...state, purchases, loading: false }),
    ),
    on(
      ShopActions.failed,
      PaymentsActions.failed,
      (state, { error }): ShopState => ({ ...state, loading: false, busy: false, error }),
    ),
  ),
  extraSelectors: ({ selectShopState }) => {
    const selectAllShopItems = createSelector(selectShopState, selectAll);
    return {
      selectAllShopItems,
      selectHeroItems: createSelector(selectAllShopItems, (items) =>
        items.filter((item) => item.type === 'AVATAR'),
      ),
      selectPetItems: createSelector(selectAllShopItems, (items) =>
        items.filter((item) => item.type === 'PET'),
      ),
      selectSabotageItems: createSelector(selectAllShopItems, (items) =>
        items.filter((item) => item.type === 'SABOTAGE'),
      ),
      selectStarterItems: createSelector(selectAllShopItems, (items) =>
        items.filter((item) => item.isStarter),
      ),
    };
  },
});

function withEquippedItems(state: ShopState, user: CurrentUser): ShopState {
  const changes = selectAll(state).map((item) => {
    const equipped = item.id === user.avatarKey || item.id === user.petKey;
    return { id: item.id, changes: { equipped, owned: item.owned || equipped } };
  });
  return shopItemsAdapter.updateMany(changes, state);
}
