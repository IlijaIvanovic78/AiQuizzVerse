import { ShopItem } from '../../core/models/shop.model';
import { ICONS_URL, itemIconUrl } from '../../shared/icons';

export type ShopTab = 'heroes' | 'pets' | 'power-ups' | 'sabotages' | 'coins';

interface ShopTabOption {
  id: ShopTab;
  label: string;
  icon: string;
  pixelated: boolean;
}

export const SHOP_TABS: ShopTabOption[] = [
  { id: 'heroes', label: 'Heroes', icon: itemIconUrl('sword'), pixelated: false },
  { id: 'pets', label: 'Pets', icon: `${ICONS_URL}heart.png`, pixelated: true },
  { id: 'power-ups', label: 'Power-ups', icon: itemIconUrl('potion'), pixelated: false },
  // \u00AD is a soft hyphen: the word can break on narrow phones, like Power-ups does.
  { id: 'sabotages', label: 'Sabo\u00ADtages', icon: `${ICONS_URL}fog.png`, pixelated: true },
  { id: 'coins', label: 'Coins', icon: `${ICONS_URL}coin.png`, pixelated: true },
];

// The tabs that show a shelf of item cards.
export const ITEM_TABS: ShopTab[] = ['heroes', 'pets', 'sabotages'];

// Ink is free for everyone, so the server does not sell it. The shop still shows it first, as
// an item every player already owns, so nobody thinks they start a party without a sabotage.
export const FREE_INK: ShopItem = {
  id: 'sabotage-ink',
  name: 'Ink',
  type: 'SABOTAGE',
  description: "Splash ink over a rival's question for 4 seconds.",
  price: 0,
  minLevel: 1,
  isStarter: false,
  isChestOnly: false,
  owned: true,
  equipped: false,
};

type PackArt = 'coins' | 'chest' | 'treasure';

export const PACK_ART: Record<string, PackArt> = {
  pouch: 'coins',
  chest: 'chest',
  vault: 'treasure',
};

export const DEFAULT_PACK_ART: PackArt = 'treasure';

// Same limit the server enforces: paid purchases in the last 30 days.
export const MONTHLY_LIMIT_CENTS = 1000;

// The `status` query param the payment provider sends the player back with.
export const CANCELLED_PAYMENT_STATUS = 'cancelled';
export const SUCCESS_PAYMENT_STATUS = 'success';

// The grown-up gate asks for a two-digit number times a one-digit number.
export const GATE_LEFT_MIN = 12;
export const GATE_LEFT_MAX = 99;
export const GATE_RIGHT_MIN = 3;
export const GATE_RIGHT_MAX = 9;
