import { ConflictException, HttpException, HttpStatus } from '@nestjs/common';
import { QuizWriterService } from '../ai/quiz-writer.service';
import { DocumentsService } from '../documents/documents.service';
import { NotificationsService } from '../realtime/notifications.service';
import { QuizGenerationService } from './quiz-generation.service';
import { DAILY_AI_LIMIT, PATH_GENERATION_COST } from './quizzes.constants';
import { QuizzesService } from './quizzes.service';

describe('QuizGenerationService limits', () => {
  let generatedToday: number;
  let service: QuizGenerationService;

  beforeEach(() => {
    generatedToday = 0;
    const quizzes = {
      countGeneratedSince: () => Promise.resolve(generatedToday),
    } as unknown as QuizzesService;
    service = new QuizGenerationService(
      {} as QuizWriterService,
      {} as DocumentsService,
      quizzes,
      {} as NotificationsService,
    );
  });

  it('refuses a second generation while the first one is running', async () => {
    let finishFirst: () => void = () => undefined;
    const first = service.runWithLimits(
      'user-1',
      1,
      () => new Promise<void>((resolve) => (finishFirst = resolve)),
    );

    await expect(service.runWithLimits('user-1', 1, () => Promise.resolve())).rejects.toThrow(
      ConflictException,
    );
    await Promise.resolve();
    finishFirst();
    await first;
    await expect(service.runWithLimits('user-1', 1, () => Promise.resolve())).resolves.toBe(
      undefined,
    );
  });

  it('lets other users generate at the same time', async () => {
    let finishFirst: () => void = () => undefined;
    const first = service.runWithLimits(
      'user-1',
      1,
      () => new Promise<void>((resolve) => (finishFirst = resolve)),
    );

    await expect(service.runWithLimits('user-2', 1, () => Promise.resolve(7))).resolves.toBe(7);
    finishFirst();
    await first;
  });

  it('refuses a learning path that would go over the daily limit', async () => {
    generatedToday = DAILY_AI_LIMIT - PATH_GENERATION_COST + 1;

    const refused = service.runWithLimits('user-1', PATH_GENERATION_COST, () => Promise.resolve());

    await expect(refused).rejects.toThrow(HttpException);
    await expect(refused).rejects.toMatchObject({ status: HttpStatus.TOO_MANY_REQUESTS });
  });

  it('still allows a single quiz right below the limit', async () => {
    generatedToday = DAILY_AI_LIMIT - 1;

    await expect(service.runWithLimits('user-1', 1, () => Promise.resolve(1))).resolves.toBe(1);
  });
});
