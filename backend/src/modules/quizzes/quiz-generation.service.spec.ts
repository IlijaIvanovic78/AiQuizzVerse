import { ConflictException, HttpException, HttpStatus } from '@nestjs/common';
import { QuizWriterService } from '../ai/quiz-writer.service';
import { DocumentsService } from '../documents/documents.service';
import { NotificationsService } from '../realtime/notifications.service';
import { QuizGenerationService } from './quiz-generation.service';
import { DAILY_AI_LIMIT, PATH_GENERATION_COST } from './quizzes.constants';
import { QuizzesService } from './quizzes.service';

describe('QuizGenerationService limits', () => {
  let service: QuizGenerationService;

  beforeEach(() => {
    service = new QuizGenerationService(
      {} as QuizWriterService,
      {} as DocumentsService,
      {} as QuizzesService,
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

  it('stops at the daily limit, counting a path as several generations', async () => {
    const pathsPerDay = Math.floor(DAILY_AI_LIMIT / PATH_GENERATION_COST);
    for (let i = 0; i < pathsPerDay; i++) {
      await service.runWithLimits('user-1', PATH_GENERATION_COST, () => Promise.resolve());
    }

    const refused = service.runWithLimits('user-1', 1, () => Promise.resolve());

    await expect(refused).rejects.toThrow(HttpException);
    await expect(refused).rejects.toMatchObject({ status: HttpStatus.TOO_MANY_REQUESTS });
  });

  it('does not count failed generations', async () => {
    for (let i = 0; i < DAILY_AI_LIMIT + 1; i++) {
      await expect(
        service.runWithLimits('user-1', 1, () => Promise.reject(new Error('OpenAI is down'))),
      ).rejects.toThrow('OpenAI is down');
    }

    await expect(service.runWithLimits('user-1', 1, () => Promise.resolve())).resolves.toBe(
      undefined,
    );
  });
});
