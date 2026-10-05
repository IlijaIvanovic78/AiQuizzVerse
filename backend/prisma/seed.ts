import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { BoostType, PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';
import { BCRYPT_ROUNDS } from '../src/modules/auth/auth.constants';
import { toQuizCopy } from '../src/modules/quizzes/quiz.mapper';
import { STARTER_QUIZ_IDS } from '../src/modules/quizzes/quizzes.constants';
import { STARTER_BOOSTS } from '../src/modules/users/users.constants';
import { DEMO_QUIZZES, SeedQuiz } from './seed-data/demo-quizzes';
import { SEED_ITEMS } from './seed-data/items';

interface DemoUser {
  email: string;
  username: string;
  avatarKey: string;
  petKey: string;
  coins: number;
  xp: number;
  boosts: { type: BoostType; quantity: number }[];
}

const DEMO_PASSWORD = 'demo1234';

const DEMO_HERO: DemoUser = {
  email: 'demo@quizverse.dev',
  username: 'demo_hero',
  avatarKey: 'mini-mage',
  petKey: 'pet-fox',
  coins: 500,
  xp: 1200,
  boosts: [
    { type: 'HINT', quantity: 3 },
    { type: 'FIFTY_FIFTY', quantity: 2 },
    { type: 'STREAK_FREEZE', quantity: 1 },
  ],
};

const DEMO_FRIEND: DemoUser = {
  email: 'friend@quizverse.dev',
  username: 'demo_friend',
  avatarKey: 'mini-archer-man',
  petKey: 'pet-bunny',
  coins: 300,
  xp: 600,
  boosts: STARTER_BOOSTS,
};

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function seedItems(): Promise<void> {
  for (const item of SEED_ITEMS) {
    await prisma.item.upsert({ where: { id: item.id }, update: item, create: item });
  }
}

async function seedUser(user: DemoUser, passwordHash: string): Promise<string> {
  const { boosts, ...profile } = user;
  const { id: userId } = await prisma.user.upsert({
    where: { email: user.email },
    update: {},
    create: { ...profile, passwordHash },
  });

  for (const itemId of [user.avatarKey, user.petKey]) {
    await prisma.userItem.upsert({
      where: { userId_itemId: { userId, itemId } },
      update: {},
      create: { userId, itemId },
    });
  }
  for (const boost of boosts) {
    await prisma.userBoost.upsert({
      where: { userId_type: { userId, type: boost.type } },
      update: {},
      create: { userId, ...boost },
    });
  }
  return userId;
}

async function seedFriendship(senderId: string, receiverId: string): Promise<void> {
  await prisma.friendship.upsert({
    where: { senderId_receiverId: { senderId, receiverId } },
    update: {},
    create: { senderId, receiverId, status: 'ACCEPTED' },
  });
}

async function seedDemoQuiz(quiz: SeedQuiz, ownerId: string): Promise<void> {
  const { questions, ...details } = quiz;
  await prisma.quiz.upsert({
    where: { id: quiz.id },
    update: {},
    create: {
      ...details,
      ownerId,
      questions: {
        create: questions.map((question, index) => ({ ...question, position: index + 1 })),
      },
    },
  });
}

async function copyStarterQuizzesOnce(userId: string): Promise<void> {
  const ownedQuizzes = await prisma.quiz.count({ where: { ownerId: userId } });
  if (ownedQuizzes > 0) {
    return;
  }
  const starters = await prisma.quiz.findMany({
    where: { id: { in: STARTER_QUIZ_IDS } },
    include: { questions: { orderBy: { position: 'asc' } } },
  });
  await prisma.$transaction(
    starters.map((quiz) => prisma.quiz.create({ data: toQuizCopy(quiz, userId) })),
  );
}

async function main(): Promise<void> {
  await seedItems();
  const passwordHash = await hash(DEMO_PASSWORD, BCRYPT_ROUNDS);
  const heroId = await seedUser(DEMO_HERO, passwordHash);
  const friendId = await seedUser(DEMO_FRIEND, passwordHash);
  await seedFriendship(heroId, friendId);

  for (const quiz of DEMO_QUIZZES) {
    await seedDemoQuiz(quiz, heroId);
  }
  await copyStarterQuizzesOnce(friendId);

  console.log(
    `Seed ready: ${SEED_ITEMS.length} items, 2 demo users, ${DEMO_QUIZZES.length} demo quizzes.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
