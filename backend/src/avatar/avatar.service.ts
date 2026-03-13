import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ItemType } from '@prisma/client';

@Injectable()
export class AvatarService {
  constructor(private readonly prisma: PrismaService) {}

  /** Get all avatar items owned by a user */
  async getUserItems(userId: string) {
    return this.prisma.userItem.findMany({
      where: { userId },
      include: { item: true },
    });
  }

  /** Get the currently equipped (selected) avatar */
  async getEquipped(userId: string) {
    return this.prisma.userItem.findFirst({
      where: { userId, isEquipped: true },
      include: { item: true },
    });
  }

  /** Select (equip) an avatar — unequips any current one first, updates user.avatarUrl */
  async selectAvatar(userId: string, userItemId: string) {
    const userItem = await this.prisma.userItem.findFirst({
      where: { id: userItemId, userId },
      include: { item: true },
    });
    if (!userItem) throw new NotFoundException('Avatar not found in inventory');

    await this.prisma.$transaction([
      // Unequip all current avatars
      this.prisma.userItem.updateMany({
        where: { userId, isEquipped: true },
        data: { isEquipped: false },
      }),
      // Equip selected
      this.prisma.userItem.update({
        where: { id: userItemId },
        data: { isEquipped: true },
      }),
      // Update user's avatarUrl
      this.prisma.user.update({
        where: { id: userId },
        data: { avatarUrl: userItem.item.imagePath },
      }),
    ]);

    return this.getEquipped(userId);
  }

  /** Get the 3 free starter avatars (price = 0) */
  async getStarters() {
    return this.prisma.item.findMany({
      where: { type: ItemType.AVATAR, price: 0 },
      orderBy: { name: 'asc' },
    });
  }

  /** First-login: pick a free starter avatar */
  async selectStarter(userId: string, itemId: string) {
    // Check user doesn't already own any avatar
    const owned = await this.prisma.userItem.count({ where: { userId } });
    if (owned > 0) throw new BadRequestException('You already have an avatar');

    // Verify the item is a free starter
    const item = await this.prisma.item.findUnique({ where: { id: itemId } });
    if (!item || item.type !== ItemType.AVATAR || item.price !== 0) {
      throw new BadRequestException('Invalid starter avatar');
    }

    // Give the user this avatar item + equip + set avatarUrl
    const [userItem] = await this.prisma.$transaction([
      this.prisma.userItem.create({
        data: { userId, itemId, isEquipped: true },
        include: { item: true },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { avatarUrl: item.imagePath },
      }),
    ]);

    return userItem;
  }
}
