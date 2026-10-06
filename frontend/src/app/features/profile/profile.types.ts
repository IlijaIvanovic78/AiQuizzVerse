import { ProfileView } from '../../core/models/profile.model';
import { ItemType } from '../../core/models/shop.model';

export type ProfileState =
  | { status: 'loading' }
  | { status: 'ready'; profile: ProfileView }
  | { status: 'missing' }
  | { status: 'failed'; message: string };

// The badge of a match in the match history.
export interface OutcomeLook {
  label: string;
  badge: string;
}

export type WardrobeTab = 'heroes' | 'pets';

export interface WardrobeTabOption {
  id: WardrobeTab;
  label: string;
  // The shop items this tab shows.
  itemType: ItemType;
  icon: string;
  pixelated: boolean;
  // Shown when the player owns nothing of this kind yet.
  emptyText: string;
}
