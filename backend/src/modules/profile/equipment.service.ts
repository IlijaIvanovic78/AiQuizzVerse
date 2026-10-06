import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Item } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ITEM_NOT_FOUND_MESSAGE } from '../shop/shop.constants';
import { UsersService } from '../users/users.service';
import { CurrentUser } from '../users/users.types';

/** Puts on the heroes and pets a player owns: the hero is the avatar, the pet walks next to it. */
@Injectable()
export class EquipmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
  ) {}

  async equip(userId: string, itemId: string): Promise<CurrentUser> {
    const item = await this.prisma.item.findUnique({ where: { id: itemId } });
    if (!item) {
      throw new NotFoundException(ITEM_NOT_FOUND_MESSAGE);
    }
    if (item.type === 'SABOTAGE') {
      throw new BadRequestException('Sabotages are not worn. They work in party matches.');
    }
    await this.assertOwned(userId, item);

    const slot = item.type === 'AVATAR' ? { avatarKey: item.id } : { petKey: item.id };
    await this.prisma.user.update({ where: { id: userId }, data: slot });
    return this.users.findCurrentUser(userId);
  }

  async unequipPet(userId: string): Promise<CurrentUser> {
    await this.prisma.user.update({ where: { id: userId }, data: { petKey: null } });
    return this.users.findCurrentUser(userId);
  }

  private async assertOwned(userId: string, item: Item): Promise<void> {
    const owned = await this.prisma.userItem.count({ where: { userId, itemId: item.id } });
    if (owned === 0) {
      throw new BadRequestException(
        item.isChestOnly ? 'Find this one in chests first.' : 'Get this item in the shop first.',
      );
    }
  }
}
