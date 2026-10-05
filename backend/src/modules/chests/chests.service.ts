import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ChestSource, ChestType, Prisma, UserChest } from '@prisma/client';
import { utcToday } from '../../common/utils/dates';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../realtime/notifications.service';
import { ShopService } from '../shop/shop.service';
import { toChestReward, toChestView } from './chest.mapper';
import {
  CHEST_ALREADY_OPEN_MESSAGE,
  CHEST_NOT_FOUND_MESSAGE,
  RECENT_CHESTS_LIMIT,
} from './chests.constants';
import { chestOdds, chestsForMatch, rollChest, skinPools } from './chests.rules';
import {
  ChestList,
  ChestOdds,
  ChestReward,
  ChestsEarnedToday,
  MatchChestFacts,
  NewChest,
  OpenedChest,
} from './chests.types';

@Injectable()
export class ChestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly shop: ShopService,
  ) {}

  async findAll(userId: string): Promise<ChestList> {
    const [unopened, recent] = await Promise.all([
      this.prisma.userChest.findMany({
        where: { userId, openedAt: null },
        orderBy: { earnedAt: 'desc' },
      }),
      this.prisma.userChest.findMany({
        where: { userId, openedAt: { not: null } },
        orderBy: { openedAt: 'desc' },
        take: RECENT_CHESTS_LIMIT,
      }),
    ]);
    return { unopened: unopened.map(toChestView), recent: recent.map(toChestView) };
  }

  findOdds(): ChestOdds {
    return chestOdds();
  }

  async open(userId: string, chestId: string): Promise<OpenedChest> {
    const chest = await this.findOwnChest(userId, chestId);
    if (chest.openedAt) {
      throw new ConflictException(CHEST_ALREADY_OPEN_MESSAGE);
    }
    const reward = await this.rollReward(userId, chest.type);
    const openedAt = new Date();

    const coins = await this.prisma.$transaction(async (tx) => {
      // Only the request that still finds the chest closed opens it, so a double click
      // pays the reward once.
      const { count } = await tx.userChest.updateMany({
        where: { id: chestId, openedAt: null },
        data: { openedAt, reward },
      });
      if (count === 0) {
        throw new ConflictException(CHEST_ALREADY_OPEN_MESSAGE);
      }
      return this.payReward(tx, userId, reward);
    });

    if (reward.coins > 0) {
      this.notifications.emitToUser(userId, 'coins:updated', { coins });
    }
    return { chest: { ...toChestView(chest), openedAt, reward }, reward, coins };
  }

  // Locks the user row first, so two matches ending at the same time cannot both
  // take the last daily or victory chest of the day.
  async grantForMatch(
    userId: string,
    match: MatchChestFacts,
    db: Prisma.TransactionClient = this.prisma,
  ): Promise<void> {
    await db.$queryRaw`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`;
    const earnedToday = await this.countEarnedToday(db, userId);
    const chests = chestsForMatch(match, earnedToday);
    await db.userChest.createMany({
      data: chests.map((chest) => ({ ...chest, userId, matchId: match.matchId })),
    });
  }

  async grant(
    userId: string,
    chest: NewChest,
    db: Prisma.TransactionClient = this.prisma,
  ): Promise<void> {
    await db.userChest.create({ data: { ...chest, userId } });
  }

  private async rollReward(userId: string, type: ChestType): Promise<ChestReward> {
    const [items, customer] = await Promise.all([
      this.prisma.item.findMany({ where: { isStarter: false } }),
      this.shop.findCustomer(userId),
    ]);
    const rolled = rollChest(type, skinPools(items), customer.ownedItemIds, Math.random);
    return toChestReward(rolled, customer);
  }

  private async payReward(
    tx: Prisma.TransactionClient,
    userId: string,
    reward: ChestReward,
  ): Promise<number> {
    for (const boost of reward.boosts) {
      await tx.userBoost.upsert({
        where: { userId_type: { userId, type: boost.type } },
        create: { userId, ...boost },
        update: { quantity: { increment: boost.quantity } },
      });
    }
    if (reward.item && !reward.duplicate) {
      await tx.userItem.create({ data: { userId, itemId: reward.item.id } });
    }
    const user = await tx.user.update({
      where: { id: userId },
      data: { coins: { increment: reward.coins } },
      select: { coins: true },
    });
    return user.coins;
  }

  private async countEarnedToday(
    db: Prisma.TransactionClient,
    userId: string,
  ): Promise<ChestsEarnedToday> {
    const since = utcToday();
    const countSince = (source: ChestSource) =>
      db.userChest.count({ where: { userId, source, earnedAt: { gte: since } } });
    return { daily: await countSince('DAILY_MATCH'), victories: await countSince('VICTORY') };
  }

  private async findOwnChest(userId: string, chestId: string): Promise<UserChest> {
    const chest = await this.prisma.userChest.findFirst({ where: { id: chestId, userId } });
    if (!chest) {
      throw new NotFoundException(CHEST_NOT_FOUND_MESSAGE);
    }
    return chest;
  }
}
