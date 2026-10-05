import { MatchMode } from '../core/models/match.model';
import { ItemImageName } from './icons';

export const MAX_PLAYERS: Record<MatchMode, number> = { SOLO: 1, TEAM: 2, PARTY: 4 };
// Connected players the host needs before the start button works.
export const PLAYERS_TO_START: Record<MatchMode, number> = { SOLO: 1, TEAM: 2, PARTY: 2 };

interface ModeChoice {
  mode: MatchMode;
  title: string;
  text: string;
  image: ItemImageName;
}

export const MODE_CHOICES: ModeChoice[] = [
  {
    mode: 'SOLO',
    title: 'Solo',
    text: 'Just you and the treasure chest.',
    image: 'chest',
  },
  {
    mode: 'TEAM',
    title: 'Team up',
    text: 'Fill one chest together with a friend.',
    image: 'shield',
  },
  {
    mode: 'PARTY',
    title: `Party with friends (${PLAYERS_TO_START.PARTY}-${MAX_PLAYERS.PARTY})`,
    text: `Up to ${MAX_PLAYERS.PARTY} players. The first right answer wins the round!`,
    image: 'potion',
  },
];

export const MODE_LABELS: Record<MatchMode, string> = {
  SOLO: 'Solo',
  TEAM: 'Team',
  PARTY: 'Party',
};
