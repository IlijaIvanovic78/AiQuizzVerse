import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  MATCH_VIEW_INCLUDE,
  SESSION_SETUP_INCLUDE,
  toMatchView,
  toSessionSetup,
} from './match.mapper';
import { LivePlayerStats, MatchBoostType, MatchView, SessionSetup } from './matches.types';

/** The small database steps of a live match: lobby, start, abandon and power-ups. */
@Injectable()
export class MatchPlayService {
  constructor(private readonly prisma: PrismaService) {}

  async findLobbyView(
    matchId: string,
    connectedUserIds: string[],
    liveStats: LivePlayerStats[],
  ): Promise<MatchView> {
    const match = await this.prisma.match.findUniqueOrThrow({
      where: { id: matchId },
      include: MATCH_VIEW_INCLUDE,
    });
    return toMatchView(match, connectedUserIds, liveStats);
  }

  async loadSessionSetup(matchId: string): Promise<SessionSetup> {
    const match = await this.prisma.match.findUniqueOrThrow({
      where: { id: matchId },
      include: SESSION_SETUP_INCLUDE,
    });
    return toSessionSetup(match);
  }

  /** Only one caller can move a match out of WAITING, so only one session is ever created. */
  async claimStart(matchId: string): Promise<boolean> {
    const { count } = await this.prisma.match.updateMany({
      where: { id: matchId, status: 'WAITING' },
      data: { status: 'IN_PROGRESS', startedAt: new Date() },
    });
    return count === 1;
  }

  async abandon(matchId: string): Promise<void> {
    await this.prisma.match.updateMany({
      where: { id: matchId, status: { in: ['WAITING', 'IN_PROGRESS'] } },
      data: { status: 'ABANDONED', endedAt: new Date() },
    });
  }

  async removeGuest(matchId: string, userId: string): Promise<void> {
    await this.prisma.matchPlayer.deleteMany({
      where: { matchId, userId, match: { status: 'WAITING' } },
    });
  }

  async spendBoost(userId: string, type: MatchBoostType): Promise<boolean> {
    const { count } = await this.prisma.userBoost.updateMany({
      where: { userId, type, quantity: { gte: 1 } },
      data: { quantity: { decrement: 1 } },
    });
    return count === 1;
  }

  async ownedBoosts(userId: string, type: MatchBoostType): Promise<number> {
    const boost = await this.prisma.userBoost.findUnique({
      where: { userId_type: { userId, type } },
      select: { quantity: true },
    });
    return boost?.quantity ?? 0;
  }
}
