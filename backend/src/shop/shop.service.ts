import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BoostType, ItemType } from '@prisma/client';

@Injectable()
export class ShopService {
  constructor(private readonly prisma: PrismaService) {}

  /** List all items, optionally filtered by type */
  async getItems(type?: string) {
    return this.prisma.item.findMany({
      where: type ? { type: type as any } : undefined,
      orderBy: [{ type: 'asc' }, { price: 'asc' }],
    });
  }

  /** Buy an item for the user */
  async buyItem(userId: string, itemId: string) {
    const item = await this.prisma.item.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Item not found');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.level < item.minLevel) {
      throw new BadRequestException(`Requires level ${item.minLevel}`);
    }
    if (user.coins < item.price) {
      throw new BadRequestException('Not enough coins');
    }

    // Check if already owned
    const existing = await this.prisma.userItem.findUnique({
      where: { userId_itemId: { userId, itemId } },
    });
    if (existing) throw new BadRequestException('Item already owned');

    // Transaction: deduct coins + create user item + auto-equip avatar
    const txOps: any[] = [
      this.prisma.user.update({
        where: { id: userId },
        data: { coins: { decrement: item.price } },
      }),
    ];

    // If buying an AVATAR, unequip current, equip new, set avatarUrl
    if (item.type === ItemType.AVATAR) {
      txOps.push(
        this.prisma.userItem.updateMany({
          where: { userId, isEquipped: true },
          data: { isEquipped: false },
        }),
      );
      txOps.push(
        this.prisma.userItem.create({
          data: { userId, itemId, isEquipped: true },
          include: { item: true },
        }),
      );
      txOps.push(
        this.prisma.user.update({
          where: { id: userId },
          data: { avatarUrl: item.imagePath },
        }),
      );
    } else {
      txOps.push(
        this.prisma.userItem.create({
          data: { userId, itemId },
          include: { item: true },
        }),
      );
    }

    const results = await this.prisma.$transaction(txOps);
    // The userItem is at index 2 for avatars, index 1 for others
    return item.type === ItemType.AVATAR ? results[2] : results[1];
  }

  /** Buy a boost for the user */
  async buyBoost(userId: string, type: BoostType) {
    const prices: Record<BoostType, number> = {
      HINT: 20,
      EXTRA_TIME: 15,
      FIFTY_FIFTY: 25,
      DOUBLE_POINTS: 30,
      SHIELD: 35,
      STREAK_FREEZE: 40,
    };

    const price = prices[type];
    if (price === undefined) throw new BadRequestException('Invalid boost type');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.coins < price) throw new BadRequestException('Not enough coins');

    // Transaction: deduct coins + upsert boost quantity
    const [, boost] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { coins: { decrement: price } },
      }),
      this.prisma.userBoost.upsert({
        where: { userId_type: { userId, type } },
        update: { quantity: { increment: 1 } },
        create: { userId, type, quantity: 1 },
      }),
    ]);

    return boost;
  }

  /** Get user's boosts */
  async getUserBoosts(userId: string) {
    return this.prisma.userBoost.findMany({ where: { userId } });
  }
}
