import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { BoostType, ItemType } from '@prisma/client';
import { BOOST_PRICES } from '../../core/constants';

@Injectable()
export class ShopService {
  constructor(private readonly prisma: PrismaService) {}

  async getItems(type?: string) {
    const validTypes = Object.values(ItemType);
    const filterType = type && validTypes.includes(type as ItemType) ? (type as ItemType) : undefined;

    return this.prisma.item.findMany({
      where: filterType ? { type: filterType } : undefined,
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

    const isEquippable = item.type === ItemType.AVATAR || item.type === ItemType.PET;

    if (isEquippable) {
      const [, , userItem] = await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: userId },
          data: { coins: { decrement: item.price } },
        }),
        this.prisma.userItem.updateMany({
          where: { userId, isEquipped: true, item: { type: item.type } },
          data: { isEquipped: false },
        }),
        this.prisma.userItem.create({
          data: { userId, itemId, isEquipped: true },
          include: { item: true },
        }),
        this.prisma.user.update({
          where: { id: userId },
          data: { [item.type === ItemType.AVATAR ? 'avatarUrl' : 'petUrl']: item.imagePath },
        }),
      ]);
      return userItem;
    }

    const [, userItem] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { coins: { decrement: item.price } },
      }),
      this.prisma.userItem.create({
        data: { userId, itemId },
        include: { item: true },
      }),
    ]);
    return userItem;
  }

  async buyBoost(userId: string, type: BoostType) {
    const price = BOOST_PRICES[type];
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
