import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { LearningPathsService } from '../learning-paths/learning-paths.service';
import { PathResult, StepReward } from '../learning-paths/learning-paths.types';
import { accuracyPercent, matchReward, starsForAccuracy } from '../progression/progression.rules';
import { ProgressionService } from '../progression/progression.service';
import { PlayerReward } from '../progression/progression.types';
import { ReviewService } from '../review/review.service';
import {
  MATCH_RESULT_INCLUDE,
  ResultMatch,
  ResultMatchPlayer,
  toMatchResult,
  toReviewAnswers,
} from './match.mapper';
import {
  FINISH_TRANSACTION_TIMEOUT_MS,
  MATCH_NOT_FOUND_MESSAGE,
  NOT_IN_MATCH_MESSAGE,
} from './matches.constants';
import { FinishedPlayer, MatchResult, MatchSummary, PlayerSummary } from './matches.types';
import { playerOutcome } from './scoring';

interface SavedMatch {
  rewards: Map<string, PlayerReward>;
  path: PathResult | null;
}

@Injectable()
export class MatchResultsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly progression: ProgressionService,
    private readonly review: ReviewService,
    private readonly learningPaths: LearningPathsService,
  ) {}

  // Saves the match once and returns the result for every rewarded player
  // (an empty list when the match had already ended).
  async save(summary: MatchSummary): Promise<FinishedPlayer[]> {
    const saved = await this.prisma.$transaction((tx) => this.saveInTransaction(tx, summary), {
      timeout: FINISH_TRANSACTION_TIMEOUT_MS,
    });
    return saved ? this.buildFinishedPlayers(summary.match.id, saved) : [];
  }

  async findResult(matchId: string, userId: string): Promise<MatchResult> {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: MATCH_RESULT_INCLUDE,
    });
    if (!match) {
      throw new NotFoundException(MATCH_NOT_FOUND_MESSAGE);
    }
    const viewer = match.players.find((player) => player.userId === userId);
    if (!viewer) {
      throw new ForbiddenException(NOT_IN_MATCH_MESSAGE);
    }
    if (match.status !== 'FINISHED') {
      throw new ConflictException('This match has no results yet.');
    }
    return toMatchResult(match, viewer, {
      path: await this.findPathResult(match, viewer),
      coinCapReached: this.coinCapWasReached(match, viewer),
    });
  }

  private async saveInTransaction(
    tx: Prisma.TransactionClient,
    summary: MatchSummary,
  ): Promise<SavedMatch | null> {
    const { count } = await tx.match.updateMany({
      where: { id: summary.match.id, status: 'IN_PROGRESS' },
      data: { status: summary.status, endedAt: new Date() },
    });
    if (count === 0) {
      return null;
    }

    const rewards = new Map<string, PlayerReward>();
    for (const player of summary.players) {
      const reward = player.rewarded ? await this.rewardPlayer(tx, summary, player) : null;
      await this.savePlayer(tx, summary.match.id, player, reward);
      if (reward) {
        rewards.set(player.userId, reward);
      }
    }
    return { rewards, path: await this.recordPathStep(tx, summary) };
  }

  private async rewardPlayer(
    tx: Prisma.TransactionClient,
    summary: MatchSummary,
    player: PlayerSummary,
  ): Promise<PlayerReward> {
    const someoneWon = summary.players.some((candidate) => candidate.isWinner);
    const reward = await this.progression.rewardMatchPlayer(
      player.userId,
      {
        mode: summary.match.mode,
        difficulty: summary.match.quiz.difficulty,
        correctCount: player.correctCount,
        outcome: playerOutcome(summary.match.mode, player.isWinner, someoneWon),
        abandoned: summary.status === 'ABANDONED',
      },
      tx,
    );
    await this.review.recordAnswers(
      player.userId,
      toReviewAnswers(player.answers, summary.questions),
      tx,
    );
    return reward;
  }

  private async savePlayer(
    tx: Prisma.TransactionClient,
    matchId: string,
    player: PlayerSummary,
    reward: PlayerReward | null,
  ): Promise<void> {
    await tx.matchPlayer.update({
      where: { matchId_userId: { matchId, userId: player.userId } },
      data: {
        score: player.score,
        correctCount: player.correctCount,
        isWinner: player.isWinner,
        answers: player.answers,
        xpEarned: reward?.xpEarned ?? 0,
        coinsEarned: reward?.coinsEarned ?? 0,
        leveledUp: reward?.leveledUp ?? false,
      },
    });
  }

  private async recordPathStep(
    tx: Prisma.TransactionClient,
    summary: MatchSummary,
  ): Promise<PathResult | null> {
    if (summary.status !== 'FINISHED' || summary.match.quiz.kind !== 'PATH_STEP') {
      return null;
    }
    const step = await this.learningPaths.findStepByQuiz(summary.match.quiz.id);
    const host = summary.players.find((player) => player.userId === summary.match.hostId);
    if (!step || !host) {
      return null;
    }

    const path = await this.learningPaths.recordStepResult(
      host.userId,
      step,
      host.correctCount,
      summary.questions.length,
      tx,
    );
    if (path.reward) {
      await tx.match.update({
        where: { id: summary.match.id },
        data: { stepReward: { coins: path.reward.coins, boost: path.reward.boost } },
      });
    }
    return path;
  }

  private async buildFinishedPlayers(
    matchId: string,
    saved: SavedMatch,
  ): Promise<FinishedPlayer[]> {
    const match = await this.prisma.match.findUniqueOrThrow({
      where: { id: matchId },
      include: MATCH_RESULT_INCLUDE,
    });
    const users = await this.prisma.user.findMany({
      where: { id: { in: [...saved.rewards.keys()] } },
      select: { id: true, coins: true },
    });

    return users.flatMap((user) => {
      const player = match.players.find((candidate) => candidate.userId === user.id);
      const reward = saved.rewards.get(user.id);
      if (!player || !reward) {
        return [];
      }
      const extras = { path: saved.path, coinCapReached: reward.coinCapReached };
      return [{ userId: user.id, coins: user.coins, result: toMatchResult(match, player, extras) }];
    });
  }

  // Rebuilds the path part of a saved result: this run's stars and the reward
  // stored on the match.
  private async findPathResult(
    match: ResultMatch,
    viewer: ResultMatchPlayer,
  ): Promise<PathResult | null> {
    const step = match.quiz.pathStep;
    if (!step) {
      return null;
    }
    const cleared = step.completedAt !== null;
    return {
      pathId: step.pathId,
      stepId: step.id,
      stars: starsForAccuracy(accuracyPercent(viewer.correctCount, match.quiz.questions.length)),
      cleared,
      nextStepId: cleared ? await this.learningPaths.findNextStepId(step) : null,
      reward: match.stepReward as StepReward | null,
    };
  }

  // The daily cap is the only thing that lowers match coins, so earning less
  // than the match was worth means the cap was hit.
  private coinCapWasReached(match: ResultMatch, viewer: ResultMatchPlayer): boolean {
    const someoneWon = match.players.some((player) => player.isWinner);
    const fullReward = matchReward({
      mode: match.mode,
      difficulty: match.quiz.difficulty,
      correctCount: viewer.correctCount,
      outcome: playerOutcome(match.mode, viewer.isWinner, someoneWon),
      abandoned: false,
    });
    return viewer.coinsEarned < fullReward.coins;
  }
}
