import { ConflictException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { utcToday } from '../../common/utils/dates';
import { PrismaService } from '../../prisma/prisma.service';
import { DAILY_AI_LIMIT } from './quizzes.constants';

@Injectable()
export class GenerationLimitsService {
  private readonly usersGenerating = new Set<string>();

  constructor(private readonly prisma: PrismaService) {}

  /** Allows one generation per user at a time and DAILY_AI_LIMIT AI quizzes per UTC day. */
  async runWithLimits<T>(userId: string, cost: number, generate: () => Promise<T>): Promise<T> {
    if (this.usersGenerating.has(userId)) {
      throw new ConflictException("You're already creating something");
    }
    this.usersGenerating.add(userId);
    try {
      await this.assertDailyLimit(userId, cost);
      return await generate();
    } finally {
      this.usersGenerating.delete(userId);
    }
  }

  private async assertDailyLimit(userId: string, cost: number): Promise<void> {
    const usedToday = await this.countGeneratedToday(userId);
    if (usedToday + cost > DAILY_AI_LIMIT) {
      throw new HttpException(
        'The quiz master needs a rest. Try again tomorrow!',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  // Counts AI-written quizzes, deleted ones included so deleting cannot reset the limit.
  // A learning path saves one such quiz per step.
  private countGeneratedToday(userId: string): Promise<number> {
    return this.prisma.quiz.count({
      where: {
        ownerId: userId,
        createdAt: { gte: utcToday() },
        source: { not: 'MANUAL' },
        kind: { not: 'REVIEW' },
      },
    });
  }
}
