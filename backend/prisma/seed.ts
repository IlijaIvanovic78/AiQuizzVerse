import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo user
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@quizverse.com' },
    update: {},
    create: {
      email: 'demo@quizverse.com',
      username: 'demo_user',
      passwordHash: '$2b$10$demohashedpassword', // In production, use proper bcrypt hash
      xp: 100,
      coins: 500,
      level: 1,
    },
  });

  console.log('✅ Created demo user:', demoUser);

  // Create additional test users
  const testUser = await prisma.user.upsert({
    where: { email: 'test@quizverse.com' },
    update: {},
    create: {
      email: 'test@quizverse.com',
      username: 'test_user',
      passwordHash: '$2b$10$testhashedpassword',
      xp: 250,
      coins: 300,
      level: 2,
    },
  });

  console.log('✅ Created test user:', testUser);

  // ── Shop Items (Avatars) ─────────────────────────────────
  // Delete old items & user items first (dev only)
  await prisma.userItem.deleteMany({});
  await prisma.item.deleteMany({});

  const avatarItems = [
    // 3 Free starter avatars (imagePath = character id from manifest.json)
    { name: 'Sword Man', imagePath: 'mini-sword-man', price: 0, minLevel: 1 },
    { name: 'Archer Man', imagePath: 'mini-archer-man', price: 0, minLevel: 1 },
    { name: 'Mage', imagePath: 'mini-mage', price: 0, minLevel: 1 },
    // Paid avatars
    { name: 'Shield Man', imagePath: 'mini-shield-man', price: 80, minLevel: 1 },
    { name: 'Spear Man', imagePath: 'mini-spear-man', price: 100, minLevel: 1 },
    { name: 'Crossbow Man', imagePath: 'mini-cross-bow-man', price: 120, minLevel: 2 },
    { name: 'Halberd Man', imagePath: 'mini-halberd-man', price: 150, minLevel: 2 },
    { name: 'Prince', imagePath: 'mini-prince-man', price: 180, minLevel: 3 },
    { name: 'King', imagePath: 'mini-king-man', price: 250, minLevel: 4 },
    { name: 'Cavalier', imagePath: 'mini-cavalier-man', price: 200, minLevel: 2 },
    { name: 'Horse Man', imagePath: 'mini-horse-man', price: 220, minLevel: 3 },
    { name: 'Arch Mage', imagePath: 'mini-arch-mage', price: 300, minLevel: 4 },
    { name: 'Earth Warrior', imagePath: 'mini-earth-warrior', price: 200, minLevel: 2 },
    { name: 'Ice Swordswoman', imagePath: 'mini-ice-swordswoman', price: 250, minLevel: 3 },
    { name: 'Lightning Warrior', imagePath: 'mini-lightning-warrior', price: 300, minLevel: 3 },
    { name: 'Water Spearwoman', imagePath: 'mini-water-spearwoman', price: 350, minLevel: 4 },
    { name: 'Wind Warrior', imagePath: 'mini-wind-warrior', price: 400, minLevel: 5 },
    { name: 'Soldier', imagePath: 'human-soldier-sword-shield', price: 500, minLevel: 6 },
  ];

  for (const item of avatarItems) {
    await prisma.item.upsert({
      where: { id: item.name.toLowerCase().replace(/\s+/g, '-') },
      update: { ...item, type: 'AVATAR' },
      create: {
        id: item.name.toLowerCase().replace(/\s+/g, '-'),
        type: 'AVATAR',
        ...item,
      },
    });
  }

  console.log(`✅ Seeded ${avatarItems.length} avatar items (3 free starters, 15 paid)`);


  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
