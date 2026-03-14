import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { MatchType, MatchStatus, BoostType } from '@prisma/client';
import { nanoid } from 'nanoid';
import { PlayerAnswer } from '../../core/types';
import { MATCH_HISTORY_LIMIT } from '../../core/constants/app.constants';
import { calculateAnswerScore } from '../../core/constants';
import { USER_MATCH_SELECT } from '../../shared/constants';

@Injectable()
export class GameService {
  constructor(private readonly prisma: PrismaService) {}

  /** Create a new match and add the creator as first player */
  async createMatch(userId: string, quizId: string, type: MatchType) {
    // Verify quiz exists and has questions
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { _count: { select: { questions: true } } },
    });
    if (!quiz) throw new NotFoundException('Quiz not found');
    if (quiz._count.questions === 0) {
      throw new BadRequestException('Quiz has no questions');
    }

    const inviteCode = type === MatchType.SOLO ? null : nanoid(6);
    const status = type === MatchType.SOLO ? MatchStatus.IN_PROGRESS : MatchStatus.WAITING;

    const match = await this.prisma.match.create({
      data: {
        type,
        status,
        quizId,
        inviteCode,
        players: {
          create: { userId },
        },
      },
      include: {
        players: { include: { user: { select: { id: true, username: true, avatarUrl: true } } } },
        quiz: { include: { questions: true } },
      },
    });

    return match;
  }

  /** Join an existing match via invite code */
  async joinMatch(userId: string, inviteCode: string) {
    const match = await this.prisma.match.findUnique({
      where: { inviteCode },
      include: {
        players: { include: { user: { select: { id: true, username: true, avatarUrl: true } } } },
        quiz: { include: { questions: true } },
      },
    });

    if (!match) throw new NotFoundException('Match not found');
    if (match.status !== MatchStatus.WAITING) {
      throw new BadRequestException('Match is no longer accepting players');
    }

    // Check if already joined
    if (match.players.some((p) => p.userId === userId)) {
      throw new BadRequestException('You already joined this match');
    }

    // PvP = max 2, COOP = max 2
    const maxPlayers = match.type === MatchType.RANKED ? 1 : 2;
    if (match.players.length >= maxPlayers) {
      throw new BadRequestException('Match is full');
    }

    await this.prisma.matchPlayer.create({
      data: { matchId: match.id, userId },
    });

    // Auto-start when full
    const updated = await this.prisma.match.update({
      where: { id: match.id },
      data: { status: MatchStatus.IN_PROGRESS },
      include: {
        players: { include: { user: { select: { id: true, username: true, avatarUrl: true } } } },
        quiz: { include: { questions: true } },
      },
    });

    return updated;
  }

  /** Record a player's answer and compute points */
  async submitAnswer(
    matchId: string,
    userId: string,
    questionId: string,
    answer: number,
    timeMs: number,
  ) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: { quiz: { include: { questions: true } } },
    });
    if (!match) throw new NotFoundException('Match not found');
    if (match.status !== MatchStatus.IN_PROGRESS) {
      throw new BadRequestException('Match is not in progress');
    }

    const question = match.quiz.questions.find((q) => q.id === questionId);
    if (!question) throw new NotFoundException('Question not found in this quiz');

    const correct = question.correctAnswer === answer;
    const timeLimitMs = match.quiz.timePerQuestion * 1000;
    const points = calculateAnswerScore(correct, timeMs, timeLimitMs);

    const player = await this.prisma.matchPlayer.findUnique({
      where: { matchId_userId: { matchId, userId } },
    });
    if (!player) throw new ForbiddenException('You are not in this match');

    const existingAnswers: PlayerAnswer[] = Array.isArray(player.answers)
      ? (player.answers as unknown as PlayerAnswer[])
      : [];
    const updatedAnswers: PlayerAnswer[] = [
      ...existingAnswers,
      { questionId, answer, timeMs, correct, points },
    ];

    await this.prisma.matchPlayer.update({
      where: { id: player.id },
      data: {
        answers: updatedAnswers as unknown as import('@prisma/client').Prisma.InputJsonValue,
        score: { increment: points },
      },
    });

    return { correct, points, correctAnswer: question.correctAnswer, explanation: question.explanation, answer };
  }

  /** Finish a match and determine winner(s) */
  async finishMatch(matchId: string) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        players: { include: { user: { select: { id: true, username: true, avatarUrl: true } } } },
      },
    });
    if (!match) throw new NotFoundException('Match not found');

    // Determine winner(s)
    const maxScore = Math.max(...match.players.map((p) => p.score));
    const winnerIds = match.players
      .filter((p) => p.score === maxScore)
      .map((p) => p.id);

    // Mark winners
    if (winnerIds.length > 0) {
      await this.prisma.matchPlayer.updateMany({
        where: { id: { in: winnerIds } },
        data: { isWinner: true },
      });
    }

    // Close match
    const finished = await this.prisma.match.update({
      where: { id: matchId },
      data: { status: MatchStatus.COMPLETED, endedAt: new Date() },
      include: {
        players: { include: { user: { select: { id: true, username: true, avatarUrl: true } } } },
        quiz: { select: { id: true, title: true, theme: true } },
      },
    });

    return finished;
  }

  /** Get match details */
  async getMatch(matchId: string) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        players: { include: { user: { select: { id: true, username: true, avatarUrl: true } } } },
        quiz: { select: { id: true, title: true, theme: true, numQuestions: true, timePerQuestion: true } },
      },
    });
    if (!match) throw new NotFoundException('Match not found');
    return match;
  }

  /** Get quiz questions (ordered by creation) */
  async getQuizQuestions(quizId: string) {
    return this.prisma.question.findMany({
      where: { quizId },
      orderBy: { id: 'asc' },
    });
  }

  /** Get user's match history */
  async getHistory(userId: string) {
    return this.prisma.matchPlayer.findMany({
      where: { userId },
      orderBy: { match: { createdAt: 'desc' } },
      take: MATCH_HISTORY_LIMIT,
      include: {
        match: {
          include: {
            quiz: { select: { id: true, title: true, theme: true } },
            players: { include: { user: { select: { id: true, username: true } } } },
          },
        },
      },
    });
  }

  /** Use a boost — decrement quantity, return boost effect data */
  async useBoost(userId: string, type: BoostType, matchId: string, questionId?: string) {
    const boost = await this.prisma.userBoost.findUnique({
      where: { userId_type: { userId, type } },
    });
    if (!boost || boost.quantity < 1) {
      throw new BadRequestException('No boost available');
    }

    await this.prisma.userBoost.update({
      where: { id: boost.id },
      data: { quantity: { decrement: 1 } },
    });

    // Compute boost-specific payload
    if (type === 'FIFTY_FIFTY' && questionId) {
      return { type, effect: await this.fiftyFifty(matchId, questionId) };
    }
    if (type === 'HINT' && questionId) {
      const match = await this.prisma.match.findUnique({
        where: { id: matchId },
        include: { quiz: { include: { questions: true } } },
      });
      const q = match?.quiz.questions.find((q) => q.id === questionId);
      return { type, effect: { hint: q?.explanation || 'Think carefully!' } };
    }

    // EXTRA_TIME, DOUBLE_POINTS, SHIELD, STREAK_FREEZE — handled on client
    return { type, effect: null };
  }

  /** Return indices of 2 wrong answers to eliminate */
  private async fiftyFifty(matchId: string, questionId: string): Promise<{ eliminatedIndices: number[] }> {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: { quiz: { include: { questions: true } } },
    });
    const question = match?.quiz.questions.find((q) => q.id === questionId);
    if (!question) return { eliminatedIndices: [] };

    const wrongIndices = [0, 1, 2, 3].filter((i) => i !== question.correctAnswer);
    // Shuffle and take 2
    for (let i = wrongIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [wrongIndices[i], wrongIndices[j]] = [wrongIndices[j], wrongIndices[i]];
    }
    return { eliminatedIndices: wrongIndices.slice(0, 2) };
  }
}
