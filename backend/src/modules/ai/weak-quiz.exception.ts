import { ServiceUnavailableException } from '@nestjs/common';
import { AI_WEAK_QUIZ_MESSAGE } from './ai.constants';

/** The AI answered, but too few of its questions passed the checks. Writing it again may help. */
export class WeakQuizException extends ServiceUnavailableException {
  constructor() {
    super(AI_WEAK_QUIZ_MESSAGE);
  }
}
