import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { BoostType, Difficulty, MatchMode, PrismaClient, Question } from '@prisma/client';
import { hash } from 'bcrypt';
import { addUtcDays, startOfUtcDay, utcToday } from '../src/common/utils/dates';
import { BCRYPT_ROUNDS } from '../src/modules/auth/auth.constants';
import { EarnedChest } from '../src/modules/chests/chests.types';
import { MS_PER_SECOND } from '../src/modules/matches/matches.constants';
import { PlayerAnswerRecord } from '../src/modules/matches/matches.types';
import { answerPoints, findWinnerIds, playerOutcome } from '../src/modules/matches/scoring';
import { matchReward } from '../src/modules/progression/progression.rules';
import { toQuizCopy } from '../src/modules/quizzes/quiz.mapper';
import { STARTER_QUIZ_IDS } from '../src/modules/quizzes/quizzes.constants';
import { STARTER_BOOSTS } from '../src/modules/users/users.constants';
import { DEMO_MATCHES, DemoPlayer, SeedMatch, SeedRun } from './seed-data/demo-history';
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
  chests: EarnedChest[];
}

interface ScoredRun {
  userId: string;
  score: number;
  correctCount: number;
  answers: PlayerAnswerRecord[];
}

interface SeedPlayerRow extends ScoredRun {
  isWinner: boolean;
  xpEarned: number;
  coinsEarned: number;
}

type DemoUserIds = Record<DemoPlayer, string>;

const DEMO_PASSWORD = 'demo1234';
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
const DEMO_MATCH_MINUTES = 4;

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
  chests: [
    { type: 'WOODEN', source: 'DAILY_MATCH' },
    { type: 'SILVER', source: 'LEVEL_UP' },
    { type: 'GOLDEN', source: 'STREAK' },
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
  chests: [{ type: 'WOODEN', source: 'DAILY_MATCH' }],
};

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set. Add it to backend/.env.');
}
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

async function seedItems(): Promise<void> {
  for (const item of SEED_ITEMS) {
    await prisma.item.upsert({ where: { id: item.id }, update: item, create: item });
  }
}

async function seedUser(user: DemoUser, passwordHash: string): Promise<string> {
  const { boosts, chests, ...profile } = user;
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
  await seedChestsOnce(userId, chests);
  return userId;
}

/** Only while the user has no chest at all, so restarts never add them again. */
async function seedChestsOnce(userId: string, chests: EarnedChest[]): Promise<void> {
  const ownedChests = await prisma.userChest.count({ where: { userId } });
  if (ownedChests > 0) {
    return;
  }
  await prisma.userChest.createMany({ data: chests.map((chest) => ({ ...chest, userId })) });
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
    where: { id: { in: STARTER_QUIZ_IDS }, deletedAt: null },
    include: { questions: { orderBy: { position: 'asc' } } },
  });
  await prisma.$transaction(
    starters.map((quiz) => prisma.quiz.create({ data: toQuizCopy(quiz, userId) })),
  );
}

/** Only while demo_hero has no finished match, so restarts never add the matches again. */
async function seedDemoHistory(userIds: DemoUserIds): Promise<boolean> {
  const finishedMatches = await prisma.matchPlayer.count({
    where: { userId: userIds.hero, match: { status: 'FINISHED' } },
  });
  if (finishedMatches > 0) {
    return false;
  }
  for (const match of DEMO_MATCHES) {
    await seedMatch(match, userIds);
  }
  await seedReviewCards(userIds.hero);
  await seedStreak(userIds.hero, daysPlayed('hero'));
  await seedStreak(userIds.friend, daysPlayed('friend'));
  return true;
}

async function seedMatch(match: SeedMatch, userIds: DemoUserIds): Promise<void> {
  const quiz = await prisma.quiz.findUniqueOrThrow({
    where: { id: match.quizId },
    include: { questions: { orderBy: { position: 'asc' } } },
  });
  const timeLimitMs = quiz.timePerQuestion * MS_PER_SECOND;
  const runs = match.runs.map((run) =>
    scoreRun(run, userIds[run.player], quiz.questions, timeLimitMs),
  );
  const rows = toPlayerRows(match.mode, quiz.difficulty, runs, quiz.questions.length);
  const endedAt = playedAt(match.daysAgo, match.minutesEarlier);
  const startedAt = new Date(endedAt.getTime() - DEMO_MATCH_MINUTES * MS_PER_MINUTE);

  await prisma.match.create({
    data: {
      mode: match.mode,
      status: 'FINISHED',
      quizId: quiz.id,
      hostId: runs[0].userId,
      createdAt: startedAt,
      startedAt,
      endedAt,
      players: { create: rows.map((row) => ({ ...row, joinedAt: startedAt })) },
    },
  });
}

/** A wrong answer picks the option right after the correct one. */
function scoreRun(
  run: SeedRun,
  userId: string,
  questions: Question[],
  timeLimitMs: number,
): ScoredRun {
  const answers = questions.map((question, index) => {
    const correct = run.correct[index];
    const optionIndex = correct
      ? question.correctIndex
      : (question.correctIndex + 1) % question.options.length;
    const points = answerPoints(correct, run.timeLeft * timeLimitMs, timeLimitMs);
    return { questionId: question.id, optionIndex, correct, points };
  });
  return {
    userId,
    score: answers.reduce((sum, answer) => sum + answer.points, 0),
    correctCount: answers.filter((answer) => answer.correct).length,
    answers,
  };
}

function toPlayerRows(
  mode: MatchMode,
  difficulty: Difficulty,
  runs: ScoredRun[],
  questionCount: number,
): SeedPlayerRow[] {
  const winnerIds = findWinnerIds(mode, runs, questionCount);
  const players = runs.map((run) => ({ ...run, isWinner: winnerIds.includes(run.userId) }));
  return players.map((player) => {
    const reward = matchReward({
      mode,
      difficulty,
      correctCount: player.correctCount,
      outcome: playerOutcome(mode, player, players),
      abandoned: false,
    });
    return { ...player, xpEarned: reward.xp, coinsEarned: reward.coins };
  });
}

/** Every question demo_hero missed is due today in the mistakes notebook; old cards stay. */
async function seedReviewCards(heroId: string): Promise<void> {
  const rows = await prisma.matchPlayer.findMany({
    where: { userId: heroId },
    select: { answers: true },
  });
  const missedQuestionIds = rows
    .flatMap((row) => row.answers as PlayerAnswerRecord[])
    .filter((answer) => !answer.correct)
    .map((answer) => answer.questionId);

  for (const questionId of new Set(missedQuestionIds)) {
    const timesWrong = missedQuestionIds.filter((id) => id === questionId).length;
    await prisma.reviewCard.upsert({
      where: { userId_questionId: { userId: heroId, questionId } },
      create: { userId: heroId, questionId, timesWrong, dueOn: utcToday() },
      update: {},
    });
  }
}

/** The streak counts the days in a row that end with the most recent day played. */
async function seedStreak(userId: string, daysAgoPlayed: number[]): Promise<void> {
  const lastDaysAgo = Math.min(...daysAgoPlayed);
  let streak = 1;
  while (daysAgoPlayed.includes(lastDaysAgo + streak)) {
    streak += 1;
  }
  await prisma.user.update({
    where: { id: userId },
    data: { streak, longestStreak: streak, lastPlayedOn: addUtcDays(utcToday(), -lastDaysAgo) },
  });
}

function daysPlayed(player: DemoPlayer): number[] {
  return DEMO_MATCHES.filter((match) => match.runs.some((run) => run.player === player)).map(
    (match) => match.daysAgo,
  );
}

/** The same time of day, days ago, but never before that day started. */
function playedAt(daysAgo: number, minutesEarlier: number): Date {
  const sameTimeThatDay = addUtcDays(new Date(), -daysAgo);
  const time = sameTimeThatDay.getTime() - minutesEarlier * MS_PER_MINUTE;
  return new Date(Math.max(time, startOfUtcDay(sameTimeThatDay).getTime()));
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
  const historyAdded = await seedDemoHistory({ hero: heroId, friend: friendId });

  const history = historyAdded ? `, ${DEMO_MATCHES.length} demo matches` : '';
  console.log(
    `Seed ready: ${SEED_ITEMS.length} items, 2 demo users, ${DEMO_QUIZZES.length} demo quizzes${history}.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
