import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { Difficulty } from '@prisma/client';

const DIFFICULTIES: Difficulty[] = ['EASY', 'EASY', 'MEDIUM', 'MEDIUM', 'HARD', 'HARD', 'EXPERT', 'EXPERT'];

/** Reward types for cleared stages */
const STAGE_REWARDS = [
  { type: 'COINS', amount: 30 },
  { type: 'HINT', amount: 2 },
  { type: 'COINS', amount: 60 },
  { type: 'EXTRA_TIME', amount: 2 },
  { type: 'COINS', amount: 90 },
  { type: 'FIFTY_FIFTY', amount: 2 },
  { type: 'COINS', amount: 120 },
  { type: 'COINS', amount: 200 },
];

@Injectable()
export class RankedService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  /** Create a ranked journey: generate all quizzes in one batch LLM call */
  async createJourney(userId: string, topic: string, totalStages = 8) {
    // Generate one quiz per stage with ascending difficulty
    const quizIds: string[] = [];
    for (let i = 0; i < totalStages; i++) {
      const difficulty = DIFFICULTIES[i] || 'EXPERT';
      const quiz = await this.aiService.generateQuiz(
        {
          topic: `${topic} - Stage ${i + 1}`,
          difficulty,
          numQuestions: 5,
          timePerQuestion: 30,
          sourceType: 'prompt',
        },
        userId,
      );
      quizIds.push(quiz.id);
    }

    // Create journey with stages
    const journey = await this.prisma.rankedJourney.create({
      data: {
        userId,
        topic,
        totalStages,
        stages: {
          create: quizIds.map((quizId, index) => ({
            stageNumber: index + 1,
            quizId,
            difficulty: DIFFICULTIES[index] || 'EXPERT',
          })),
        },
      },
      include: {
        stages: {
          include: { quiz: { select: { id: true, title: true, theme: true } } },
          orderBy: { stageNumber: 'asc' },
        },
      },
    });

    return journey;
  }

  /** Get all journeys for user */
  async getJourneys(userId: string) {
    return this.prisma.rankedJourney.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        stages: {
          orderBy: { stageNumber: 'asc' },
          select: {
            id: true,
            stageNumber: true,
            difficulty: true,
            isCompleted: true,
            score: true,
            earnedReward: true,
          },
        },
      },
    });
  }

  /** Get a single journey with full details */
  async getJourney(journeyId: string, userId: string) {
    const journey = await this.prisma.rankedJourney.findFirst({
      where: { id: journeyId, userId },
      include: {
        stages: {
          include: { quiz: { select: { id: true, title: true, theme: true, numQuestions: true, timePerQuestion: true } } },
          orderBy: { stageNumber: 'asc' },
        },
      },
    });
    if (!journey) throw new NotFoundException('Journey not found');
    return journey;
  }

  /** Complete a stage after playing it */
  async completeStage(journeyId: string, stageId: string, userId: string, score: number) {
    const journey = await this.prisma.rankedJourney.findFirst({
      where: { id: journeyId, userId },
      include: { stages: { orderBy: { stageNumber: 'asc' } } },
    });
    if (!journey) throw new NotFoundException('Journey not found');

    const stage = journey.stages.find((s) => s.id === stageId);
    if (!stage) throw new NotFoundException('Stage not found');
    if (stage.isCompleted) throw new BadRequestException('Stage already completed');

    // Must complete stages in order
    const prevStage = journey.stages.find((s) => s.stageNumber === stage.stageNumber - 1);
    if (prevStage && !prevStage.isCompleted) {
      throw new BadRequestException('Complete the previous stage first');
    }

    const reward = STAGE_REWARDS[stage.stageNumber - 1] || { type: 'COINS', amount: 50 };

    // Update stage
    await this.prisma.rankedStage.update({
      where: { id: stageId },
      data: { isCompleted: true, score, earnedReward: reward },
    });

    // Advance journey
    const newCurrent = stage.stageNumber;
    const isCompleted = newCurrent >= journey.totalStages;
    await this.prisma.rankedJourney.update({
      where: { id: journeyId },
      data: { currentStage: newCurrent, isCompleted },
    });

    // Apply reward
    if (reward.type === 'COINS') {
      await this.prisma.user.update({
        where: { id: userId },
        data: { coins: { increment: reward.amount } },
      });
    } else {
      await this.prisma.userBoost.upsert({
        where: { userId_type: { userId, type: reward.type as any } },
        update: { quantity: { increment: reward.amount } },
        create: { userId, type: reward.type as any, quantity: reward.amount },
      });
    }

    return { stage: { ...stage, isCompleted: true, score, earnedReward: reward }, reward, journeyCompleted: isCompleted };
  }
}
