import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BoostType, Item, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { levelForXp } from '../progression/progression.rules';
import { UsersService } from '../users/users.service';
import { CurrentUser } from '../users/users.types';
import { toShopItem } from './shop-item.mapper';
import { BOOST_CATALOG, ITEM_NOT_FOUND_MESSAGE } from './shop.constants';
import { BoostOffer, BoostPurchase, ItemPurchase, ShopCustomer, ShopItem } from './shop.types';

@Injectable()
export class ShopService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
  ) {}

  async listItems(userId: string): Promise<ShopItem[]> {
    const [items, customer] = await Promise.all([
      this.prisma.item.findMany({ orderBy: [{ type: 'asc' }, { price: 'asc' }, { name: 'asc' }] }),
      this.findCustomer(userId),
    ]);
    return items.map((item) => toShopItem(item, customer));
  }

  async buyItem(userId: string, itemId: string): Promise<ItemPurchase> {
    const item = await this.findItem(itemId);
    assertCanBuy(item, await this.findCustomer(userId));

    await this.prisma.$transaction(async (tx) => {
      await this.spendCoins(tx, userId, item.price);
      await tx.userItem.create({ data: { userId, itemId } });
    });

    const customer = await this.findCustomer(userId);
    return { coins: customer.coins, item: toShopItem(item, customer) };
  }

  async claimStarter(userId: string, itemId: string): Promise<CurrentUser> {
    const item = await this.findItem(itemId);
    if (!item.isStarter) {
      throw new BadRequestException('Pick one of the starter heroes.');
    }

    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.user.updateMany({
        where: { id: userId, avatarKey: null },
        data: { avatarKey: item.id },
      });
      if (count === 0) {
        throw new BadRequestException('You already have a hero.');
      }
      await tx.userItem.upsert({
        where: { userId_itemId: { userId, itemId } },
        create: { userId, itemId },
        update: {},
      });
    });
    return this.users.findCurrentUser(userId);
  }

  async listBoosts(userId: string): Promise<BoostOffer[]> {
    const boosts = await this.prisma.userBoost.findMany({ where: { userId } });
    return BOOST_CATALOG.map((entry) => ({
      ...entry,
      owned: boosts.find((boost) => boost.type === entry.type)?.quantity ?? 0,
    }));
  }

  async buyBoost(userId: string, type: BoostType): Promise<BoostPurchase> {
    const entry = BOOST_CATALOG.find((boost) => boost.type === type);
    if (!entry || entry.price === null) {
      throw new BadRequestException("This power-up can't be bought. Find it in golden chests.");
    }
    const price = entry.price;

    const { coins, quantity } = await this.prisma.$transaction(async (tx) => {
      await this.spendCoins(tx, userId, price);
      const boost = await tx.userBoost.upsert({
        where: { userId_type: { userId, type } },
        create: { userId, type, quantity: 1 },
        update: { quantity: { increment: 1 } },
      });
      const user = await tx.user.findUniqueOrThrow({
        where: { id: userId },
        select: { coins: true },
      });
      return { coins: user.coins, quantity: boost.quantity };
    });
    return { coins, boost: { ...entry, owned: quantity } };
  }

  async findCustomer(userId: string): Promise<ShopCustomer> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        coins: true,
        xp: true,
        avatarKey: true,
        petKey: true,
        items: { select: { itemId: true } },
      },
    });
    return {
      coins: user.coins,
      xp: user.xp,
      avatarKey: user.avatarKey,
      petKey: user.petKey,
      ownedItemIds: new Set(user.items.map((owned) => owned.itemId)),
    };
  }

  // The coin check and the decrement are one statement, so two quick purchases
  // cannot overspend.
  private async spendCoins(
    tx: Prisma.TransactionClient,
    userId: string,
    price: number,
  ): Promise<void> {
    const { count } = await tx.user.updateMany({
      where: { id: userId, coins: { gte: price } },
      data: { coins: { decrement: price } },
    });
    if (count === 0) {
      throw new BadRequestException('Not enough coins. Play quizzes to earn more coins.');
    }
  }

  private async findItem(itemId: string): Promise<Item> {
    const item = await this.prisma.item.findUnique({ where: { id: itemId } });
    if (!item) {
      throw new NotFoundException(ITEM_NOT_FOUND_MESSAGE);
    }
    return item;
  }
}

function assertCanBuy(item: Item, customer: ShopCustomer): void {
  if (item.isStarter) {
    throw new BadRequestException('Starter heroes are free. You pick one when you begin.');
  }
  if (item.isChestOnly) {
    throw new BadRequestException("This one can't be bought. Find it in chests!");
  }
  if (customer.ownedItemIds.has(item.id)) {
    throw new BadRequestException('You already own this.');
  }
  if (levelForXp(customer.xp) < item.minLevel) {
    throw new BadRequestException(`Reach level ${item.minLevel} to unlock this.`);
  }
}
