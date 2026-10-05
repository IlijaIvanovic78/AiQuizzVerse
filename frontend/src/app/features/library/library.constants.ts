import { MatchMode } from '../../core/models/match.model';
import { QuizSource } from '../../core/models/quiz.model';
import { ItemImageName } from '../../shared/components/empty-state.component';

export const SOURCE_LABELS: Record<QuizSource, string> = {
  TOPIC: 'Made from a topic',
  DOCUMENT: 'Made from your PDF',
  MANUAL: 'Written by hand',
};

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
];
