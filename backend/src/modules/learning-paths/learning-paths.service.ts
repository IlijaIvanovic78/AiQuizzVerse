import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PathStep, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ChestsService } from '../chests/chests.service';
import { accuracyPercent, starsForAccuracy } from '../progression/progression.rules';
import {
  PATH_DETAIL_INCLUDE,
  PATH_SUMMARY_INCLUDE,
  PathDetailRow,
  toPathDetail,
  toPathSummary,
} from './learning-path.mapper';
import { STEP_REWARDS } from './learning-paths.constants';
import { isStepUnlocked } from './learning-paths.rules';
import { PathDetail, PathResult, PathSummary, StepReward, StepRun } from './learning-paths.types';

@Injectable()
export class LearningPathsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chests: ChestsService,
  ) {}

  async findAll(userId: string): Promise<PathSummary[]> {
    const paths = await this.prisma.learningPath.findMany({
      where: { ownerId: userId },
      include: PATH_SUMMARY_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return paths.map(toPathSummary);
  }

  async findDetail(userId: string, pathId: string): Promise<PathDetail> {
    const path = await this.findOwnPath(userId, pathId);
    return toPathDetail(path);
  }

  /** Step quizzes are soft deleted like any other quiz, so match history and coin totals stay. */
  async remove(userId: string, pathId: string): Promise<void> {
    const path = await this.findOwnPath(userId, pathId);
    const quizIds = path.steps.map((step) => step.quizId);
    await this.prisma.$transaction([
      this.prisma.quiz.updateMany({
        where: { id: { in: quizIds } },
        data: { deletedAt: new Date() },
      }),
      this.prisma.learningPath.delete({ where: { id: pathId } }),
    ]);
  }

  findStepByQuiz(
    quizId: string,
    db: Prisma.TransactionClient = this.prisma,
  ): Promise<PathStep | null> {
    return db.pathStep.findUnique({ where: { quizId } });
  }

  // The caller has already checked that the step quiz belongs to the player.
  async assertStepUnlocked(step: PathStep): Promise<void> {
    const previous = await this.prisma.pathStep.findUnique({
      where: { pathId_position: { pathId: step.pathId, position: step.position - 1 } },
      select: { completedAt: true },
    });
    if (!isStepUnlocked(step.position, Boolean(previous?.completedAt))) {
      throw new ForbiddenException('Clear the previous step first.');
    }
  }

  async recordStepResult(
    userId: string,
    step: PathStep,
    run: StepRun,
    db: Prisma.TransactionClient = this.prisma,
  ): Promise<PathResult> {
    const accuracy = accuracyPercent(run.correct, run.total);
    const stars = starsForAccuracy(accuracy);
    await this.keepBestResult(db, step.id, stars, accuracy);
    let firstClear = false;
    if (stars > 0) {
      firstClear = await this.markCleared(db, step.id);
    }
    const reward = firstClear
      ? await this.grantStepReward(db, userId, step.position, run.matchId)
      : null;

    const saved = await db.pathStep.findUniqueOrThrow({ where: { id: step.id } });
    return this.describeStepResult(saved, stars, reward, db);
  }

  /** The path part of a match result, for a finished run and for a saved result. */
  async describeStepResult(
    step: PathStep,
    stars: number,
    reward: StepReward | null,
    db: Prisma.TransactionClient = this.prisma,
  ): Promise<PathResult> {
    const cleared = step.completedAt !== null;
    return {
      pathId: step.pathId,
      stepId: step.id,
      stars,
      cleared,
      nextStepId: cleared ? await this.findNextStepId(db, step) : null,
      reward,
    };
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

  private async findOwnPath(userId: string, pathId: string): Promise<PathDetailRow> {
    const path = await this.prisma.learningPath.findUnique({
      where: { id: pathId },
      include: PATH_DETAIL_INCLUDE,
    });
    if (!path) {
      throw new NotFoundException('We could not find that learning path.');
    }
    if (path.ownerId !== userId) {
      throw new ForbiddenException('This learning path belongs to someone else.');
    }
    return path;
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
    matchId: string,
  ): Promise<StepReward> {
    const reward = STEP_REWARDS[position];
    await db.user.update({
      where: { id: userId },
      data: { coins: { increment: reward.coins } },
    });
    if (reward.chest) {
      await this.chests.grant(userId, { type: reward.chest, source: 'PATH_STEP', matchId }, db);
    }
    return reward;
  }
}
