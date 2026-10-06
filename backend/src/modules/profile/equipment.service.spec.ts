import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Item, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { CurrentUser } from '../users/users.types';
import { EquipmentService } from './equipment.service';

const hero: Item = {
  id: 'mini-mage',
  name: 'Mage',
  description: '',
  type: 'AVATAR',
  price: 60,
  minLevel: 1,
  isStarter: false,
  isChestOnly: false,
};
const pet: Item = { ...hero, id: 'pet-fox', name: 'Fox', type: 'PET' };
const chestPet: Item = { ...pet, id: 'pet-dragon-gold', name: 'Gold dragon', isChestOnly: true };
const sabotage: Item = { ...hero, id: 'sabotage-fog', name: 'Fog', type: 'SABOTAGE' };
const CATALOG = [hero, pet, chestPet, sabotage];

let ownedItemIds: string[];
let savedSlots: Prisma.UserUpdateInput[];
let equipment: EquipmentService;

beforeEach(() => {
  ownedItemIds = [hero.id, pet.id, sabotage.id];
  savedSlots = [];
  const prisma = {
    item: {
      findUnique: ({ where }: { where: { id: string } }) =>
        Promise.resolve(CATALOG.find((item) => item.id === where.id) ?? null),
    },
    userItem: {
      count: ({ where }: { where: { itemId: string } }) =>
        Promise.resolve(ownedItemIds.includes(where.itemId) ? 1 : 0),
    },
    user: {
      update: ({ data }: { data: Prisma.UserUpdateInput }) => {
        savedSlots.push(data);
        return Promise.resolve();
      },
    },
  } as unknown as PrismaService;
  const users = {
    findCurrentUser: () => Promise.resolve({} as CurrentUser),
  } as unknown as UsersService;
  equipment = new EquipmentService(prisma, users);
});

describe('EquipmentService', () => {
  it('wears an owned hero as the avatar', async () => {
    await equipment.equip('user-1', hero.id);
    expect(savedSlots).toEqual([{ avatarKey: 'mini-mage' }]);
  });

  it('wears an owned pet without touching the hero', async () => {
    await equipment.equip('user-1', pet.id);
    expect(savedSlots).toEqual([{ petKey: 'pet-fox' }]);
  });

  it('takes the pet off', async () => {
    await equipment.unequipPet('user-1');
    expect(savedSlots).toEqual([{ petKey: null }]);
  });

  it('never wears a sabotage, even an owned one', async () => {
    await expect(equipment.equip('user-1', sabotage.id)).rejects.toThrow(
      'Sabotages are not worn. They work in party matches.',
    );
    expect(savedSlots).toEqual([]);
  });

  it('refuses an item the player does not own and says where to get it', async () => {
    ownedItemIds = [];
    await expect(equipment.equip('user-1', hero.id)).rejects.toThrow(
      'Get this item in the shop first.',
    );
    await expect(equipment.equip('user-1', chestPet.id)).rejects.toThrow(
      'Find this one in chests first.',
    );
    await expect(equipment.equip('user-1', chestPet.id)).rejects.toThrow(BadRequestException);
    expect(savedSlots).toEqual([]);
  });

  it('answers 404 for an item that does not exist', async () => {
    await expect(equipment.equip('user-1', 'no-such-item')).rejects.toThrow(NotFoundException);
  });
});
