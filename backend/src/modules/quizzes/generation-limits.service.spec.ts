import { ConflictException, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PATH_GENERATION_COST } from '../learning-paths/learning-paths.constants';
import { GenerationLimitsService } from './generation-limits.service';
import { DAILY_AI_LIMIT } from './quizzes.constants';

describe('GenerationLimitsService', () => {
  let generatedToday: number;
  let limits: GenerationLimitsService;

  beforeEach(() => {
    generatedToday = 0;
    const prisma = {
      quiz: { count: () => Promise.resolve(generatedToday) },
    } as unknown as PrismaService;
    limits = new GenerationLimitsService(prisma);
  });

  it('refuses a second generation while the first one is running', async () => {
    let finishFirst: () => void = () => undefined;
    const firstRunning = new Promise<void>((resolve) => (finishFirst = resolve));
    const first = limits.runWithLimits('user-1', 1, () => firstRunning);

    await expect(limits.runWithLimits('user-1', 1, () => Promise.resolve())).rejects.toThrow(
      ConflictException,
    );
    finishFirst();
    await first;
    await expect(limits.runWithLimits('user-1', 1, () => Promise.resolve())).resolves.toBe(
      undefined,
    );
  });

  it('lets other users generate at the same time', async () => {
    let finishFirst: () => void = () => undefined;
    const firstRunning = new Promise<void>((resolve) => (finishFirst = resolve));
    const first = limits.runWithLimits('user-1', 1, () => firstRunning);

    await expect(limits.runWithLimits('user-2', 1, () => Promise.resolve(7))).resolves.toBe(7);
    finishFirst();
    await first;
  });

  it('refuses a learning path that would go over the daily limit', async () => {
    generatedToday = DAILY_AI_LIMIT - PATH_GENERATION_COST + 1;

    const refused = limits.runWithLimits('user-1', PATH_GENERATION_COST, () => Promise.resolve());

    await expect(refused).rejects.toThrow(HttpException);
    await expect(refused).rejects.toMatchObject({ status: HttpStatus.TOO_MANY_REQUESTS });
  });

  it('still allows a single quiz right below the limit', async () => {
    generatedToday = DAILY_AI_LIMIT - 1;

    await expect(limits.runWithLimits('user-1', 1, () => Promise.resolve(1))).resolves.toBe(1);
  });
});
