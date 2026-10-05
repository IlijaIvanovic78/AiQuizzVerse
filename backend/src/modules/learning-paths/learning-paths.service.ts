import { ForbiddenException, Injectable } from '@nestjs/common';
import { PathStep, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { accuracyPercent, starsForAccuracy } from '../progression/progression.rules';
import { STEP_REWARDS } from './learning-paths.constants';
import { PathResult, StepReward, StepWithOwner } from './learning-paths.types';

@Injectable()
export class LearningPathsService {
  constructor(private readonly prisma: PrismaService) {}

  findStepByQuiz(quizId: string): Promise<StepWithOwner | null> {
    return this.prisma.pathStep.findUnique({
      where: { quizId },
      include: { path: { select: { ownerId: true } } },
    });
  }

  async assertStepUnlocked(userId: string, step: StepWithOwner): Promise<void> {
    if (step.path.ownerId !== userId) {
      throw new ForbiddenException('This learning path belongs to someone else.');
    }
    if (step.position === 1) {
      return;
    }

    const previous = await this.prisma.pathStep.findUnique({
      where: { pathId_position: { pathId: step.pathId, position: step.position - 1 } },
      select: { completedAt: true },
    });
    if (!previous?.completedAt) {
      throw new ForbiddenException('Clear the previous step first.');
    }
  }

  async recordStepResult(
    userId: string,
    step: PathStep,
    correct: number,
    total: number,
    db: Prisma.TransactionClient = this.prisma,
  ): Promise<PathResult> {
    const accuracy = accuracyPercent(correct, total);
    const stars = starsForAccuracy(accuracy);
    await this.keepBestResult(db, step.id, stars, accuracy);
    const firstClear = stars > 0 && (await this.markCleared(db, step.id));
    const reward = firstClear ? await this.grantStepReward(db, userId, step.position) : null;

    const saved = await db.pathStep.findUniqueOrThrow({ where: { id: step.id } });
    const cleared = saved.completedAt !== null;
    return {
      pathId: saved.pathId,
      stepId: saved.id,
      stars,
      cleared,
      nextStepId: cleared ? await this.findNextStepId(db, saved) : null,
      reward,
    };
  }

  // Conditional updates instead of read-then-write, so two runs finishing at once
  // can neither lower the best result nor pay the first-clear reward twice.
  private async keepBestResult(
    db: Prisma.TransactionClient,
    stepId: string,
    stars: number,
    accuracy: number,
  ): Promise<void> {
    await db.pathStep.updateMany({ where: { id: stepId, stars: { lt: stars } }, data: { stars } });
    await db.pathStep.updateMany({
      where: { id: stepId, bestAccuracy: { lt: accuracy } },
      data: { bestAccuracy: accuracy },
    });
  }

  private async markCleared(db: Prisma.TransactionClient, stepId: string): Promise<boolean> {
    const { count } = await db.pathStep.updateMany({
      where: { id: stepId, completedAt: null },
      data: { completedAt: new Date() },
    });
    return count === 1;
  }

  private async grantStepReward(
    db: Prisma.TransactionClient,
    userId: string,
    position: number,
  ): Promise<StepReward> {
    const reward = STEP_REWARDS[position];
    await db.user.update({
      where: { id: userId },
      data: { coins: { increment: reward.coins } },
    });
    if (reward.boost) {
      await db.userBoost.upsert({
        where: { userId_type: { userId, type: reward.boost } },
        create: { userId, type: reward.boost, quantity: 1 },
        update: { quantity: { increment: 1 } },
      });
    }
    return reward;
  }

  private async findNextStepId(
    db: Prisma.TransactionClient,
    step: PathStep,
  ): Promise<string | null> {
    const next = await db.pathStep.findUnique({
      where: { pathId_position: { pathId: step.pathId, position: step.position + 1 } },
      select: { id: true },
    });
    return next?.id ?? null;
  }
}
