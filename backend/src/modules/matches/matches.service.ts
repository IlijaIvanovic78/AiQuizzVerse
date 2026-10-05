import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { MatchMode, Prisma, Quiz } from '@prisma/client';
import { customAlphabet } from 'nanoid';
import { UNIQUE_VIOLATION } from '../../prisma/prisma.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { LearningPathsService } from '../learning-paths/learning-paths.service';
import { FEATURED_QUIZ_IDS, QUIZ_NOT_FOUND_MESSAGE } from '../quizzes/quizzes.constants';
import { NotificationsService } from '../realtime/notifications.service';
import { toPublicUser } from '../users/user.mapper';
import { CreateMatchDto } from './dto/create-match.dto';
import {
  HISTORY_INCLUDE,
  MATCH_VIEW_INCLUDE,
  MatchWithPlayers,
  NOBODY_CONNECTED,
  toHistoryEntry,
  toMatchView,
} from './match.mapper';
import {
  HISTORY_LIMIT,
  INVITE_CODE_ALPHABET,
  INVITE_CODE_LENGTH,
  MATCH_NOT_FOUND_MESSAGE,
  MATCH_STARTED_MESSAGE,
  MAX_PLAYERS_BY_MODE,
  NOT_IN_MATCH_MESSAGE,
} from './matches.constants';
import { MatchHistoryEntry, MatchView } from './matches.types';

const newInviteCode = customAlphabet(INVITE_CODE_ALPHABET, INVITE_CODE_LENGTH);

@Injectable()
export class MatchesService implements OnModuleInit {
  private readonly logger = new Logger(MatchesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly learningPaths: LearningPathsService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Sessions live in memory, so a match that was open before a restart cannot go on. */
  async onModuleInit(): Promise<void> {
    const { count } = await this.prisma.match.updateMany({
      where: { status: { in: ['WAITING', 'IN_PROGRESS'] } },
      data: { status: 'ABANDONED', endedAt: new Date() },
    });
    if (count > 0) {
      this.logger.log(`Marked ${count} interrupted matches as abandoned`);
    }
  }

  async create(userId: string, dto: CreateMatchDto): Promise<MatchView> {
    const quiz = await this.findPlayableQuiz(userId, dto.quizId);
    await this.assertModeAllowed(userId, quiz, dto.mode);
    if (dto.inviteFriendId) {
      await this.assertCanInvite(dto.mode, userId, dto.inviteFriendId);
    }

    const match = await this.createMatch(userId, quiz.id, dto.mode);
    if (dto.inviteFriendId) {
      this.sendInvite(match, dto.inviteFriendId);
    }
    return toMatchView(match, NOBODY_CONNECTED);
  }

  async join(userId: string, inviteCode: string): Promise<MatchView> {
    const matchId = await this.prisma.$transaction(async (tx) => {
      // Locks the match row, so two friends joining at once cannot both take the last seat.
      const [locked] = await tx.$queryRaw<{ id: string }[]>`
        SELECT id FROM matches WHERE invite_code = ${inviteCode} FOR UPDATE`;
      if (!locked) {
        throw new NotFoundException('No match uses this code. Check it and try again.');
      }

      const match = await tx.match.findUniqueOrThrow({
        where: { id: locked.id },
        include: { players: { select: { userId: true } } },
      });
      if (match.players.some((player) => player.userId === userId)) {
        return match.id;
      }
      if (match.status !== 'WAITING') {
        throw new ConflictException(MATCH_STARTED_MESSAGE);
      }
      if (match.players.length >= MAX_PLAYERS_BY_MODE[match.mode]) {
        throw new ConflictException('This match is full.');
      }
      await tx.matchPlayer.create({ data: { matchId: match.id, userId } });
      return match.id;
    });
    return this.getView(matchId, userId);
  }

  async history(userId: string): Promise<MatchHistoryEntry[]> {
    const rows = await this.prisma.matchPlayer.findMany({
      where: { userId, match: { status: 'FINISHED' } },
      orderBy: { match: { endedAt: 'desc' } },
      take: HISTORY_LIMIT,
      include: HISTORY_INCLUDE,
    });
    return rows.map(toHistoryEntry);
  }

  async getView(matchId: string, userId: string): Promise<MatchView> {
    return toMatchView(await this.findForPlayer(matchId, userId), NOBODY_CONNECTED);
  }

  async invite(matchId: string, userId: string, friendId: string): Promise<void> {
    const match = await this.findForPlayer(matchId, userId);
    if (match.hostId !== userId) {
      throw new ForbiddenException('Only the host can invite friends.');
    }
    if (match.status !== 'WAITING') {
      throw new ConflictException(MATCH_STARTED_MESSAGE);
    }
    await this.assertCanInvite(match.mode, userId, friendId);
    this.sendInvite(match, friendId);
  }

  async rematch(matchId: string, userId: string): Promise<MatchView> {
    const previous = await this.findForPlayer(matchId, userId);
    if (previous.status !== 'FINISHED' || previous.mode === 'SOLO') {
      throw new BadRequestException('Only finished team and party matches can be replayed.');
    }
    const quiz = await this.prisma.quiz.findFirst({
      where: { id: previous.quiz.id, deletedAt: null },
      select: { id: true },
    });
    if (!quiz) {
      throw new NotFoundException('This quiz is no longer available.');
    }

    const match = await this.createMatch(userId, quiz.id, previous.mode);
    previous.players
      .filter((player) => player.userId !== userId)
      .forEach((player) => this.sendInvite(match, player.userId));
    return toMatchView(match, NOBODY_CONNECTED);
  }

  async findForPlayer(matchId: string, userId: string): Promise<MatchWithPlayers> {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: MATCH_VIEW_INCLUDE,
    });
    if (!match) {
      throw new NotFoundException(MATCH_NOT_FOUND_MESSAGE);
    }
    if (!match.players.some((player) => player.userId === userId)) {
      throw new ForbiddenException(NOT_IN_MATCH_MESSAGE);
    }
    return match;
  }

  private async findPlayableQuiz(userId: string, quizId: string): Promise<Quiz> {
    const quiz = await this.prisma.quiz.findFirst({
      where: {
        id: quizId,
        deletedAt: null,
        OR: [{ ownerId: userId }, { id: { in: FEATURED_QUIZ_IDS } }],
      },
    });
    if (!quiz) {
      throw new NotFoundException(QUIZ_NOT_FOUND_MESSAGE);
    }
    return quiz;
  }

  private async assertModeAllowed(userId: string, quiz: Quiz, mode: MatchMode): Promise<void> {
    if (quiz.kind !== 'PATH_STEP') {
      return;
    }
    if (mode !== 'SOLO') {
      throw new BadRequestException('Learning path steps are played solo.');
    }
    const step = await this.learningPaths.findStepByQuiz(quiz.id);
    if (!step) {
      throw new NotFoundException('We could not find this learning path step.');
    }
    await this.learningPaths.assertStepUnlocked(userId, step);
  }

  private async assertCanInvite(mode: MatchMode, userId: string, friendId: string): Promise<void> {
    if (mode === 'SOLO') {
      throw new BadRequestException('Solo matches are just for you. Pick a team or party match.');
    }
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        status: 'ACCEPTED',
        OR: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId },
        ],
      },
      select: { id: true },
    });
    if (!friendship) {
      throw new BadRequestException('You can only invite your friends.');
    }
  }

  private async createMatch(
    hostId: string,
    quizId: string,
    mode: MatchMode,
  ): Promise<MatchWithPlayers> {
    try {
      return await this.insertMatch(hostId, quizId, mode);
    } catch (error) {
      if (!isUniqueViolation(error)) {
        throw error;
      }
      return this.insertMatch(hostId, quizId, mode);
    }
  }

  private insertMatch(hostId: string, quizId: string, mode: MatchMode): Promise<MatchWithPlayers> {
    return this.prisma.match.create({
      data: {
        mode,
        quizId,
        hostId,
        inviteCode: mode === 'SOLO' ? null : newInviteCode(),
        players: { create: { userId: hostId } },
      },
      include: MATCH_VIEW_INCLUDE,
    });
  }

  private sendInvite(match: MatchWithPlayers, friendId: string): void {
    const host = match.players.find((player) => player.userId === match.hostId);
    if (!host || !match.inviteCode) {
      return;
    }
    this.notifications.emitToUser(friendId, 'match:invite', {
      matchId: match.id,
      inviteCode: match.inviteCode,
      mode: match.mode,
      quizTitle: match.quiz.title,
      from: toPublicUser(host.user),
    });
  }
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === UNIQUE_VIOLATION;
}
