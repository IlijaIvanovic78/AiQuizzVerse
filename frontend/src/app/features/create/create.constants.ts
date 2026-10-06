import { HttpStatusCode } from '@angular/common/http';
import {
  Audience,
  Difficulty,
  QuizLanguage,
  QuizSource,
  QuizTheme,
} from '../../core/models/quiz.model';
import { GenerationStep } from '../../core/models/realtime-events.model';
import { MAX_QUESTIONS, MIN_QUESTIONS } from '../../shared/forms/quiz-form';
import { PATH_STEP_COUNT } from '../paths/paths.constants';
import { AudienceChoice, CreateKind, PictureChoice, WizardStep } from './create.types';

// Home and the paths page link here with ?make=path to open the wizard on a learning path.
export const NEW_PATH_QUERY_PARAMS = { make: 'path' };

export const TOPIC_SUGGESTIONS = [
  'Dinosaurs',
  'Solar System',
  'Human Body',
  'Serbian History',
  'Fractions',
  'World Capitals',
];

export const DEFAULT_TIME_BY_AUDIENCE: Record<Audience, number> = {
  KIDS: 45,
  TEENS: 30,
  ADULTS: 20,
};

export const DEFAULT_QUESTION_COUNT = 5;
// The server writes this many quizzes per player a day; a path counts once for every step.
export const DAILY_CREATION_LIMIT = 15;
export const MAX_PDF_MEGABYTES = 10;
export const MAX_PDF_BYTES = MAX_PDF_MEGABYTES * 1024 * 1024;
export const PDF_MIME_TYPE = 'application/pdf';

// Steps of a quiz that is written by the quiz master, and of one written by hand.
export const GENERATED_STEPS: WizardStep[] = ['source', 'make', 'settings'];
export const MANUAL_STEPS: WizardStep[] = ['source', 'settings', 'questions'];

export const STEP_LABELS: Record<WizardStep, string> = {
  source: 'Source',
  make: 'What to make',
  settings: 'Settings',
  questions: 'Questions',
};

export const STEP_TITLES: Record<WizardStep, string> = {
  source: 'Where should the questions come from?',
  make: 'What should the quiz master make?',
  settings: 'Set up your quest',
  questions: 'Write your questions',
};

export const SOURCE_CHOICES: PictureChoice<QuizSource>[] = [
  {
    value: 'TOPIC',
    title: 'Pick a topic',
    text: 'Type anything you are curious about.',
    image: 'sword',
  },
  {
    value: 'DOCUMENT',
    title: 'Upload a lesson',
    text: 'Turn your own PDF notes into questions.',
    image: 'chest',
  },
  {
    value: 'MANUAL',
    title: 'Write it myself',
    text: 'Make every question by hand.',
    image: 'axes',
  },
];

export const KIND_CHOICES: PictureChoice<CreateKind>[] = [
  {
    value: 'QUIZ',
    title: 'Quick quiz',
    text: `One round of ${MIN_QUESTIONS} to ${MAX_QUESTIONS} questions.`,
    image: 'shield',
  },
  {
    value: 'PATH',
    title: 'Learning path',
    text: `${PATH_STEP_COUNT} steps from easy to master, each with a study card.`,
    image: 'treasure',
  },
];

export const AUDIENCE_CHOICES: AudienceChoice[] = [
  {
    value: 'KIDS',
    ages: 'Ages 7 to 12',
    text: 'Short sentences and simple words.',
    heroKey: 'mini-sword-man',
  },
  {
    value: 'TEENS',
    ages: 'Ages 13 to 17',
    text: 'A bit more detail and challenge.',
    heroKey: 'mini-ice-swordswoman',
  },
  {
    value: 'ADULTS',
    ages: '18 and up',
    text: 'Full detail, no hand-holding.',
    heroKey: 'mini-arch-mage',
  },
];

export const LANGUAGES: QuizLanguage[] = ['EN', 'SR'];

export const DIFFICULTY_CHOICES: { value: Difficulty; label: string }[] = [
  { value: 'EASY', label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD', label: 'Hard' },
];

export const QUIZ_THEMES: QuizTheme[] = [
  'GENERAL',
  'SPACE',
  'HISTORY',
  'SCIENCE',
  'NATURE',
  'GEOGRAPHY',
  'MATH',
  'LANGUAGE',
  'ART',
  'MUSIC',
  'SPORTS',
  'TECHNOLOGY',
];

// The order in which the server reports a quiz being written (quiz:progress).
export const QUIZ_GENERATION_STEPS: { step: GenerationStep; label: string }[] = [
  { step: 'reading', label: 'Reading your topic' },
  { step: 'writing', label: 'Writing the questions' },
  { step: 'reviewing', label: 'Checking every answer' },
  { step: 'saving', label: 'Packing it into your library' },
];

export const CREATION_ERROR_TITLES: Partial<Record<number, string>> = {
  [HttpStatusCode.Conflict]: 'Already on it!',
  [HttpStatusCode.TooManyRequests]: 'The quiz master needs a rest',
  [HttpStatusCode.ServiceUnavailable]: 'The quiz master is resting',
};

export const DEFAULT_ERROR_TITLE = "That didn't work";
