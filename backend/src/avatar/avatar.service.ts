import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ItemType } from '@prisma/client';

@Injectable()
export class AvatarService {
  constructor(private readonly prisma: PrismaService) {}

  /** Get all AVATAR items owned by a user (excludes pets) */
  async getUserItems(userId: string) {
    return this.prisma.userItem.findMany({
      where: { userId, item: { type: ItemType.AVATAR } },
      include: { item: true },
    });
  }

  /** Get the currently equipped AVATAR */
  async getEquipped(userId: string) {
    return this.prisma.userItem.findFirst({
      where: { userId, isEquipped: true, item: { type: ItemType.AVATAR } },
      include: { item: true },
    });
  }

  /** Select (equip) an avatar — unequips only current avatar, updates user.avatarUrl */
  async selectAvatar(userId: string, userItemId: string) {
    const userItem = await this.prisma.userItem.findFirst({
      where: { id: userItemId, userId },
      include: { item: true },
    });
    if (!userItem) throw new NotFoundException('Avatar not found in inventory');
    if (userItem.item.type !== ItemType.AVATAR) throw new BadRequestException('Item is not an avatar');

    await this.prisma.$transaction([
      // Unequip only AVATAR items (not pets)
      this.prisma.userItem.updateMany({
        where: { userId, isEquipped: true, item: { type: ItemType.AVATAR } },
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
    const owned = await this.prisma.userItem.count({ where: { userId, item: { type: ItemType.AVATAR } } });
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

  /** Get all PET items owned by a user */
  async getUserPets(userId: string) {
    return this.prisma.userItem.findMany({
      where: { userId, item: { type: ItemType.PET } },
      include: { item: true },
    });
  }

  /** Get the currently equipped pet */
  async getEquippedPet(userId: string) {
    return this.prisma.userItem.findFirst({
      where: { userId, isEquipped: true, item: { type: ItemType.PET } },
      include: { item: true },
    });
  }

  /** Select (equip) a pet — unequips only current pet, updates user.petUrl */
  async selectPet(userId: string, userItemId: string) {
    const userItem = await this.prisma.userItem.findFirst({
      where: { id: userItemId, userId },
      include: { item: true },
    });
    if (!userItem) throw new NotFoundException('Pet not found in inventory');
    if (userItem.item.type !== ItemType.PET) throw new BadRequestException('Item is not a pet');

    await this.prisma.$transaction([
      this.prisma.userItem.updateMany({
        where: { userId, isEquipped: true, item: { type: ItemType.PET } },
        data: { isEquipped: false },
      }),
      this.prisma.userItem.update({
        where: { id: userItemId },
        data: { isEquipped: true },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { petUrl: userItem.item.imagePath },
      }),
    ]);

    return this.getEquippedPet(userId);
  }

  /** Unequip current pet */
  async unequipPet(userId: string) {
    await this.prisma.$transaction([
      this.prisma.userItem.updateMany({
        where: { userId, isEquipped: true, item: { type: ItemType.PET } },
        data: { isEquipped: false },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { petUrl: null },
      }),
    ]);
    return { success: true };
  }
}
