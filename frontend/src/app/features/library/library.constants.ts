import { QuizSource } from '../../core/models/quiz.model';

export const SOURCE_LABELS: Record<QuizSource, string> = {
  TOPIC: 'Made from a topic',
  DOCUMENT: 'Made from your PDF',
  MANUAL: 'Written by hand',
};
