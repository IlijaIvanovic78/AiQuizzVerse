import { MatchOutcome } from '../../core/models/match.model';
import { OutcomeLook } from './profile.types';

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
