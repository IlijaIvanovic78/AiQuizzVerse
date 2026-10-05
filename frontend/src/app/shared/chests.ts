import { ChestSource, ChestType } from '../core/models/chest.model';
import { PixelIconName } from './components/pixel-icon.component';

export const CHEST_NAMES: Record<ChestType, string> = {
  WOODEN: 'Wooden chest',
  SILVER: 'Silver chest',
  GOLDEN: 'Golden chest',
};

export const CHEST_ICONS: Record<ChestType, PixelIconName> = {
  WOODEN: 'chest-wooden',
  SILVER: 'chest-silver',
  GOLDEN: 'chest-golden',
};

// Why the player got the chest, as shown on the chest card.
export const CHEST_SOURCES: Record<ChestSource, string> = {
  DAILY_MATCH: 'First good game of the day',
  VICTORY: 'Won a party match',
  PATH_STEP: 'Cleared a path step',
  LEVEL_UP: 'Reached a new level',
  STREAK: 'Kept a 7-day streak',
};
