import { QuizProgress } from '../../core/models/realtime-events.model';
import {
  CREATION_ERROR_TITLES,
  DEFAULT_ERROR_TITLE,
  MAX_PDF_BYTES,
  MAX_PDF_MEGABYTES,
  PDF_MIME_TYPE,
  QUIZ_GENERATION_STEPS,
} from './create.constants';
import { GenerationStepState } from './create.types';

const HALF_STEP = 0.5;

export function pdfProblem(file: Pick<File, 'name' | 'type' | 'size'>): string | null {
  if (file.type !== PDF_MIME_TYPE) {
    return `"${file.name}" is not a PDF. Choose a file that ends in .pdf.`;
  }
  if (file.size > MAX_PDF_BYTES) {
    return `That PDF is bigger than ${MAX_PDF_MEGABYTES} MB. Try a smaller one.`;
  }
  return null;
}

// Steps before the reported one are done; the last step is done once the quiz is saved.
export function quizStepStates(progress: QuizProgress | null): GenerationStepState[] {
  const current = progress
    ? QUIZ_GENERATION_STEPS.findIndex(({ step }) => step === progress.step)
    : 0;
  const saved = progress !== null && progress.done >= progress.total;
  return QUIZ_GENERATION_STEPS.map((_, index): GenerationStepState => {
    if (saved || index < current) {
      return 'done';
    }
    return index === current ? 'active' : 'waiting';
  });
}

// How far along the road the hero has walked, from 0 to 1. A step in progress counts as half.
export function quizProgressFraction(states: GenerationStepState[]): number {
  const done = states.filter((state) => state === 'done').length;
  const active = states.includes('active') ? HALF_STEP : 0;
  return (done + active) / states.length;
}

export function pathProgressFraction(progress: QuizProgress | null): number {
  return progress ? progress.done / progress.total : 0;
}

export function creationErrorTitle(status: number): string {
  return CREATION_ERROR_TITLES[status] ?? DEFAULT_ERROR_TITLE;
}
