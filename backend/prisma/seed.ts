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
      coins: 50,
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
      coins: 100,
      level: 2,
    },
  });

  console.log('✅ Created test user:', testUser);

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
