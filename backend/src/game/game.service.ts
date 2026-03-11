import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MatchType, MatchStatus } from '@prisma/client';
import { nanoid } from 'nanoid';

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
    const timeLimit = match.quiz.timePerQuestion * 1000; // ms
    const points = correct
      ? 100 + Math.max(0, Math.floor(((timeLimit - timeMs) / timeLimit) * 50))
      : 0;

    const player = await this.prisma.matchPlayer.findUnique({
      where: { matchId_userId: { matchId, userId } },
    });
    if (!player) throw new ForbiddenException('You are not in this match');

    // Append answer to JSON array
    const existingAnswers = (player.answers as any[]) || [];
    const updatedAnswers = [
      ...existingAnswers,
      { questionId, answer, timeMs, correct, points },
    ];

    await this.prisma.matchPlayer.update({
      where: { id: player.id },
      data: {
        answers: updatedAnswers,
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
      take: 20,
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
}
