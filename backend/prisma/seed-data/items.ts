import { ItemType } from '@prisma/client';

interface SeedItem {
  id: string;
  name: string;
  type: ItemType;
  price: number;
  minLevel: number;
  isStarter: boolean;
  isChestOnly: boolean;
}

function hero(id: string, name: string, price: number, minLevel: number): SeedItem {
  return { id, name, type: 'AVATAR', price, minLevel, isStarter: false, isChestOnly: false };
}

function starterHero(id: string, name: string): SeedItem {
  return { id, name, type: 'AVATAR', price: 0, minLevel: 1, isStarter: true, isChestOnly: false };
}

function pet(id: string, name: string, price: number, minLevel: number): SeedItem {
  return { id, name, type: 'PET', price, minLevel, isStarter: false, isChestOnly: false };
}

/** Never sold, so it has no price or level: it can only come out of a chest. */
function chestOnly(id: string, name: string, type: ItemType): SeedItem {
  return { id, name, type, price: 0, minLevel: 1, isStarter: false, isChestOnly: true };
}

export const SEED_ITEMS: SeedItem[] = [
  starterHero('mini-sword-man', 'Swordsman'),
  starterHero('mini-archer-man', 'Archer'),
  starterHero('mini-mage', 'Mage'),
  hero('mini-shield-man', 'Shield Bearer', 80, 1),
  hero('mini-spear-man', 'Spearman', 100, 1),
  hero('mini-cross-bow-man', 'Crossbowman', 120, 2),
  hero('mini-halberd-man', 'Halberdier', 150, 2),
  hero('mini-cavalier-man', 'Cavalier', 180, 3),
  hero('mini-earth-warrior', 'Earth Warrior', 200, 3),
  hero('mini-horse-man', 'Horseman', 220, 4),
  hero('mini-prince-man', 'Prince', 230, 4),
  hero('mini-king-man', 'King', 250, 5),
  hero('mini-ice-swordswoman', 'Ice Swordswoman', 260, 5),
  hero('mini-lightning-warrior', 'Lightning Warrior', 280, 6),
  hero('mini-arch-mage', 'Archmage', 300, 6),
  hero('mini-water-spearwoman', 'Water Spearwoman', 350, 7),
  hero('mini-wind-warrior', 'Wind Warrior', 400, 8),
  hero('hero-forest-ranger', 'Forest Ranger', 120, 2),
  hero('hero-desert-nomad', 'Desert Nomad', 140, 2),
  hero('hero-fire-mage', 'Fire Mage', 150, 2),
  hero('hero-frost-knight', 'Frost Knight', 180, 3),
  hero('hero-shadow-archer', 'Shadow Archer', 200, 3),
  hero('hero-storm-lancer', 'Storm Lancer', 220, 4),
  hero('hero-crimson-prince', 'Crimson Prince', 240, 4),
  hero('hero-sun-paladin', 'Sun Paladin', 260, 5),
  chestOnly('hero-golden-king', 'Golden King', 'AVATAR'),
  chestOnly('hero-void-archmage', 'Void Archmage', 'AVATAR'),
  pet('pet-bunny', 'Snow Bunny', 30, 1),
  pet('pet-bird', 'Sparrow', 30, 1),
  pet('pet-fox', 'Fox', 40, 1),
  pet('pet-hermie', 'Hermie', 40, 1),
  pet('pet-deer', 'Fawn', 50, 1),
  pet('pet-roach', 'Roach', 50, 1),
  pet('pet-boar', 'Boar', 60, 2),
  pet('pet-jumpy-lumpy', 'Jumpy Lumpy', 60, 2),
  pet('pet-orchid-owl', 'Orchid Owl', 70, 2),
  pet('pet-wolf', 'Wolf', 80, 2),
  pet('pet-bear', 'Bear', 90, 3),
  pet('pet-deer2', 'Stag', 90, 3),
  pet('pet-robot-walky', 'Walky Bot', 100, 3),
  pet('pet-martian-red', 'Little Martian', 110, 3),
  pet('pet-mr-circuit', 'Mr. Circuit', 120, 3),
  pet('pet-slime-green', 'Green Slime', 40, 1),
  pet('pet-slime-blue', 'Water Slime', 50, 1),
  pet('pet-arctic-fox', 'Arctic Fox', 90, 2),
  pet('pet-shadow-wolf', 'Shadow Wolf', 140, 3),
  pet('pet-dragon-green', 'Moss Dragon', 250, 4),
  pet('pet-dragon-red', 'Ember Dragon', 300, 5),
  chestOnly('pet-dragon-blue', 'Frost Dragon', 'PET'),
  chestOnly('pet-dragon-gold', 'Sun Dragon', 'PET'),
  chestOnly('pet-slime-pink', 'Bubblegum Slime', 'PET'),
  chestOnly('pet-golden-bunny', 'Golden Bunny', 'PET'),
];
