import { MatchMode } from '../core/models/match.model';
import { ItemImageName } from './components/empty-state.component';

export interface ModeChoice {
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
    mode: 'DUEL',
    title: 'Duel a friend',
    text: 'Who knows more? No power-ups, a fair fight.',
    image: 'axes',
  },
  {
    mode: 'TEAM',
    title: 'Team up',
    text: 'Fill one chest together with a friend.',
    image: 'shield',
  },
  {
    mode: 'PARTY',
    title: 'Party (2-4)',
    text: 'The first right answer wins. Sabotage your friends!',
    image: 'potion',
  },
];
