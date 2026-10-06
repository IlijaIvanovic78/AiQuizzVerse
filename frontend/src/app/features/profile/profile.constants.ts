import { MatchOutcome } from '../../core/models/match.model';
import { ICONS_URL, itemIconUrl } from '../../shared/icons';
import { OutcomeLook, WardrobeTabOption } from './profile.types';

export const RECENT_MATCHES_SHOWN = 8;

// Mastery bars turn green from 80% and orange from 60%; the percent is always printed too.
export const STRONG_ACCURACY = 80;
export const GOOD_ACCURACY = 60;

// A lost party is still a good fight and a missed team goal was so close; the app never says
// "Defeat".
export const OUTCOME_LOOKS: Record<MatchOutcome, OutcomeLook> = {
  WIN: { label: 'Victory', badge: 'badge-jade' },
  DRAW: { label: 'Draw', badge: 'badge-mana' },
  LOSS: { label: 'Good fight', badge: 'badge-fog' },
  DONE: { label: 'Finished', badge: 'badge-torch' },
};
export const TEAM_VICTORY_LOOK: OutcomeLook = { label: 'Team victory', badge: 'badge-jade' };
export const SO_CLOSE_LOOK: OutcomeLook = { label: 'So close', badge: 'badge-fog' };

// The shop links to /profile#wardrobe, and the profile then scrolls to the wardrobe.
export const WARDROBE_FRAGMENT = 'wardrobe';

// The same icons as the Heroes and Pets tabs of the shop.
export const WARDROBE_TABS: WardrobeTabOption[] = [
  {
    id: 'heroes',
    label: 'Heroes',
    itemType: 'AVATAR',
    icon: itemIconUrl('sword'),
    pixelated: false,
    emptyText: 'No heroes yet. New ones wait in the shop, and the rarest hide in chests.',
  },
  {
    id: 'pets',
    label: 'Pets',
    itemType: 'PET',
    icon: `${ICONS_URL}heart.png`,
    pixelated: true,
    emptyText: 'No pets yet. A pet follows your hero into every game.',
  },
];
