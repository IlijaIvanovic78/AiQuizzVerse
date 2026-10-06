import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PLAYER_NOT_FOUND_MESSAGE } from '../friends/friends.constants';
import { FriendsService } from '../friends/friends.service';
import { ReviewService } from '../review/review.service';
import { USERNAME_TAKEN_MESSAGE } from '../users/users.constants';
import { UsersService } from '../users/users.service';
import { CurrentUser } from '../users/users.types';
import { PROFILE_USER_SELECT, ProfileUserRow, toProfileUser } from './profile.mapper';
import { masteryByTheme, matchStats } from './profile.rules';
import { PlayedMatch, ProfileView } from './profile.types';

type ProfileRelationInfo = Pick<ProfileView, 'relation' | 'friendshipId'>;

const SELF: ProfileRelationInfo = { relation: 'SELF', friendshipId: null };

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly friends: FriendsService,
    private readonly review: ReviewService,
  ) {}

  async getOwnProfile(userId: string): Promise<ProfileView> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: PROFILE_USER_SELECT,
    });
    return this.buildProfile(user, SELF);
  }

  async getProfile(viewerId: string, username: string): Promise<ProfileView> {
    const user = await this.prisma.user.findFirst({
      where: { username: { equals: username, mode: 'insensitive' } },
      select: PROFILE_USER_SELECT,
    });
    if (!user) {
      throw new NotFoundException(PLAYER_NOT_FOUND_MESSAGE);
    }

    const relation =
      user.id === viewerId ? SELF : await this.friends.findRelation(viewerId, user.id);
    return this.buildProfile(user, relation);
  }

  async rename(userId: string, username: string): Promise<CurrentUser> {
    const user = await this.users.findByIdOrThrow(userId);
    // The taken check ignores case, so changing only the case of your own name must stay allowed.
    const isOwnName = user.username.toLowerCase() === username.toLowerCase();
    if (!isOwnName && (await this.users.isUsernameTaken(username))) {
      throw new ConflictException(USERNAME_TAKEN_MESSAGE);
    }

    await this.users.rename(userId, username);
    return this.users.findCurrentUser(userId);
  }

  private async buildProfile(
    user: ProfileUserRow,
    relation: ProfileRelationInfo,
  ): Promise<ProfileView> {
    const [matches, quizzesCreated, pathStars, mistakesToReview] = await Promise.all([
      this.findPlayedMatches(user.id),
      this.prisma.quiz.count({ where: { ownerId: user.id, kind: 'STANDARD', deletedAt: null } }),
      this.sumPathStars(user.id),
      this.review.countDue(user.id),
    ]);

    return {
      user: toProfileUser(user),
      stats: { ...matchStats(matches), quizzesCreated, pathStars, mistakesToReview },
      mastery: masteryByTheme(matches),
      ...relation,
    };
  }

  private async findPlayedMatches(userId: string): Promise<PlayedMatch[]> {
    const players = await this.prisma.matchPlayer.findMany({
      where: { userId, match: { status: 'FINISHED' } },
      select: {
        correctCount: true,
        outcome: true,
        match: {
          select: { quiz: { select: { theme: true, _count: { select: { questions: true } } } } },
        },
      },
    });
    return players.map((player) => ({
      theme: player.match.quiz.theme,
      questionCount: player.match.quiz._count.questions,
      correctCount: player.correctCount,
      outcome: player.outcome,
    }));
  }

  private async sumPathStars(userId: string): Promise<number> {
    const { _sum } = await this.prisma.pathStep.aggregate({
      _sum: { stars: true },
      where: { path: { ownerId: userId } },
    });
    return _sum.stars ?? 0;
  }
}
